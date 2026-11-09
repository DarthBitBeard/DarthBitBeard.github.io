(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("topNav");
  var progressBar = document.getElementById("progressBar");

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
  var sections = ["about", "certifications", "experience", "projects", "volunteering", "contact"]
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

  var photoCard = document.getElementById("photoCard");
  var photoFrame = photoCard ? photoCard.querySelector(".photo-frame") : null;
  if (photoCard && photoFrame && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    photoCard.addEventListener("mousemove", function (event) {
      var rect = photoCard.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      photoFrame.style.transform = "rotateY(" + x * 6 + "deg) rotateX(" + -y * 6 + "deg)";
    });
    photoCard.addEventListener("mouseleave", function () {
      photoFrame.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
  }

  var timecode = document.getElementById("timecode");
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tickTimecode() {
    if (!timecode) { return; }
    var d = new Date();
    var frames = Math.floor((d.getMilliseconds() / 1000) * 24);
    timecode.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + ":" + pad(frames);
  }
  if (timecode) {
    tickTimecode();
    setInterval(tickTimecode, 42);
  }

  var board = document.getElementById("board");
  var prevBtn = document.getElementById("boardPrev");
  var nextBtn = document.getElementById("boardNext");
  function boardStep(dir) {
    if (!board) { return; }
    var card = board.querySelector(".evidence");
    var step = card ? card.getBoundingClientRect().width + 20 : 480;
    board.scrollBy({ left: dir * step, behavior: reduceMotion ? "auto" : "smooth" });
  }
  if (prevBtn) { prevBtn.addEventListener("click", function () { boardStep(-1); }); }
  if (nextBtn) { nextBtn.addEventListener("click", function () { boardStep(1); }); }

  var skinLinks = document.querySelectorAll("[data-skin-link]");
  skinLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      try { localStorage.setItem("lb-skin", link.getAttribute("data-skin-link")); } catch (e) {}
    });
  });
})();
