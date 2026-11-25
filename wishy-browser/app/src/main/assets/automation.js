// Wishy automation layer. The app prepends:
//   window.__wyAuto = { videoFs, ageBypass, contentPref, popups, allow };
// Runs at document start in every frame when supported, or at page start.
// Everything is wrapped in try/catch so a failing rule never breaks a page.
(function () {
  "use strict";
  if (window.__wyAutoInit) return;
  try { Object.defineProperty(window, "__wyAutoInit", { value: 1 }); } catch (e) { window.__wyAutoInit = 1; }

  var C = window.__wyAuto || {};
  var host = location.hostname;
  if (C.allow && C.allow.indexOf(host) >= 0) return;

  var actedEls = typeof WeakSet === "function" ? new WeakSet() : null;
  var exitedVideos = typeof WeakSet === "function" ? new WeakSet() : null;
  var lastUserClickAt = 0;

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function labelFor(el) {
    if (!el) return "";
    var txt = norm(el.innerText || el.textContent || el.value || el.getAttribute("aria-label") || el.getAttribute("title") || "");
    if (!txt && el.id && document.querySelector) {
      try {
        var lbl = document.querySelector("label[for=\"" + CSS.escape(el.id) + "\"]");
        if (lbl) txt = norm(lbl.innerText || lbl.textContent);
      } catch (e) { /* ignore */ }
    }
    if (!txt && el.closest) {
      var pLbl = el.closest("label");
      if (pLbl) txt = norm(pLbl.innerText || pLbl.textContent);
    }
    return txt;
  }

  function unlockScroll() {
    try {
      if (document.documentElement) document.documentElement.style.setProperty("overflow", "auto", "important");
      if (document.body) document.body.style.setProperty("overflow", "auto", "important");
    } catch (e) { /* ignore */ }
  }

  // ======================================================================================
  // 1. Auto-Fullscreen Videos on Click
  // ======================================================================================
  if (C.videoFs) {
    try {
      var fsCooldown = 0;
      var isFullscreenActive = function () {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
      };

      document.addEventListener("fullscreenchange", function () {
        if (!isFullscreenActive() && lastFsVideo && exitedVideos) {
          exitedVideos.add(lastFsVideo);
        }
      }, true);
      document.addEventListener("webkitfullscreenchange", function () {
        if (!isFullscreenActive() && lastFsVideo && exitedVideos) {
          exitedVideos.add(lastFsVideo);
        }
      }, true);

      var lastFsVideo = null;

      var findPlayerWrap = function (v) {
        if (!v || !v.closest) return v;
        return v.closest(".html5-video-player, .video-js, .plyr, .jwplayer, .fluid_video_wrapper, [class*='video-player' i], [class*='player-container' i], [id*='player' i]") || v;
      };

      var enterFullscreenFor = function (v, fromDirectClick) {
        if (!v || isFullscreenActive()) return;
        var now = Date.now();
        if (now - fsCooldown < 450) return;
        if (!fromDirectClick && exitedVideos && exitedVideos.has(v)) return;
        if (!fromDirectClick) {
          var rect = v.getBoundingClientRect ? v.getBoundingClientRect() : null;
          var tooSmall = rect && (rect.width < 180 || rect.height < 100);
          var looksLikeBgLoop = v.loop && v.muted && !v.controls;
          if (tooSmall || looksLikeBgLoop) return;
        }
        fsCooldown = now;
        lastFsVideo = v;

        try {
          if (v.paused) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          }
        } catch (e) { /* ignore */ }

        var wrap = findPlayerWrap(v);
        // Prefer the player's own fullscreen button when present so custom controls stay available.
        if (wrap && wrap !== v && wrap.querySelector) {
          var fsBtn = wrap.querySelector(
            ".ytp-fullscreen-button, .vjs-fullscreen-control, .plyr__control[data-plyr='fullscreen'], .jw-icon-fullscreen, .fp-fullscreen, button[aria-label*='fullscreen' i], button[title*='fullscreen' i]"
          );
          if (fsBtn && !/exit/i.test((fsBtn.getAttribute("aria-label") || "") + " " + (fsBtn.getAttribute("title") || ""))) {
            try {
              fsBtn.click();
              return;
            } catch (e) { /* fallback below */ }
          }
        }

        var targets = [v, wrap];
        // On custom players with controls inside wrap, try wrap first, else video element.
        if (wrap && wrap !== v) targets = [wrap, v];
        for (var i = 0; i < targets.length; i++) {
          var t = targets[i];
          if (!t) continue;
          try {
            if (t.requestFullscreen) {
              var pr = t.requestFullscreen();
              if (pr && pr.catch) pr.catch(function () {
                try {
                  if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
                  else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
                } catch (e2) { /* ignore */ }
              });
              return;
            }
            if (t.webkitRequestFullscreen) { t.webkitRequestFullscreen(); return; }
          } catch (e) { /* try next */ }
        }
        try {
          if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
        } catch (e) { /* ignore */ }
      };

      var findClickedVideo = function (target) {
        if (!target) return null;
        if (target.tagName === "VIDEO") return target;
        if (target.closest) {
          var wrap = target.closest(".html5-video-player, .video-js, .plyr, .jwplayer, .fluid_video_wrapper, [class*='player' i], [id*='player' i]");
          if (wrap) {
            var v = wrap.querySelector("video");
            if (v) return v;
          }
        }
        return null;
      };

      document.addEventListener("click", function (ev) {
        lastUserClickAt = Date.now();
        var t = ev.target;
        // Do not hijack explicit Exit Fullscreen clicks or settings/volume/timeline clicks inside an active fullscreen player.
        if (isFullscreenActive()) return;
        if (t && t.closest && t.closest("[aria-label*='exit' i], [title*='exit' i], .vjs-volume-panel, .ytp-settings-button")) return;
        var v = findClickedVideo(t);
        if (v) {
          if (exitedVideos) exitedVideos.delete(v);
          setTimeout(function () { enterFullscreenFor(v, true); }, 60);
        }
      }, true);

      // Also catch videos that begin playing right after clicking a video thumbnail/link or play overlay.
      document.addEventListener("playing", function (ev) {
        var v = ev.target;
        if (!v || v.tagName !== "VIDEO" || isFullscreenActive()) return;
        if (Date.now() - lastUserClickAt <= 8000 || (document.referrer && document.referrer !== location.href)) {
          enterFullscreenFor(v, false);
        }
      }, true);
    } catch (e) { /* ignore */ }
  }

  // ======================================================================================
  // 2. Age Verification Pop-up Bypass
  // ======================================================================================
  var AGE_TEXT_RX = /\b(18\+|21\+|over 18|18 years|years of age|age verification|verify your age|confirm your age|are you (at least )?18|adult (content|material|website|site)|mature content|parental advisory|altersbestätigung|volljährig|über 18|18 ans|mayor de edad|maggiorenne)\b/i;
  var AGE_POS_RX = /^(enter( site| here)?|i am (18|over 18|18\+|21\+|an adult)|i'm (18|over 18|18\+)|over 18|18\+|yes(,? i am( 18)?)?|accept( & enter| and enter| all)?|i accept|i agree|agree( & enter| and enter)?|continue|proceed|confirm|enter website|akzeptieren|bestätigen|ja(,? ich bin 18)?|eintreten|weiter|entrer|j'ai 18 ans|aceptar|entrar|accetta|entra)$/i;
  var AGE_NEG_RX = /\b(exit|leave|under 18|i am not|no,|cancel|disagree|decline|reject|back to|google)\b/i;

  function runAgeBypass() {
    if (!C.ageBypass) return;
    try {
      var candidates = document.querySelectorAll(
        "[role='dialog'], [aria-modal='true'], [id*='age' i], [class*='age' i], [id*='verify' i], [class*='verify' i], [id*='disclaimer' i], [class*='disclaimer' i], [id*='gate' i], [class*='gate' i], [id*='modal' i], [class*='modal' i], [id*='overlay' i], [class*='overlay' i], [id*='popup' i], [class*='popup' i]"
      );
      for (var i = 0; i < candidates.length; i++) {
        var box = candidates[i];
        if (!box || (box.offsetWidth === 0 && box.offsetHeight === 0)) continue;
        var text = norm(box.innerText || box.textContent || "");
        if (!text || text.length > 2600 || !AGE_TEXT_RX.test(text)) continue;

        // Check any confirmation checkbox inside the age modal first.
        var cbs = box.querySelectorAll("input[type='checkbox']");
        for (var k = 0; k < cbs.length; k++) {
          var cb = cbs[k];
          if (!cb.checked && !(actedEls && actedEls.has(cb))) {
            var lbl = labelFor(cb);
            if (!lbl || AGE_TEXT_RX.test(lbl) || /agree|confirm|accept|18|terms/i.test(lbl)) {
              if (actedEls) actedEls.add(cb);
              try { cb.click(); } catch (e) { cb.checked = true; }
            }
          }
        }

        var btns = box.querySelectorAll("button, a, input[type='button'], input[type='submit'], [role='button']");
        for (var j = 0; j < btns.length; j++) {
          var b = btns[j];
          if (actedEls && actedEls.has(b)) continue;
          if (b.offsetWidth === 0 && b.offsetHeight === 0) continue;
          var bt = labelFor(b);
          if (!bt || bt.length > 48) continue;
          if (AGE_NEG_RX.test(bt)) continue;
          if (AGE_POS_RX.test(bt) || /\b(i am 18|over 18|enter site|confirm age|18\+ enter|accept & enter)\b/i.test(bt)) {
            if (actedEls) actedEls.add(b);
            try {
              b.click();
              unlockScroll();
              return;
            } catch (e) { /* ignore */ }
          }
        }
      }
    } catch (e) { /* ignore */ }
  }

  // ======================================================================================
  // 3. Preferred Content Type Auto-Selection (Straight & Lesbian ONLY)
  // ======================================================================================
  var STRAIGHT_RX = /\b(straight|hetero(sexual)?|men\s*&\s*women|women\s*&\s*men)\b/i;
  var LESBIAN_RX = /\b(lesbian|lesbians|women\s*&\s*women)\b/i;
  var EXCLUDE_RX = /\b(gay|trans|transgender|shemale|ladyboy|ts|bi|bisexual|queer|all|everything|both|men only|couples)\b/i;
  var ORIENT_CTX_RX = /\b(orientation|preference|interested in|show me|content type|what do you like|looking for|category)\b/i;

  function isPreferred(txt) {
    if (!txt) return false;
    var hasPref = STRAIGHT_RX.test(txt) || LESBIAN_RX.test(txt);
    if (!hasPref) return false;
    // Allow combined "Straight & Lesbian" explicitly, otherwise reject if mixed with excluded words like "Straight & Gay" or "All".
    if (/\b(gay|trans|transgender|shemale|bisexual|all)\b/i.test(txt)) return false;
    return true;
  }

  function isExcluded(txt) {
    return !!txt && EXCLUDE_RX.test(txt) && !STRAIGHT_RX.test(txt) && !LESBIAN_RX.test(txt);
  }

  function isOrientationWidget(box) {
    if (!box) return false;
    var t = norm(box.innerText || box.textContent || "");
    if (!t || t.length > 1800) return false;
    var hits = 0;
    if (STRAIGHT_RX.test(t)) hits++;
    if (LESBIAN_RX.test(t)) hits++;
    if (/\bgay\b/i.test(t)) hits++;
    if (/\b(trans|transgender|shemale)\b/i.test(t)) hits++;
    return hits >= 2 || (hits >= 1 && ORIENT_CTX_RX.test(t));
  }

  function runContentPref() {
    if (!C.contentPref) return;
    try {
      // A. <select> dropdowns for orientation/preference
      var selects = document.querySelectorAll("select");
      for (var s = 0; s < selects.length; s++) {
        var sel = selects[s];
        if (actedEls && actedEls.has(sel)) continue;
        var ctx = (sel.name || "") + " " + (sel.id || "") + " " + (sel.getAttribute("aria-label") || "");
        var opts = Array.prototype.slice.call(sel.options || []);
        var optText = opts.map(function (o) { return norm(o.text); }).join(" ");
        if (!ORIENT_CTX_RX.test(ctx) && !(STRAIGHT_RX.test(optText) && /\bgay\b/i.test(optText))) continue;

        var chosen = opts.find(function (o) { return STRAIGHT_RX.test(o.text) && LESBIAN_RX.test(o.text); }) ||
          opts.find(function (o) { return isPreferred(o.text) && STRAIGHT_RX.test(o.text); }) ||
          opts.find(function (o) { return isPreferred(o.text) && LESBIAN_RX.test(o.text); });
        if (chosen && sel.value !== chosen.value) {
          if (actedEls) actedEls.add(sel);
          sel.value = chosen.value;
          sel.dispatchEvent(new Event("input", { bubbles: true }));
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // B. Modal / form / selector containers
      var boxes = document.querySelectorAll(
        "[role='dialog'], [aria-modal='true'], form, [id*='orient' i], [class*='orient' i], [id*='pref' i], [class*='pref' i], [id*='gender' i], [class*='gender' i], [id*='category' i], [class*='category' i], [id*='filter' i], [class*='filter' i]"
      );
      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        if (!box || (box.offsetWidth === 0 && box.offsetHeight === 0)) continue;
        if (!isOrientationWidget(box)) continue;

        var changed = false;

        // 1) Checkboxes: check Straight & Lesbian, uncheck everything else (Gay, Trans, Bi, All)
        var cbs = box.querySelectorAll("input[type='checkbox'], [role='checkbox']");
        if (cbs.length >= 2) {
          for (var c = 0; c < cbs.length; c++) {
            var cb = cbs[c];
            var lbl = labelFor(cb);
            if (!lbl || lbl.length > 40) continue;
            var isChecked = cb.tagName === "INPUT" ? !!cb.checked : cb.getAttribute("aria-checked") === "true";
            if (isPreferred(lbl)) {
              if (!isChecked && !(actedEls && actedEls.has(cb))) {
                if (actedEls) actedEls.add(cb);
                try { cb.click(); changed = true; } catch (e) { /* ignore */ }
              }
            } else if (isExcluded(lbl)) {
              if (isChecked && !(actedEls && actedEls.has(cb))) {
                if (actedEls) actedEls.add(cb);
                try { cb.click(); changed = true; } catch (e) { /* ignore */ }
              }
            }
          }
        }

        // 2) Radio buttons or toggle/choice buttons inside an orientation dialog/selector
        var isModal = box.matches && box.matches("[role='dialog'], [aria-modal='true'], [id*='orient' i], [class*='orient' i], [id*='pref' i], [class*='pref' i]");
        var radios = box.querySelectorAll("input[type='radio']");
        if (radios.length >= 2) {
          var pickRadio = null;
          for (var r = 0; r < radios.length; r++) {
            var rl = labelFor(radios[r]);
            if (STRAIGHT_RX.test(rl) && LESBIAN_RX.test(rl)) { pickRadio = radios[r]; break; }
            if (!pickRadio && isPreferred(rl) && STRAIGHT_RX.test(rl)) pickRadio = radios[r];
            else if (!pickRadio && isPreferred(rl) && LESBIAN_RX.test(rl)) pickRadio = radios[r];
          }
          if (pickRadio && !pickRadio.checked && !(actedEls && actedEls.has(pickRadio))) {
            if (actedEls) actedEls.add(pickRadio);
            try { pickRadio.click(); changed = true; } catch (e) { /* ignore */ }
          }
        }

        // 3) Button/pill choices (multi-select aria-pressed or single-select modal cards)
        if (cbs.length === 0 && radios.length === 0) {
          var btns = box.querySelectorAll("button, a[role='button'], [role='button'], [data-orientation], [data-preference]");
          var orientBtns = [];
          for (var b = 0; b < btns.length; b++) {
            var bt = labelFor(btns[b]);
            if (bt && bt.length <= 36 && (STRAIGHT_RX.test(bt) || LESBIAN_RX.test(bt) || EXCLUDE_RX.test(bt))) {
              orientBtns.push({ el: btns[b], txt: bt });
            }
          }
          if (orientBtns.length >= 2) {
            var hasPressedState = orientBtns.some(function (x) { return x.el.hasAttribute("aria-pressed"); });
            if (hasPressedState) {
              orientBtns.forEach(function (x) {
                var pressed = x.el.getAttribute("aria-pressed") === "true";
                if (isPreferred(x.txt) && !pressed && !(actedEls && actedEls.has(x.el))) {
                  if (actedEls) actedEls.add(x.el);
                  try { x.el.click(); changed = true; } catch (e) { /* ignore */ }
                } else if (isExcluded(x.txt) && pressed && !(actedEls && actedEls.has(x.el))) {
                  if (actedEls) actedEls.add(x.el);
                  try { x.el.click(); changed = true; } catch (e) { /* ignore */ }
                }
              });
            } else if (isModal) {
              var best = orientBtns.find(function (x) { return STRAIGHT_RX.test(x.txt) && LESBIAN_RX.test(x.txt); }) ||
                orientBtns.find(function (x) { return isPreferred(x.txt) && STRAIGHT_RX.test(x.txt); }) ||
                orientBtns.find(function (x) { return isPreferred(x.txt) && LESBIAN_RX.test(x.txt); });
              if (best && !(actedEls && actedEls.has(best.el))) {
                if (actedEls) actedEls.add(best.el);
                try { best.el.click(); changed = true; } catch (e) { /* ignore */ }
              }
            }
          }
        }

        // 4) If we updated preferences inside a modal/form, click its Save/Apply/Continue button if present
        if (changed && isModal) {
          var submitBtns = box.querySelectorAll("button, input[type='submit'], input[type='button'], [role='button']");
          for (var sb = 0; sb < submitBtns.length; sb++) {
            var sbt = labelFor(submitBtns[sb]);
            if (/^(save|apply|continue|confirm|done|enter|ok|submit|speichern|weiter)$/i.test(sbt) && !(actedEls && actedEls.has(submitBtns[sb]))) {
              if (actedEls) actedEls.add(submitBtns[sb]);
              setTimeout((function (btn) { return function () { try { btn.click(); } catch (e) {} }; })(submitBtns[sb]), 120);
              break;
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
  }

  function sweep() {
    runAgeBypass();
    runContentPref();
  }

  if (C.ageBypass || C.contentPref) {
    var ticks = 0;
    var interval = setInterval(function () {
      sweep();
      if (++ticks >= 16) clearInterval(interval);
    }, 500);

    if (typeof MutationObserver === "function") {
      var pending = false;
      var mo = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        setTimeout(function () { pending = false; sweep(); }, 250);
      });
      var attach = function () {
        if (document.documentElement) mo.observe(document.documentElement, { childList: true, subtree: true });
      };
      if (document.documentElement) attach();
      else document.addEventListener("DOMContentLoaded", attach);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", sweep);
    } else {
      sweep();
    }
  }
})();
