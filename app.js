function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function generateWalkData(count, start, volatility, trend) {
  const data = [start];
  for (let i = 1; i < count; i++) {
    data.push(clamp(data[i - 1] + rand(-volatility, volatility) + trend, start * 0.85, start * 1.15));
  }
  return data;
}

(function initBgChart() {
  const canvas = document.getElementById("bgChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const CANDLES = 80;
  let candles = [], offset = 0;

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }

  function genCandle(prev) {
    const open = prev ? prev.close : rand(100, 120);
    const close = open + rand(-3.5, 3.5);
    return { open, close, high: Math.max(open, close) + rand(0.3, 2.2), low: Math.min(open, close) - rand(0.3, 2.2) };
  }

  function seedCandles() {
    candles = [];
    let prev = null;
    for (let i = 0; i < CANDLES + 2; i++) { prev = genCandle(prev); candles.push(prev); }
  }

  function drawBg() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, (H / 6) * i); ctx.lineTo(W, (H / 6) * i); ctx.stroke();
    }
    const visible = candles.slice(0, CANDLES + 1);
    const maxP = Math.max(...visible.map(c => c.high));
    const minP = Math.min(...visible.map(c => c.low));
    const range = maxP - minP || 1;
    const padT = H * 0.15, chartH = H * 0.7, gap = W / CANDLES, candleW = gap * 0.65;
    const toY = p => padT + chartH * (1 - (p - minP) / range);
    const closes = visible.map((c, i) => ({ x: i * gap + gap / 2 - offset, y: toY(c.close) }));
    if (closes.length > 1) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(229,9,20,0.15)"); grad.addColorStop(1, "rgba(229,9,20,0)");
      ctx.beginPath();
      ctx.moveTo(closes[0].x, H);
      closes.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(closes[closes.length - 1].x, H);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(229,9,20,0.4)"; ctx.lineWidth = 1.5;
      closes.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
    visible.forEach((c, i) => {
      const x = i * gap + gap / 2 - offset;
      const isUp = c.close >= c.open;
      const color = isUp ? "rgba(0,196,125,0.7)" : "rgba(229,9,20,0.7)";
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, toY(c.high)); ctx.lineTo(x, toY(c.low)); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, Math.min(toY(c.open), toY(c.close)), candleW, Math.max(1.5, Math.abs(toY(c.open) - toY(c.close))));
    });
  }

  let frame = 0;
  function tick() {
    frame++;
    if (frame % 2 === 0) {
      offset += 0.4;
      if (offset >= canvas.width / CANDLES) { offset = 0; candles.shift(); candles.push(genCandle(candles[candles.length - 1])); }
    }
    drawBg(); requestAnimationFrame(tick);
  }
  resize(); seedCandles(); tick();
  window.addEventListener("resize", () => { resize(); seedCandles(); });
})();

(function initConvBg() {
  const canvas = document.getElementById("convBgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let data = generateWalkData(120, 100, 1.2, 0.02);

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const step = W / (data.length - 1);
    const toY = v => H - ((v - min) / range) * H * 0.8 - H * 0.1;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(229,9,20,0.2)"); grad.addColorStop(1, "rgba(229,9,20,0)");
    ctx.beginPath();
    data.forEach((v, i) => i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * step, toY(v)));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    data.forEach((v, i) => i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * step, toY(v)));
    ctx.strokeStyle = "rgba(229,9,20,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function tick() { data.push(data[data.length - 1] + rand(-1.2, 1.2) + 0.015); data.shift(); draw(); setTimeout(() => requestAnimationFrame(tick), 80); }
  resize(); draw(); tick();
  window.addEventListener("resize", () => { resize(); draw(); });
})();

const sparkConfigs = [
  { id: "spark1", up: true,  start: 1.0842, vol: 0.0008 },
  { id: "spark2", up: true,  start: 1.2741, vol: 0.0006 },
  { id: "spark3", up: false, start: 149.82, vol: 0.12   },
  { id: "spark4", up: false, start: 83.42,  vol: 0.04   },
];
const sparkData = {};
sparkConfigs.forEach(cfg => { sparkData[cfg.id] = generateWalkData(30, cfg.start, cfg.vol, cfg.up ? cfg.vol * 0.1 : -cfg.vol * 0.1); });

function drawSparkline(id, data, isUp) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 0.0001;
  const step = W / (data.length - 1);
  const color = isUp ? "#00c47d" : "#f5a623";
  const toY = v => H - ((v - min) / range) * (H - 4) - 2;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, isUp ? "rgba(0,196,125,0.3)" : "rgba(245,166,35,0.3)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * step, toY(v)));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * step, toY(v)));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}
sparkConfigs.forEach(cfg => drawSparkline(cfg.id, sparkData[cfg.id], cfg.up));
setInterval(() => {
  sparkConfigs.forEach(cfg => {
    const d = sparkData[cfg.id];
    d.push(d[d.length - 1] + rand(-cfg.vol, cfg.vol) + (cfg.up ? cfg.vol * 0.08 : -cfg.vol * 0.08));
    d.shift();
    drawSparkline(cfg.id, d, cfg.up);
  });
}, 900);

