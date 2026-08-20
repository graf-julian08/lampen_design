/* --- CLOCK --- */
function updateClock() {
  const el = document.getElementById("clock");
  setInterval(() => {
    const now = new Date();
    el.textContent =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
  }, 1000);
}
updateClock();

/* --- SWIPE / DOTS LOGIC --- */
const carousel = document.getElementById("carousel");
const dotsContainer = document.getElementById("dots");

const totalScreens = 4;
let currentScreen = 0;

// create dots
for (let i = 0; i < totalScreens; i++) {
  const dot = document.createElement("div");
  dot.classList.add("dot");
  if (i === 0) dot.classList.add("active");
  dot.dataset.index = i;
  dotsContainer.appendChild(dot);
}

const dots = document.querySelectorAll(".dot");

function updateCarousel() {
  carousel.style.transform = `translateX(${-currentScreen * 100}%)`;

  dots.forEach((d) => d.classList.remove("active"));
  dots[currentScreen].classList.add("active");
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    currentScreen = Number(dot.dataset.index);
    updateCarousel();
  });
});

// swipe
let startX = 0;

carousel.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

carousel.addEventListener("touchend", (e) => {
  let diff = e.changedTouches[0].clientX - startX;

  if (diff > 50 && currentScreen > 0) currentScreen--;
  if (diff < -50 && currentScreen < totalScreens - 1) currentScreen++;

  updateCarousel();
});

/* --- COLOR WHEEL --- */
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const radius = canvas.width / 2;

const brightnessInput = document.getElementById("brightness");
const preview = document.getElementById("preview");
const hexInput = document.getElementById("hex");

let currentHue = 0;
let currentSat = 0;
let currentX = radius;
let currentY = radius;

// HSV → RGB
function hsvToRgb(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;
  let r, g, b;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return [r, g, b];
}

// RGB → HEX
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function drawWheel() {
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - radius;
      const dy = y - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const index = (y * canvas.width + x) * 4;

      if (dist > radius) {
        data[index + 3] = 0;
        continue;
      }

      const sat = dist / radius;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const hue = (angle + 360) % 360;

      const [r, g, b] = hsvToRgb(hue, sat, 1);

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
}

function drawPicker() {
  ctx.save();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(currentX, currentY, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateColor() {
  const v = brightnessInput.value / 100;
  const [r, g, b] = hsvToRgb(currentHue, currentSat, v);
  const hex = rgbToHex(r, g, b);
  preview.style.background = hex;
  hexInput.value = hex;
}

function redraw() {
  drawWheel();
  drawPicker();
  updateColor();
}

function pick(event) {
  const bounds = canvas.getBoundingClientRect();

  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;

  const x = (event.clientX - bounds.left) * scaleX;
  const y = (event.clientY - bounds.top) * scaleY;

  const dx = x - radius;
  const dy = y - radius;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > radius) return;

  currentX = x;
  currentY = y;

  currentSat = dist / radius;
  currentHue = (Math.atan2(dy, dx) * 180) / Math.PI;
  currentHue = (currentHue + 360) % 360;

  redraw();
}

let dragging = false;

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  pick(e);
});
window.addEventListener("mousemove", (e) => dragging && pick(e));
window.addEventListener("mouseup", () => (dragging = false));

brightnessInput.addEventListener("input", redraw);

drawWheel();
drawPicker();
updateColor();