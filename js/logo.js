/* ==========================================================================
   Bee Li — colour play and cursor
   • Logo stripes: while the pointer stays on the logo, they keep cycling
     through fully random colours, returning to the original yellow on leave.
   • Link preview icons: a random tilt each time a product link is hovered.
   • Dot cursor: two small dots replace the system cursor. They glide after
     the pointer, part slightly while moving and merge again when it stops.
   • Cursor label: an "Open" pill takes over from the dots on product links.
   The dot cursor is only used with a mouse or trackpad, and never when the
   user prefers reduced motion: those visitors keep their system cursor.
   ========================================================================== */
(function () {
  "use strict";

  var ORIGINAL = "#FFBA1A";
  var INTERVAL = 250; // ms between colour changes while hovered

  var logo = document.querySelector(".brand__logo");
  var stripes = document.getElementById("logoStripes");

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

  /* -- Pointer capabilities --------------------------------------------- */
  var finePointer = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : false;
  // The dot cursor hides the system cursor, so it is only switched on from
  // here: if this script never runs, the normal cursor is still there.
  var dotCursor = finePointer && !reduceMotion;
  var root = document.documentElement;
  var label = null;   // the "Open" pill, created further down
  var labelWidth = 0; // its full width once expanded

  /* -- Dot cursor ------------------------------------------------------- */
  // Two 8px dots stacked on the pointer: logo ink on top, logo yellow beneath.
  // The pair glides after the pointer with a little lag, which gives it weight.
  // While it is catching up, the dots part by a few px in opposite directions
  // (yellow leaning ahead, ink trailing); once the pointer rests they ease
  // back into a single round dot. Faster movement also stretches the dots
  // along the direction of travel. Nothing bounces.
  if (dotCursor) {
    var FOLLOW = 0.25;      // share of the gap to the pointer closed per step
    var SPLIT = 0.23;       // how much of that gap becomes the split
    var MAX_SPLIT = 6;      // px: furthest each dot moves from the pair's centre
    var SPLIT_EASE = 0.13;  // how quickly the split grows and fades per step
    var STRETCH = 0.03;     // stretch gained per px the pair is behind
    var MAX_STRETCH = 1.6;  // dots stretch up to 2.6x their length
    var STEP = 1000 / 60;   // motion runs at a steady 60 steps per second

    var dotYellow = document.createElement("div");
    var dotInk = document.createElement("div");
    dotYellow.className = "cursor-dot cursor-dot--yellow";
    dotInk.className = "cursor-dot cursor-dot--ink";
    dotYellow.setAttribute("aria-hidden", "true");
    dotInk.setAttribute("aria-hidden", "true");
    document.body.appendChild(dotYellow);
    document.body.appendChild(dotInk);
    root.classList.add("has-dot-cursor");

    var px = null, py = null; // real pointer position
    var cx = 0, cy = 0;       // centre of the pair, gliding after the pointer
    var ox = 0, oy = 0;       // current split
    var angle = 0;            // direction of travel, for the stretch
    var frame = null;
    var lastFrame = 0;
    var backlog = 0;

    function renderDots() {
      dotYellow.style.translate = (cx + ox) + "px " + (cy + oy) + "px";
      dotInk.style.translate = (cx - ox) + "px " + (cy - oy) + "px";
      // Stretch along the direction of travel. It is tied directly to how far
      // the pair still has to glide, so it fades smoothly with no bounce.
      var gx = px - cx;
      var gy = py - cy;
      var gap = Math.sqrt(gx * gx + gy * gy);
      var stretch = Math.min(gap * STRETCH, MAX_STRETCH);
      if (gap > 0.5) angle = Math.atan2(gy, gx);
      var shape = "rotate(" + angle + "rad) scale(" +
        (1 + stretch) + ", " + (1 - stretch * 0.35) + ")";
      dotYellow.style.transform = shape;
      dotInk.style.transform = shape;
      // The pill grows out of the ink dot, so it rides on the same spot
      // (nudged back on screen if it would run past the right or bottom edge).
      if (label) {
        var lx = cx - ox - 4;
        var ly = cy - oy - 4;
        if (label.classList.contains("is-on")) {
          lx = Math.min(lx, window.innerWidth - 8 - labelWidth);
          ly = Math.min(ly, window.innerHeight - 8 - 28);
        }
        label.style.translate = lx + "px " + ly + "px";
      }
    }

    function stepMotion() {
      var gx = px - cx;
      var gy = py - cy;
      cx += gx * FOLLOW;
      cy += gy * FOLLOW;
      // The split aims at a fraction of the gap, capped at MAX_SPLIT.
      var tx = gx * SPLIT;
      var ty = gy * SPLIT;
      var len = Math.sqrt(tx * tx + ty * ty);
      if (len > MAX_SPLIT) {
        tx = (tx / len) * MAX_SPLIT;
        ty = (ty / len) * MAX_SPLIT;
      }
      ox += (tx - ox) * SPLIT_EASE;
      oy += (ty - oy) * SPLIT_EASE;
    }

    function animate(now) {
      backlog += Math.min(now - lastFrame, 100);
      lastFrame = now;
      while (backlog >= STEP) {
        stepMotion();
        backlog -= STEP;
      }
      var resting = Math.abs(px - cx) < 0.05 && Math.abs(py - cy) < 0.05 &&
        Math.abs(ox) < 0.05 && Math.abs(oy) < 0.05;
      if (resting) {
        cx = px;
        cy = py;
        ox = oy = 0;
        frame = null;
        renderDots();
        return;
      }
      renderDots();
      frame = requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove", function (e) {
      // First movement (or returning to the page): start on the pointer
      // rather than gliding in from wherever the dots were left.
      if (px === null || !root.classList.contains("dots-on")) {
        cx = e.clientX;
        cy = e.clientY;
        ox = oy = 0;
      }
      px = e.clientX;
      py = e.clientY;
      root.classList.add("dots-on");
      if (!frame) {
        lastFrame = performance.now();
        backlog = 0;
        renderDots();
        frame = requestAnimationFrame(animate);
      }
    }, { passive: true });

    // Hide the dots when the pointer leaves the page.
    root.addEventListener("mouseleave", function () {
      root.classList.remove("dots-on");
    });

    // Over a product link the dots give way to the "Open" pill; over any
    // other link they grow, standing in for the usual pointing hand.
    document.addEventListener("mouseover", function (e) {
      var link = e.target.closest ? e.target.closest("a") : null;
      var product = !!(link && link.closest(".pop"));
      root.classList.toggle("dots-label", product);
      root.classList.toggle("dots-link", !!link && !product);
    });
  }

  /* -- Cursor label ----------------------------------------------------- */
  // An "Open ↗" pill shown while the pointer is over a product link. Mouse and
  // trackpad only: skipped on touch.
  // • With the dot cursor, the ink dot itself swells into the pill and shrinks
  //   back to a dot on leaving (the pill is carried by renderDots above).
  // • With the system cursor (reduced motion), a ready-made pill simply
  //   appears beside the pointer.
  var labelLinks = document.querySelectorAll(".pop a");

  if (finePointer && labelLinks.length) {
    var OFFSET_X = 14; // px to the right of the system cursor
    var OFFSET_Y = 18; // px below the system cursor
    var EDGE = 8;      // px kept clear of the viewport edges

    label = document.createElement("div");
    label.className = "cursor-label";
    label.setAttribute("aria-hidden", "true");
    var labelText = document.createElement("span");
    labelText.className = "cursor-label__text";
    labelText.textContent = "Open \u2197";
    label.appendChild(labelText);
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
        if (dotCursor) {
          // Tell the stylesheet how wide the pill should grow: text + padding.
          labelWidth = labelText.offsetWidth + 24;
          label.style.setProperty("--label-w", labelWidth + "px");
        } else {
          moveLabel(e);
        }
        label.classList.add("is-on");
      });
      if (!dotCursor) link.addEventListener("mousemove", moveLabel);
      link.addEventListener("mouseleave", function () {
        label.classList.remove("is-on");
      });
    });
  }
})();
