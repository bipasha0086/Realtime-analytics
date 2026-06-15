// Minimal JS: live time, simulated weather, metric updates, alerts, navigation
const metricsConfig = [
  { key: 'CPU Usage', unit: '%', accent: 'blue', min: 10, max: 90 },
  { key: 'Error Rate', unit: '%', accent: 'orange', min: 0, max: 10 },
  { key: 'Transactions', unit: ' tx/s', accent: 'cyan', min: 20, max: 200 },
  { key: 'Response Time', unit: ' ms', accent: 'pink', min: 50, max: 600 },
  { key: 'Active Users', unit: '', accent: 'blue', min: 40, max: 1000 },
  { key: 'Sales', unit: '$', accent: 'cyan', min: 100, max: 6000 },
];

const el = (id) => document.getElementById(id);

function updateTime(){
  const now = new Date();
  el('local-date').textContent = now.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  el('local-time').textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000); updateTime();

function updateWeather(){
  const conds = ['Sunny','Cloudy','Rainy','Partly Cloudy','Clear'];
  const cond = conds[Math.floor(Math.random()*conds.length)];
  const temp = Math.floor(Math.random()*18 + 10);
  const hum = Math.floor(Math.random()*50 + 30);
  const wind = Math.floor(Math.random()*20 + 2);
  el('weather-temp').textContent = `${temp}°C`;
  el('weather-cond').textContent = cond;
  el('weather-hum').textContent = `${hum}%`;
  el('weather-wind').textContent = `${wind} km/h`;
}
updateWeather(); setInterval(updateWeather, 300000);

// Theme initialization and toggle for static demo
function applyTheme(t){
  try{ document.documentElement.className = t; }catch(e){}
  const btn = document.getElementById('themeToggle');
  if(btn) btn.textContent = (t === 'dark') ? '🌙' : '☀️';
}
const storedTheme = (function(){ try{ return localStorage.getItem('dashboard_theme'); }catch(e){return null} })();
const initialTheme = storedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(initialTheme);
const themeBtn = document.getElementById('themeToggle');
if(themeBtn){ themeBtn.addEventListener('click', ()=>{ const next = document.documentElement.className === 'dark' ? 'light' : 'dark'; applyTheme(next); try{ localStorage.setItem('dashboard_theme', next); }catch(e){} }); }

// wire nav to smooth-scroll to section and keep active state
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    const sec = document.getElementById(target);
    if(sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// highlight nav button for the section mostly in view using IntersectionObserver
const sections = document.querySelectorAll('.content-section');
if(sections && sections.length){
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const id = entry.target.id;
      const btn = document.querySelector(`.nav-btn[data-target="${id}"]`);
      if(entry.isIntersecting){
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
        if(btn) btn.classList.add('active');
      }
    });
  }, { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0.1 });

  sections.forEach(s=> observer.observe(s));
}

const cardsRoot = el('cards');
const state = {};

function createSparklineSVG(values, w=180, h=36){
  if(values.length<2) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max-min);
  const step = w / (values.length-1);
  const points = values.map((v,i)=>{
    const x = i*step; const y = h - ((v-min)/range)*h; return `${x},${y}`; 
  }).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%"><polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/></svg>`;
}

function createCard(metric){
  const card = document.createElement('div'); card.className = `card ${metric.accent} animate`;
  const label = document.createElement('div'); label.className='label'; label.textContent = metric.key;
  const value = document.createElement('div'); value.className='value'; value.id = `value-${metric.key}`; value.textContent = '--';
  const small = document.createElement('div'); small.className='small-muted'; small.id = `small-${metric.key}`;
  const spark = document.createElement('div'); spark.className='spark'; spark.id = `spark-${metric.key}`;
  card.appendChild(label); card.appendChild(value); card.appendChild(small); card.appendChild(spark);
  return card;
}

function initCards(){
  metricsConfig.forEach(m=>{
    state[m.key] = { history: [], value: 0 };
    cardsRoot.appendChild(createCard(m));
  });
}
initCards();

function updateMetrics(){
  metricsConfig.forEach(cfg=>{
    const st = state[cfg.key];
    const last = st.history.length? st.history[st.history.length-1]: Math.floor((cfg.min+cfg.max)/2);
    const delta = Math.round((Math.random()-0.45)*(cfg.max-cfg.min)/30);
    let next = Math.max(cfg.min, Math.min(cfg.max, last + delta));
    st.history.push(next); if(st.history.length>30) st.history.shift();
    st.value = next;
    const elv = el(`value-${cfg.key}`);
    if(elv){
      elv.textContent = (cfg.unit==='%' || cfg.unit==='ms')? `${next}${cfg.unit}` : `${next} ${cfg.unit}`;
    }
    const els = el(`small-${cfg.key}`);
    if(els) els.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    const esp = el(`spark-${cfg.key}`);
    if(esp) esp.innerHTML = createSparklineSVG(st.history.map(v=>v));
  });
  checkAlerts();
}
setInterval(updateMetrics, 1500); updateMetrics();

