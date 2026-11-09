(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("topNav");
  var progressBar = document.getElementById("progressBar");

  var themeToggle = document.getElementById("themeToggle");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    if (themeToggle) {
      var dark = theme === "dark";
      themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
      themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      themeToggle.textContent = dark ? "Light mode" : "Dark mode";
    }
  }

  if (themeToggle) {
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
    themeToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  /* Skin easter egg: the Case File skin is hidden. Triple-tap the hero
     portrait, or type "casefile" anywhere, to open it. */
  var skinLoader = document.getElementById("skinLoader");
  var loaderFill = document.getElementById("loaderFill");
  var skinSwitching = false;
  function switchSkin(target, href) {
    if (skinSwitching) { return; }
    skinSwitching = true;
    try { localStorage.setItem("lb-skin", target); } catch (e) {}
    if (reduceMotion || !skinLoader) { window.location.href = href; return; }
    skinLoader.style.display = "flex";
    void skinLoader.offsetWidth;
    skinLoader.classList.add("show");
    skinLoader.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(function () {
      if (loaderFill) { loaderFill.style.width = "100%"; }
    });
    window.setTimeout(function () { window.location.href = href; }, 950);
  }
  function openCaseFile() { switchSkin("casefile", "casefile.html"); }
  var photoCardEgg = document.getElementById("photoCard");
  if (photoCardEgg) {
    var tapCount = 0;
    var tapTimer = null;
    photoCardEgg.addEventListener("click", function () {
      tapCount += 1;
      window.clearTimeout(tapTimer);
      if (tapCount >= 3) { tapCount = 0; openCaseFile(); return; }
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

  function onScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (nav) {
      nav.classList.toggle("scrolled", scrollTop > 8);
    }
    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
      progressBar.style.width = pct + "%";
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

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

  var hero = document.querySelector(".hero-split");
  if (hero && !reduceMotion) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var y = window.scrollY || 0;
          if (y < 500) {
            hero.style.transform = "translateY(" + y * 0.04 + "px)";
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  var photoCard = document.getElementById("photoCard");
  var photoFrame = photoCard ? photoCard.querySelector(".photo-frame") : null;
  if (photoCard && photoFrame && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    photoCard.addEventListener("mousemove", function (event) {
      var rect = photoCard.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      photoFrame.style.transform = "rotateY(" + x * 8 + "deg) rotateX(" + -y * 8 + "deg) scale(1.02)";
    });
    photoCard.addEventListener("mouseleave", function () {
      photoFrame.style.transform = "rotateY(0deg) rotateX(0deg) scale(1)";
    });
  }
})();
