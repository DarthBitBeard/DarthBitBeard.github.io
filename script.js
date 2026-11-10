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
      function apply() {
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        showTheme(next);
      }
      /* Where supported, the new theme spreads out in a circle from the button. */
      if (!document.startViewTransition || reduceMotion) { apply(); return; }
      var rect = themeToggle.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.classList.add("theme-vt");
      var transition = document.startViewTransition(apply);
      transition.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 560, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {});
      transition.finished.then(function () { root.classList.remove("theme-vt"); }, function () { root.classList.remove("theme-vt"); });
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

  /* ---------- Filter certifications by issuer ---------- */
  var certGrid = document.querySelector(".cert-grid");
  if (certGrid) {
    var certCards = [].slice.call(certGrid.querySelectorAll(".cert-card"));
    var issuerCounts = {};
    var issuers = [];
    certCards.forEach(function (card) {
      var tag = card.querySelector(".issuer");
      var issuer = tag ? tag.textContent.trim() : "Other";
      card.setAttribute("data-issuer", issuer);
      if (!issuerCounts[issuer]) { issuerCounts[issuer] = 0; issuers.push(issuer); }
      issuerCounts[issuer] += 1;
    });
    if (issuers.length > 1) {
      issuers.sort(function (a, b) { return issuerCounts[b] - issuerCounts[a] || a.localeCompare(b); });
      var filterBar = document.createElement("div");
      filterBar.className = "cert-filter";
      filterBar.setAttribute("role", "group");
      filterBar.setAttribute("aria-label", "Filter certifications by issuer");
      var filterStatus = document.createElement("p");
      filterStatus.className = "sr-only";
      filterStatus.setAttribute("aria-live", "polite");
      var chips = [];
      var addChip = function (label, value, count) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "cert-chip";
        chip.setAttribute("aria-pressed", value === "" ? "true" : "false");
        chip.setAttribute("aria-label", (value ? label : "All issuers") + ", " + count + (count === 1 ? " certification" : " certifications"));
        chip.appendChild(document.createTextNode(label));
        var num = document.createElement("span");
        num.className = "cert-chip-count";
        num.textContent = count;
        chip.appendChild(num);
        chip.addEventListener("click", function () {
          var shown = 0;
          chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
          certCards.forEach(function (card) {
            var match = value === "" || card.getAttribute("data-issuer") === value;
            card.hidden = !match;
            if (match) { shown += 1; card.classList.add("visible"); }
          });
          filterStatus.textContent = "Showing " + shown + (shown === 1 ? " certification" : " certifications") + (value ? " from " + value : "");
        });
        chips.push(chip);
        filterBar.appendChild(chip);
      };
      addChip("All", "", certCards.length);
      issuers.forEach(function (issuer) { addChip(issuer, issuer, issuerCounts[issuer]); });
      certGrid.parentNode.insertBefore(filterBar, certGrid);
      certGrid.parentNode.insertBefore(filterStatus, certGrid);
    }
  }

  /* ---------- On phones, hide the nav while scrolling down ----------
     It comes back as soon as the visitor scrolls up, nears the top, opens
     the menu, or tabs into it. */
  var topNav = document.getElementById("topNav");
  var narrow = window.matchMedia("(max-width: 860px)");
  var lastNavY = window.scrollY || 0;
  function updateNav() {
    if (!topNav) { return; }
    var y = window.scrollY || 0;
    if (!narrow.matches || y < 120 || topNav.classList.contains("menu-open") || topNav.contains(document.activeElement)) {
      topNav.classList.remove("nav-hidden");
      lastNavY = y;
      return;
    }
    if (y > lastNavY + 10) { topNav.classList.add("nav-hidden"); lastNavY = y; }
    else if (y < lastNavY - 10) { topNav.classList.remove("nav-hidden"); lastNavY = y; }
  }
  if (topNav) {
    window.addEventListener("scroll", updateNav, { passive: true });
    topNav.addEventListener("focusin", function () { topNav.classList.remove("nav-hidden"); });
  }

  /* ---------- Sliding highlight behind the active nav link ---------- */
  var navLinkBox = document.getElementById("navLinks");
  if (navLinkBox) {
    var pill = document.createElement("span");
    pill.className = "nav-pill";
    pill.setAttribute("aria-hidden", "true");
    navLinkBox.insertBefore(pill, navLinkBox.firstChild);
    root.classList.add("nav-pill-ready");
    var pillPlaced = false;
    var placePill = function () {
      var active = navLinkBox.querySelector("a.active");
      if (!active || !active.offsetWidth) { pill.classList.remove("on"); return; }
      if (!pillPlaced) { pill.style.transition = "none"; }
      pill.style.width = active.offsetWidth + "px";
      pill.style.height = active.offsetHeight + "px";
      pill.style.transform = "translate(" + active.offsetLeft + "px, " + active.offsetTop + "px)";
      if (!pillPlaced) { void pill.offsetWidth; pill.style.transition = ""; pillPlaced = true; }
      pill.classList.add("on");
    };
    /* Watch only the links (not the pill itself, which would loop). */
    if ("MutationObserver" in window) {
      var linkWatcher = new MutationObserver(placePill);
      navLinkBox.querySelectorAll("a").forEach(function (a) {
        linkWatcher.observe(a, { attributes: true, attributeFilter: ["class"] });
      });
    }
    window.addEventListener("resize", placePill);
    placePill();
  }

  /* ---------- Experience timeline fills in as you scroll ---------- */
  var timeline = document.querySelector(".timeline");
  if (timeline) {
    var jobs = [].slice.call(timeline.querySelectorAll(".job"));
    var timelineTicking = false;
    var fillTimeline = function () {
      timelineTicking = false;
      var rect = timeline.getBoundingClientRect();
      var mark = window.innerHeight * 0.6;
      var done = rect.height > 0 ? Math.min(1, Math.max(0, (mark - rect.top) / rect.height)) : 1;
      timeline.style.setProperty("--tl", done.toFixed(3));
      jobs.forEach(function (job) {
        var dot = job.querySelector(".job-dot");
        if (dot) { job.classList.toggle("reached", dot.getBoundingClientRect().top < mark); }
      });
    };
    window.addEventListener("scroll", function () {
      if (!timelineTicking) { timelineTicking = true; window.requestAnimationFrame(fillTimeline); }
    }, { passive: true });
    window.addEventListener("resize", fillTimeline);
    fillTimeline();
  }

  /* ---------- How long each role lasted, e.g. "2 yrs 1 mo" ---------- */
  var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  var nowDate = new Date();
  var thisMonth = nowDate.getFullYear() * 12 + nowDate.getMonth();
  function monthIndex(text) {
    if (/present/i.test(text)) { return thisMonth; }
    var match = /([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})/.exec(text);
    if (!match || !(match[1].toLowerCase() in MONTHS)) { return null; }
    return parseInt(match[2], 10) * 12 + MONTHS[match[1].toLowerCase()];
  }
  function formatMonths(total) {
    var years = Math.floor(total / 12);
    var months = total % 12;
    var parts = [];
    if (years) { parts.push(years + (years === 1 ? " yr" : " yrs")); }
    if (months) { parts.push(months + (months === 1 ? " mo" : " mos")); }
    return parts.join(" ");
  }
  document.querySelectorAll(".role-dates").forEach(function (pillEl) {
    var ends = pillEl.textContent.split(/\s+[-\u2013\u2014]\s+/);
    if (ends.length !== 2) { return; }
    var start = monthIndex(ends[0]);
    var end = monthIndex(ends[1]);
    if (start === null || end === null || end < start) { return; }
    var label = formatMonths(end - start + 1);
    if (!label) { return; }
    var dur = document.createElement("span");
    dur.className = "role-dur";
    dur.textContent = label;
    pillEl.appendChild(document.createTextNode(" "));
    pillEl.appendChild(dur);
  });

  /* ---------- "Now" dates also say how long ago ---------- */
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  document.querySelectorAll(".now-date time[datetime]").forEach(function (time) {
    var parts = time.getAttribute("datetime").split("-");
    if (parts.length !== 3) { return; }
    var then = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var days = Math.round((today - then) / 86400000);
    if (isNaN(days) || days < 0) { return; }
    var label;
    if (days === 0) { label = "today"; }
    else if (days === 1) { label = "yesterday"; }
    else if (days < 14) { label = days + " days ago"; }
    else if (days < 60) { label = Math.round(days / 7) + " weeks ago"; }
    else if (days < 365) { label = Math.round(days / 30.44) + " months ago"; }
    else { var yrs = Math.round(days / 365.25); label = yrs + (yrs === 1 ? " year ago" : " years ago"); }
    var ago = document.createElement("span");
    ago.className = "now-ago";
    ago.textContent = label;
    time.parentNode.appendChild(document.createTextNode(" "));
    time.parentNode.appendChild(ago);
  });

  /* ---------- Briefly highlight the section a link jumps to ---------- */
  var landTimers = {};
  function landOn(id, delay) {
    var section = id ? document.getElementById(id) : null;
    var head = section ? section.querySelector(".section-head") : null;
    if (!head) { return; }
    window.clearTimeout(landTimers[id]);
    head.classList.remove("landed");
    landTimers[id] = window.setTimeout(function () {
      head.classList.add("landed");
      landTimers[id] = window.setTimeout(function () { head.classList.remove("landed"); }, 2000);
    }, delay);
  }
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest("a[href^='#']") : null;
    if (link) { landOn(link.getAttribute("href").slice(1), reduceMotion ? 0 : 450); }
  });
  if (location.hash) { landOn(location.hash.slice(1), 700); }

  /* ---------- Back-to-top button ---------- */
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    if (toTop) {
      toTop.classList.toggle("show", y > window.innerHeight * 0.9);
      var max = root.scrollHeight - window.innerHeight;
      var done = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      toTop.style.setProperty("--ring", (100 - done * 100).toFixed(1));
    }
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
