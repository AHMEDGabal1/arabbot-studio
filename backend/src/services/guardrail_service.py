import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.guardrail import GuardrailRule


def _check_forbidden_word(text: str, value: str) -> bool:
    """Returns True if forbidden word is found in text (case-insensitive)."""
    if not value or not text:
        return False
    return value.lower() in text.lower()


def _check_regex_block(text: str, pattern: str) -> bool:
    """Returns True if text matches regex pattern.

    Safely handles invalid regex or overly long patterns (limit 200 chars)
    to prevent ReDoS attacks.
    """
    if not pattern or not text or len(pattern) > 200:
        return False
    # Limit text size to prevent ReDoS on large payloads
    if len(text) > 10000:
        return False
    try:
        return re.search(pattern, text) is not None
    except re.error:
        return False


def _check_max_discount(text: str, max_value: str) -> bool:
    """Returns True if any discount number in text exceeds max_value.

    Supports percentages (% / بالمئة / بالمية) and phrases like 'خصم X'.
    """
    try:
        max_disc = float(max_value)
    except (ValueError, TypeError):
        return False

    # Normalize Eastern Arabic digits to Western
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    normalized = text
    for i, d in enumerate(arabic_digits):
        normalized = normalized.replace(d, str(i))

    found = []
    # Match: number followed by percentage indicator
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*(?:%|بالمئة|بالمية)", normalized):
        try:
            found.append(float(m.group(1)))
        except ValueError:
            pass

    # Match: خصم followed by number
    for m in re.finditer(r"خصم\s*(\d+(?:\.\d+)?)", normalized):
        try:
            found.append(float(m.group(1)))
        except ValueError:
            pass

    return any(d > max_disc for d in found)


def _check_required_phrase(text: str, phrase: str) -> bool:
    """Returns True if required phrase is MISSING from text (violation)."""
    if not phrase:
        return False
    return phrase not in text


def _check_max_length(text: str, max_len: str) -> bool:
    """Returns True if text length exceeds max_len (violation)."""
    try:
        limit = int(max_len)
    except (ValueError, TypeError):
        return False
    return len(text) > limit


# --- Validation engine ---

async def get_bot_rules(db: AsyncSession, bot_id: str) -> list[GuardrailRule]:
    """Fetch active rules for a bot ordered by priority DESC."""
    result = await db.execute(
        select(GuardrailRule)
        .where(
            GuardrailRule.bot_id == uuid.UUID(bot_id),
            GuardrailRule.is_active.is_(True),
        )
        .order_by(GuardrailRule.priority.desc(), GuardrailRule.created_at.asc())
    )
    return list(result.scalars().all())


async def validate_response(db: AsyncSession, bot_id: str, response_text: str) -> dict:
    """Validates bot response text against active guardrail rules.

    Returns dict with: passed (bool), violations (list), sanitized_text (str), action (str).
    The orchestrator uses this to decide whether to block, replace, or escalate.
    """
    rules = await get_bot_rules(db, bot_id)
    violations = []
    sanitized_text = response_text
    final_action = None

    _validators = {
        "forbidden_word": _check_forbidden_word,
        "regex_block": _check_regex_block,
        "max_discount": _check_max_discount,
        "required_phrase": _check_required_phrase,
        "max_length": _check_max_length,
    }

    for rule in rules:
        validator = _validators.get(rule.rule_type)
        if not validator:
            continue

        is_violated = validator(sanitized_text, rule.value)
        if not is_violated:
            continue

        violations.append({
            "rule_id": str(rule.id),
            "rule_type": rule.rule_type,
            "action": rule.action,
            "value": rule.value,
        })

        if rule.action == "replace" and rule.replacement_text is not None:
            if rule.rule_type == "forbidden_word":
                # Replace the specific word while preserving surrounding text
                pattern = re.compile(re.escape(rule.value), re.IGNORECASE)
                sanitized_text = pattern.sub(rule.replacement_text, sanitized_text)
            else:
                sanitized_text = rule.replacement_text
        elif rule.action in ("block", "escalate", "flag") and final_action is None:
            final_action = rule.action

    passed = final_action not in ("block", "escalate")
    return {
        "passed": passed,
        "action": final_action or "allow",
        "violations": violations,
        "sanitized_text": sanitized_text,
    }


# --- CRUD operations ---

async def create_guardrail_rule(db: AsyncSession, bot_id: str, data: dict) -> GuardrailRule:
    rule = GuardrailRule(bot_id=uuid.UUID(bot_id), **data)
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


async def list_guardrail_rules(
    db: AsyncSession, bot_id: str, limit: int = 50, offset: int = 0
) -> tuple[list[GuardrailRule], int]:
    result = await db.execute(
        select(GuardrailRule)
        .where(GuardrailRule.bot_id == uuid.UUID(bot_id))
        .order_by(GuardrailRule.priority.desc(), GuardrailRule.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = list(result.scalars().all())
    count_result = await db.execute(
        select(func.count(GuardrailRule.id)).where(GuardrailRule.bot_id == uuid.UUID(bot_id))
    )
    return items, count_result.scalar() or 0


async def get_guardrail_rule(db: AsyncSession, rule_id: str, bot_id: str) -> GuardrailRule | None:
    result = await db.execute(
        select(GuardrailRule).where(
            GuardrailRule.id == uuid.UUID(rule_id),
            GuardrailRule.bot_id == uuid.UUID(bot_id),
        )
    )
    return result.scalar_one_or_none()


async def update_guardrail_rule(
    db: AsyncSession, rule_id: str, bot_id: str, data: dict
) -> GuardrailRule | None:
    rule = await get_guardrail_rule(db, rule_id, bot_id)
    if not rule:
        return None
    for key, value in data.items():
        setattr(rule, key, value)
    await db.flush()
    await db.refresh(rule)
    return rule


async def delete_guardrail_rule(db: AsyncSession, rule_id: str, bot_id: str) -> bool:
    result = await db.execute(
        delete(GuardrailRule).where(
            GuardrailRule.id == uuid.UUID(rule_id),
            GuardrailRule.bot_id == uuid.UUID(bot_id),
        )
    )
    await db.flush()
    return result.rowcount > 0
