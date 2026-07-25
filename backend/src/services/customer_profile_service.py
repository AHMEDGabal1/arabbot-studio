import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.customer_profile import CustomerProfile


async def get_or_create_profile(
    db: AsyncSession, workspace_id: str, channel: str, channel_user_id: str
) -> CustomerProfile:
    """Find existing profile or create a new one. Returns the profile."""
    result = await db.execute(
        select(CustomerProfile).where(
            CustomerProfile.workspace_id == uuid.UUID(workspace_id),
            CustomerProfile.channel == channel,
            CustomerProfile.channel_user_id == channel_user_id,
        )
    )
    profile = result.scalar_one_or_none()

    if profile:
        return profile

    profile = CustomerProfile(
        workspace_id=uuid.UUID(workspace_id),
        channel=channel,
        channel_user_id=channel_user_id,
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


async def get_profile_by_id(
    db: AsyncSession, profile_id: str, workspace_id: str
) -> CustomerProfile | None:
    result = await db.execute(
        select(CustomerProfile).where(
            CustomerProfile.id == uuid.UUID(profile_id),
            CustomerProfile.workspace_id == uuid.UUID(workspace_id),
        )
    )
    return result.scalar_one_or_none()


async def update_profile(
    db: AsyncSession, profile_id: str, workspace_id: str, updates: dict
) -> CustomerProfile | None:
    profile = await get_profile_by_id(db, profile_id, workspace_id)
    if not profile:
        return None
    for key, value in updates.items():
        setattr(profile, key, value)
    await db.flush()
    await db.refresh(profile)
    return profile


async def increment_message_count(db: AsyncSession, profile_id: uuid.UUID) -> None:
    """Increment total_messages and update last_seen_at."""
    result = await db.execute(
        select(CustomerProfile).where(CustomerProfile.id == profile_id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.total_messages = (profile.total_messages or 0) + 1
        profile.last_seen_at = datetime.now(timezone.utc)


async def increment_conversation_count(db: AsyncSession, profile_id: uuid.UUID) -> None:
    """Increment total_conversations counter."""
    result = await db.execute(
        select(CustomerProfile).where(CustomerProfile.id == profile_id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.total_conversations = (profile.total_conversations or 0) + 1


async def get_profile_context(
    db: AsyncSession, workspace_id: str, channel: str, channel_user_id: str
) -> str:
    """Build a brief Arabic context string for LLM prompt injection.

    Returns empty string if no profile found or profile is brand new (0 conversations).
    This keeps prompts clean for first-time customers.
    """
    result = await db.execute(
        select(CustomerProfile).where(
            CustomerProfile.workspace_id == uuid.UUID(workspace_id),
            CustomerProfile.channel == channel,
            CustomerProfile.channel_user_id == channel_user_id,
        )
    )
    profile = result.scalar_one_or_none()

    if not profile or profile.total_conversations == 0:
        return ""

    parts = [f"معلومات العميل: عدد المحادثات: {profile.total_conversations}. عدد الرسائل: {profile.total_messages}."]

    if profile.tags:
        try:
            tag_list = json.loads(profile.tags)
            if tag_list:
                parts.append(f"التصنيفات: {', '.join(tag_list)}.")
        except (json.JSONDecodeError, TypeError):
            pass

    if profile.notes:
        parts.append(f"ملاحظات: {profile.notes}")

    if profile.display_name:
        parts.insert(0, f"اسم العميل: {profile.display_name}.")

    return " ".join(parts)


async def search_profiles(
    db: AsyncSession,
    workspace_id: str,
    query: str | None = None,
    tag: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[CustomerProfile]:
    """Search customer profiles by name/phone/channel_user_id and optionally filter by tag."""
    stmt = select(CustomerProfile).where(
        CustomerProfile.workspace_id == uuid.UUID(workspace_id)
    )

    if query:
        # Case-insensitive search across multiple fields
        like_pattern = f"%{query}%"
        stmt = stmt.where(
            (CustomerProfile.display_name.ilike(like_pattern))
            | (CustomerProfile.phone.ilike(like_pattern))
            | (CustomerProfile.channel_user_id.ilike(like_pattern))
        )

    if tag:
        # Substring match on JSON tags array string
        stmt = stmt.where(CustomerProfile.tags.ilike(f"%{tag}%"))

    stmt = stmt.order_by(CustomerProfile.last_seen_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
