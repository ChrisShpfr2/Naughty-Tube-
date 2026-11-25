// Wishy privacy layer. The app puts window.__wyCfg = {fp, ref, banners, rtc, ping} in front of this file.
// Runs at document start when the WebView supports it, otherwise as soon as the page begins loading.
// Everything is wrapped in try/catch: a failed protection must never break a page.
(function () {
  "use strict";
  if (window.__wyP) return;
  try { Object.defineProperty(window, "__wyP", { value: 1 }); } catch (e) { window.__wyP = 1; }
  var C = window.__wyCfg || {};

  function def(obj, key, value) {
    try { Object.defineProperty(obj, key, { get: function () { return value; }, configurable: true }); } catch (e) { /* ignore */ }
  }

  // ---- Fingerprint protection ------------------------------------------------------------
  if (C.fp) {
    try {
      def(navigator, "hardwareConcurrency", 4);
      def(navigator, "deviceMemory", 8);
      def(navigator, "languages", ["en-US", "en"]);
      def(navigator, "language", "en-US");
      def(navigator, "getBattery", undefined);
      def(navigator, "maxTouchPoints", 0);
    } catch (e) { /* ignore */ }

    // Canvas read-back gets a tiny per-session change, so the same canvas hashes differently on every launch.
    try {
      var seed = (Math.random() * 255) | 0;
      var twoD = typeof WeakSet === "function" ? new WeakSet() : null;
      var origGet = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type) {
        if (twoD && type === "2d") twoD.add(this);
        return origGet.apply(this, arguments);
      };
      var origGid = CanvasRenderingContext2D.prototype.getImageData;
      var origUrl = HTMLCanvasElement.prototype.toDataURL;
      var origBlob = HTMLCanvasElement.prototype.toBlob;

      var nudge = function (data) {
        var n = Math.min(data.length, 64);
        for (var i = 0; i < n; i += 4) data[i] = data[i] ^ ((seed >> ((i >> 2) & 7)) & 1);
      };
      var noisyCopy = function (c) {
        try {
          if (!twoD || !twoD.has(c) || c.width * c.height < 256) return c;
          var t = document.createElement("canvas");
          t.width = c.width; t.height = c.height;
          var x = t.getContext("2d");
          x.drawImage(c, 0, 0);
          var d = origGid.call(x, 0, 0, Math.min(c.width, 8), Math.min(c.height, 2));
          nudge(d.data);
          x.putImageData(d, 0, 0);
          return t;
        } catch (e) { return c; }
      };
      CanvasRenderingContext2D.prototype.getImageData = function () {
        var d = origGid.apply(this, arguments);
        try { if (d && d.data && d.width * d.height >= 256) nudge(d.data); } catch (e) { /* ignore */ }
        return d;
      };
      HTMLCanvasElement.prototype.toDataURL = function () {
        return origUrl.apply(noisyCopy(this), arguments);
      };
      HTMLCanvasElement.prototype.toBlob = function () {
        return origBlob.apply(noisyCopy(this), arguments);
      };
    } catch (e) { /* ignore */ }
  }

  // ---- Fingerprint protection, part 2: graphics card name and audio fingerprints ---------------
  if (C.fp) {
    try {
      var seed2 = (Math.random() * 255) | 0;
      // The "unmasked" vendor and renderer strings identify the exact GPU; every device now reports the same pair.
      [window.WebGLRenderingContext, window.WebGL2RenderingContext].forEach(function (K) {
        if (!K || !K.prototype) return;
        var g = K.prototype.getParameter;
        K.prototype.getParameter = function (p) {
          if (p === 37445) return "Google Inc.";
          if (p === 37446) return "ANGLE (Generic Renderer)";
          return g.apply(this, arguments);
        };
      });
      // Audio fingerprints read tiny differences in rendered samples; each buffer gets a minute, per-session change.
      if (window.AudioBuffer && AudioBuffer.prototype.getChannelData) {
        var gcd = AudioBuffer.prototype.getChannelData;
        AudioBuffer.prototype.getChannelData = function () {
          var d = gcd.apply(this, arguments);
          try {
            if (!this.__wyN) {
              this.__wyN = 1;
              for (var i = 0; i < d.length && i < 32; i++) d[i] += (((seed2 >> (i & 7)) & 1) ? 1 : -1) * 1e-7;
            }
          } catch (e) { /* ignore */ }
          return d;
        };
      }
      def(navigator, "connection", undefined);
    } catch (e) { /* ignore */ }
  }

  // ---- WebRTC: sites cannot read your local network address through it (video calls stop working) ----
  if (C.rtc) {
    try {
      ["RTCPeerConnection", "webkitRTCPeerConnection", "RTCSessionDescription", "RTCIceCandidate"].forEach(function (n) { def(window, n, undefined); });
    } catch (e) { /* ignore */ }
  }

  // ---- Link pings: <a ping="..."> tells another server about every click; drop it ----------------
  if (C.ping) {
    try {
      var unping = function (ev) {
        try {
          var a = ev.target && ev.target.closest ? ev.target.closest("a[ping]") : null;
          if (a) a.removeAttribute("ping");
        } catch (e) { /* ignore */ }
      };
      document.addEventListener("click", unping, true);
      document.addEventListener("keydown", function (ev) { if (ev.key === "Enter") unping(ev); }, true);
    } catch (e) { /* ignore */ }
  }

  // ---- Referrer: nothing is sent to other sites when you click a link to them -------------
  if (C.ref) {
    try {
      var m = document.createElement("meta");
      m.name = "referrer"; m.content = "strict-origin-when-cross-origin";
      (document.head || document.documentElement).appendChild(m);
      var strip = function (ev) {
        try {
          var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
          if (a && a.origin && a.origin !== location.origin) a.rel = ((a.rel || "") + " noreferrer noopener").trim();
        } catch (e) { /* ignore */ }
      };
      document.addEventListener("click", strip, true);
      document.addEventListener("keydown", function (ev) { if (ev.key === "Enter") strip(ev); }, true);
    } catch (e) { /* ignore */ }
  }

  // ---- Cookie and consent pop-ups (Auto-reject + hide + scroll unlock) ---------------------
  if (C.banners) {
    try {
      var SEL = [
        "#onetrust-consent-sdk", "#onetrust-banner-sdk", "#CybotCookiebotDialog", "#CybotCookiebotDialogBodyUnderlay",
        ".cc-window", ".cc-banner", "#cookie-law-info-bar", "#cookiebanner", "#cookie-banner", ".cookie-banner",
        ".cookie-consent", "#cookieConsent", "#cookie-consent", ".cookie-notice", "#cookie-notice", "#cookie-consent-banner",
        ".truste_overlay", ".truste_box_overlay", "#truste-consent-track", "#qc-cmp2-container", ".qc-cmp2-container",
        "#didomi-host", "#didomi-popup", ".didomi-popup-backdrop", "#usercentrics-root", "[id^=\"sp_message_container\"]",
        ".fc-consent-root", "#gdpr-cookie-notice", ".gdpr-banner", "#gdpr-banner", ".osano-cm-window", ".osano-cm-dialog",
        "#cmpbox", "#cmpwrapper", "#iubenda-cs-banner", ".iubenda-cs-container", "#CookieBanner", ".js-cookie-consent",
        "#consent-banner", ".consent-banner", "#cookiescript_injected", "#moove_gdpr_cookie_info_bar", "#cookieChoiceInfo",
        "#sd-cmp", "#tarteaucitronRoot", "#tarteaucitronAlertBig", "#klaro", ".klaro", "#BorlabsCookieBox", ".cmplz-cookiebanner"
      ].join(",");
      var css = document.createElement("style");
      css.textContent = SEL + "{display:none!important}";
      (document.head || document.documentElement).appendChild(css);

      var KNOWN_REJECT = [
        "#onetrust-reject-all-handler",
        "#CybotCookiebotDialogBodyButtonDecline",
        "#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll",
        "#didomi-notice-disagree-button",
        ".qc-cmp2-summary-buttons button[mode=\"secondary\"]",
        ".fc-cta-do-not-consent",
        "[data-testid=\"uc-deny-all-button\"]",
        ".cn-decline",
        ".iubenda-cs-reject-btn",
        ".cmplz-deny",
        "#BorlabsCookieBoxBtnRefuse",
        "#tarteaucitronAllDenied2",
        ".osano-cm-denyAll",
        "button[data-cookiefirst-action=\"reject\"]",
        "[id*=\"reject\" i][id*=\"cookie\" i]",
        "[class*=\"reject\" i][class*=\"cookie\" i]",
        "[title*=\"Reject\" i]",
        "[title*=\"Decline\" i]"
      ];

      var REJECT_RX = /^(reject( all)?|decline( all)?|refuse( all)?|deny( all)?|disagree|no thanks|only necessary|necessary only|essential(s)? only|only essential(s)?|use necessary cookies only|continue without accepting|opt out|do not consent|alle ablehnen|ablehnen|nur notwendige|tout refuser|refuser|rechazar( todo)?|rifiuta( tutto)?|weigeren)$/i;
      var ACCEPT_RX = /(accept|allow|agree|consent|ok|got it|alle akzeptieren|zustimmen|tout accepter|aceptar)/i;
      var clickedReject = typeof WeakSet === "function" ? new WeakSet() : null;

      var tryClickReject = function (root) {
        if (!root || !root.querySelectorAll) return false;
        for (var i = 0; i < KNOWN_REJECT.length; i++) {
          try {
            var btn = root.querySelector(KNOWN_REJECT[i]);
            if (btn && (!clickedReject || !clickedReject.has(btn))) {
              if (clickedReject) clickedReject.add(btn);
              btn.click();
              return true;
            }
          } catch (e) { /* ignore */ }
        }
        var containers = root.querySelectorAll(
          "[role='dialog'], [aria-modal='true'], [id*='cookie' i], [class*='cookie' i], [id*='consent' i], [class*='consent' i], [id*='gdpr' i], [class*='gdpr' i], [id*='cmp' i]"
        );
        for (var c = 0; c < containers.length; c++) {
          var box = containers[c];
          var btns = box.querySelectorAll("button, a[role='button'], [role='button'], input[type='button'], input[type='submit']");
          for (var j = 0; j < btns.length; j++) {
            var el = btns[j];
            if (clickedReject && clickedReject.has(el)) continue;
            var txt = (el.innerText || el.textContent || el.value || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
            if (!txt || txt.length > 48) continue;
            if (REJECT_RX.test(txt) && !ACCEPT_RX.test(txt)) {
              if (clickedReject) clickedReject.add(el);
              try { el.click(); return true; } catch (e) { /* ignore */ }
            }
          }
        }
        return false;
      };

      var unlock = function () {
        try {
          tryClickReject(document);
          var uc = document.getElementById("usercentrics-root");
          if (uc && uc.shadowRoot) tryClickReject(uc.shadowRoot);
          var r = document.documentElement, b = document.body;
          if (document.querySelector(SEL)) {
            if (r) r.style.setProperty("overflow", "auto", "important");
            if (b) b.style.setProperty("overflow", "auto", "important");
          }
        } catch (e) { /* ignore */ }
      };
      var tries = 0;
      var timer = setInterval(function () { unlock(); if (++tries >= 14) clearInterval(timer); }, 450);
      if (typeof MutationObserver === "function") {
        var obsTimer = null;
        var mo = new MutationObserver(function () {
          if (obsTimer) return;
          obsTimer = setTimeout(function () { obsTimer = null; unlock(); }, 250);
        });
        var startObs = function () { if (document.documentElement) mo.observe(document.documentElement, { childList: true, subtree: true }); };
        if (document.documentElement) startObs(); else document.addEventListener("DOMContentLoaded", startObs);
      }
    } catch (e) { /* ignore */ }
  }

  // ---- Global pop-up, popunder and clickjacking overlay blocker ---------------------------
  if (C.popups) {
    try {
      var makeDummyWin = function () {
        var noop = function () {};
        var docProxy = { open: noop, write: noop, writeln: noop, close: noop };
        var locProxy = { href: "about:blank", assign: noop, replace: noop };
        return {
          closed: false, opener: null, name: "",
          focus: noop, blur: noop, close: noop, postMessage: noop,
          document: docProxy, location: locProxy
        };
      };
      try {
        Object.defineProperty(window, "open", {
          configurable: true,
          writable: false,
          value: function () { return makeDummyWin(); }
        });
      } catch (e) {
        try { window.open = function () { return makeDummyWin(); }; } catch (e2) { /* ignore */ }
      }

      var AD_POP_HOST = /(popads|popcash|propellerads|propu\.sh|monetag|exoclick|exosrv|realsrv|trafficjunky|juicyads|adsterra|highperformanceformat|effectivegatecpm|topcreativeformat|hilltopads|clickadu|adspyglass|tsyndicate|traffichunt|trafficfactory|admaven|ad-maven|onclickalgo|doubleclick|googlesyndication|adf\.ly|linkvertise)/i;
      var isAdHref = function (href) {
        if (!href) return false;
        try {
          var u = new URL(href, location.href);
          if (AD_POP_HOST.test(u.hostname) || /popunder|\/afu\.php/i.test(u.pathname + u.search)) return true;
        } catch (e) { /* ignore */ }
        return false;
      };

      // Neutralize programmatic offscreen _blank anchor clicks used for popunders.
      var origAClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        try {
          var tgt = (this.getAttribute("target") || "").toLowerCase();
          var inDom = document.documentElement && document.documentElement.contains(this);
          if ((tgt === "_blank" && (!inDom || isAdHref(this.href))) || isAdHref(this.href)) {
            return;
          }
        } catch (e) { /* ignore */ }
        return origAClick.apply(this, arguments);
      };

      // Strip _blank from external/ad anchors and block invisible clickjacking overlays.
      document.addEventListener("click", function (ev) {
        try {
          var t = ev.target;
          var a = t && t.closest ? t.closest("a[href]") : null;
          if (a) {
            if (isAdHref(a.href)) {
              ev.preventDefault();
              ev.stopImmediatePropagation();
              return false;
            }
            if ((a.getAttribute("target") || "").toLowerCase() === "_blank") {
              a.removeAttribute("target");
            }
          }
          if (t && t.nodeType === 1 && t !== document.body && t !== document.documentElement) {
            var st = window.getComputedStyle ? getComputedStyle(t) : null;
            if (st && (st.position === "fixed" || st.position === "absolute")) {
              var zi = parseInt(st.zIndex, 10);
              var r = t.getBoundingClientRect ? t.getBoundingClientRect() : null;
              var big = r && r.width >= window.innerWidth * 0.75 && r.height >= window.innerHeight * 0.75;
              var invisible = parseFloat(st.opacity) === 0 || (st.backgroundColor === "rgba(0, 0, 0, 0)" && (t.innerText || "").trim() === "" && !t.querySelector("video, img, input, button"));
              if (big && zi > 500 && invisible) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                t.style.setProperty("display", "none", "important");
                t.style.setProperty("pointer-events", "none", "important");
                return false;
              }
            }
          }
        } catch (e) { /* ignore */ }
      }, true);
    } catch (e) { /* ignore */ }
  }
})();