const marketCharts = [
  { id: "chart-eur", up: true,  start: 1.0842, vol: 0.0010 },
  { id: "chart-gbp", up: true,  start: 1.2741, vol: 0.0009 },
  { id: "chart-jpy", up: false, start: 149.82, vol: 0.15   },
  { id: "chart-aud", up: true,  start: 0.6512, vol: 0.0007 },
  { id: "chart-inr", up: false, start: 83.42,  vol: 0.05   },
  { id: "chart-cny", up: true,  start: 7.2401, vol: 0.006  },
];
const mcData = {};
marketCharts.forEach(cfg => { mcData[cfg.id] = generateWalkData(50, cfg.start, cfg.vol, cfg.up ? cfg.vol * 0.05 : -cfg.vol * 0.05); });

function drawMarketChart(id, data, isUp) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 260, H = canvas.height;
  canvas.width = W;
  ctx.clearRect(0, 0, W, H);
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 0.0001;
  const step = W / (data.length - 1);
  const color = isUp ? "#00c47d" : "#f5a623";
  const toY = v => H - ((v - min) / range) * (H - 4) - 2;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, isUp ? "rgba(0,196,125,0.25)" : "rgba(245,166,35,0.25)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * step, toY(v)));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(0, toY(v)) : ctx.lineTo(i * step, toY(v)));
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
  const lastY = toY(data[data.length - 1]);
  ctx.beginPath(); ctx.arc(W - 1, lastY, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
marketCharts.forEach(cfg => drawMarketChart(cfg.id, mcData[cfg.id], cfg.up));
setInterval(() => {
  marketCharts.forEach(cfg => {
    const d = mcData[cfg.id];
    d.push(d[d.length - 1] + rand(-cfg.vol, cfg.vol)); d.shift();
    drawMarketChart(cfg.id, d, cfg.up);
  });
}, 1200);

const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => { navbar.classList.toggle("scrolled", window.scrollY > 50); }, { passive: true });

document.querySelectorAll(".scroll-link").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute("href"));
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 62, behavior: "smooth" });
  });
});

const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const delay = parseInt(entry.target.dataset.delay || 0);
    setTimeout(() => entry.target.classList.add("revealed"), delay);
  });
}, { threshold: 0.12 });
document.querySelectorAll("[data-reveal], .market-card, .step-card, .section-head, .about-notice").forEach(el => revealObs.observe(el));

const amountInput = document.getElementById("amount");
const fromSelect  = document.getElementById("fromCurrency");
const toSelect    = document.getElementById("toCurrency");
const convertBtn  = document.getElementById("convertBtn");
const btnLoader   = document.getElementById("btnLoader");
const resultPanel = document.getElementById("resultPanel");
const resultLabel = document.getElementById("resultLabel");
const resultValue = document.getElementById("resultValue");
const rateInfo    = document.getElementById("rateInfo");
const errorPanel  = document.getElementById("errorPanel");
const swapBtn     = document.getElementById("swapBtn");

function populateSelects() {
  CURRENCIES.forEach(({ code, name }) => {
    const make = () => { const o = document.createElement("option"); o.value = code; o.textContent = `${code} — ${name}`; return o; };
    fromSelect.appendChild(make());
    toSelect.appendChild(make());
  });
  fromSelect.value = "USD";
  toSelect.value = "INR";
}

function setLoading(state) { convertBtn.disabled = state; btnLoader.classList.toggle("visible", state); }
function clearMessages() { errorPanel.classList.remove("visible"); resultPanel.classList.remove("visible"); }
function showError(msg) { errorPanel.textContent = msg; errorPanel.classList.add("visible"); resultPanel.classList.remove("visible"); }
function showResult(from, to, amount, converted, rate) {
  resultPanel.classList.add("visible");
  resultLabel.textContent = `${amount.toLocaleString()} ${from}`;
  resultValue.textContent = `${converted.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${to}`;
  rateInfo.textContent = `1 ${from} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${to}`;
}

async function fetchRate(from, to) {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.result !== "success" || data.rates?.[to] == null) throw new Error();
    return data.rates[to];
  } catch {
    const res2 = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (!res2.ok) throw new Error();
    const data2 = await res2.json();
    if (data2.rates?.[to] == null) throw new Error();
    return data2.rates[to];
  }
}

async function handleConvert() {
  clearMessages();
  const raw = amountInput.value.trim();
  const amount = parseFloat(raw);
  const from = fromSelect.value, to = toSelect.value;
  if (!raw || isNaN(amount)) { showError("Please enter a valid amount."); return; }
  if (amount <= 0) { showError("Amount must be greater than zero."); return; }
  if (from === to) { showResult(from, to, amount, amount, 1); return; }
  setLoading(true);
  try {
    const rate = await fetchRate(from, to);
    showResult(from, to, amount, amount * rate, rate);
  } catch {
    showError("Could not fetch rates. Check your connection and try again.");
  } finally {
    setLoading(false);
  }
}

swapBtn.addEventListener("click", () => {
  const tmp = fromSelect.value; fromSelect.value = toSelect.value; toSelect.value = tmp;
  clearMessages(); swapBtn.classList.add("spin"); setTimeout(() => swapBtn.classList.remove("spin"), 320);
});
convertBtn.addEventListener("click", handleConvert);
amountInput.addEventListener("keydown", e => { if (e.key === "Enter") handleConvert(); });

populateSelects();