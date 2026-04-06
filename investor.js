let API_KEY = "";

const STOCK_GROUPS = {
  mega:    [{ s:"AAPL",n:"Apple"}, {s:"MSFT",n:"Microsoft"}, {s:"NVDA",n:"NVIDIA"}, {s:"GOOGL",n:"Alphabet"}, {s:"AMZN",n:"Amazon"}, {s:"META",n:"Meta"}, {s:"TSLA",n:"Tesla"}, {s:"BRK.B",n:"Berkshire"}],
  tech:    [{ s:"AAPL",n:"Apple"}, {s:"MSFT",n:"Microsoft"}, {s:"NVDA",n:"NVIDIA"}, {s:"AMD",n:"AMD"}, {s:"INTC",n:"Intel"}, {s:"CRM",n:"Salesforce"}, {s:"ORCL",n:"Oracle"}, {s:"ADBE",n:"Adobe"}],
  finance: [{ s:"JPM",n:"JPMorgan"}, {s:"BAC",n:"Bank of America"}, {s:"GS",n:"Goldman Sachs"}, {s:"MS",n:"Morgan Stanley"}, {s:"WFC",n:"Wells Fargo"}, {s:"BLK",n:"BlackRock"}, {s:"V",n:"Visa"}, {s:"MA",n:"Mastercard"}],
  energy:  [{ s:"XOM",n:"ExxonMobil"}, {s:"CVX",n:"Chevron"}, {s:"COP",n:"ConocoPhillips"}, {s:"SLB",n:"Schlumberger"}, {s:"EOG",n:"EOG Resources"}, {s:"MPC",n:"Marathon Pete."}, {s:"PXD",n:"Pioneer Natural"}, {s:"OXY",n:"Occidental"}],
};

const SENTIMENT_TICKERS = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","JPM"];

const rand = (a,b) => Math.random()*(b-a)+a;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const fmtNum = (n,d=2) => n == null ? "—" : Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtPct = (n,d=2) => n == null ? "—" : (n>0?"+":"")+Number(n).toFixed(d)+"%";
const ago = ts => { const s = Math.floor((Date.now()-ts*1000)/1000); if(s<60) return s+"s ago"; if(s<3600) return Math.floor(s/60)+"m ago"; if(s<86400) return Math.floor(s/3600)+"h ago"; return Math.floor(s/86400)+"d ago"; };

function simWalk(n, start, vol) {
  const d=[start]; for(let i=1;i<n;i++) d.push(clamp(d[i-1]+rand(-vol,vol), start*0.8, start*1.2)); return d;
}

function drawMiniChart(canvasId, data, isUp) {
  const c = document.getElementById(canvasId); if(!c) return;
  const ctx = c.getContext("2d"), W=c.width, H=c.height;
  ctx.clearRect(0,0,W,H);
  const max=Math.max(...data), min=Math.min(...data), range=max-min||0.001;
  const toY = v => H-((v-min)/range)*(H-3)-2;
  const step = W/(data.length-1);
  const color = isUp ? "#00c47d" : "#f5a623";
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, isUp?"rgba(0,196,125,0.3)":"rgba(245,166,35,0.3)");
  grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.beginPath();
  data.forEach((v,i) => i===0 ? ctx.moveTo(0,toY(v)) : ctx.lineTo(i*step,toY(v)));
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
  ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath();
  data.forEach((v,i) => i===0 ? ctx.moveTo(0,toY(v)) : ctx.lineTo(i*step,toY(v)));
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
}

(function initHeroCanvas() {
  const canvas = document.getElementById("invHeroCanvas"); if(!canvas) return;
  const ctx = canvas.getContext("2d");
  let data = simWalk(200, 150, 1.8);
  function resize() { canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; }
  function draw() {
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle="rgba(255,255,255,0.025)"; ctx.lineWidth=1;
    for(let i=1;i<8;i++) { ctx.beginPath(); ctx.moveTo(0,(H/8)*i); ctx.lineTo(W,(H/8)*i); ctx.stroke(); }
    const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
    const step=W/(data.length-1);
    const toY = v => H-((v-min)/range)*H*0.75-H*0.1;
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,"rgba(229,9,20,0.12)"); grad.addColorStop(1,"rgba(229,9,20,0)");
    ctx.beginPath();
    data.forEach((v,i) => i===0 ? ctx.moveTo(0,toY(v)) : ctx.lineTo(i*step,toY(v)));
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath();
    data.forEach((v,i) => i===0 ? ctx.moveTo(0,toY(v)) : ctx.lineTo(i*step,toY(v)));
    ctx.strokeStyle="rgba(229,9,20,0.35)"; ctx.lineWidth=1.5; ctx.stroke();
  }
  function tick() { data.push(data[data.length-1]+rand(-1.8,1.8)); data.shift(); draw(); setTimeout(()=>requestAnimationFrame(tick),60); }
  resize(); draw(); tick();
  window.addEventListener("resize",()=>{resize();draw();});
})();

