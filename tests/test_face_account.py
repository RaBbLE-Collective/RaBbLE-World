"""Face tests: the account control in the status bar, and the guest prompt, against a mocked sCoRE.
Run:  DEV_PORT=8010 bash ../RaBbLE-Grimoire/spells/dev-serve.sh --world   (serves World on :8010)
      python3 tests/test_face_account.py [base_url]     default http://localhost:8010/
Needs python playwright + chromium. No real network: /health and /api/v1 are intercepted, and the
NeBuLA bundle is aborted on purpose (the face still wakes without the entity), so the run is fast."""
import json, re, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8010/"
ORIGIN = re.match(r"https?://[^/]+", URL).group(0)
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"}
SESSION = {"token": "tok123", "expires_at": 4102444800000, "name": "Mark M", "username": "mark", "tier": "member", "email_verified": True}

def open_face(browser, width=1280, height=800, session=None, chat="ok", seed_turns=None):
    """chat: 'ok' streams a reply, '429' answers the guest limit, 'down' refuses (scripted fallback)."""
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    chats = []
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    def api(route):
        req = route.request
        path = re.sub(r"^https?://[^/]+", "", req.url)
        if req.method == "OPTIONS":
            return route.fulfill(status=204, headers=CORS)
        if path.startswith("/health"):
            return route.fulfill(status=200, content_type="application/json", headers=CORS, body='{"presence":1}')
        if path.startswith("/api/v1/chat"):
            chats.append({"auth": req.headers.get("authorization"), "body": json.loads(req.post_data or "{}")})
            if chat == "429":
                return route.fulfill(status=429, content_type="application/json", headers=CORS,
                                     body=json.dumps({"detail": "Guest limit reached: daily allowance. Sign in to keep going."}))
            if chat == "down":
                return route.fulfill(status=503, content_type="application/json", headers=CORS, body="{}")
            return route.fulfill(status=200, content_type="text/event-stream", headers=CORS,
                                 body='data: "A reply for you."\n\ndata: [DONE]\n\n')
        return route.fulfill(status=404, content_type="application/json", headers=CORS, body="{}")
    page.route(re.compile(r"http://localhost:8000/.*"), api)
    page.route(re.compile(r"https://score\.joinrabble\.world/.*"), api)
    page.route(re.compile(r".*/nebula/.*"), lambda r: r.abort())
    if session is not None:
        page.add_init_script("sessionStorage.setItem('rabble.account', %s)" % json.dumps(json.dumps(session)))
    if seed_turns is not None:
        page.add_init_script("sessionStorage.setItem('rabble:guest-turns', '%d')" % seed_turns)
    page.goto(URL)
    page.click("#faceArrive")
    page.wait_for_selector("body[data-beat=meet]")
    return page, chats, errors

def say(page, text):
    """Send one message and wait until its reply is shown and the box is free again."""
    n = page.locator("#faceVoice .face-voice-line").count()
    page.fill("#faceInput", text)
    page.press("#faceInput", "Enter")
    page.wait_for_function("(n) => document.querySelectorAll('#faceVoice .face-voice-line').length >= n + 2", arg=n)
    page.wait_for_function("!document.getElementById('faceSend').disabled || (document.getElementById('faceGate') && !document.getElementById('faceGate').hidden)")
    page.wait_for_timeout(200)

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ── account control ──
    page, chats, errors = open_face(b)
    el = page.locator("#faceAccount")
    check("signed out: control says 'sign in'", el.inner_text().strip().lower() == "sign in")
    check("signed out: control links to /world/account", el.get_attribute("href") == "/world/account")
    box = el.bounding_box(); pill = page.locator("#presencePill").bounding_box()
    check("signed out: control is top right, left of the presence pill", box["y"] < 40 and box["x"] + box["width"] <= pill["x"] + 1 and pill["x"] + pill["width"] > 1280 - 40)
    check("no page errors on the face", not errors)

    page, chats, errors = open_face(b, session=SESSION)
    el = page.locator("#faceAccount")
    check("signed in: control shows the username", el.inner_text().strip() == "mark")
    check("signed in: control still links to /world/account", el.get_attribute("href") == "/world/account")
    check("signed in: not the display name", "Mark M" not in el.inner_text())

    expired = dict(SESSION, expires_at=1000)
    page, chats, errors = open_face(b, session=expired)
    check("expired session reads as signed out", page.locator("#faceAccount").inner_text().strip().lower() == "sign in")

    page, chats, errors = open_face(b, width=390, height=844, session=SESSION)
    box = page.locator("#faceAccount").bounding_box(); pill = page.locator("#presencePill").bounding_box()
    check("phone: control and pill pinned top right", box["x"] + box["width"] <= pill["x"] + 1 and pill["x"] + pill["width"] > 390 - 40 and box["y"] < 40)
    check("phone: no horizontal scroll", page.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))

    # ── chat attribution ──
    page, chats, errors = open_face(b, session=SESSION)
    page.fill("#faceInput", "hello"); page.press("#faceInput", "Enter")
    page.wait_for_function("document.querySelectorAll('#faceVoice .face-voice-line').length>=3")
    check("signed in: chat sends the member's bearer token", chats and chats[0]["auth"] == "Bearer tok123")

    page, chats, errors = open_face(b)
    page.fill("#faceInput", "hello"); page.press("#faceInput", "Enter")
    page.wait_for_function("document.querySelectorAll('#faceVoice .face-voice-line').length>=3")
    check("guest: chat sends no Authorization header", chats and chats[0]["auth"] is None)

    b.close()

print("\n%d failed" % len(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
