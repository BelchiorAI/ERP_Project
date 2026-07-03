"""
End-to-end API health check.
Tests: token, /me/, employees, timesheets, leave-requests.
"""
import urllib.request
import urllib.error
import json
import sys

BASE = "http://127.0.0.1:8000/api"
CREDS = [
    ("alice_manager", "password123", "manager"),
    ("olivia_taylor", "password123", "employee"),
]

def api(path, token=None, method="GET", data=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def check(label, status, body, expect_status=200):
    ok = status == expect_status
    icon = "[OK]" if ok else "[FAIL]"
    print(f"  {icon} {label}: HTTP {status}", end="")
    if not ok:
        print(f" — {body}", end="")
    print()
    return ok

all_ok = True
print("=" * 60)

for username, password, role in CREDS:
    print(f"\n[{role.upper()}] {username}")
    print("-" * 40)

    # 1. Get token
    status, body = api("/token/", data={"username": username, "password": password}, method="POST")
    ok = check("POST /api/token/", status, body, 200)
    if not ok:
        all_ok = False
        continue
    token = body["access"]

    # 2. /me/
    status, body = api("/employees/me/", token=token)
    ok = check("GET /api/employees/me/", status, body)
    if ok:
        me = body
        print(f"       > id={me.get('id')} username={me.get('username')} role={me.get('role')}")
    else:
        all_ok = False

    # 3. employees list
    status, body = api("/employees/", token=token)
    ok = check("GET /api/employees/", status, body)
    if ok:
        count = len(body) if isinstance(body, list) else body.get("count", "?")
        print(f"       > {count} employees visible")
    else:
        all_ok = False

    # 4. timesheets
    status, body = api("/timesheets/", token=token)
    ok = check("GET /api/timesheets/", status, body)
    if ok:
        count = len(body) if isinstance(body, list) else body.get("count", "?")
        print(f"       > {count} timesheets visible")
    else:
        all_ok = False

    # 5. leave-requests
    status, body = api("/leave-requests/", token=token)
    ok = check("GET /api/leave-requests/", status, body)
    if ok:
        count = len(body) if isinstance(body, list) else body.get("count", "?")
        print(f"       > {count} leave requests visible")
    else:
        all_ok = False

print("\n" + "=" * 60)
if all_ok:
    print("[OK] ALL CHECKS PASSED -- Backend is fully operational!")
else:
    print("[FAIL] SOME CHECKS FAILED -- See above for details.")
    sys.exit(1)
