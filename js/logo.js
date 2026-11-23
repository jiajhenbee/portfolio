/* ==========================================================================
   Bee Li — logo hover
   On hover, the yellow stripes switch to a random vivid colour,
   and return to the original yellow when the pointer leaves.
   ========================================================================== */
(function () {
  "use strict";

  var ORIGINAL = "#FFBA1A";
  var logo = document.querySelector(".brand__logo");
  var stripes = document.getElementById("logoStripes");
  if (!logo || !stripes) return;

  var lastHue = null;

  // Random, but kept vivid and readable via fixed saturation/lightness,
  // and nudged away from the previous hue so each hover looks distinct.
  function randomColor() {
    var hue;
    do {
      hue = Math.floor(Math.random() * 360);
    } while (lastHue !== null && Math.abs(hue - lastHue) < 40);
    lastHue = hue;
    return "hsl(" + hue + ", 85%, 55%)";
  }

  logo.addEventListener("mouseenter", function () {
    stripes.setAttribute("fill", randomColor());
  });

  logo.addEventListener("mouseleave", function () {
    stripes.setAttribute("fill", ORIGINAL);
  });
})();
