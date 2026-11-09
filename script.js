(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var nav = document.getElementById("topNav");
  var progressBar = document.getElementById("progressBar");
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

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var menuLinks = document.getElementById("navLinks");
  function setMenu(open) {
    if (!nav || !menuToggle) { return; }
    nav.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (menuToggle && menuLinks) {
    menuToggle.addEventListener("click", function () { setMenu(!nav.classList.contains("menu-open")); });
    menuLinks.addEventListener("click", function (event) { if (event.target.closest("a")) { setMenu(false); } });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("menu-open")) { setMenu(false); menuToggle.focus(); }
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("menu-open") && !nav.contains(event.target)) { setMenu(false); }
    });
  }

  /* "New" badges hide themselves after their data-new-until date. */
  var todayIso = new Date().toISOString().slice(0, 10);
  document.querySelectorAll("[data-new-until]").forEach(function (badge) {
    if (badge.getAttribute("data-new-until") < todayIso) { badge.remove(); }
  });

  /* ---------- Easter egg: the Case File skin ----------
     Triple-tap the portrait, or type "casefile" anywhere. */
  function openCaseFile(origin) {
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
  try { console.log("Psst. The subject keeps secrets. Tap the portrait three times."); } catch (e) {}

  /* ---------- Scroll: nav state, progress bar, back-to-top ---------- */
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    if (nav) { nav.classList.toggle("scrolled", y > 8); }
    if (progressBar) {
      var max = root.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0) + "%";
    }
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

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  function reveal(el) {
    el.classList.add("visible");
    if (!reduceMotion) { el.querySelectorAll("[data-count]").forEach(countUp); }
  }
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = document.querySelectorAll(".nav-links a");
  var sections = ["about", "certifications", "experience", "projects", "volunteering", "skills"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

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
