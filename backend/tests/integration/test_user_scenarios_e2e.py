import uuid
import json
import hmac
import hashlib
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import User, Conversation, HandoffQueue, Bot, Workspace, WorkspaceMember


def _sign_payload(body: bytes, secret: str) -> str:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={expected}"


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_1_onboarding_and_auth(client):
    """
    Scenario 1: User Onboarding & Identity Journey
    - Test registration of a new user
    - Duplicate registration failure check
    - Login with valid credentials
    - Login with invalid credentials
    - Token authentication and user profile retrieval
    """
    # 1. New user registration
    reg_resp = await client.post("/api/v1/auth/register", json={
        "email": "ahmed.gabal@arabbot.studio",
        "password": "SecurePassword123!",
        "name": "Ahmed Gabal",
    })
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    user_id = reg_data["user_id"]

    # 2. Duplicate registration prevention
    dup_resp = await client.post("/api/v1/auth/register", json={
        "email": "ahmed.gabal@arabbot.studio",
        "password": "SecurePassword123!",
        "name": "Ahmed Gabal Clone",
    })
    assert dup_resp.status_code == 409

    # 3. Login with invalid password
    bad_login = await client.post("/api/v1/auth/login", json={
        "email": "ahmed.gabal@arabbot.studio",
        "password": "WrongPassword!",
    })
    assert bad_login.status_code == 401

    # 4. Login with correct credentials
    good_login = await client.post("/api/v1/auth/login", json={
        "email": "ahmed.gabal@arabbot.studio",
        "password": "SecurePassword123!",
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()

    # 5. Fetch profile info (/me)
    profile_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_resp.status_code == 200
    assert profile_resp.json()["email"] == "ahmed.gabal@arabbot.studio"


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_2_workspace_isolation(client):
    """
    Scenario 2: Multi-Tenancy Workspace Isolation
    - User A creates a workspace and a bot
    - User B registers and confirms isolated view (cannot view User A's bots or handoffs)
    """
    # User A setup
    reg_a = await client.post("/api/v1/auth/register", json={
        "email": "usera@workspace.com",
        "password": "Password123!",
        "name": "User A",
    })
    token_a = reg_a.json()["access_token"]

    # User A creates a bot
    bot_resp_a = await client.post(
        "/api/v1/bots",
        json={"name": "User A's Egyptian Bot", "channel": "whatsapp"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert bot_resp_a.status_code == 201
    bot_a_id = bot_resp_a.json()["id"]

    # User B setup
    reg_b = await client.post("/api/v1/auth/register", json={
        "email": "userb@workspace.com",
        "password": "Password123!",
        "name": "User B",
    })
    token_b = reg_b.json()["access_token"]

    # User B lists bots -> should be empty
    bots_b = await client.get(
        "/api/v1/bots",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert bots_b.status_code == 200
    assert len(bots_b.json()["items"]) == 0

    # User B attempts to fetch User A's bot directly -> 404 Not Found
    get_bot_b = await client.get(
        f"/api/v1/bots/{bot_a_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert get_bot_b.status_code == 404


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_3_bot_management_and_activation(client):
    """
    Scenario 3: Bot Creation, Lifecycle, and Activation
    - User creates an Arabic bot with specific config
    - User lists bots
    - User activates the bot
    - User deletes a bot
    """
    # Auth User
    reg = await client.post("/api/v1/auth/register", json={
        "email": "botmaster@arabbot.studio",
        "password": "Password123!",
        "name": "Bot Master",
    })
    token = reg.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Bot 1 (Egyptian Support)
    create_1 = await client.post(
        "/api/v1/bots",
        json={"name": "بوت الدعم الفني المصري", "channel": "whatsapp"},
        headers=auth_headers
    )
    assert create_1.status_code == 201
    bot_1 = create_1.json()
    assert bot_1["name"] == "بوت الدعم الفني المصري"
    assert bot_1["is_active"] is False

    # 2. Create Bot 2 (Saudi Sales)
    create_2 = await client.post(
        "/api/v1/bots",
        json={"name": "بوت المبيعات السعودي", "channel": "whatsapp"},
        headers=auth_headers
    )
    assert create_2.status_code == 201
    bot_2 = create_2.json()

    # 3. List workspace bots (expecting 2)
    list_resp = await client.get("/api/v1/bots", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["items"]) == 2

    # 4. Activate Bot 1
    act_resp = await client.post(f"/api/v1/bots/{bot_1['id']}/activate", headers=auth_headers)
    assert act_resp.status_code == 200
    assert act_resp.json()["is_active"] is True

    # 5. Delete Bot 2
    del_resp = await client.delete(f"/api/v1/bots/{bot_2['id']}", headers=auth_headers)
    assert del_resp.status_code == 204

    # 6. Verify Bot 2 deleted and Bot 1 remains
    list_after = await client.get("/api/v1/bots", headers=auth_headers)
    assert len(list_after.json()["items"]) == 1
    assert list_after.json()["items"][0]["id"] == bot_1["id"]


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_4_knowledge_base_management(client):
    """
    Scenario 4: Knowledge Base Ingestion & Document Management
    - User uploads Arabic company FAQs to bot knowledge base
    - User retrieves knowledge list
    - User deletes knowledge item
    """
    reg = await client.post("/api/v1/auth/register", json={
        "email": "kbmanager@arabbot.studio",
        "password": "Password123!",
        "name": "KB Manager",
    })
    token = reg.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a Bot
    bot_create = await client.post(
        "/api/v1/bots",
        json={"name": "Knowledge Bot", "channel": "whatsapp"},
        headers=auth_headers
    )
    assert bot_create.status_code == 201
    bot_id = bot_create.json()["id"]

    # 2. Upload Arabic FAQ knowledge item
    kb_create = await client.post(
        f"/api/v1/bots/{bot_id}/knowledge",
        json={
            "type": "faq",
            "question": "ما هي مواعيد العمل واسعار الشحن؟",
            "answer": "مواعيد العمل من الأحد للخميس. الشحن مجاني للطلبات فوق 500 جنيه.",
        },
        headers=auth_headers
    )
    assert kb_create.status_code == 201, f"Knowledge creation failed: {kb_create.text}"
    kb_item = kb_create.json()
    assert kb_item["type"] == "faq"

    # 3. Upload second document item
    kb_create_2 = await client.post(
        f"/api/v1/bots/{bot_id}/knowledge",
        json={
            "type": "faq",
            "question": "ما هي فروع الشركة؟",
            "answer": "الفرع الرئيسي بالقاهرة وفرع الإسكندرية.",
        },
        headers=auth_headers
    )
    assert kb_create_2.status_code == 201

    # 4. List knowledge documents
    kb_list = await client.get(f"/api/v1/bots/{bot_id}/knowledge", headers=auth_headers)
    assert kb_list.status_code == 200
    assert len(kb_list.json()["items"]) == 2

    # 5. Delete first document
    del_kb = await client.delete(f"/api/v1/bots/{bot_id}/knowledge/{kb_item['id']}", headers=auth_headers)
    assert del_kb.status_code == 204

    # 6. List again (1 document left)
    kb_list_after = await client.get(f"/api/v1/bots/{bot_id}/knowledge", headers=auth_headers)
    assert len(kb_list_after.json()["items"]) == 1


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_5_meta_webhooks(client, db_session: AsyncSession):
    """
    Scenario 5: Multi-Channel WhatsApp Webhook Verification & Message Ingestion
    - Verify WhatsApp webhook GET challenge with correct verify_token
    - Test incoming WhatsApp POST payload with HMAC signature and Arabic customer inquiry
    """
    # 1. Setup bot in DB with verify token and secret
    bot = Bot(
        name="Webhook Test Bot",
        channel="whatsapp",
        workspace_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        wa_verify_token="meta_token_123",
        wa_access_token="meta_secret_key_456",
    )
    db_session.add(bot)
    await db_session.flush()
    await db_session.commit()
    bot_id = str(bot.id)

    # 2. GET verification handshake (Success)
    verify_resp = await client.get(
        f"/webhooks/whatsapp/{bot_id}",
        params={"hub.mode": "subscribe", "hub.verify_token": "meta_token_123", "hub.challenge": "CHALLENGE_OK_999"}
    )
    assert verify_resp.status_code == 200
    assert verify_resp.text == "CHALLENGE_OK_999"

    # 3. GET verification handshake (Failure - wrong token)
    bad_verify = await client.get(
        f"/webhooks/whatsapp/{bot_id}",
        params={"hub.mode": "subscribe", "hub.verify_token": "wrong_token", "hub.challenge": "123"}
    )
    assert bad_verify.status_code == 403

    # 4. POST webhook message ingestion signed with HMAC SHA256
    meta_payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "WHATSAPP_ENTRY_123",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                        "display_phone_number": "+201234567890",
                        "phone_number_id": "PHONE_12345",
                    },
                    "messages": [{
                        "from": "+201234567890",
                        "id": "wamid.HBgL123",
                        "timestamp": "1700000000",
                        "type": "text",
                        "text": {"body": "عايز اعرف اسعار الشحن والقاهرة بكام؟"},
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    body_bytes = json.dumps(meta_payload).encode()
    signature = _sign_payload(body_bytes, "test_secret")

    post_resp = await client.post(
        f"/webhooks/whatsapp/{bot_id}",
        content=body_bytes,
        headers={"X-Hub-Signature-256": signature}
    )
    assert post_resp.status_code == 200
    assert post_resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_6_handoff_escalation(client, db_session: AsyncSession):
    """
    Scenario 6: Live Agent Customer Service Handoff Lifecycle
    - Customer triggers handoff
    - Human Agent views pending handoff queue
    - Human Agent assigns handoff to self
    - Human Agent marks handoff as resolved
    """
    # 1. User Agent setup
    reg = await client.post("/api/v1/auth/register", json={
        "email": "supportagent@arabbot.studio",
        "password": "Password123!",
        "name": "Human Support Agent",
    })
    data = reg.json()
    token = data["access_token"]
    agent_id = data["user_id"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Bot
    bot_resp = await client.post(
        "/api/v1/bots",
        json={"name": "Handoff Lifecycle Bot", "channel": "whatsapp"},
        headers=auth_headers
    )
    bot_id = bot_resp.json()["id"]

    # 3. Simulate low-confidence customer conversation causing handoff entry
    conv = Conversation(
        bot_id=uuid.UUID(bot_id),
        channel="whatsapp",
        channel_user_id="+201098765432",
    )
    db_session.add(conv)
    await db_session.flush()

    handoff = HandoffQueue(
        conversation_id=conv.id,
        reason="Low AI Confidence: Customer requested human manager",
    )
    db_session.add(handoff)
    await db_session.flush()
    await db_session.commit()
    handoff_id = str(handoff.id)

    # 4. Agent fetches pending handoffs
    queue_resp = await client.get("/api/v1/handoffs", headers=auth_headers)
    assert queue_resp.status_code == 200
    items = queue_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == handoff_id
    assert items[0]["assigned_to"] is None

    # 5. Agent assigns handoff to self
    assign_resp = await client.patch(
        f"/api/v1/handoffs/{handoff_id}/assign",
        json={"assigned_to": agent_id},
        headers=auth_headers
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["assigned_to"] == agent_id

    # 6. Agent resolves handoff
    resolve_resp = await client.patch(
        f"/api/v1/handoffs/{handoff_id}/resolve",
        headers=auth_headers
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["resolved_at"] is not None

    # 7. Verify queue is now clear of unresolved handoffs
    queue_after = await client.get("/api/v1/handoffs", headers=auth_headers)
    assert queue_after.status_code == 200
    assert len(queue_after.json()["items"]) == 0


@pytest.mark.asyncio
async def test_complete_user_journey_scenario_7_rbac_admin_controls(client, db_session: AsyncSession):
    """
    Scenario 7: Role-Based Access Control (RBAC) & System Admin Analytics
    - Normal workspace user attempting admin analytics -> 403 Forbidden
    - SuperAdmin user accessing admin analytics -> 200 OK
    """
    # 1. Normal user setup
    normal_reg = await client.post("/api/v1/auth/register", json={
        "email": "normal.user@arabbot.studio",
        "password": "Password123!",
        "name": "Normal User",
    })
    normal_token = normal_reg.json()["access_token"]

    # 2. Normal user tries to access /api/v1/admin/analytics -> 403 Forbidden
    forbidden_resp = await client.get(
        "/api/v1/admin/analytics",
        headers={"Authorization": f"Bearer {normal_token}"}
    )
    assert forbidden_resp.status_code == 403

    # 3. SuperAdmin setup in DB
    admin_reg = await client.post("/api/v1/auth/register", json={
        "email": "superadmin@arabbot.studio",
        "password": "SuperAdminPass123!",
        "name": "Super Admin User",
    })
    admin_data = admin_reg.json()
    admin_token = admin_data["access_token"]
    admin_id = uuid.UUID(admin_data["user_id"])

    # Elevate to SuperAdmin in DB
    from sqlalchemy import select
    res = await db_session.execute(select(User).where(User.id == admin_id))
    admin_user = res.scalar_one()
    admin_user.is_superadmin = True
    await db_session.commit()

    # 4. SuperAdmin accesses /api/v1/admin/analytics -> 200 OK
    admin_resp = await client.get(
        "/api/v1/admin/analytics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_resp.status_code == 200
    analytics_data = admin_resp.json()
    assert "total_users" in analytics_data
    assert "total_bots" in analytics_data
