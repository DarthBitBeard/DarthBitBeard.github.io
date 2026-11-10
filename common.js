/* Shared by both skins: nav state, progress bar, mobile menu, "New" badge
   expiry, reveal on scroll, and active nav link. Load it before the page's own
   script. Revealed elements fire an "lb:reveal" event the page script can use. */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("topNav");
  var progressBar = document.getElementById("progressBar");

  /* ---------- Nav shadow and reading progress ---------- */
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    if (nav) { nav.classList.toggle("scrolled", y > 8); }
    if (progressBar) {
      var max = root.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu (under 620px) ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var menuLinks = document.getElementById("navLinks");
  /* While open: the page behind does not scroll, Tab cycles between the menu
     button and the links, and a keyboard open moves focus to the first link. */
  function setMenu(open, focusFirst) {
    if (!nav || !menuToggle) { return; }
    nav.classList.toggle("menu-open", open);
    root.classList.toggle("menu-lock", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open && focusFirst && menuLinks) {
      var first = menuLinks.querySelector("a");
      if (first) { first.focus(); }
    }
  }
  if (nav && menuToggle && menuLinks) {
    /* event.detail is 0 for a keyboard press: only then move focus into the menu. */
    menuToggle.addEventListener("click", function (event) { setMenu(!nav.classList.contains("menu-open"), event.detail === 0); });
    menuLinks.addEventListener("click", function (event) { if (event.target.closest("a")) { setMenu(false); } });
    document.addEventListener("keydown", function (event) {
      if (!nav.classList.contains("menu-open")) { return; }
      if (event.key === "Escape") { setMenu(false); menuToggle.focus(); return; }
      if (event.key !== "Tab") { return; }
      var stops = [menuToggle].concat([].slice.call(menuLinks.querySelectorAll("a")));
      var index = stops.indexOf(document.activeElement);
      var next = index === -1 ? 0 : (index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
      event.preventDefault();
      stops[next].focus();
    });
    /* Close it if the window grows past the phone layout. */
    var wide = window.matchMedia("(min-width: 621px)");
    var onWide = function (event) { if (event.matches) { setMenu(false); } };
    if (wide.addEventListener) { wide.addEventListener("change", onWide); } else if (wide.addListener) { wide.addListener(onWide); }
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("menu-open") && !nav.contains(event.target)) { setMenu(false); }
    });
  }

  /* ---------- "New" badges hide themselves after data-new-until ---------- */
  var todayIso = new Date().toISOString().slice(0, 10);
  document.querySelectorAll("[data-new-until]").forEach(function (badge) {
    if (badge.getAttribute("data-new-until") < todayIso) { badge.remove(); }
  });

  /* ---------- Reveal on scroll ---------- */
  function reveal(el) {
    el.classList.add("visible");
    el.dispatchEvent(new CustomEvent("lb:reveal", { bubbles: true }));
  }
  var revealEls = document.querySelectorAll(".reveal");
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

  /* ---------- Highlight the nav link for the section in view ---------- */
  var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  var sections = [];
  navLinks.forEach(function (link) {
    var section = document.getElementById(link.getAttribute("href").slice(1));
    if (section) { sections.push(section); }
  });
  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (link) {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }
})();
