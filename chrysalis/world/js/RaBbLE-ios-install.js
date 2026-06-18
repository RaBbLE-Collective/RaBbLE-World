/**
 * ios-install.js — "Add to Home Screen" nudge for iOS Safari
 *
 * Shows a RaBbLE-styled banner when the user is on iOS Safari (not already
 * installed as a standalone PWA). Dismissed via × and suppressed for 30 days.
 */
(function () {
  const STORAGE_KEY = 'rabble_ios_banner_dismissed';
  const SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  // Only show on iOS in a browser (not standalone)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = ('standalone' in navigator) && navigator.standalone;
  if (!isIOS || isStandalone) return;

  // Check dismiss timestamp
  const ts = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  if (Date.now() - ts < SUPPRESS_MS) return;

  const CSS = `
#rabble-ios-banner {
  position: fixed;
  bottom: max(env(safe-area-inset-bottom, 12px), 12px);
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  width: min(360px, calc(100vw - 32px));
  background: rgba(18, 19, 42, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(191, 95, 255, 0.35);
  border-radius: 14px;
  padding: 14px 16px 14px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 99999;
  box-shadow: 0 0 28px rgba(191, 95, 255, 0.18), 0 8px 32px rgba(0,0,0,0.6);
  transition: transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: var(--font-ui, 'Exo 2', sans-serif);
  color: var(--rabble-text, #e8e6f0);
  -webkit-user-select: none;
  user-select: none;
}
#rabble-ios-banner.visible {
  transform: translateX(-50%) translateY(0);
}
#rabble-ios-banner .rib-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(255,45,120,0.18), rgba(191,95,255,0.18));
  border: 1px solid rgba(191,95,255,0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
#rabble-ios-banner .rib-body {
  flex: 1;
  min-width: 0;
}
#rabble-ios-banner .rib-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #ff2d78, #bf5fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 3px;
}
#rabble-ios-banner .rib-text {
  font-size: 12px;
  color: var(--rabble-muted, #6b6880);
  line-height: 1.45;
}
#rabble-ios-banner .rib-text strong {
  color: #e8e0f0;
}
#rabble-ios-banner .rib-share {
  display: inline-block;
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  fill: #00f5ff;
}
#rabble-ios-banner .rib-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--rabble-muted, #6b6880);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  margin-top: -2px;
  transition: color 0.2s;
}
#rabble-ios-banner .rib-close:hover { color: var(--rabble-text, #e8e6f0); }
  `;

  const shareIcon = `<svg class="rib-share" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 5l-4-4-4 4h3v8h2V5h3zm-9 4H5a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V10a1 1 0 00-1-1h-2v2h1v8H6v-8h1V9z"/>
  </svg>`;

  function inject() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'rabble-ios-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <div class="rib-icon">⚡</div>
      <div class="rib-body">
        <div class="rib-title">Go Full Screen</div>
        <div class="rib-text">
          Tap ${shareIcon} <strong>Share</strong> then
          <strong>"Add to Home Screen"</strong> to run RaBbLE without browser bars.
        </div>
      </div>
      <button class="rib-close" aria-label="Dismiss">×</button>
    `;
    document.body.appendChild(banner);

    // Trigger slide-up on next frame
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('visible')));

    banner.querySelector('.rib-close').addEventListener('click', () => {
      banner.style.transform = 'translateX(-50%) translateY(130%)';
      banner.style.transition = 'transform 0.3s ease-in';
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setTimeout(() => banner.remove(), 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
