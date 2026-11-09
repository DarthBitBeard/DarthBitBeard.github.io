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

  /* Mobile menu: the section links collapse behind a button under 620px. */
  var menuToggle = document.getElementById("menuToggle");
  var menuLinks = document.getElementById("navLinks");
  function setMenu(open) {
    if (!nav || !menuToggle) { return; }
    nav.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (menuToggle && menuLinks) {
    menuToggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("menu-open"));
    });
    menuLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) { setMenu(false); }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("menu-open")) { setMenu(false); menuToggle.focus(); }
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("menu-open") && !nav.contains(event.target)) { setMenu(false); }
    });
  }

  /* "New" badges hide themselves after their data-new-until date, even if the
     site has not been rebuilt since. */
  var todayIso = new Date().toISOString().slice(0, 10);
  document.querySelectorAll("[data-new-until]").forEach(function (badge) {
    if (badge.getAttribute("data-new-until") < todayIso) { badge.remove(); }
  });

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

  /* ---------- Decrypt evidence cards ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@";
  function scrambleText(el, duration, delay) {
    var finalText = el.getAttribute("data-final") || el.textContent;
    el.setAttribute("data-final", finalText);
    if (reduceMotion) { el.textContent = finalText; return; }
    var start = null;
    function tick(now) {
      if (start === null) { start = now + (delay || 0); }
      var t = Math.min(1, Math.max(0, (now - start) / duration));
      var locked = Math.floor(finalText.length * t);
      var out = "";
      for (var i = 0; i < finalText.length; i++) {
        var ch = finalText.charAt(i);
        out += i < locked || ch === " " ? ch : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out;
      if (t < 1) { window.requestAnimationFrame(tick); }
    }
    window.requestAnimationFrame(tick);
  }

  function decrypt(card, delay) {
    if (!card.classList.contains("redacted")) { return; }
    card.classList.remove("redacted");
    var btn = card.querySelector(".decrypt");
    if (btn) { btn.textContent = "[ Decrypted ]"; btn.setAttribute("aria-pressed", "true"); }
    card.querySelectorAll("li").forEach(function (li, i) {
      if (li.children.length === 0) { scrambleText(li, 650, (delay || 0) + i * 90); }
    });
  }
  function redact(card) {
    card.classList.add("redacted");
    var btn = card.querySelector(".decrypt");
    if (btn) { btn.textContent = "[ Decrypt file ]"; btn.setAttribute("aria-pressed", "false"); }
  }
  document.querySelectorAll(".evidence").forEach(function (card) {
    var btn = card.querySelector(".decrypt");
    if (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (card.classList.contains("redacted")) { decrypt(card); } else { redact(card); }
      });
    }
    card.addEventListener("click", function (event) {
      if (event.target.closest("a, button")) { return; }
      decrypt(card);
    });
  });
  var decryptAll = document.getElementById("decryptAll");
  if (decryptAll) {
    decryptAll.addEventListener("click", function () {
      document.querySelectorAll(".evidence.redacted").forEach(function (card, i) { decrypt(card, i * 120); });
    });
  }

  /* ---------- Hero name decodes on load ---------- */
  var arriving = !!(window.LBSkin && window.LBSkin.arriving);
  document.querySelectorAll(".hero .decode").forEach(function (el, i) {
    scrambleText(el, 900, (arriving ? 1000 : 250) + i * 220);
  });

  /* ---------- Easter egg: back to the Classic skin ----------
     Triple-tap the portrait, or type "classic" anywhere. */
  function openClassic() {
    if (window.LBSkin) { window.LBSkin.go("classic"); }
    else { try { localStorage.setItem("lb-skin", "classic"); } catch (e) {} window.location.href = "./"; }
  }
  var photoCardEgg = document.getElementById("photoCard");
  if (photoCardEgg) {
    var tapCount = 0;
    var tapTimer = null;
    photoCardEgg.addEventListener("click", function () {
      tapCount += 1;
      window.clearTimeout(tapTimer);
      if (tapCount >= 3) { tapCount = 0; openClassic(); return; }
      tapTimer = window.setTimeout(function () { tapCount = 0; }, 1200);
    });
  }
  var typedEgg = "";
  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) { return; }
    var tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") { return; }
    if (typeof event.key !== "string" || event.key.length !== 1) { return; }
    typedEgg = (typedEgg + event.key.toLowerCase()).slice(-7);
    if (typedEgg === "classic") { typedEgg = ""; openClassic(); }
  });
  try { console.log("Psst. The subject keeps secrets. Tap the portrait three times."); } catch (e) {}
})();