function populateAnalyticsGrid(){
  const grid = el('analyticsGrid');
  grid.innerHTML = '';
  metricsConfig.slice(0,4).forEach(cfg=>{
    const box = document.createElement('div'); box.className='analytics-panel';
    box.innerHTML = `<h3>${cfg.key}</h3><p class='muted'>Live small chart</p><div style='height:80px'>${createSparklineSVG((state[cfg.key].history.length?state[cfg.key].history:[0]).map(x=>x),400,80)}</div>`;
    grid.appendChild(box);
  });
}
setInterval(populateAnalyticsGrid, 2000);

let alerts = JSON.parse(localStorage.getItem('alerts_demo_v1') || '[]');
function renderAlerts(){
  const container = el('alertsContainer');
  container.innerHTML = '';
  if(alerts.length===0){ container.textContent = 'No active alerts'; return; }
  alerts.forEach(a=>{
    const it = document.createElement('div'); it.className='alert-item';
    const info = document.createElement('div'); info.innerHTML = `<div><strong>${a.metric}</strong> • ${a.condition} ${a.threshold}</div><div class='meta'>Created: ${new Date(a.created).toLocaleString()}</div>`;
    const btn = document.createElement('button'); btn.className='resolve-btn'; btn.textContent='Resolve'; btn.addEventListener('click',()=>{ resolveAlert(a.id); });
    it.appendChild(info); it.appendChild(btn); container.appendChild(it);
  });
}
function saveAlerts(){ localStorage.setItem('alerts_demo_v1', JSON.stringify(alerts)); }
function createAlert(){
  const metric = el('alert-metric').value.trim(); const threshold = Number(el('alert-threshold').value); const condition = el('alert-condition').value;
  if(!metric || !threshold){ alert('Please enter metric and threshold'); return; }
  const id = 'a_'+Date.now();
  alerts.push({ id, metric, threshold, condition, created: Date.now() }); saveAlerts(); renderAlerts();
  el('alert-metric').value=''; el('alert-threshold').value='';
}
function resolveAlert(id){ alerts = alerts.filter(a=>a.id!==id); saveAlerts(); renderAlerts(); }

document.getElementById('createAlert').addEventListener('click', createAlert);
renderAlerts();

function checkAlerts(){
  alerts.forEach(a=>{
    const metricState = state[a.metric];
    if(!metricState) return;
    const val = metricState.value;
    if((a.condition==='above' && val > a.threshold) || (a.condition==='below' && val < a.threshold)){
      const card = Array.from(document.querySelectorAll('.card')).find(c=> c.querySelector('.label') && c.querySelector('.label').textContent===a.metric);
      if(card){ card.style.boxShadow = '0 12px 46px rgba(232,58,164,0.28)'; setTimeout(()=>{ card.style.boxShadow=''; }, 1800); }
    }
  });
}

el('toggleStats').addEventListener('click', ()=>{
  const btn = el('toggleStats'); const showing = btn.dataset.showing === '1';
  btn.dataset.showing = showing? '0' : '1'; btn.textContent = showing? 'Show Statistics' : 'Hide Statistics';
  document.body.classList.toggle('show-stats', !showing);
});

window.addEventListener('load', ()=>{
  cardsRoot.innerHTML='';
  metricsConfig.forEach(cfg=>{
    cardsRoot.appendChild(createCard(cfg));
    state[cfg.key].history = Array.from({length:12}, ()=> Math.round(Math.random()*(cfg.max-cfg.min)+cfg.min));
  });
  updateMetrics(); populateAnalyticsGrid();
});

document.addEventListener('keydown', (e)=>{
  if(e.key === '1') document.querySelector('[data-target="dashboard"]').click();
  if(e.key === '2') document.querySelector('[data-target="analytics"]').click();
  if(e.key === '3') document.querySelector('[data-target="alerts"]').click();
});

// sidebar toggle (mobile)
const sidebarToggleBtn = el('sidebarToggle');
if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', ()=>{
  document.body.classList.toggle('collapsed');
});