function updateClock() {
  const el = document.getElementById("invTime"); if(!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})+" EST";
}
setInterval(updateClock, 1000); updateClock();

const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(!e.isIntersecting) return; setTimeout(()=>e.target.classList.add("revealed"), parseInt(e.target.dataset.delay||0)); });
}, {threshold:0.1});

function observeAll() {
  document.querySelectorAll("[data-reveal], .market-card, .metric-card, .step-card, .fund-placeholder, .sec-head").forEach(el=>revealObs.observe(el));
}

document.querySelectorAll(".scroll-link").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute("href"));
    if(t) window.scrollTo({top: t.getBoundingClientRect().top + window.scrollY - 90, behavior:"smooth"});
  });
});

async function finnhub(path) {
  const res = await fetch(`https://finnhub.io/api/v1${path}&token=${API_KEY}`);
  if(!res.ok) throw new Error(`Finnhub ${res.status}`);
  return res.json();
}

async function loadMarketBar() {
  const indices = [{sym:"SPY",id:"sp500"},{sym:"QQQ",id:"nasdaq"},{sym:"DIA",id:"dow"},{sym:"VIXY",id:"vix"},{sym:"COINBASE:BTC/USD",id:"btc"}];
  for(const idx of indices) {
    try {
      const q = await finnhub(`/quote?symbol=${idx.sym}`);
      const pct = ((q.c-q.pc)/q.pc*100).toFixed(2);
      const isUp = q.c >= q.pc;
      const vEl = document.getElementById(idx.id+"val");
      const cEl = document.getElementById(idx.id+"chg");
      if(vEl) vEl.textContent = idx.id==="btc" ? "$"+fmtNum(q.c,0) : fmtNum(q.c);
      if(cEl) { cEl.textContent = (isUp?"+":"")+pct+"%"; cEl.className = "imb-chg "+(isUp?"up":"down"); }
    } catch {}
  }
}

