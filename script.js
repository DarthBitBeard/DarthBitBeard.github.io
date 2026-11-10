(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var toTop = document.getElementById("toTop");

  /* ---------- Theme ---------- */
  var themeToggle = document.getElementById("themeToggle");
  function showTheme(theme) {
    if (!themeToggle) { return; }
    var dark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  /* Follow the system light/dark setting live until the visitor picks one. */
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  function onSystemTheme(event) {
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved) { return; }
    var theme = event.matches ? "dark" : "light";
    root.setAttribute("data-theme", theme);
    showTheme(theme);
  }
  if (systemDark.addEventListener) { systemDark.addEventListener("change", onSystemTheme); }
  else if (systemDark.addListener) { systemDark.addListener(onSystemTheme); }
  if (themeToggle) {
    showTheme(root.getAttribute("data-theme") || "light");
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      showTheme(next);
    });
  }

  /* ---------- Easter egg: the Case File skin ----------
     Triple-tap the portrait, or type "casefile" anywhere. */
  function openCaseFile(origin) {
    if (window.LBEggs) { window.LBEggs.found("casefile", false); }
    if (window.LBSkin) { window.LBSkin.go("casefile", { origin: origin }); }
    else { try { localStorage.setItem("lb-skin", "casefile"); } catch (e) {} window.location.href = "casefile.html"; }
  }
  var photoCard = document.getElementById("photoCard");
  if (photoCard) {
    var tapCount = 0;
    var tapTimer = null;
    photoCard.addEventListener("click", function () {
      tapCount += 1;
      window.clearTimeout(tapTimer);
      if (tapCount >= 3) { tapCount = 0; openCaseFile(photoCard.querySelector(".photo-frame")); return; }
      tapTimer = window.setTimeout(function () { tapCount = 0; }, 1200);
    });
  }
  var typedEgg = "";
  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) { return; }
    var tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") { return; }
    if (typeof event.key !== "string" || event.key.length !== 1) { return; }
    typedEgg = (typedEgg + event.key.toLowerCase()).slice(-8);
    if (typedEgg === "casefile") { typedEgg = ""; openCaseFile(); }
  });

  /* ---------- Copy to clipboard, with a short confirmation ---------- */
  var copyToast = document.getElementById("copyToast");
  var toastTimer = null;
  function announce(message) {
    if (!copyToast) { return; }
    copyToast.textContent = message;
    copyToast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      copyToast.classList.remove("show");
      window.setTimeout(function () { if (!copyToast.classList.contains("show")) { copyToast.textContent = ""; } }, 350);
    }, 2200);
  }
  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.className = "sr-only";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    area.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }

  document.querySelectorAll(".copy-email").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy");
      copyText(text).then(function () {
        button.classList.add("copied");
        window.setTimeout(function () { button.classList.remove("copied"); }, 2200);
        announce(button.getAttribute("data-copied") || "Copied");
      }, function () { announce("Couldn't copy. The address is " + text); });
    });
  });

  /* A copy-link button beside each section's kicker, for sharing a section. */
  document.querySelectorAll("section[id] > .wrap > .section-head .kicker, section[id] > .wrap > .contact-card .kicker").forEach(function (kicker) {
    var section = kicker.closest("section[id]");
    var label = kicker.lastChild && kicker.lastChild.nodeType === 3 ? kicker.lastChild.textContent.trim() : section.id;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "section-link";
    button.setAttribute("aria-label", "Copy link to the " + label + " section");
    button.title = "Copy link to this section";
    button.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-link"/></svg>';
    button.addEventListener("click", function () {
      var url = location.origin + location.pathname + "#" + section.id;
      copyText(url).then(function () {
        try { history.replaceState(null, "", "#" + section.id); } catch (e) {}
        announce("Link to " + label + " copied");
      }, function () { announce("Couldn't copy the link"); });
    });
    kicker.appendChild(button);
  });

  /* ---------- Back-to-top button ---------- */
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    if (toTop) { toTop.classList.toggle("show", y > window.innerHeight * 0.9); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Count-up for stat numbers like "6+ yrs" ---------- */
  function countUp(el) {
    var match = /^(\d+)(\D.*)?$/.exec(el.getAttribute("data-count") || "");
    if (!match || /\//.test(match[2] || "")) { return; }
    var target = parseInt(match[1], 10);
    var suffix = match[2] || "";
    var start = null;
    function tick(now) {
      if (start === null) { start = now; }
      var t = Math.min(1, (now - start) / 1100);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) { window.requestAnimationFrame(tick); }
    }
    el.textContent = "0" + suffix;
    window.requestAnimationFrame(tick);
  }

  /* Count up stat numbers when common.js reveals them. */
  document.addEventListener("lb:reveal", function (event) {
    if (!reduceMotion) { event.target.querySelectorAll("[data-count]").forEach(countUp); }
  });

  if (reduceMotion || !finePointer) { return; }

  /* ---------- Pointer effects (mouse and trackpad only) ---------- */
  document.querySelectorAll(".spot").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", (event.clientX - rect.left) + "px");
      card.style.setProperty("--my", (event.clientY - rect.top) + "px");
    });
  });

  var photoFrame = photoCard ? photoCard.querySelector(".photo-frame") : null;
  if (photoCard && photoFrame) {
    photoCard.addEventListener("mousemove", function (event) {
      var rect = photoCard.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      photoFrame.style.transform = "rotateY(" + x * 10 + "deg) rotateX(" + -y * 10 + "deg) scale(1.02)";
    });
    photoCard.addEventListener("mouseleave", function () { photoFrame.style.transform = ""; });
  }

  var heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || 0;
        if (y < 900) { heroBg.style.transform = "translateY(" + y * 0.25 + "px)"; }
        ticking = false;
      });
    }, { passive: true });
  }
})();
