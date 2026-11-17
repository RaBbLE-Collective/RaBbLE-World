"""Account portal tests: Captures and Conversations tabs against a mocked sCoRE API.
Run:  DEV_PORT=8010 bash ../RaBbLE-Grimoire/spells/dev-serve.sh --world   (serves World on :8010)
      python3 tests/test_account_portal.py [base_url]     default http://localhost:8010/world/account.html
Needs python playwright + chromium. No real network: every /api/v1 call is intercepted."""
import json, re, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8010/world/account.html"
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

def note(i):
    return {"id": f"n{i}", "title": f"Note {i}", "source": "voice" if i % 2 else "text",
            "created": f"2026-11-{17 - (i // 100):02d}T10:{i % 60:02d}:00Z", "device": "My Pocket", "ts": i,
            "preview": f"preview <b>{i}</b>"}
def conv(i):
    return {"id": f"c{i}", "device": "My Pocket", "started_at": f"2026-11-16T10:{i % 60:02d}:00Z",
            "ended_at": "2026-11-16T11:00:00Z", "turns": 2, "preview": f"hello {i}"}

def run(browser, tier, empty=False, fail_status=None):
    ctx = browser.new_context(viewport={"width": 375, "height": 800}, accept_downloads=True)
    ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=URL.split("/world")[0])
    page = ctx.new_page()
    calls = []
    deleted = set()
    def handler(route):
        req = route.request
        u = req.url
        calls.append((req.method, u, req.headers.get("authorization")))
        path = re.sub(r"^https?://[^/]+", "", u)
        def ok(body, status=200):
            route.fulfill(status=status, content_type="application/json", body=json.dumps(body),
                          headers={"access-control-allow-origin": "*", "access-control-allow-headers": "*",
                                   "access-control-allow-methods": "*"})
        if req.method == "OPTIONS": return ok({})
        if path.startswith("/api/v1/auth/login"):
            return ok({"token": "tok123", "expires_in": 3600, "username": "mark", "tier": tier, "email_verified": True})
        if path.startswith("/api/v1/devices"): return ok({"devices": [], "limit": 3})
        if fail_status and "/pocket/" in path: return ok({"detail": "x"}, fail_status)
        m = re.match(r"/api/v1/pocket/notes(?:/(\w+))?(?:\?(.*))?$", path)
        if m:
            if m.group(1):
                if req.method == "DELETE":
                    deleted.add(m.group(1)); return ok({"ok": True})
                return ok({"id": m.group(1), "title": "Note 1", "source": "voice", "created": "2026-11-17T10:01:00Z",
                           "device": "My Pocket", "ts": 1, "md": "---\ntitle: Note 1\n---\n<img src=x onerror=alert(1)> body"})
            if empty: return ok({"notes": []})
            q = m.group(2) or ""
            return ok({"notes": [note(i) for i in range(1, 51)]} if "before=" not in q else {"notes": [note(51), note(52)]})
        m = re.match(r"/api/v1/pocket/conversations(?:/(\w+))?(?:\?(.*))?$", path)
        if m:
            if m.group(1):
                if req.method == "DELETE":
                    deleted.add(m.group(1)); return ok({"ok": True})
                return ok({"id": m.group(1), "device": "My Pocket", "started_at": "2026-11-16T10:00:00Z",
                           "ended_at": "2026-11-16T11:00:00Z",
                           "turns": [{"role": "user", "text": "hi <i>there</i>", "ts": 1}, {"role": "assistant", "text": "hello", "ts": 2}]})
            if empty: return ok({"conversations": []})
            return ok({"conversations": [conv(1), conv(2)]})
        return ok({}, 404)
    page.route("**/api/v1/**", handler)
    page.route("http://localhost:8000/**", handler)
    page.route(re.compile(r"https://score\.joinrabble\.world/.*"), handler)
    dialogs = []
    page.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
    page.goto(URL)
    page.fill("#si-identifier", "mark"); page.fill("#si-password", "pw")
    page.click("#signin-form button[type=submit]")
    page.wait_for_selector("#home:not(.acct-hidden)")
    return page, calls, deleted, dialogs

