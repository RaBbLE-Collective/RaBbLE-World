"""Face tests: the account control in the status bar, and the guest prompt, against a mocked sCoRE.
Run:  DEV_PORT=8010 bash ../RaBbLE-Grimoire/spells/dev-serve.sh --world   (serves World on :8010)
      python3 tests/test_face_account.py [base_url]     default http://localhost:8010/
Needs python playwright + chromium. No real network: /health and /api/v1 are intercepted, and the
NeBuLA bundle is aborted on purpose (the face still wakes without the entity), so the run is fast."""
import json, os, re, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8010/"
ORIGIN = re.match(r"https?://[^/]+", URL).group(0)
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"}
SHOTS = os.environ.get("FACE_SHOTS", "/tmp/")
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
    page.route(re.compile(r".*/(api/v1|health)(/.*)?$"), api)
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

    # ── guest prompt ──
    page, chats, errors = open_face(b)
    gate = page.locator("#faceGate")
    check("guest: no prompt before the first turn", gate.is_hidden())
    say(page, "one")
    check("guest: turn 1 answered, no prompt, box still open", gate.is_hidden() and page.locator("#faceInput").is_enabled() and len(chats) == 1)
    say(page, "two")
    check("guest: after the reply to turn 2 the prompt is shown", gate.is_visible() and len(chats) == 2)
    check("guest: the second reply is on screen", "A reply for you." in page.inner_text("#faceVoice"))
    check("guest: typing is disabled with a reason in the box", page.locator("#faceInput").is_disabled() and page.get_attribute("#faceInput", "placeholder") == "sign in to keep talking")
    check("guest: send is disabled", page.locator("#faceSend").is_disabled())
    links = page.eval_on_selector_all("#faceGate a", "e=>e.map(x=>[x.textContent.trim(), x.getAttribute('href')])")
    check("prompt offers sign in and create an account", links == [["sign in", "/world/account"], ["create an account", "/world/account?tab=signup"]])
    gtext = page.inner_text("#faceGate")
    check("prompt says a new account needs an invite", "needs an invite" in gtext)
    check("prompt copy has no em dash", "\u2014" not in gtext)
    page.evaluate("document.getElementById('faceAsk').requestSubmit ? document.getElementById('faceAsk').dispatchEvent(new Event('submit', {cancelable:true})) : 0")
    page.wait_for_timeout(300)
    check("guest: a forced third send makes no request", len(chats) == 2)
    check("guest: turn count kept in sessionStorage", page.evaluate("sessionStorage.getItem('rabble:guest-turns')") == "2")
    page.reload(); page.click("#faceArrive"); page.wait_for_selector("body[data-beat=meet]")
    check("guest: reload keeps the prompt (count survives in the tab)", page.locator("#faceGate").is_visible() and page.locator("#faceInput").is_disabled())

    page, chats, errors = open_face(b, seed_turns=2)
    check("guest: two turns already spent shows the prompt on arrival", page.locator("#faceGate").is_visible())

    page, chats, errors = open_face(b, session=SESSION)
    for i in range(4): say(page, "m%d" % i)
    check("member: four turns, never prompted", page.locator("#faceGate").is_hidden() and page.locator("#faceInput").is_enabled() and len(chats) == 4)
    check("member: every turn sent the bearer token", all(c["auth"] == "Bearer tok123" for c in chats))
    page, chats, errors = open_face(b, session=SESSION, seed_turns=5)
    check("member: an old guest count never prompts", page.locator("#faceGate").is_hidden())

    page, chats, errors = open_face(b, chat="429")
    page.fill("#faceInput", "hello"); page.press("#faceInput", "Enter")
    page.wait_for_selector("#faceGate:not([hidden])")
    check("429: the prompt is shown with the allowance copy", "allowance is used up" in page.inner_text("#faceGateCopy"))
    check("429: typing disabled", page.locator("#faceInput").is_disabled() and page.locator("#faceSend").is_disabled())
    lines = page.eval_on_selector_all("#faceVoice .face-voice-line", "e=>e.map(x=>x.className+'|'+x.textContent)")
    check("429: no empty or scripted reply left behind", not any(l.startswith("face-voice-line is-entity|") and l.endswith("|") for l in lines) and len(lines) == 2)
    check("429: a guest sent no token", chats[0]["auth"] is None)

    page, chats, errors = open_face(b, session=SESSION, chat="429")
    page.fill("#faceInput", "hello"); page.press("#faceInput", "Enter")
    page.wait_for_function("document.querySelectorAll('#faceVoice .face-voice-line').length>=3")
    page.wait_for_timeout(300)
    check("member rate limit (429 with token) is never the guest prompt", page.locator("#faceGate").is_hidden())

    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.add_init_script("Object.defineProperty(window,'sessionStorage',{get(){throw new Error('off')}})")
    page.route(re.compile(r"http://localhost:8000/.*"), lambda r: r.fulfill(status=200, headers=CORS, content_type="text/event-stream", body='data: "ok"\n\ndata: [DONE]\n\n') if "/chat" in r.request.url else r.fulfill(status=200, headers=CORS, content_type="application/json", body="{}"))
    page.route(re.compile(r".*/nebula/.*"), lambda r: r.abort())
    page.goto(URL); page.click("#faceArrive"); page.wait_for_selector("body[data-beat=meet]")
    say(page, "a"); say(page, "b")
    check("storage off: still stops at two turns (memory count)", page.locator("#faceGate").is_visible())

    page, chats, errors = open_face(b, width=390, height=844, seed_turns=2)
    page.wait_for_timeout(500)
    gb = page.locator("#faceGate").bounding_box()
    abox = page.locator("#faceGate a >> nth=1").bounding_box()
    check("phone: prompt inside the viewport with 16px gutters", gb["x"] >= 15 and gb["x"] + gb["width"] <= 390 - 15)
    check("phone: both buttons visible and inside the card", abox["x"] + abox["width"] <= gb["x"] + gb["width"] and abox["y"] + abox["height"] <= 844)
    check("phone: no horizontal scroll with the prompt", page.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))
    page.screenshot(path=SHOTS + "gate_390.png")
    page, chats, errors = open_face(b, seed_turns=2)
    page.wait_for_timeout(500)
    page.screenshot(path=SHOTS + "gate_1280.png")
    check("no page errors with the prompt", not errors)

    # portal: the sign-up link opens the sign-up form
    page = b.new_context(viewport={"width": 375, "height": 800}).new_page()
    page.route(re.compile(r"http://localhost:8000/.*"), lambda r: r.fulfill(status=200, headers=CORS, content_type="application/json", body="{}"))
    page.goto(ORIGIN + "/world/account.html?tab=signup")
    check("portal: ?tab=signup opens the sign-up form", page.locator("#signup").is_visible() and page.locator("#signin").is_hidden())

    b.close()

print("\n%d failed" % len(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
