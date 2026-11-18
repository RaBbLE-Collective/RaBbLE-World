"""Add a Pocket: the key goes to the device over Web Serial (mocked port). Playwright + chromium; no device, no network.
Run:  DEV_PORT=8010 bash ../RaBbLE-Grimoire/spells/dev-serve.sh --world ; python3 tests/test_pocket_serial.py [url]"""
import json, re, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8010/world/account.html"
KEY = "rbdv_" + "a1B2c3D4" * 4
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

FAKE = """
(() => {
  const held = %s;
  window.__written = [];
  let hasToken = held;
  const enc = new TextEncoder();
  let ctl;
  const readable = new ReadableStream({ start(c) { ctl = c; } });
  const emit = (s) => ctl.enqueue(enc.encode(s + '\\r\\n'));
  const writable = new WritableStream({ write(chunk) {
    const line = new TextDecoder().decode(chunk).trim();
    window.__written.push(line);
    emit('I (12) rabble: log line');
    if (line === '>status') emit('@status {"board":"rabble_waveshare_175b","device":{"beam":{"token":' + hasToken + ',"state":"Saved"}}}');
    else if (line.startsWith('>beam.token=')) { hasToken = true; emit('@setup beam.token: ok'); }
  }});
  const port = { getInfo: () => ({ usbVendorId: 0x303a }), open: async () => {}, close: async () => {}, setSignals: async () => {}, readable, writable };
  Object.defineProperty(navigator, 'serial', { value: { getPorts: async () => [port], requestPort: async () => port }, configurable: true });
})();
"""

def run(b, held):
    ctx = b.new_context(viewport={"width": 375, "height": 800})
    page = ctx.new_page()
    page.add_init_script(FAKE % ("true" if held else "false"))
    dialogs = []
    page.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
    def handler(route):
        req = route.request
        path = re.sub(r"^https?://[^/]+", "", req.url)
        def ok(body, status=200):
            route.fulfill(status=status, content_type="application/json", body=json.dumps(body),
                          headers={"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"})
        if req.method == "OPTIONS": return ok({})
        if path.startswith("/api/v1/auth/login"):
            return ok({"token": "tok123", "expires_in": 3600, "username": "mark", "tier": "member", "email_verified": True})
        if path.startswith("/api/v1/devices") and req.method == "POST": return ok({"key": KEY, "id": "d1", "label": "My Pocket"}, 201)
        if path.startswith("/api/v1/devices"): return ok({"devices": [], "limit": 3})
        return ok({})
    page.route("**/api/v1/**", handler)
    page.route("http://localhost:8000/**", handler)
    page.route(re.compile(r"https://score\.joinrabble\.world/.*"), handler)
    page.goto(URL)
    page.fill("#si-identifier", "mark"); page.fill("#si-password", "pw")
    page.click("#signin-form button[type=submit]")
    page.wait_for_selector("#home:not(.acct-hidden)")
    page.click("#tab-pockets")
    page.fill("#pk-label", "My Pocket"); page.click("#pk-add")
    page.wait_for_selector("#pk-key-panel:not(.acct-hidden)")
    return page, dialogs

with sync_playwright() as pw:
    b = pw.chromium.launch()
    page, dialogs = run(b, held=False)
    check("USB button shown when Web Serial exists", page.locator("#pk-usb").is_visible())
    page.click("#pk-usb")
    page.wait_for_selector("#pk-key-panel.acct-hidden", state="attached")
    w = page.evaluate("window.__written")
    check("fresh Pocket: key written as >beam.token=KEY", ">beam.token=" + KEY in w)
    check("fresh Pocket: no replace prompt", not dialogs)
    check("success message shown, key cleared from the page", "has its key" in page.inner_text("#pk-msg") and KEY not in page.content())

    page, dialogs = run(b, held=True)
    page.click("#pk-usb")
    page.wait_for_function("document.getElementById('pk-usb-msg').textContent.includes('unchanged')")
    w = page.evaluate("window.__written")
    check("held key: asked before replacing", len(dialogs) == 1)
    check("held key, declined: no token written", not any(l.startswith(">beam.token=") for l in w))
    check("declined: key still on screen for copy", page.locator("#pk-key-panel").is_visible() and page.inner_text("#pk-key") == KEY)
    check("USB button usable again after a decline", page.locator("#pk-usb").is_enabled())
    check("no horizontal scroll at 375px", page.evaluate("document.documentElement.scrollWidth<=window.innerWidth"))

    ctx = b.new_context(); p2 = ctx.new_page(); p2.goto(URL)
    check("module loads without serial and reports unsupported", p2.evaluate("typeof RaBbLEPocketSerial.supported()") == "boolean")
    b.close()
print("\nFAILED: " + ", ".join(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