async function loadStocks(group) {
  const grid = document.getElementById("stocksGrid");
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Fetching ${group} stocks...</span></div>`;
  const stocks = STOCK_GROUPS[group];
  const cards = [];
  for(const st of stocks) {
    try {
      const q = await finnhub(`/quote?symbol=${st.s}`);
      const pct = ((q.c-q.pc)/q.pc*100);
      const isUp = q.c >= q.pc;
      const chartData = simWalk(30, q.pc, Math.abs(q.c-q.pc)*0.3+0.1);
      chartData[chartData.length-1] = q.c;
      cards.push({st, q, pct, isUp, chartData});
    } catch {
      cards.push({st, q:null, pct:0, isUp:true, chartData:simWalk(30,100,1)});
    }
  }
  grid.innerHTML = "";
  cards.forEach(({st,q,pct,isUp,chartData},idx) => {
    const div = document.createElement("div");
    div.className = "stock-card";
    const badgeClass = isUp ? "up-badge" : "down-badge";
    const badgeTxt = isUp ? "▲ LONG" : "▼ SHORT";
    const badgeStyle = isUp ? "background:var(--green-dim);color:var(--green);border:1px solid rgba(0,196,125,0.2)" : "background:var(--amber-dim);color:var(--amber);border:1px solid rgba(245,166,35,0.2)";
    div.innerHTML = `
      <div class="scard-header">
        <span class="scard-ticker">${st.s}</span>
        <span class="scard-badge" style="${badgeStyle}">${badgeTxt}</span>
      </div>
      <span class="scard-name">${st.n}</span>
      <span class="scard-price">${q ? "$"+fmtNum(q.c) : "—"}</span>
      <span class="scard-change ${isUp?"up":"down"}">${q ? (isUp?"+":"")+pct.toFixed(2)+"%" : "—"}</span>
      <canvas class="scard-chart" id="sc-chart-${idx}" width="200" height="44"></canvas>
      <div class="scard-footer">
        <span class="scard-meta">H ${q?"$"+fmtNum(q.h):"—"}</span>
        <span class="scard-meta">L ${q?"$"+fmtNum(q.l):"—"}</span>
        <span class="scard-meta">PC ${q?"$"+fmtNum(q.pc):"—"}</span>
      </div>`;
    grid.appendChild(div);
    setTimeout(() => drawMiniChart(`sc-chart-${idx}`, chartData, isUp), 50);
  });
}

function loadMetricsSim() {
  const fgi = Math.floor(rand(25,75));
  document.getElementById("fgiVal").textContent = fgi;
  const labels = ["Extreme Fear","Fear","Neutral","Greed","Extreme Greed"];
  const li = fgi<20?0:fgi<40?1:fgi<60?2:fgi<80?3:4;
  document.getElementById("fgiLabel").textContent = labels[li];
  document.getElementById("fgiLabel").style.color = fgi<40?"var(--amber)":fgi<60?"var(--text-2)":"var(--green)";
  drawMiniChart("fgiChart", simWalk(20, fgi, 3), fgi>=50);

  const metrics = [
    {v:"$"+fmtNum(rand(74,82)),c:fmtPct(rand(-2,2)),id:"oil",chartUp:rand(0,1)>0.5},
    {v:"$"+fmtNum(rand(2100,2400),0),c:fmtPct(rand(-1.5,1.5)),id:"gold",chartUp:rand(0,1)>0.5},
    {v:rand(3.9,4.8).toFixed(2)+"%",c:fmtPct(rand(-0.1,0.1),3),id:"bond",chartUp:rand(0,1)>0.5},
    {v:fmtNum(rand(101,108)),c:fmtPct(rand(-0.8,0.8)),id:"dxy",chartUp:rand(0,1)>0.5},
    {v:rand(48,58).toFixed(1)+"%",c:fmtPct(rand(-0.5,0.5)),id:"btcdom",chartUp:rand(0,1)>0.5},
  ];
  metrics.forEach(m => {
    document.getElementById(m.id+"Val").textContent = m.v;
    const cEl = document.getElementById(m.id+"Chg");
    if(cEl) { cEl.textContent = m.c; cEl.className = "mc-sub "+(m.c.startsWith("+")?"up":"down"); }
    drawMiniChart(m.id+"Chart", simWalk(20, 100, 1.5), m.chartUp);
  });

  const adv = Math.floor(rand(180,320)), dec = 500-adv;
  document.getElementById("breadthVal").textContent = `${adv} ▲ / ${dec} ▼`;
  const pct = (adv/500*100).toFixed(0);
  const fill = document.getElementById("breadthBarFill");
  if(fill) { fill.style.width = pct+"%"; fill.style.background = adv>dec?"var(--green)":"var(--amber)"; }

  const sectors = [{n:"Tech",v:rand(-2,4)},{n:"Finance",v:rand(-1.5,2)},{n:"Energy",v:rand(-3,3)},{n:"Health",v:rand(-1,2)},{n:"Consumer",v:rand(-2,2)},{n:"Utilities",v:rand(-1.5,1)}];
  const sb = document.getElementById("sectorBars"); if(!sb) return;
  sb.innerHTML = "";
  const maxV = Math.max(...sectors.map(s=>Math.abs(s.v)));
  sectors.forEach(s => {
    const isUp = s.v>=0;
    const h = Math.max(4, Math.abs(s.v)/maxV*48);
    const div = document.createElement("div"); div.className="sector-bar-item";
    div.innerHTML=`<span class="sector-bar-label">${s.n}</span><div class="sector-bar-fill" style="height:${h}px;background:${isUp?"var(--green)":"var(--amber)"}"></div><span class="sector-bar-pct ${isUp?"up":"down"}">${(isUp?"+":"")+s.v.toFixed(1)}%</span>`;
    sb.appendChild(div);
  });
}

async function loadNews(cat="general") {
  const grid = document.getElementById("newsGrid");
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading news...</span></div>`;
  try {
    const data = await finnhub(`/news?category=${cat}`);
    const items = data.slice(0,9);
    grid.innerHTML = "";
    items.forEach((item, i) => {
      const sentimentWords = item.headline.toLowerCase();
      let sentiment = "neutral", sentimentTxt = "NEUTRAL";
      if(sentimentWords.match(/surge|rally|gain|beat|record|profit|growth|upgrade|buy|bull/)) { sentiment="bullish"; sentimentTxt="BULLISH"; }
      else if(sentimentWords.match(/crash|fall|drop|miss|loss|cut|bear|sell|warning|risk|concern/)) { sentiment="bearish"; sentimentTxt="BEARISH"; }
      const card = document.createElement("a");
      card.className = "news-card"+(i===0?" featured":"");
      card.href = item.url; card.target="_blank"; card.rel="noopener";
      card.innerHTML=`
        <div class="nc-meta">
          <span class="nc-source">${item.source}</span>
          <span class="nc-time">${ago(item.datetime)}</span>
        </div>
        <p class="nc-headline">${item.headline}</p>
        <p class="nc-summary">${item.summary||""}</p>
        <span class="nc-sentiment ${sentiment}">● ${sentimentTxt}</span>`;
      grid.appendChild(card);
    });

    const hlInner = document.getElementById("hlInner");
    if(hlInner) {
      hlInner.textContent = items.map(n=>n.headline).join("  ·  ");
    }
  } catch {
    grid.innerHTML = `<div class="loading-state"><span>Failed to load news. Check your API key.</span></div>`;
  }
}

