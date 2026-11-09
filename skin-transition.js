/* Skin transition controller, shared by both skins.
   LBSkin.go("casefile" | "classic", { origin: element or {x, y} }) plays the
   exit sequence, then navigates. The page being opened sees the lb-arrive
   flag (set in its <head>) and plays the matching arrival sequence. */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var busy = false;
  var timers = [];
  var frames = [];
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@/<>";

  var PAGES = { casefile: "casefile.html", classic: "./" };
  var LABELS = { casefile: "Opening the Case File view", classic: "Returning to the Classic view" };
  /* ms until the browser is sent to the new page */
  var DURATION = { casefile: 2350, classic: 2420 };

  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

  function animate(duration, delay, step) {
    var start = null;
    function tick(now) {
      if (start === null) { start = now + delay; }
      var t = Math.min(1, Math.max(0, (now - start) / duration));
      step(t);
      if (t < 1) { frames.push(window.requestAnimationFrame(tick)); }
    }
    frames.push(window.requestAnimationFrame(tick));
  }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* Random glyphs that lock into the final text from left to right. */
  function scramble(el, delay, duration) {
    if (!el) { return; }
    var finalText = el.getAttribute("data-final") || el.textContent;
    animate(duration, delay, function (t) {
      var locked = Math.floor(finalText.length * t);
      var out = "";
      for (var i = 0; i < finalText.length; i++) {
        var ch = finalText.charAt(i);
        out += i < locked || ch === " " ? ch : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out;
    });
  }

  function counter(pctEl, fillEl, delay, duration) {
    animate(duration, delay, function (t) {
      var v = Math.round(easeInOut(t) * 100);
      if (pctEl) { pctEl.textContent = ("00" + v).slice(-3) + "%"; }
      if (fillEl) { fillEl.style.width = v + "%"; }
    });
  }

  function addHeadLink(rel, href, as) {
    var link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (as) { link.as = as; }
    document.head.appendChild(link);
  }

  function classicTheme() {
    try {
      var saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") { return saved; }
    } catch (e) {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setOrigin(el, origin) {
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    if (origin && typeof origin.getBoundingClientRect === "function") {
      var r = origin.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    } else if (origin && typeof origin.x === "number") {
      x = origin.x;
      y = origin.y;
    }
    el.style.setProperty("--ox", x + "px");
    el.style.setProperty("--oy", y + "px");
  }

  function go(target, opts) {
    if (busy || !PAGES[target]) { return; }
    busy = true;
    var href = PAGES[target];
    try { localStorage.setItem("lb-skin", target); } catch (e) {}

    var el = document.getElementById("skinExit");
    if (reduceMotion || !el || el.getAttribute("data-target") !== target) {
      window.location.href = href;
      return;
    }
    try { sessionStorage.setItem("lb-arrive", target); } catch (e) {}

    /* Warm the cache for the next page while the sequence plays. */
    addHeadLink("prefetch", href);
    if (target === "casefile") {
      addHeadLink("stylesheet", "fonts/fonts.css");
      addHeadLink("prefetch", "casefile.css");
    } else {
      addHeadLink("prefetch", "styles.css");
      el.setAttribute("data-sk-theme", classicTheme());
    }

    var status = document.getElementById("skinStatus");
    if (status) { status.textContent = LABELS[target] + "."; }

    setOrigin(el, opts && opts.origin);
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add("is-active");
    root.style.overflow = "hidden";

    if (target === "casefile") {
      scramble(el.querySelector(".sk-name"), 420, 900);
      counter(el.querySelector(".sk-pct"), el.querySelector(".sk-fill"), 520, 1220);
      later(function () { el.classList.add("is-stamped"); }, 1800);
    }

    var navigated = false;
    function navigate() {
      if (navigated) { return; }
      navigated = true;
      window.location.href = href;
    }
    later(navigate, DURATION[target]);
    /* Any click or key skips the rest of the sequence. */
    later(function () {
      el.addEventListener("click", navigate);
      document.addEventListener("keydown", navigate, { once: true });
    }, 250);
  }

  function reset() {
    timers.forEach(function (t) { window.clearTimeout(t); });
    frames.forEach(function (f) { window.cancelAnimationFrame(f); });
    timers = [];
    frames = [];
    busy = false;
    root.style.overflow = "";
    var el = document.getElementById("skinExit");
    if (el) {
      el.classList.remove("is-active", "is-stamped");
      el.hidden = true;
      var fill = el.querySelector(".sk-fill");
      if (fill) { fill.style.width = "0"; }
      var name = el.querySelector(".sk-name[data-final]");
      if (name) { name.textContent = name.getAttribute("data-final"); }
    }
  }

  /* Coming back with the Back button can restore this page from the
     back/forward cache with the exit overlay still up, so clear it. */
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) { reset(); }
  });

  var arriving = root.classList.contains("sk-arriving");
  if (arriving) {
    window.setTimeout(function () {
      root.classList.remove("sk-arriving");
      var arrive = document.getElementById("skinArrive");
      if (arrive) { arrive.remove(); }
    }, 1300);
  }

  window.LBSkin = { go: go, arriving: arriving };
})();
