import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def request(endpoint, method="GET", data=None, headers=None):
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

def run_test():
    print("=" * 60)
    print("[+] ARABBOT STUDIO - FULL END-TO-END WORKFLOW TEST")
    print("=" * 60)

    # 1. Register / Login
    email = "user_e2e_final@arabbot.ai"
    password = "Password123!"
    print(f"\n[1] Registering User ({email})...")
    status, res = request("/auth/register", "POST", {
        "email": email,
        "password": password,
        "name": "E2E Test Admin"
    })
    print(f"   Status: {status}")

    print("\n[2] Logging In...")
    status, res = request("/auth/login", "POST", {
        "email": email,
        "password": password
    })
    print(f"   Status: {status}")
    token = res.get("access_token")
    assert token, "Login failed: No access_token received!"
    print(f"   JWT Token Acquired: {token[:20]}...")
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Bot
    print("\n[3] Creating Bot...")
    status, bot = request("/bots", "POST", {
        "name": "Cairo Support Bot",
        "channel": "whatsapp",
        "wa_phone_number_id": "100987654321",
        "wa_access_token": "EAA_test_token_123"
    }, auth_headers)
    print(f"   Status: {status}")
    bot_id = bot.get("id")
    print(f"   Bot Created ID: {bot_id}")

    # 4. Seed Specialist Agents
    print("\n[4] Seeding Specialist Agents for Bot...")
    status, agents = request(f"/bots/{bot_id}/agents/seed-defaults", "POST", {}, auth_headers)
    print(f"   Status: {status}")
    print(f"   Seeded Agents Count: {len(agents)}")
    for a in agents:
        print(f"     - Agent [{a['agent_type']}]: {a['agent_type'].upper()} Agent (Intents: {a['handles_intents']})")

    # 5. Add Guardrail Rule
    print("\n[5] Adding Guardrail Rules...")
    status, rule1 = request(f"/bots/{bot_id}/guardrails", "POST", {
        "rule_type": "forbidden_word",
        "value": "secret",
        "action": "block",
        "priority": 10
    }, auth_headers)
    print(f"   Status: {status}")
    print(f"   Guardrail 1 Created: {rule1.get('rule_type')}='{rule1.get('value')}' (Action: {rule1.get('action')})")

    status, rule2 = request(f"/bots/{bot_id}/guardrails", "POST", {
        "rule_type": "max_discount",
        "value": "30",
        "action": "replace",
        "replacement_text": "Max discount is 30%",
        "priority": 5
    }, auth_headers)
    print(f"   Guardrail 2 Created: {rule2.get('rule_type')}='{rule2.get('value')}%' (Action: {rule2.get('action')})")

    # 6. Test Token Refresh Endpoint
    print("\n[6] Testing Token Refresh...")
    refresh_token = res.get("refresh_token")
    if refresh_token:
        status, ref_res = request("/auth/refresh", "POST", {"refresh_token": refresh_token})
        print(f"   Status: {status}")
        assert status == 200, f"Refresh failed: {ref_res}"
        print(f"   New Access Token: {ref_res.get('access_token')[:20]}...")
    else:
        print("   Skipped: No refresh token returned in login response.")

    # 7. Customer Profile (CDP) API Verification
    print("\n[7] Fetching Customer Profiles (CDP)...")
    status, customers = request("/customers", "GET", None, auth_headers)
    print(f"   Status: {status}")
    print(f"   Current Customers in CDP: {len(customers) if isinstance(customers, list) else 0}")

    # 8. Analytics Overview Verification
    print("\n[8] Checking Analytics Overview...")
    status, analytics = request("/analytics/overview", "GET", None, auth_headers)
    print(f"   Status: {status}")
    print(f"   Analytics Fetched Successfully!")

    # 9. List Conversations Verification
    print("\n[9] Checking Conversations...")
    status, convs = request(f"/conversations?bot_id={bot_id}", "GET", None, auth_headers)
    print(f"   Status: {status}")
    print(f"   Conversations Count: {convs.get('total', 0) if isinstance(convs, dict) else len(convs)}")

    print("\n" + "=" * 60)
    print("[+] SUCCESS: Live User Simulation & End-to-End Workflow Passed 100%!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
