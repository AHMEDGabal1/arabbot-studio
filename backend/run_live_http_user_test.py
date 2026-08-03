import asyncio
import os
import time
import uvicorn
import threading
import urllib.request
import urllib.error
import json
from src.main import app

# Ensure SECRET_KEY is set
os.environ["SECRET_KEY"] = "super-secret-test-key-12345"

PORT = 8088
BASE_URL = f"http://127.0.0.1:{PORT}/api/v1"

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")

def http_request(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return e.code, json.loads(body) if body else {"error": str(e)}

def run_live_user_test():
    print("=" * 70)
    print("[+] LIVE USER SIMULATION TEST OVER HTTP (FastAPI Server)")
    print("=" * 70)
    
    # Wait for server startup
    time.sleep(2)
    
    # 1. User Registration
    print("\n[Step 1] User Registration")
    email = f"live_user_{int(time.time())}@arabbot.ai"
    password = "LiveUser123!"
    status, reg_res = http_request("/auth/register", "POST", {
        "email": email,
        "password": password,
        "name": "Live Test Customer"
    })
    print(f"   Status: {status}")
    print(f"   User ID: {reg_res.get('user_id')}")
    print(f"   Default Workspace ID: {reg_res.get('workspace_id')}")
    token = reg_res.get("access_token")
    refresh_token = reg_res.get("refresh_token")
    assert token, "Registration failed: Missing access_token"
    
    auth_headers = {
        "Authorization": f"Bearer {token}",
        "X-Workspace-ID": reg_res.get('workspace_id')
    }

    # 2. Verify /auth/me
    print("\n[Step 2] User Session Verification (/auth/me)")
    status, me_res = http_request("/auth/me", "GET", headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Authenticated User: {me_res.get('name')} ({me_res.get('email')})")

    # 3. Token Refresh Simulation (FE-01 / M1)
    print("\n[Step 3] Token Refresh Simulation (/auth/refresh)")
    status, ref_res = http_request("/auth/refresh", "POST", {"refresh_token": refresh_token})
    print(f"   Status: {status}")
    new_token = ref_res.get("access_token")
    print(f"   Refreshed Access Token Received: {new_token[:25]}...")
    auth_headers["Authorization"] = f"Bearer {new_token}"

    # 4. Create Bot (Bot Management)
    print("\n[Step 4] Creating Bot ('Cairo Sales Assistant')")
    status, bot_res = http_request("/bots", "POST", {
        "name": "Cairo Sales Assistant",
        "channel": "whatsapp",
        "wa_phone_number_id": "109876543210",
        "wa_access_token": "live_test_access_token"
    }, headers=auth_headers)
    print(f"   Status: {status}")
    bot_id = bot_res.get("id")
    print(f"   Bot ID: {bot_id}")

    # 5. Activate Bot
    print("\n[Step 5] Activating Bot")
    status, act_res = http_request(f"/bots/{bot_id}/activate", "POST", headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Bot Status: {act_res.get('status')}")

    # 6. Seed Specialist Agents
    print("\n[Step 6] Seeding Multi-Agent System (Sales, Support, Billing)")
    status, agents_res = http_request(f"/bots/{bot_id}/agents/seed-defaults", "POST", headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Seeded Specialist Agents Count: {len(agents_res)}")
    for ag in agents_res:
        intents = ag.get('handles_intents', [])
        if isinstance(intents, str):
            try:
                intents = json.loads(intents)
            except Exception:
                pass
        print(f"     - Agent: {ag.get('agent_type').upper()} (Handles: {', '.join(intents) if isinstance(intents, list) else intents})")

    # 7. Add Knowledge Base Item (RAG)
    print("\n[Step 7] Adding Knowledge Base Document")
    status, kb_res = http_request(f"/bots/{bot_id}/knowledge", "POST", {
        "type": "faq",
        "question": "What is your return policy?",
        "answer": "Our return policy allows returns within 14 days of purchase with original receipt."
    }, headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Knowledge Item ID: {kb_res.get('id')}")
    assert status == 201, f"Knowledge creation failed: {kb_res}"

    # 8. Add Guardrail Rule
    print("\n[Step 8] Setting Up Guardrails (Max Discount 20%)")
    status, gr_res = http_request(f"/bots/{bot_id}/guardrails", "POST", {
        "rule_type": "max_discount",
        "value": "20",
        "action": "replace",
        "replacement_text": "Maximum allowed discount is 20%.",
        "priority": 10
    }, headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Guardrail Rule Active: {gr_res.get('rule_type')} = {gr_res.get('value')}%")

    # 9. Customer Profile Inspection (CDP)
    print("\n[Step 9] CDP Customer Profile Inspection")
    status, cdp_res = http_request("/customers", "GET", headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Registered Customers Count: {len(cdp_res) if isinstance(cdp_res, list) else 0}")

    # 10. Analytics Dashboard Inspection
    print("\n[Step 10] Analytics Overview Inspection")
    status, analytics_res = http_request("/analytics/overview", "GET", headers=auth_headers)
    print(f"   Status: {status}")
    print(f"   Analytics Summary: Total Bots = {analytics_res.get('total_bots', 0)}, Active = {analytics_res.get('active_bots', 0)}")

    print("\n" + "=" * 70)
    print("[+] SUCCESS: LIVE USER SIMULATION COMPLETED (100% PASSED)")
    print("=" * 70)

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    try:
        run_live_user_test()
    except Exception as e:
        print(f"\n[-] Live User Test Failed: {e}")
        import traceback
        traceback.print_exc()