async function loadSentimentFeed() {
  const grid = document.getElementById("sfGrid");
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading sentiment...</span></div>`;
  const results = [];
  for(const ticker of SENTIMENT_TICKERS) {
    try {
      const d = await finnhub(`/news-sentiment?symbol=${ticker}`);
      results.push({ticker, data:d});
    } catch {
      results.push({ticker, data:null});
    }
  }
  grid.innerHTML = "";
  results.forEach(({ticker, data}) => {
    const card = document.createElement("div"); card.className="sf-card";
    if(!data || data.sentiment == null) {
      card.innerHTML=`<span class="sf-ticker">${ticker}</span><span class="sf-label" style="color:var(--text-3)">No data</span>`;
    } else {
      const bull = (data.sentiment.bullishPercent*100).toFixed(0);
      const bear = (data.sentiment.bearishPercent*100).toFixed(0);
      const buzz = data.buzz?.buzz?.toFixed(2)||"—";
      const signal = bull>60?"bullish":bull<40?"bearish":"neutral";
      card.innerHTML=`
        <span class="sf-ticker">${ticker}</span>
        <div class="sf-score-row">
          <span class="sf-pill sf-bull">▲ ${bull}%</span>
          <span class="sf-pill sf-bear">▼ ${bear}%</span>
        </div>
        <span class="sf-pill sf-buzz" style="width:fit-content">BUZZ ${buzz}</span>
        <span class="sf-label">${signal==="bullish"?"Market leaning bullish":signal==="bearish"?"Market leaning bearish":"Mixed signals"}</span>`;
    }
    grid.appendChild(card);
  });
}

document.querySelectorAll(".sc-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sc-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    loadStocks(btn.dataset.group);
  });
});

document.querySelectorAll(".nf-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nf-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    loadNews(btn.dataset.cat);
  });
});

document.querySelectorAll(".sip-mode").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sip-mode").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const isHeadline = btn.dataset.mode==="headline";
    document.getElementById("sentimentText").style.display = isHeadline?"":"none";
    document.getElementById("sipTickerRow").style.display = isHeadline?"none":"";
  });
});

async function runSentimentAnalysis() {
  const btn = document.getElementById("runSentiment");
  const loader = document.getElementById("sipLoader");
  const resultEl = document.getElementById("sentimentResult");
  const mode = document.querySelector(".sip-mode.active").dataset.mode;

  let text = "";
  if(mode==="headline") {
    text = document.getElementById("sentimentText").value.trim();
    if(!text) { alert("Please enter a headline to analyse."); return; }
  } else {
    const ticker = document.getElementById("sentimentTicker").value.trim().toUpperCase();
    if(!ticker) { alert("Please enter a ticker symbol."); return; }
    try {
      loader.classList.add("visible"); btn.disabled=true;
      const news = await finnhub(`/company-news?symbol=${ticker}&from=2024-01-01&to=2025-12-31`);
      text = news.slice(0,3).map(n=>n.headline).join(". ") || "No recent news found.";
    } catch { text = `Latest news for ${ticker} unavailable. Analysing ticker name only.`; }
  }

  loader.classList.add("visible"); btn.disabled=true;

  const keywords = text.toLowerCase();
  let bullScore=0, bearScore=0, riskScore=0;
  const bullWords = ["surge","rally","gain","profit","beat","record","growth","strong","upgrade","buy","bullish","positive","rise","high","exceed","outperform","expand"];
  const bearWords = ["crash","fall","drop","loss","miss","cut","bearish","negative","risk","concern","warn","decline","weak","below","underperform","lawsuit","investigation"];
  const riskWords = ["uncertain","volatile","risk","worry","caution","hedge","fear","unknown","probe","investigation","regulatory"];
  bullWords.forEach(w => { if(keywords.includes(w)) bullScore++; });
  bearWords.forEach(w => { if(keywords.includes(w)) bearScore++; });
  riskWords.forEach(w => { if(keywords.includes(w)) riskScore++; });

  const total = bullScore+bearScore || 1;
  const bullPct = Math.round(bullScore/total*100);
  const bearPct = 100-bullPct;
  let signal, icon, reason, tags;

  if(bullScore>bearScore+1) {
    signal="buy"; icon=""; reason=`Positive sentiment signals detected (${bullWords.filter(w=>keywords.includes(w)).slice(0,4).join(", ")}). The tone of this headline suggests upward price momentum. Consider a long position or watching for breakout entry.`;
    tags=["BULLISH","LONG SIGNAL","MOMENTUM","POSITIVE CATALYST"];
  } else if(bearScore>bullScore+1) {
    signal="sell"; icon=""; reason=`Bearish indicators present (${bearWords.filter(w=>keywords.includes(w)).slice(0,4).join(", ")}). This news suggests potential downside risk. Consider reducing exposure or hedging your position.`;
    tags=["BEARISH","SHORT SIGNAL","RISK-OFF","NEGATIVE CATALYST"];
  } else {
    signal="hold"; icon=""; reason=`Mixed or neutral signals detected. The headline contains both positive and negative indicators. Wait for price confirmation before acting. Volatility is likely.`;
    tags=["NEUTRAL","MIXED","WAIT FOR CONFIRMATION","MONITOR"];
  }

  if(riskScore>2) tags.push("HIGH RISK");

  const confPct = Math.min(95, Math.max(52, Math.abs(bullScore-bearScore)*12+55));

  resultEl.innerHTML=`<div class="srp-verdict">
    <div class="srp-signal">
      <div class="srp-signal-icon ${signal}">${icon}</div>
      <div class="srp-signal-text">
        <h3 class="${signal}">${signal.toUpperCase()}</h3>
        <p>${signal==="buy"?"Consider long position":signal==="sell"?"Consider reducing exposure":"Hold — wait for clarity"}</p>
      </div>
    </div>
    <div class="srp-score-row">
      <div class="srp-score"><label>BULLISH</label><span style="color:var(--green)">${bullPct}%</span></div>
      <div class="srp-score"><label>BEARISH</label><span style="color:var(--amber)">${bearPct}%</span></div>
      <div class="srp-score"><label>CONFIDENCE</label><span style="color:var(--text-1)">${confPct}%</span></div>
      <div class="srp-score"><label>RISK LEVEL</label><span style="color:${riskScore>2?"var(--red)":riskScore>0?"var(--amber)":"var(--green)"}">${riskScore>2?"HIGH":riskScore>0?"MEDIUM":"LOW"}</span></div>
    </div>
    <p class="srp-reasoning">${reason}</p>
    <div class="srp-tags">${tags.map(t=>`<span class="srp-tag">${t}</span>`).join("")}</div>
    <p class="srp-reasoning" style="font-size:0.72rem;color:var(--text-3);margin-top:8px">This is algorithmic keyword analysis, not financial advice. Always do your own research before trading.</p>
  </div>`;

  loader.classList.remove("visible"); btn.disabled=false;
}

document.getElementById("runSentiment").addEventListener("click", runSentimentAnalysis);

async function loadFundamentals(ticker) {
  const resultEl = document.getElementById("fundResult");
  resultEl.innerHTML=`<div class="loading-state"><div class="spinner"></div><span>Fetching fundamentals for ${ticker}...</span></div>`;
  try {
    const [profile, quote, metrics] = await Promise.all([
      finnhub(`/stock/profile2?symbol=${ticker}`),
      finnhub(`/quote?symbol=${ticker}`),
      finnhub(`/stock/metric?symbol=${ticker}&metric=all`)
    ]);
    const m = metrics.metric || {};
    const pct = ((quote.c-quote.pc)/quote.pc*100).toFixed(2);
    const isUp = quote.c>=quote.pc;

    const metricGroups = [
      {
        title:"VALUATION",
        items:[
          {l:"P/E Ratio",v:m["peAnnual"]!=null?m["peAnnual"].toFixed(2):"—", rating: m["peAnnual"]<15?"good":m["peAnnual"]<30?"":"warn"},
          {l:"P/B Ratio",v:m["pbAnnual"]!=null?m["pbAnnual"].toFixed(2):"—", rating:""},
          {l:"P/S Ratio",v:m["psAnnual"]!=null?m["psAnnual"].toFixed(2):"—", rating:""},
          {l:"EV/EBITDA",v:m["currentEv/freeCashFlowAnnual"]!=null?m["currentEv/freeCashFlowAnnual"].toFixed(1):"—", rating:""},
          {l:"Market Cap",v:profile.marketCapitalization?("$"+fmtNum(profile.marketCapitalization/1000,1)+"B"):"—", rating:""},
          {l:"Enterprise Val",v:m["enterpriseValueAnnual"]!=null?("$"+fmtNum(m["enterpriseValueAnnual"]/1000,1)+"B"):"—", rating:""},
        ]
      },
      {
        title:"PROFITABILITY",
        items:[
          {l:"Gross Margin",v:m["grossMarginAnnual"]!=null?fmtPct(m["grossMarginAnnual"],1):"—", rating:m["grossMarginAnnual"]>40?"good":m["grossMarginAnnual"]>20?"":"warn"},
          {l:"Net Margin",v:m["netProfitMarginAnnual"]!=null?fmtPct(m["netProfitMarginAnnual"],1):"—", rating:m["netProfitMarginAnnual"]>15?"good":m["netProfitMarginAnnual"]>5?"":"warn"},
          {l:"ROE",v:m["roeAnnual"]!=null?fmtPct(m["roeAnnual"],1):"—", rating:m["roeAnnual"]>15?"good":m["roeAnnual"]>8?"":"warn"},
          {l:"ROA",v:m["roaAnnual"]!=null?fmtPct(m["roaAnnual"],1):"—", rating:m["roaAnnual"]>5?"good":""},
          {l:"EPS (TTM)",v:m["epsAnnual"]!=null?("$"+m["epsAnnual"].toFixed(2)):"—", rating:m["epsAnnual"]>0?"good":"bad"},
          {l:"EPS Growth",v:m["epsGrowthTTMYoy"]!=null?fmtPct(m["epsGrowthTTMYoy"],1):"—", rating:m["epsGrowthTTMYoy"]>10?"good":m["epsGrowthTTMYoy"]>0?"":"warn"},
        ]
      },
      {
        title:"FINANCIAL HEALTH",
        items:[
          {l:"Debt/Equity",v:m["totalDebt/totalEquityAnnual"]!=null?m["totalDebt/totalEquityAnnual"].toFixed(2):"—", rating:m["totalDebt/totalEquityAnnual"]<0.5?"good":m["totalDebt/totalEquityAnnual"]<1.5?"":"warn"},
          {l:"Current Ratio",v:m["currentRatioAnnual"]!=null?m["currentRatioAnnual"].toFixed(2):"—", rating:m["currentRatioAnnual"]>2?"good":m["currentRatioAnnual"]>1?"":"bad"},
          {l:"Quick Ratio",v:m["quickRatioAnnual"]!=null?m["quickRatioAnnual"].toFixed(2):"—", rating:m["quickRatioAnnual"]>1?"good":""},
          {l:"Rev Growth YoY",v:m["revenueGrowthTTMYoy"]!=null?fmtPct(m["revenueGrowthTTMYoy"],1):"—", rating:m["revenueGrowthTTMYoy"]>10?"good":m["revenueGrowthTTMYoy"]>0?"":"warn"},
          {l:"Dividend Yield",v:m["dividendYieldIndicatedAnnual"]!=null?fmtPct(m["dividendYieldIndicatedAnnual"],2):"—", rating:""},
          {l:"Beta",v:m["beta"]!=null?m["beta"].toFixed(2):"—", rating:m["beta"]<1.2?"good":m["beta"]<1.8?"":"warn"},
        ]
      },
      {
        title:"PRICE PERFORMANCE",
        items:[
          {l:"52W High",v:m["52WeekHigh"]!=null?("$"+fmtNum(m["52WeekHigh"])):"—", rating:""},
          {l:"52W Low",v:m["52WeekLow"]!=null?("$"+fmtNum(m["52WeekLow"])):"—", rating:""},
          {l:"52W Return",v:m["52WeekPriceReturnDaily"]!=null?fmtPct(m["52WeekPriceReturnDaily"],1):"—", rating:m["52WeekPriceReturnDaily"]>0?"good":"warn"},
          {l:"YTD Return",v:m["ytdPriceReturnDaily"]!=null?fmtPct(m["ytdPriceReturnDaily"],1):"—", rating:m["ytdPriceReturnDaily"]>0?"good":"warn"},
          {l:"3M Return",v:m["3MonthPriceReturnDaily"]!=null?fmtPct(m["3MonthPriceReturnDaily"],1):"—", rating:m["3MonthPriceReturnDaily"]>0?"good":"warn"},
          {l:"Avg Vol 10D",v:m["10DayAverageTradingVolume"]!=null?fmtNum(m["10DayAverageTradingVolume"]/1e6,1)+"M":"—", rating:""},
        ]
      }
    ];

    const groupsHTML = metricGroups.map(g=>`
      <div class="fund-metric-group">
        <div class="fmg-title">${g.title}</div>
        <div class="fmg-grid">
          ${g.items.map(item=>`<div class="fmg-item"><span class="fmg-label">${item.l}</span><span class="fmg-val ${item.rating||""}">${item.v}</span></div>`).join("")}
        </div>
      </div>`).join("");

    const tags = [profile.exchange, profile.finnhubIndustry, profile.country].filter(Boolean);

    resultEl.innerHTML=`<div class="fund-result-grid">
      <div class="fund-profile-card">
        <div class="fpc-header">
          <div>
            <div class="fpc-name">${profile.name||ticker}</div>
            <div class="fpc-ticker">${ticker} · ${profile.exchange||""}</div>
          </div>
          <div>
            <div class="fpc-price">$${fmtNum(quote.c)}</div>
            <div class="fpc-chg ${isUp?"up":"down"}">${(isUp?"+":"")+pct}% today</div>
          </div>
        </div>
        <p class="fpc-desc">${profile.weburl?"<a href='"+profile.weburl+"' target='_blank' rel='noopener' style='color:var(--blue);text-decoration:none'>"+profile.weburl+"</a><br/>":""} ${ticker} is a ${profile.finnhubIndustry||"public"} company listed on ${profile.exchange||"a major exchange"}, headquartered in ${profile.country||"N/A"}. It has ${profile.shareOutstanding?fmtNum(profile.shareOutstanding,0)+"M shares outstanding":""} with a market cap of ${profile.marketCapitalization?"$"+fmtNum(profile.marketCapitalization/1000,1)+"B":"N/A"}.</p>
        <div class="fpc-tags">${tags.map(t=>`<span class="fpc-tag">${t}</span>`).join("")}</div>
      </div>
      <div class="fund-metrics-panel">${groupsHTML}</div>
    </div>`;
  } catch(err) {
    resultEl.innerHTML=`<div class="loading-state"><span>Failed to load data for ${ticker}. Verify the ticker and API key.</span></div>`;
  }
}

document.getElementById("fundSearch").addEventListener("click", () => {
  const t = document.getElementById("fundTicker").value.trim().toUpperCase();
  if(t) loadFundamentals(t);
});
document.getElementById("fundTicker").addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("fundSearch").click(); });
document.querySelectorAll(".fp-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.getElementById("fundTicker").value = chip.dataset.ticker;
    loadFundamentals(chip.dataset.ticker);
  });
});

function initAll() {
  observeAll();
  loadStocks("mega");
  loadMetricsSim();
  loadNews("general");
  loadSentimentFeed();
  loadMarketBar();
}

document.getElementById("apiKeySubmit").addEventListener("click", () => {
  const key = document.getElementById("apiKeyInput").value.trim();
  if(!key || key.length < 10) { alert("Please enter a valid Finnhub API key."); return; }
  API_KEY = key;
  document.getElementById("apiGate").classList.add("hidden");
  initAll();
});
document.getElementById("apiKeyInput").addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("apiKeySubmit").click(); });