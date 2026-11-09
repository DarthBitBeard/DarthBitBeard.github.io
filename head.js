/* Runs in <head>, before the page paints. Kept as a file (not inline) so the
   Content-Security-Policy can block all inline scripts.
   data-skin on the <script> tag: "classic", "casefile" or "none" (404 page). */
(function () {
  var root = document.documentElement;
  var script = document.currentScript;
  var skin = (script && script.getAttribute("data-skin")) || "none";

  /* Lets CSS hide things for animation only when JavaScript is running. */
  root.classList.add("js");

  if (skin !== "casefile") {
    var theme = "light";
    try {
      theme = localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch (e) {}
    root.setAttribute("data-theme", theme);
  }

  if (skin !== "classic" && skin !== "casefile") { return; }
  var other = skin === "classic" ? "casefile" : "classic";
  var otherHref = skin === "classic" ? "casefile.html" : "./";
  var hosts = ["landonbeard.beardlab.us", "localhost", "127.0.0.1"];
  try {
    /* Remember the last skin a visitor chose. */
    if (localStorage.getItem("lb-skin") === other && hosts.indexOf(location.hostname) > -1) {
      location.replace(otherHref);
      return;
    }
    /* Arriving from the other skin: play the arrival half of the transition. */
    if (sessionStorage.getItem("lb-arrive") === skin) {
      sessionStorage.removeItem("lb-arrive");
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.classList.add("sk-arriving");
      }
    }
  } catch (e) {}
})();
