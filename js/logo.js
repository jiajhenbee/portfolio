/* ==========================================================================
   Bee Li — colour play
   • Logo stripes: while the pointer stays on the logo, they keep cycling
     through fully random colours, returning to the original yellow on leave.
   • Text cursor: while the pointer is over text, the slim bar cursor keeps
     cycling through the same random colours, returning to its static colour
     on leave.
   Cycling is gentle (slow interval + smooth transition) and is disabled when
   the user prefers reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  var ORIGINAL = "#FFBA1A";
  var INTERVAL = 250; // ms between colour changes while hovered

  var logo = document.querySelector(".brand__logo");
  var stripes = document.getElementById("logoStripes");
  var textEls = document.querySelectorAll(".lede, .body p, .brand__name");

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // A fully random colour across the whole RGB space, returned as hex.
  // The only guard rejects colours too light to be seen on the pale bg.
  function randomColor() {
    var r, g, b, luminance;
    do {
      r = Math.floor(Math.random() * 256);
      g = Math.floor(Math.random() * 256);
      b = Math.floor(Math.random() * 256);
      luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    } while (luminance > 0.82); // skip near-white colours that vanish on the bg
    return "#" + [r, g, b].map(function (n) {
      return n.toString(16).padStart(2, "0");
    }).join("");
  }

  /* -- Logo stripes ----------------------------------------------------- */
  if (logo && stripes) {
    var logoTimer = null;

    function logoTick() {
      stripes.setAttribute("fill", randomColor());
    }

    logo.addEventListener("mouseenter", function () {
      logoTick();
      if (!reduceMotion) {
        clearInterval(logoTimer);
        logoTimer = setInterval(logoTick, INTERVAL);
      }
    });

    logo.addEventListener("mouseleave", function () {
      clearInterval(logoTimer);
      logoTimer = null;
      stripes.setAttribute("fill", ORIGINAL);
    });
  }

  /* -- Link preview icons ----------------------------------------------- */
  // Each time a link with a pop-up icon is hovered or focused, tilt the icon
  // by a fresh random angle between -20 and 20 degrees.
  document.querySelectorAll(".pop").forEach(function (pop) {
    var link = pop.querySelector("a");
    var img = pop.querySelector(".pop__img");
    if (!link || !img) return;

    function tilt() {
      var deg = Math.round(Math.random() * 40 - 20);
      img.style.setProperty("--pop-rot", deg + "deg");
    }

    link.addEventListener("mouseenter", tilt);
    link.addEventListener("focus", tilt);
  });

  /* -- Cursor label ----------------------------------------------------- */
  // A small "Open ↗" pill that appears beside the pointer while it is over a
  // product link, and follows it. The real cursor stays visible. Mouse and
  // trackpad only: skipped on touch devices.
  var finePointer = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : false;
  var labelLinks = document.querySelectorAll(".pop a");

  if (finePointer && labelLinks.length) {
    var OFFSET_X = 14; // px to the right of the pointer
    var OFFSET_Y = 18; // px below the pointer
    var EDGE = 8;      // px kept clear of the viewport edges

    var label = document.createElement("div");
    label.className = "cursor-label";
    label.setAttribute("aria-hidden", "true");
    label.textContent = "Open ↗";
    document.body.appendChild(label);

    function moveLabel(e) {
      var w = label.offsetWidth;
      var h = label.offsetHeight;
      var x = e.clientX + OFFSET_X;
      var y = e.clientY + OFFSET_Y;
      // Flip to the other side of the pointer rather than run off screen.
      if (x + w > window.innerWidth - EDGE) x = e.clientX - OFFSET_X - w;
      if (y + h > window.innerHeight - EDGE) y = e.clientY - OFFSET_Y - h;
      label.style.translate = x + "px " + y + "px";
    }

    labelLinks.forEach(function (link) {
      link.addEventListener("mouseenter", function (e) {
        moveLabel(e);
        label.classList.add("is-on");
      });
      link.addEventListener("mousemove", moveLabel);
      link.addEventListener("mouseleave", function () {
        label.classList.remove("is-on");
      });
    });
  }

  /* -- Text cursor ------------------------------------------------------ */
  // Only animate the cursor colour when motion is allowed; otherwise the
  // static bar cursor from the stylesheet stays in place.
  if (textEls.length && !reduceMotion) {
    var cursorTimer = null;

    // Build a bar-cursor value tinted with the given hex colour.
    function barCursor(hex) {
      var fill = "%23" + hex.slice(1); // # -> %23
      return "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='12'%20height='28'%20viewBox='0%200%2012%2028'%3E%3Crect%20x='4.5'%20y='2'%20width='3'%20height='24'%20rx='1.5'%20fill='" + fill + "'/%3E%3C/svg%3E\") 6 14, text";
    }

    function paintCursor() {
      var value = barCursor(randomColor());
      textEls.forEach(function (el) { el.style.cursor = value; });
    }

    function startCursor() {
      paintCursor();
      clearInterval(cursorTimer);
      cursorTimer = setInterval(paintCursor, INTERVAL);
    }

    function stopCursor() {
      clearInterval(cursorTimer);
      cursorTimer = null;
      // Clear the inline override so the static CSS bar cursor returns.
      textEls.forEach(function (el) { el.style.cursor = ""; });
    }

    textEls.forEach(function (el) {
      el.addEventListener("mouseenter", startCursor);
      el.addEventListener("mouseleave", stopCursor);
    });
  }
})();
