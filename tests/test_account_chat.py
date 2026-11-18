"""Portal Home chat: saved conversations, pickup of an open one, Continue here, the Pockets workbench button,
and invite links. Mocked sCoRE API (every /api/v1 call is intercepted), no network.
Run:  DEV_PORT=8010 bash ../RaBbLE-Grimoire/spells/dev-serve.sh --world
      python3 tests/test_account_chat.py [base_url]     default http://localhost:8010/world/account.html"""
import json, re, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8010/world/account.html"
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

OPEN = {"id": "c1", "device": "My Pocket", "started_at": "2026-11-18T10:00:00Z", "ended_at": None, "origin": "pocket",
        "turns": [{"role": "user", "text": "hello from the pocket", "ts": "1", "surface": "pocket"},
                  {"role": "assistant", "text": "hi", "ts": "2", "surface": "pocket"}]}
OLD = {**OPEN, "id": "c0", "ended_at": "2026-11-17T11:00:00Z", "origin": "blended",
       "turns": [{"role": "user", "text": "old web", "ts": "1", "surface": "web"},
                 {"role": "assistant", "text": "old reply", "ts": "2", "surface": "pocket"}]}

def run(browser, open_convo, tier="member"):
    ctx = browser.new_context(viewport={"width": 700, "height": 900})
    page = ctx.new_page()
    calls, popups = [], []
    ctx.on("page", lambda p: popups.append(p.url))
    def handler(route):
        req = route.request
        path = re.sub(r"^https?://[^/]+", "", req.url)
        calls.append((req.method, path, req.post_data))
        def ok(body, status=200, ctype="application/json"):
            route.fulfill(status=status, content_type=ctype, body=body if isinstance(body, str) else json.dumps(body),
                          headers={"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"})
        if req.method == "OPTIONS": return ok({})
        if path.startswith("/api/v1/auth/login"):
            return ok({"token": "tok123", "expires_in": 3600, "username": "mark", "tier": tier, "email_verified": True})
        if path.startswith("/api/v1/devices"): return ok({"devices": [{"id": "d1", "label": "P", "revoked": False, "last_seen": None, "fw": "0.1.3"}], "limit": 3})
        if path.startswith("/api/v1/admin/invites"):
            if req.method == "POST": return ok({"token": "CODE123"}, 201)
            return ok({"invites": [{"token": "CODE123", "state": "live", "note": "n", "expires_at": "2026-12-01T00:00:00Z"}]})
        if req.method == "POST" and path.startswith("/api/v1/pocket/conversations?"): return ok({"id": "new1"}, 201)
        if path.startswith("/api/v1/pocket/conversations?"):
            return ok({"conversations": [{**OPEN, "turns": 2, "preview": "x"}] if open_convo else
                       [{**OLD, "turns": 2, "preview": "old web"}]})
        m = re.match(r"/api/v1/pocket/conversations/(\w+)(/resume)?$", path)
        if m:
            if m.group(2): return ok({"ok": True, "id": m.group(1)})
            return ok(OPEN if m.group(1) == "c1" else OLD)
        if path.startswith("/api/v1/chat"):
            return ok('data: "Hello "\n\ndata: "there."\n\ndata: [DONE]\n\n', ctype="text/event-stream")
        if path.startswith("/api/v1/pocket/"): return ok({"notes": []})
        return ok({})
    page.route(re.compile(r".*/(api/v1|health).*"), handler)
    page.goto(URL)
    page.fill("#si-identifier", "mark"); page.fill("#si-password", "pw"); page.click("#signin-form button[type=submit]")
    page.wait_for_selector("#home:not(.acct-hidden)")
    return ctx, page, calls, popups

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # fresh account: the first message makes a saved conversation and names it on /chat
    ctx, page, calls, popups = run(b, open_convo=False)
    check("entity element on Home", page.locator("#acctEntity").count() == 1)
    check("no open conversation: log starts empty", page.locator("#log .acct-turn").count() == 0)
    page.fill("#chat-input", "hi there"); page.click("#chat-send")
    page.wait_for_function("document.querySelectorAll('#log .acct-turn').length === 2 && !document.getElementById('chat-send').disabled")
    check("reply rendered", "Hello there." in page.inner_text("#log"))
    posts = [c for c in calls if c[0] == "POST" and c[1].startswith("/api/v1/")]
    check("conversation created before chat", any(c[1].startswith("/api/v1/pocket/conversations") for c in posts))
    chat = [c for c in posts if c[1].startswith("/api/v1/chat")]
    check("chat names the conversation", chat and json.loads(chat[0][2]).get("conversation_id") == "new1")
    page.click("#chat-new")
    check("New chat clears the log", page.locator("#log .acct-turn").count() == 0)
    page.fill("#chat-input", "again"); page.click("#chat-send")
    page.wait_for_function("!document.getElementById('chat-send').disabled")
    created = [c for c in calls if c[0] == "POST" and c[1] == "/api/v1/pocket/conversations?surface=web"]
    check("New chat starts another conversation", len(created) == 2)

    # continue from the Conversations tab
    page.click("#tab-conversations")
    page.wait_for_selector("#cv-list button")
    check("list shows the origin", "Blended" in page.inner_text("#cv-list"))
    page.click("#cv-list button")
    page.wait_for_selector("#cv-continue:not([disabled])")
    check("detail labels turns by surface when blended", "(pocket)" in page.inner_text("#cv-d-body"))
    page.click("#cv-continue")
    page.wait_for_selector("#panel-home:not(.acct-hidden)")
    check("Continue here loads the conversation on Home", "old web" in page.inner_text("#log"))
    check("resume was called", any(c[1] == "/api/v1/pocket/conversations/c0/resume" for c in calls))
    ctx.close()

    # a Pocket's open conversation is picked up on arrival
    ctx, page, calls, popups = run(b, open_convo=True)
    page.wait_for_function("document.querySelectorAll('#log .acct-turn').length === 2")
    check("open Pocket conversation shown on Home", "hello from the pocket" in page.inner_text("#log"))
    check("says it is carrying on from the Pocket", "your Pocket" in page.inner_text("#chat-where"))
    page.fill("#chat-input", "more"); page.click("#chat-send")
    page.wait_for_function("!document.getElementById('chat-send').disabled && document.querySelectorAll('#log .acct-turn').length === 4")
    chat = [c for c in calls if c[0] == "POST" and c[1].startswith("/api/v1/chat")]
    check("reply goes into the picked-up conversation, with its history",
          json.loads(chat[0][2])["conversation_id"] == "c1" and len(json.loads(chat[0][2])["messages"]) == 3)
    check("no second conversation was made", not [c for c in calls if c[1] == "/api/v1/pocket/conversations?surface=web"])

    # Pockets tab: the workbench button, no add-a-Pocket form
    page.click("#tab-pockets")
    check("no add-a-Pocket form or key panel", page.locator("#pk-form, #pk-key-panel").count() == 0)
    check("list keeps firmware", "firmware 0.1.3" in page.inner_text("#pk-list"))
    with ctx.expect_page() as pop:
        page.click("#pk-workbench")
    u = pop.value.url
    check("workbench opens with the token and name in the fragment only", u.startswith("http://localhost:8799/#token=tok123&name=mark"))
    ctx.close()

    # admin: invites are links
    ctx, page, calls, popups = run(b, open_convo=False, tier="admin")
    page.click("#tab-invites")
    page.fill("#note", "friend"); page.click("#mint-form button[type=submit]")
    page.wait_for_selector("#fresh:not(.acct-hidden)")
    fresh = page.inner_text("#fresh-token")
    check("minted invite is a link that opens sign-up", fresh.endswith("/world/account.html?invite=CODE123") or fresh.endswith("/world/account?invite=CODE123"))
    page.wait_for_selector("#list code")
    check("listed live invite is a link", "?invite=CODE123" in page.inner_text("#list"))
    ctx.close()
    b.close()

sys.exit(1 if fails else 0)
