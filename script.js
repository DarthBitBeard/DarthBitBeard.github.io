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