with sync_playwright() as pw:
    b = pw.chromium.launch()

    page, calls, deleted, dialogs = run(b, "member")
    tabs = page.eval_on_selector_all(".acct-tab:not(.acct-hidden)", "e=>e.map(x=>x.textContent)")
    check("member tabs: Home, Pockets, Captures, Conversations (no Invites)", tabs == ["Home", "Pockets", "Captures", "Conversations"])
    page.click("#tab-captures")
    page.wait_for_selector("#cp-list li")
    check("captures: 50 rows rendered", page.locator("#cp-list li").count() == 50)
    check("captures: ?tab=captures in URL", "tab=captures" in page.url)
    check("captures: bearer header sent", any("/pocket/notes" in u and a == "Bearer tok123" for _, u, a in calls))
    check("captures: limit=50 requested", any("notes?limit=50" in u for _, u, _ in calls))
    first = page.locator("#cp-list li").first.inner_text()
    check("captures: row shows title, badge, device, preview as text", "Note 1" in first and "voice" in first and "My Pocket" in first and "<b>1</b>" in first)
    check("captures: preview HTML not injected", page.locator("#cp-list b").count() == 0)
    check("captures: load more visible", page.locator("#cp-more").is_visible())
    page.click("#cp-more"); page.wait_for_function("document.querySelectorAll('#cp-list li').length===52")
    check("captures: load more sends before=<last created>", any("before=" in u and "/pocket/notes" in u for _, u, _ in calls))
    check("captures: load more hides when short page", not page.locator("#cp-more").is_visible())
    page.click("#cp-list li >> nth=0 >> button")
    page.wait_for_selector("#cp-d-body:visible")
    page.wait_for_function("document.getElementById('cp-d-body').textContent.includes('body')")
    check("captures: md shown as text, no injected element", page.locator("#cp-d-body img").count() == 0 and "<img" in page.inner_text("#cp-d-body"))
    check("captures: no alert fired", not dialogs)
    with page.expect_download() as dl:
        page.click("#cp-dl")
    check("captures: download is note-1.md", dl.value.suggested_filename == "note-1.md")
    page.click("#cp-copy")
    page.wait_for_function("document.getElementById('cp-d-msg').textContent.length>0")
    clip = page.evaluate("navigator.clipboard.readText()")
    check("captures: copy puts md on clipboard", "title: Note 1" in clip)
    page.click("#cp-del")
    check("captures: first delete click only arms", page.text_content("#cp-del") == "Sure? Delete" and not deleted)
    page.click("#cp-del")
    page.wait_for_selector("#cp-listview:visible")
    check("captures: confirmed delete calls DELETE and removes row", "n1" in deleted and page.locator("#cp-list li").count() == 51)
    check("captures: no horizontal scroll at 375px", page.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))

    page.click("#tab-conversations")
    page.wait_for_selector("#cv-list li")
    check("conversations: rows with turn count + preview", "2 turns" in page.inner_text("#cv-list li >> nth=0") and "hello 1" in page.inner_text("#cv-list li >> nth=0"))
    page.click("#cv-list li >> nth=0 >> button")
    page.wait_for_selector("#cv-d-body .acct-turn")
    check("conversations: transcript user/assistant classes", page.locator("#cv-d-body .acct-turn.you").count() == 1 and page.locator("#cv-d-body .acct-turn.rabble").count() == 1)
    check("conversations: turn text not parsed as HTML", page.locator("#cv-d-body i").count() == 0)
    page.click("#cv-del"); page.click("#cv-del")
    page.wait_for_selector("#cv-listview:visible")
    check("conversations: delete works", "c1" in deleted and page.locator("#cv-list li").count() == 1)
    page.screenshot(path="/tmp/claude-1000/acct-conv.png") if False else None
    page.goto(URL + "?tab=captures")
    page.wait_for_selector("#panel-captures:not(.acct-hidden)")
    check("?tab=captures deep link opens the tab", True)
    page.click("#signout")
    check("sign-out clears lists", page.locator("#cp-list li").count() == 0 and page.locator("#cv-list li").count() == 0)

    page, *_ = run(b, "admin")
    tabs = page.eval_on_selector_all(".acct-tab:not(.acct-hidden)", "e=>e.map(x=>x.textContent)")
    check("admin tabs include Invites after the new tabs", tabs == ["Home", "Pockets", "Captures", "Conversations", "Invites"])

    page, *_ = run(b, "member", empty=True)
    page.click("#tab-captures"); page.wait_for_function("document.getElementById('cp-status').textContent.includes('Pockets tab')")
    check("captures empty state mentions pairing in Pockets tab", "paired Pocket" in page.inner_text("#cp-status"))
    page.click("#tab-conversations"); page.wait_for_function("document.getElementById('cv-status').textContent.includes('Pockets tab')")
    check("conversations empty state", True)

    page, *_ = run(b, "member", fail_status=500)
    page.click("#tab-captures"); page.wait_for_function("document.getElementById('cp-status').classList.contains('err')")
    check("error state shown on 500", "Could not load" in page.inner_text("#cp-status"))

    page, *_ = run(b, "member", fail_status=401)
    page.click("#tab-captures")
    page.wait_for_selector("#signin:not(.acct-hidden)")
    check("401 signs the member out", "session ended" in page.inner_text("#signin-msg"))
    b.close()

print("\n%d failed" % len(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
