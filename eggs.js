/* Easter eggs for the Classic skin. Found eggs are remembered per browser.
   1. terminal  - press ` (backtick) or tap the "LB" badge in the footer
   2. konami    - up up down down left right left right B A
   3. sudo      - type "sudo" anywhere
   4. roll      - click the nav logo 5 times
   5. party     - toggle the theme 8 times in a few seconds
   6. casefile  - tap the portrait 3 times, or type "casefile" (script.js) */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EGGS = [
    { id: "terminal", name: "Shell access", hint: "Press the key left of 1." },
    { id: "konami", name: "Cheat code", hint: "Old-school cheat codes still work here." },
    { id: "sudo", name: "Privilege escalation", hint: "Every admin knows the magic word." },
    { id: "roll", name: "Barrel roll", hint: "Click my logo like you mean it." },
    { id: "party", name: "Indecisive", hint: "Can't decide between light and dark?" },
    { id: "casefile", name: "Case File", hint: "The subject keeps secrets." }
  ];
  var data = {};
  try { data = JSON.parse(document.getElementById("eggData").textContent); } catch (e) {}

  /* ---------- Found-egg tracker ---------- */
  function loadFound() {
    try { return JSON.parse(localStorage.getItem("lb-eggs") || "[]"); } catch (e) { return []; }
  }
  function eggById(id) {
    for (var i = 0; i < EGGS.length; i++) { if (EGGS[i].id === id) { return EGGS[i]; } }
    return null;
  }
  function found(id, message) {
    var list = loadFound();
    var isNew = list.indexOf(id) === -1;
    if (isNew) {
      list.push(id);
      try { localStorage.setItem("lb-eggs", JSON.stringify(list)); } catch (e) {}
    }
    var egg = eggById(id);
    if (message !== false) {
      toast({
        kicker: isNew ? "Easter egg found " + list.length + "/" + EGGS.length : "Found again",
        title: egg ? egg.name : id,
        text: message || ""
      });
    }
    if (isNew && list.length === EGGS.length) { window.setTimeout(celebrate, 900); }
  }

  /* Shown once, after every egg is found. If the last egg was the Case File
     (which leaves this page), it shows on the next visit instead. */
  function celebrate() {
    try { if (localStorage.getItem("lb-eggs-celebrated")) { return; } } catch (e) {}
    if (loadFound().length < EGGS.length) { return; }
    var exit = document.getElementById("skinExit");
    if (exit && !exit.hidden) { return; }
    try { localStorage.setItem("lb-eggs-celebrated", "1"); } catch (e) {}
    toast({ kicker: "All " + EGGS.length + " found", title: "Full clearance", text: "You found every easter egg. That kind of curiosity makes a good analyst.", gold: true, duration: 7000 });
  }

  /* ---------- Toasts ---------- */
  var toastWrap = document.createElement("div");
  toastWrap.className = "egg-toasts";
  toastWrap.setAttribute("role", "status");
  toastWrap.setAttribute("aria-live", "polite");
  document.body.appendChild(toastWrap);
  function toast(opts) {
    var el = document.createElement("div");
    el.className = "egg-toast" + (opts.gold ? " egg-toast--gold" : "") + (opts.mono ? " egg-toast--mono" : "");
    el.innerHTML = '<span class="egg-toast-icon" aria-hidden="true">' + (opts.icon || "&#9733;") + "</span>" +
      '<span class="egg-toast-body"><span class="egg-toast-kicker"></span><strong class="egg-toast-title"></strong><span class="egg-toast-text"></span></span>';
    el.querySelector(".egg-toast-kicker").textContent = opts.kicker || "";
    el.querySelector(".egg-toast-title").textContent = opts.title || "";
    el.querySelector(".egg-toast-text").textContent = opts.text || "";
    toastWrap.appendChild(el);
    window.requestAnimationFrame(function () { el.classList.add("show"); });
    window.setTimeout(function () {
      el.classList.remove("show");
      window.setTimeout(function () { el.remove(); }, 400);
    }, opts.duration || 5000);
  }

  function typingInField(event) {
    var t = event.target;
    var tag = (t && t.tagName) || "";
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable);
  }

  /* ---------- 1. Terminal ---------- */
  var term = null;
  var termOut = null;
  var termInput = null;
  var history = [];
  var historyIndex = 0;
  var lastFocus = null;

  function line(text, cls) {
    var p = document.createElement("p");
    p.className = "egg-term-line" + (cls ? " " + cls : "");
    p.textContent = text;
    termOut.appendChild(p);
  }
  function lines(arr, cls) { arr.forEach(function (t) { line(t, cls); }); }
  function linkLine(label, href) {
    var p = document.createElement("p");
    p.className = "egg-term-line";
    var a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
    p.appendChild(a);
    termOut.appendChild(p);
  }

  var person = data.person || {};
  var user = (person.name || "guest").split(" ")[0].toLowerCase();
  var COMMANDS = {
    help: function () {
      lines([
        "Available commands:",
        "  whoami        who runs this place",
        "  ls [dir]      list files",
        "  cat <file>    print a file",
        "  certs         list certifications",
        "  projects      list security projects",
        "  contact       ways to reach me",
        "  nmap          scan this host",
        "  ping          check connectivity",
        "  theme         toggle light/dark",
        "  eggs          easter egg progress",
        "  casefile      open the case file",
        "  clear, exit"
      ]);
    },
    whoami: function () {
      line(user);
      line((person.title || "") + ", " + (person.field || "") + " // " + (person.location || ""), "dim");
    },
    ls: function (args) {
      var dir = (args[0] || "").replace(/\/$/, "");
      if (!dir || dir === "~" || dir === ".") { line("about.txt  certs/  projects/  resume.pdf  secrets/"); }
      else if (dir === "certs") { COMMANDS.certs(); }
      else if (dir === "projects") { COMMANDS.projects(); }
      else if (dir === "secrets") { line("ls: cannot open directory 'secrets/': Permission denied", "err"); line("hint: some secrets need a cheat code", "dim"); }
      else { line("ls: cannot access '" + dir + "': No such file or directory", "err"); }
    },
    cat: function (args) {
      var f = args[0] || "";
      if (f === "about.txt") { line(person.about || ""); }
      else if (f === "resume.pdf") { line("binary file, try this instead:", "dim"); linkLine(person.resume_pdf || "resume.pdf", person.resume_pdf || "#"); }
      else if (/^secrets/.test(f)) { line("cat: " + f + ": Permission denied", "err"); }
      else if (/^(certs|projects)\/?$/.test(f)) { line("cat: " + f + ": Is a directory", "err"); }
      else if (!f) { line("usage: cat <file>", "dim"); }
      else { line("cat: " + f + ": No such file or directory", "err"); }
    },
    certs: function () { (data.certs || []).forEach(function (c) { line("  " + c); }); },
    projects: function () { (data.projects || []).forEach(function (p) { line("  " + p); }); },
    contact: function () {
      if (person.email) { linkLine("email     " + person.email, "mailto:" + person.email); }
      if (person.linkedin) { linkLine("linkedin  " + person.linkedin.replace(/^https?:\/\//, ""), person.linkedin); }
      if (person.github) { linkLine("github    " + person.github.replace(/^https?:\/\//, ""), person.github); }
    },
    nmap: function () {
      lines([
        "Starting Nmap ( this is a joke, nothing was scanned )",
        "Nmap scan report for " + location.hostname,
        "PORT      STATE     SERVICE",
        "22/tcp    filtered  ssh",
        "80/tcp    open      http   -> redirects to https",
        "443/tcp   open      https  (you are here)",
        "1337/tcp  open      easter-egg",
        "",
        "Nmap done: 1 IP address (1 host up), 0 vulnerabilities found. Nice try."
      ]);
    },
    ping: function () { line("PONG from " + location.hostname + ": icmp_seq=1 ttl=64 time=0.42 ms"); },
    theme: function () {
      var btn = document.getElementById("themeToggle");
      if (btn) { btn.click(); }
      line("theme set to " + root.getAttribute("data-theme"));
    },
    eggs: function () {
      var list = loadFound();
      line("Easter eggs found: " + list.length + "/" + EGGS.length);
      EGGS.forEach(function (egg) {
        var got = list.indexOf(egg.id) > -1;
        line((got ? "  [x] " + egg.name : "  [ ] ???  hint: " + egg.hint), got ? "" : "dim");
      });
    },
    casefile: function () {
      line("Opening case file...");
      closeTerminal(true);
      found("casefile", false);
      if (window.LBSkin) { window.LBSkin.go("casefile"); }
    },
    sudo: function (args) {
      if (!args.length) { line("usage: sudo <command>", "dim"); return; }
      line(user + " is not in the sudoers file. This incident will be reported.", "err");
      found("sudo", "Nice try. This incident will be reported.");
    },
    rm: function (args) {
      if (args.join(" ").indexOf("-rf") > -1) { line("Blocked by policy. Good thing the home lab has Veeam backups anyway.", "err"); }
      else { line("rm: permission denied", "err"); }
    },
    hack: function () { line("Access denied. Ethical hacking only, and only with written permission.", "err"); },
    exit: function () { closeTerminal(); },
    clear: function () { termOut.textContent = ""; }
  };
  COMMANDS.cd = function (args) {
    if (/^secrets/.test(args[0] || "")) { line("cd: secrets: Permission denied", "err"); }
    else { line("cd: this is a single-page site, there is nowhere to go", "dim"); }
  };
  COMMANDS.pwd = function () { line("/home/" + user); };
  COMMANDS.date = function () { line(new Date().toString()); };
  COMMANDS.echo = function (args) { line(args.join(" ")); };
  COMMANDS.resume = function () { COMMANDS.cat(["resume.pdf"]); };
  COMMANDS.logout = COMMANDS.exit;
  COMMANDS.quit = COMMANDS.exit;

  function run(raw) {
    var input = raw.trim();
    line(user + "@beardlab:~$ " + input, "cmd");
    if (!input) { return; }
    history.push(input);
    historyIndex = history.length;
    var parts = input.split(/\s+/);
    var name = parts.shift().toLowerCase();
    if (COMMANDS.hasOwnProperty(name)) { COMMANDS[name](parts); }
    else { line(name + ": command not found. Type 'help'.", "err"); }
    termOut.scrollTop = termOut.scrollHeight;
  }

  function buildTerminal() {
    term = document.createElement("div");
    term.className = "egg-term";
    term.setAttribute("role", "dialog");
    term.setAttribute("aria-modal", "true");
    term.setAttribute("aria-label", "Terminal");
    term.innerHTML =
      '<div class="egg-term-backdrop"></div>' +
      '<div class="egg-term-window">' +
        '<div class="egg-term-bar"><span class="egg-term-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="egg-term-title">' + user + '@beardlab: ~</span><button class="egg-term-close" type="button" aria-label="Close terminal">&times;</button></div>' +
        '<div class="egg-term-out" aria-live="polite"></div>' +
        '<form class="egg-term-form"><label class="egg-term-prompt" for="eggTermInput">' + user + '@beardlab:~$</label><input id="eggTermInput" class="egg-term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"></form>' +
      "</div>";
    document.body.appendChild(term);
    termOut = term.querySelector(".egg-term-out");
    termInput = term.querySelector(".egg-term-input");
    term.querySelector(".egg-term-backdrop").addEventListener("click", function () { closeTerminal(); });
    term.querySelector(".egg-term-close").addEventListener("click", function () { closeTerminal(); });
    term.querySelector(".egg-term-window").addEventListener("click", function (e) {
      if (!e.target.closest("a, button")) { termInput.focus(); }
    });
    term.querySelector(".egg-term-form").addEventListener("submit", function (e) {
      e.preventDefault();
      run(termInput.value);
      termInput.value = "";
    });
    termInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeTerminal(); }
      else if (e.key === "ArrowUp" && history.length) { e.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); termInput.value = history[historyIndex]; }
      else if (e.key === "ArrowDown" && history.length) { e.preventDefault(); historyIndex = Math.min(history.length, historyIndex + 1); termInput.value = history[historyIndex] || ""; }
      else if (e.key === "Tab") {
        e.preventDefault();
        var v = termInput.value.trim().toLowerCase();
        var matches = Object.keys(COMMANDS).filter(function (c) { return v && c.indexOf(v) === 0; });
        if (matches.length === 1) { termInput.value = matches[0] + " "; }
        else if (matches.length > 1) { line(matches.join("  "), "dim"); termOut.scrollTop = termOut.scrollHeight; }
      }
    });
    lines([
      "BeardLab OS 26.11 (tty1)",
      "Last login: " + new Date().toDateString() + " from a curious visitor",
      "Type 'help' to see what you can do here."
    ], "dim");
  }

  function openTerminal() {
    if (!term) { buildTerminal(); }
    if (term.classList.contains("open")) { termInput.focus(); return; }
    lastFocus = document.activeElement;
    term.classList.add("open");
    root.classList.add("egg-term-open");
    window.setTimeout(function () { termInput.focus(); }, 30);
    found("terminal", "Type 'help' to look around.");
  }
  function closeTerminal(silent) {
    if (!term) { return; }
    term.classList.remove("open");
    root.classList.remove("egg-term-open");
    if (!silent && lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  var footerBadge = document.querySelector(".footer-brand .logo-mark");
  if (footerBadge) {
    footerBadge.style.cursor = "pointer";
    footerBadge.addEventListener("click", openTerminal);
  }

  /* ---------- 2. Konami code: code rain ---------- */
  var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var konamiPos = 0;
  function codeRain() {
    if (reduceMotion) { return; }
    var canvas = document.createElement("canvas");
    canvas.className = "egg-rain";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    var size = 16;
    var cols = Math.ceil(w / size);
    var drops = [];
    for (var i = 0; i < cols; i++) { drops.push(Math.random() * -40); }
    var glyphs = "01ABCDEF0123456789{}<>/#$%&*+=LBアイウエオカキクケコサシスセソ";
    var start = performance.now();
    var last = 0;
    function frame(now) {
      var t = now - start;
      if (now - last > 45) {
        last = now;
        ctx.fillStyle = "rgba(7, 12, 22, 0.16)";
        ctx.fillRect(0, 0, w, h);
        ctx.font = "600 " + size + "px ui-monospace, Menlo, Consolas, monospace";
        for (var c = 0; c < cols; c++) {
          var y = drops[c] * size;
          ctx.fillStyle = Math.random() > 0.975 ? "#ffffff" : (c % 3 === 0 ? "#7cc4ff" : "#4da3ff");
          ctx.fillText(glyphs.charAt(Math.floor(Math.random() * glyphs.length)), c * size, y);
          if (y > h && Math.random() > 0.96) { drops[c] = 0; }
          drops[c] += 1;
        }
      }
      if (t < 4200) { window.requestAnimationFrame(frame); }
      else {
        canvas.classList.add("fade");
        window.setTimeout(function () { canvas.remove(); }, 800);
      }
    }
    window.requestAnimationFrame(frame);
  }

  /* ---------- 3. sudo ---------- */
  var typed = "";

  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) { return; }
    var key = typeof event.key === "string" ? event.key.toLowerCase() : "";

    /* Konami works anywhere outside text fields, including with the arrows. */
    if (!typingInField(event)) {
      if (key === KONAMI[konamiPos]) {
        konamiPos += 1;
        if (konamiPos === KONAMI.length) {
          konamiPos = 0;
          codeRain();
          found("konami", "Up, up, down, down, left, right, left, right, B, A. Respect.");
        }
      } else {
        konamiPos = key === KONAMI[0] ? 1 : 0;
      }
    }

    if (typingInField(event)) { return; }

    if (event.key === "`" || event.key === "~") {
      event.preventDefault();
      openTerminal();
      return;
    }

    if (key.length === 1) {
      typed = (typed + key).slice(-4);
      if (typed === "sudo") {
        typed = "";
        if (!reduceMotion) {
          root.classList.remove("egg-denied");
          void root.offsetWidth;
          root.classList.add("egg-denied");
          window.setTimeout(function () { root.classList.remove("egg-denied"); }, 700);
        }
        toast({ kicker: "Permission denied", title: user + " is not in the sudoers file.", text: "This incident will be reported.", mono: true, icon: "#" });
        window.setTimeout(function () { found("sudo", "Every admin knows the magic word. Not today, though."); }, 400);
      }
    }
  });

  /* ---------- 4. Logo barrel roll ---------- */
  var logo = document.querySelector(".nav .logo");
  if (logo) {
    var logoClicks = 0;
    var logoTimer = null;
    logo.addEventListener("click", function () {
      logoClicks += 1;
      window.clearTimeout(logoTimer);
      logoTimer = window.setTimeout(function () { logoClicks = 0; }, 1500);
      if (logoClicks >= 5) {
        logoClicks = 0;
        if (!reduceMotion) {
          root.style.setProperty("--egg-oy", ((window.scrollY || 0) + window.innerHeight / 2) + "px");
          root.classList.add("egg-roll");
          window.setTimeout(function () { root.classList.remove("egg-roll"); }, 1300);
        }
        found("roll", "Do a barrel roll!");
      }
    });
  }

  /* ---------- 5. Theme toggle party ---------- */
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    var toggles = [];
    themeBtn.addEventListener("click", function () {
      var now = Date.now();
      toggles = toggles.filter(function (t) { return now - t < 3500; });
      toggles.push(now);
      if (toggles.length >= 8) {
        toggles = [];
        if (!reduceMotion) {
          root.classList.add("egg-party");
          window.setTimeout(function () { root.classList.remove("egg-party"); }, 4000);
        }
        found("party", "Can't decide between light and dark? Have both.");
      }
    });
  }

  /* ---------- Console hints ---------- */
  try {
    console.log(
      "%c LB %c " + (person.name || "") + " // " + EGGS.length + " easter eggs are hidden on this page",
      "background:#0071e3;color:#fff;font-weight:800;padding:4px 6px;border-radius:4px",
      "color:#0071e3;font-weight:700"
    );
    EGGS.forEach(function (egg, i) { console.log("  " + (i + 1) + ". " + egg.hint); });
    console.log("Found so far: " + loadFound().length + "/" + EGGS.length + ". Progress is saved in this browser.");
  } catch (e) {}

  window.setTimeout(celebrate, window.LBSkin && window.LBSkin.arriving ? 1600 : 800);

  window.LBEggs = { found: found, openTerminal: openTerminal };
})();
