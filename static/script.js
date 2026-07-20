'use strict';

/* ══════════════════════════════════════════════════════
   BACKEND CONFIG
   ══════════════════════════════════════════════════════ */
// ── DEPLOYMENT: edit this one line ──────────────────────
// Same-origin deployment (frontend served BY the FastAPI backend, or both
// behind one reverse proxy): leave this as null — BACKEND_BASE_URL will
// fall back to the page's own origin automatically.
// Separate-host deployment (e.g. frontend on Netlify/Vercel/GitHub Pages,
// backend on Render/Railway/etc.): set this to your backend's full URL,
// for example 'https://swapify-backend.onrender.com' (no trailing slash).
// See DEPLOYMENT_FRONTEND.md for the full walkthrough.
// ⚠️ TASK 5: replace the localhost URL below with your deployed backend's
// live URL before deploying the frontend (e.g. a Render/Railway URL such as
// 'https://swapify-backend.onrender.com'). Every API call in this file is
// built from BACKEND_BASE_URL below, so this is the ONLY line that needs to
// change to point the whole app at the live backend.
// ✅ Updated — backend is now live on Render (see API_DOCS.md).
const BACKEND_OVERRIDE_URL = 'https://swapify-3.onrender.com';

const BACKEND_BASE_URL = BACKEND_OVERRIDE_URL || window.location.origin;

// The backend returns some URLs (e.g. product images, placeholders) as
// root-relative paths like "/product-images/_placeholder.svg". Those are
// meant to be resolved against the BACKEND's origin, not the page's own
// origin — which matters whenever frontend and backend run on different
// ports/hosts (e.g. Live Server on :5500, FastAPI on :5000). Without this,
// the browser requests them from the frontend's own origin and gets a 404.
function resolveBackendUrl(url){
  if(!url) return url;
  if(/^https?:\/\//i.test(url) || url.indexOf('//')===0 || url.indexOf('data:')===0) return url;
  if(url.charAt(0)==='/') return BACKEND_BASE_URL+url;
  return url;
}

/* ══════════════════════════════════════════════════════
   DYNAMIC DATE
   ══════════════════════════════════════════════════════ */
(function(){
  var now=new Date();
  var months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var monthsFull=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var d=now.getDate(),m=now.getMonth(),y=now.getFullYear();
  var badge=document.getElementById('headerDateBadge');
  if(badge) badge.textContent=d+' '+months[m];
  document.title='Swapify Scanner – '+d+' '+monthsFull[m]+' '+y;
  var footer=document.getElementById('siteFooter');
  if(footer) footer.innerHTML='Swapify &nbsp;·&nbsp; '+d+' '+monthsFull[m]+' '+y+' &nbsp;·&nbsp; Scan. Compare. Eat Smarter.';
})();

/* ══════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════ */
(function(){var t=localStorage.getItem('swapify-theme')||'light';document.documentElement.setAttribute('data-theme',t);updateThemeIcon(t);})();
function toggleTheme(){var c=document.documentElement.getAttribute('data-theme');var n=c==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);localStorage.setItem('swapify-theme',n);updateThemeIcon(n);var sw=document.getElementById('settingsDarkModeSwitch');if(sw) sw.classList.toggle('on',n==='dark');}

// ── Hamburger nav menu (collapses the header's 10 nav links once they no
// longer fit inline, instead of letting them silently overflow/get cut off) ──
//
// This used to be a single fixed @media(max-width:1180px) breakpoint, which
// undercounted the real width the 10 links + logo + badge + login/avatar +
// theme toggle need. On plenty of ordinary laptop screens (1280–1600px CSS
// width — very common once you account for OS display scaling, non-maximized
// windows, etc.) that meant the row was ALREADY wider than the header at
// widths well above 1180px, so it silently overflowed (the last button,
// "Settings", got clipped off the right edge) while the hamburger — which
// only ever appears below 1180px — never showed up to fix it.
//
// Instead of guessing another fixed number, we measure: temporarily force
// the nav back into its normal single-row layout, check whether it's wider
// than the space the header actually has for it, and toggle the
// .nav-collapsed class on <html> accordingly. This is correct at any zoom
// level, any OS scaling, any viewport width, and stays correct if labels
// ever change length (e.g. translations) or more nav items are added later.
var _navFitCheckQueued=false;
function checkHeaderNavFit(){
  if(_navFitCheckQueued) return;
  _navFitCheckQueued=true;
  requestAnimationFrame(function(){
    _navFitCheckQueued=false;
    var header=document.querySelector('header'), menu=document.getElementById('headerNavMenu');
    if(!header||!menu) return;
    var html=document.documentElement;
    var wasOpen=menu.classList.contains('open');
    var wasCollapsed=html.classList.contains('nav-collapsed');
    // Measure with the nav forced into row layout — collapsed mode takes it
    // out of normal flow (position:fixed), which would make this check
    // meaningless, so always re-test from the uncollapsed state.
    html.classList.remove('nav-collapsed');
    var overflowing=header.scrollWidth>header.clientWidth+1;
    if(overflowing){
      html.classList.add('nav-collapsed');
      if(wasOpen) menu.classList.add('open'); // preserve open/closed state across the re-check
    } else if(wasCollapsed&&wasOpen){
      // Was open in collapsed mode and no longer needs to collapse at all —
      // close the slide-out panel instead of leaving it visually orphaned.
      closeMobileNav();
    }
  });
}
window.addEventListener('resize',checkHeaderNavFit);
window.addEventListener('orientationchange',checkHeaderNavFit);
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(checkHeaderNavFit).catch(function(){});
document.addEventListener('DOMContentLoaded',checkHeaderNavFit);
// In case DOMContentLoaded already fired by the time this script (loaded at
// the bottom of the page) runs.
if(document.readyState==='interactive'||document.readyState==='complete') checkHeaderNavFit();

function toggleMobileNav(){
  var menu=document.getElementById('headerNavMenu'), btn=document.getElementById('hamburgerBtn'), bg=document.getElementById('headerNavBackdrop');
  var opening=!menu.classList.contains('open');
  menu.classList.toggle('open',opening);
  btn.classList.toggle('active',opening);
  bg.classList.toggle('visible',opening);
  document.body.style.overflow=opening?'hidden':'';
}
function closeMobileNav(){
  var menu=document.getElementById('headerNavMenu'), btn=document.getElementById('hamburgerBtn'), bg=document.getElementById('headerNavBackdrop');
  menu.classList.remove('open'); btn.classList.remove('active'); bg.classList.remove('visible');
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeMobileNav(); });
function updateThemeIcon(t){var i=document.getElementById('themeIcon');if(i) i.textContent=t==='dark'?'☀️':'🌙';}

/* ══════════════════════════════════════════════════════
   TASK 1: SETTINGS PAGE
   ══════════════════════════════════════════════════════ */
var NOTIF_KEY='swapify-notif-prefs-v1';
function loadNotifPrefs(){ try{return JSON.parse(localStorage.getItem(NOTIF_KEY)||'{"daily":true,"challenges":true}');}catch(e){return{daily:true,challenges:true};} }
function toggleNotifPref(key){
  var p=loadNotifPrefs(); p[key]=!p[key]; localStorage.setItem(NOTIF_KEY,JSON.stringify(p));
  var sw=document.getElementById('settingsNotif_'+key); if(sw) sw.classList.toggle('on',p[key]);
}
function clearScanHistorySettings(){
  if(!confirm('Clear your entire scan history? This cannot be undone.')) return;
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(LIFETIME_SCANS_KEY);
  if(typeof renderProfilePanel==='function') renderProfilePanel();
  if(typeof renderStreakGoalCard==='function') renderStreakGoalCard();
  if(typeof renderHomeDashboard==='function') renderHomeDashboard();
  if(typeof renderQuickStats==='function') renderQuickStats();
  renderSettingsPage();
}
function clearFavoritesSettings(){
  if(!confirm('Remove all saved favorites?')) return;
  saveFavoritesList([]);
  if(typeof renderFavoritesPanel==='function') renderFavoritesPanel();
  renderSettingsPage();
}
function resetPreferencesSettings(){
  if(!confirm('Reset all dietary preferences?')) return;
  resetPrefs();
  renderSettingsPage();
}
function logoutFromSettings(){
  doLogout();
}
function renderSettingsPage(){
  var dst=document.getElementById('settingsPanelFullPage');
  if(!dst) return;
  var theme=document.documentElement.getAttribute('data-theme')||'light';
  var notif=loadNotifPrefs();
  var scans=loadHistory();
  var favs=loadFavorites();

  var accountHTML;
  if(currentUser){
    var initials=(currentUser.name||'U').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    accountHTML='<div class="settings-account-card">'
      +'<div class="settings-avatar">'+initials+'</div>'
      +'<div><div class="settings-account-name">'+(currentUser.name||'Swapify User')+'</div><div class="settings-account-email">'+(currentUser.email||(currentUser.localOnly?'Local account':''))+'</div></div>'
      +'<div class="settings-account-actions"><button onclick="logoutFromSettings()">Sign Out</button></div>'
      +'</div>';
  } else {
    accountHTML='<div class="settings-account-card">'
      +'<div class="settings-avatar">G</div>'
      +'<div><div class="settings-account-name">Guest</div><div class="settings-account-email">Not logged in</div></div>'
      +'<div class="settings-account-actions"><button onclick="openAuthModal()">Login</button></div>'
      +'</div>';
  }

  dst.innerHTML = accountHTML
    + '<div class="settings-block">'
      + '<div class="settings-block-title">Appearance</div>'
      + '<div class="settings-row"><div><div class="settings-row-label">Dark Mode</div><div class="settings-row-sub">Easier on the eyes at night</div></div>'
      + '<div class="settings-switch'+(theme==='dark'?' on':'')+'" id="settingsDarkModeSwitch" onclick="toggleTheme()"></div></div>'
    + '</div>'
    + '<div class="settings-block">'
      + '<div class="settings-block-title">Preferences</div>'
      + '<div class="settings-row"><div><div class="settings-row-label">Dietary Preferences</div><div class="settings-row-sub">'+activePrefsArray().length+' active preference'+(activePrefsArray().length===1?'':'s')+'</div></div>'
      + '<button class="page-back-btn" style="padding:8px 14px;" onclick="showPage(\'preferences\')">Edit →</button></div>'
    + '</div>'
    + '<div class="settings-block">'
      + '<div class="settings-block-title">Notifications</div>'
      + '<div class="settings-row"><div><div class="settings-row-label">Daily Scan Reminder</div><div class="settings-row-sub">A nudge to keep your streak alive</div></div>'
      + '<div class="settings-switch'+(notif.daily?' on':'')+'" id="settingsNotif_daily" onclick="toggleNotifPref(\'daily\')"></div></div>'
      + '<div class="settings-row"><div><div class="settings-row-label">Challenge Alerts</div><div class="settings-row-sub">New challenges and leaderboard shifts</div></div>'
      + '<div class="settings-switch'+(notif.challenges?' on':'')+'" id="settingsNotif_challenges" onclick="toggleNotifPref(\'challenges\')"></div></div>'
    + '</div>'
    + '<div class="settings-block">'
      + '<div class="settings-block-title">Data &amp; Privacy</div>'
      + '<div class="settings-row-sub" style="margin-bottom:12px;">'+scans.length+' scan'+(scans.length===1?'':'s')+' in history · '+favs.length+' favorite'+(favs.length===1?'':'s')+' saved</div>'
      + '<button class="settings-danger-btn" onclick="clearScanHistorySettings()">Clear Scan History</button>'
      + '<button class="settings-danger-btn" onclick="clearFavoritesSettings()">Clear Favorites</button>'
      + '<button class="settings-danger-btn" onclick="resetPreferencesSettings()">Reset Dietary Preferences</button>'
    + '</div>'
    + '<div class="settings-version">Swapify · Scan. Compare. Eat Smarter.<br>Version 1.0.0</div>';
}

/* ══════════════════════════════════════════════════════
   VOICE INPUT
   ══════════════════════════════════════════════════════ */
var VOICE_SUPPORTED=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
var recognition=null, voiceListening=false;
var micBtn=document.getElementById('btnMic');

if(!VOICE_SUPPORTED){
  micBtn.classList.add('mic-disabled');
  micBtn.title='Voice input not supported in this browser';
}

function toggleVoice(){
  if(!VOICE_SUPPORTED){ showVoiceStatus('Voice input is not supported in this browser. Try Chrome.','error'); return; }
  if(voiceListening){ stopVoice(); return; }
  startVoice();
}

function startVoice(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();
  recognition.lang='en-US';
  recognition.interimResults=false;
  recognition.maxAlternatives=3;
  voiceListening=true;
  micBtn.classList.add('listening');
  showVoiceStatus('Listening… say the barcode digits clearly','info');
  recognition.onresult=function(e){
    var results=e.results[0];
    // Try each alternative — pick the one that looks most like digits
    var bestText='', bestDigits='';
    for(var i=0;i<results.length;i++){
      var raw=results[i].transcript.trim();
      // Convert spoken words to digits
      var converted=wordsToDigits(raw);
      var digits=converted.replace(/\D/g,'');
      if(digits.length>bestDigits.length){ bestDigits=digits; bestText=raw; }
    }
    stopVoice();
    if(bestDigits.length>=6){
      document.getElementById('barcodeInput').value=bestDigits;
      showVoiceStatus('Got it: "'+bestText+'" → '+bestDigits,'success');
      setTimeout(function(){hideVoiceStatus();scanProduct();},900);
    } else {
      showVoiceStatus('Couldn\'t catch a barcode. Heard: "'+bestText+'" — try again','error');
      setTimeout(hideVoiceStatus,4000);
    }
  };
  recognition.onerror=function(e){
    stopVoice();
    var msg={
      'not-allowed':'Microphone permission denied. Allow it in browser settings.',
      'no-speech':'No speech detected. Please try again.',
      'network':'Network error. Check your connection.',
      'audio-capture':'Microphone not found on this device.'
    }[e.error]||('Error: '+e.error);
    showVoiceStatus(msg,'error');
    setTimeout(hideVoiceStatus,4000);
  };
  recognition.onend=function(){ if(voiceListening) stopVoice(); };
  try{ recognition.start(); }catch(e){ stopVoice(); showVoiceStatus('Could not start voice input.','error'); setTimeout(hideVoiceStatus,3000); }
}

function stopVoice(){
  voiceListening=false;
  micBtn.classList.remove('listening');
  if(recognition){ try{ recognition.stop(); }catch(e){} recognition=null; }
}

function wordsToDigits(text){
  var map={'zero':'0','one':'1','two':'2','three':'3','four':'4','five':'5','six':'6','seven':'7','eight':'8','nine':'9',
    'oh':'0','o':'0','to':'2','too':'2','for':'4','ate':'8','tree':'3','fiver':'5','niner':'9',
    'won':'1','won\'t':'1'};
  var words=text.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/);
  return words.map(function(w){ return map[w]!==undefined?map[w]:((/^\d+$/.test(w))?w:''); }).join('');
}

function showVoiceStatus(msg, type){
  var el=document.getElementById('voiceStatus');
  var txt=document.getElementById('voiceStatusText');
  txt.textContent=msg;
  el.className='voice-status visible'+(type==='error'?' error':'');
}
function hideVoiceStatus(){ document.getElementById('voiceStatus').className='voice-status'; }

/* ══════════════════════════════════════════════════════
   FAVORITES
   ══════════════════════════════════════════════════════ */
var FAV_KEY='swapify-favs-v1';
var favsPanelOpen=false;

function loadFavorites(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY)||'[]'); }catch(e){ return[]; } }
function saveFavoritesList(list){ localStorage.setItem(FAV_KEY,JSON.stringify(list)); }

function isInFavorites(barcode){ return loadFavorites().some(function(f){ return f.barcode===barcode; }); }

// ── Favorites backend sync ──
// Favorites used to be pure localStorage, which is why they looked
// "per-browser" while things like Challenges (backend-tracked) looked the
// same everywhere. The backend already has full favorites support
// (POST/DELETE/GET /favorites) — it just wasn't being called. Wired up the
// same way preferences are: push on every change, pull-and-merge on login.
var FAVORITES_URL=BACKEND_BASE_URL+'/favorites';
function syncFavoriteAddToBackend(barcode){
  if(!currentUser||!currentUser.token||currentUser.localOnly) return;
  fetch(FAVORITES_URL,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),body:JSON.stringify({barcode:barcode})})
    .then(function(res){ if(!res.ok) handleAuthExpiry(res); }).catch(function(){});
}
function syncFavoriteRemoveToBackend(barcode){
  if(!currentUser||!currentUser.token||currentUser.localOnly) return;
  fetch(FAVORITES_URL+'/'+encodeURIComponent(barcode),{method:'DELETE',headers:getAuthHeaders()})
    .then(function(res){ if(!res.ok) handleAuthExpiry(res); }).catch(function(){});
}
// Pulls the account's favorites down from the backend so a second browser/
// device sees the same saved list, not an empty one. Any favorites that only
// exist locally (e.g. added while offline, or added as a guest before this
// login) are pushed up first so nothing gets silently dropped, then the
// backend's list — now a superset — becomes the local source of truth.
async function fetchFavoritesFromBackend(){
  if(!currentUser||!currentUser.token||currentUser.localOnly) return;
  var local=loadFavorites();
  try{
    var res=await fetch(FAVORITES_URL,{headers:getAuthHeaders()});
    if(!res.ok){ handleAuthExpiry(res); return; }
    var backendList=await res.json();
    if(!Array.isArray(backendList)) return;
    var backendBarcodes={};
    backendList.forEach(function(f){ backendBarcodes[f.barcode]=true; });
    var localOnly=local.filter(function(f){ return !backendBarcodes[f.barcode]; });
    localOnly.forEach(function(f){ syncFavoriteAddToBackend(f.barcode); });
    var merged=backendList.map(function(f){
      return{barcode:f.barcode,name:f.product_name,brand:f.brand,score:f.health_score,grade:f.grade,addedAt:f.added_at?new Date(f.added_at).getTime():Date.now()};
    }).concat(localOnly);
    saveFavoritesList(merged);
    if(favsPanelOpen) renderFavoritesPanel();
    var btn=document.getElementById('favBtn');
    if(btn&&lastScannedProduct) updateFavBtn(isInFavorites(lastScannedProduct.barcode));
  }catch(e){ /* offline/unreachable backend — local favorites remain usable */ }
}

function toggleFavorite(barcode, name, brand, score, grade){
  var favs=loadFavorites();
  var idx=favs.findIndex(function(f){ return f.barcode===barcode; });
  if(idx!==-1){
    favs.splice(idx,1);
    saveFavoritesList(favs);
    updateFavBtn(false);
    syncFavoriteRemoveToBackend(barcode);
  } else {
    favs.unshift({barcode:barcode,name:name,brand:brand,score:score,grade:grade,addedAt:Date.now()});
    if(favs.length>50) favs=favs.slice(0,50);
    saveFavoritesList(favs);
    updateFavBtn(true);
    syncFavoriteAddToBackend(barcode);
  }
  if(favsPanelOpen) renderFavoritesPanel();
}

function updateFavBtn(isFav){
  var btn=document.getElementById('favBtn');
  if(!btn) return;
  btn.className='btn-fav'+(isFav?' fav-active':'');
  btn.innerHTML=(isFav?'★ Saved':'☆ Favorite');
}

function toggleFavoritesPanel(){
  favsPanelOpen=!favsPanelOpen;
  var panel=document.getElementById('favoritesPanel');
  if(favsPanelOpen){ renderFavoritesPanel(); panel.style.display=''; }
  else panel.style.display='none';
}

function renderFavoritesPanel(){
  var favs=loadFavorites();
  var panel=document.getElementById('favoritesPanel');
  var itemsHTML=favs.length===0
    ? '<div class="fav-empty">⭐ No favorites yet — scan a product and tap Favorite to save it here.</div>'
    : favs.map(function(f){
        var gc=f.score>=9?'score-a':f.score>=7?'score-b':f.score>=5?'score-c':f.score>=3?'score-d':'score-f';
        var dateStr=new Date(f.addedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
        return '<div class="fav-item">'
          +'<div class="fav-item-score '+gc+'">'+f.grade+'</div>'
          +'<div class="fav-item-info"><div class="fav-item-name">'+(f.name||'Unknown')+'</div>'
          +'<div class="fav-item-meta">'+(f.brand||'')+(f.brand?' · ':'')+f.score+'/10 · '+dateStr+'</div></div>'
          +'<div class="fav-item-actions">'
          +'<button class="btn-fav-scan" onclick="quickScan(\''+f.barcode+'\')">Scan</button>'
          +'<button class="btn-fav-remove" onclick="removeFavorite(\''+f.barcode+'\')">✕</button>'
          +'</div></div>';
      }).join('');
  panel.innerHTML='<div class="fav-section">'
    +'<div class="fav-header-row">'
    +'<div class="fav-title">⭐ Favorites <span class="fav-count-badge">'+favs.length+'</span></div>'
    +(favs.length?'<button class="btn-clear-favs" onclick="clearAllFavorites()">Clear all</button>':'')
    +'</div>'
    +'<div class="fav-grid">'+itemsHTML+'</div></div>';
}

function removeFavorite(barcode){
  var favs=loadFavorites().filter(function(f){ return f.barcode!==barcode; });
  saveFavoritesList(favs);
  renderFavoritesPanel();
  syncFavoriteRemoveToBackend(barcode);
  // Update fav button if this is the current product
  if(lastScannedProduct&&lastScannedProduct.barcode===barcode) updateFavBtn(false);
}

function clearAllFavorites(){
  if(confirm('Clear all favorites?')){
    var favs=loadFavorites();
    favs.forEach(function(f){ syncFavoriteRemoveToBackend(f.barcode); });
    saveFavoritesList([]); renderFavoritesPanel(); updateFavBtn(false);
  }
}

/* ══════════════════════════════════════════════════════
   WEEKLY HEALTH FLOWCHART
   ══════════════════════════════════════════════════════ */
var weeklyPanelOpen=false;

function toggleWeeklyPanel(){
  weeklyPanelOpen=!weeklyPanelOpen;
  var panel=document.getElementById('weeklyPanel');
  if(weeklyPanelOpen){ renderWeeklyPanel(); panel.style.display=''; }
  else panel.style.display='none';
}

function renderWeeklyPanel(){
  _renderWeeklyPanelCore(calcDashboardStats());
  // If logged in with a real (non-local-only) account, the backend's own
  // /weekly-summary — built from scan_history, which every authenticated
  // scan already writes to — is the account's true cross-device weekly
  // data. Re-render with it once it arrives so this panel matches no
  // matter which browser/device the person is on, instead of only ever
  // reflecting this browser's localStorage.
  if(currentUser&&currentUser.token&&!currentUser.localOnly){
    fetchWeeklySummaryFromBackend();
  }
}
var WEEKLY_SUMMARY_URL=BACKEND_BASE_URL+'/weekly-summary';
async function fetchWeeklySummaryFromBackend(){
  try{
    var res=await fetch(WEEKLY_SUMMARY_URL,{headers:getAuthHeaders()});
    if(!res.ok){ handleAuthExpiry(res); return; }
    var data=await res.json();
    // Translate the backend's {date, average_score} daily_trends into the
    // same {score, timestamp} shape calcDashboardStats().history already
    // uses, so _renderWeeklyPanelCore's chart-building code runs completely
    // unchanged regardless of which source the data came from.
    var synthHistory=(data.daily_trends||[]).map(function(d){
      return{score:d.average_score,timestamp:new Date(d.date+'T12:00:00').getTime()};
    });
    _renderWeeklyPanelCore({total:data.total_scans||0,history:synthHistory});
    var wpSrc=document.getElementById('weeklyPanel'), wpDst=document.getElementById('weeklyPanelPage');
    if(wpSrc&&wpDst) wpDst.innerHTML=wpSrc.innerHTML;
  }catch(e){ /* offline/unreachable backend — the local render already stands */ }
}
function _renderWeeklyPanelCore(stats){
  var panel=document.getElementById('weeklyPanel');

  if(stats.total===0){
    panel.innerHTML='<div class="weekly-section"><div class="weekly-header"><div class="weekly-title">📊 Weekly Health Summary</div></div><div class="weekly-empty">No scans yet. Start scanning products to see your health trends here!</div></div>';
    return;
  }

  // Build last 7 days data
  var today=new Date(); today.setHours(0,0,0,0);
  var days=[];
  for(var i=6;i>=0;i--){
    var d=new Date(today.getTime()-i*86400000);
    days.push({date:d,label:d.toLocaleDateString('en-IN',{weekday:'short'}),scans:[],avg:null});
  }
  stats.history.forEach(function(item){
    var d=new Date(item.timestamp); d.setHours(0,0,0,0);
    var dt=d.getTime();
    var dayObj=days.find(function(x){ return x.date.getTime()===dt; });
    if(dayObj) dayObj.scans.push(item.score);
  });
  days.forEach(function(d){
    if(d.scans.length) d.avg=Math.round(d.scans.reduce(function(a,b){return a+b;},0)/d.scans.length*10)/10;
  });

  // Stats
  var scansThisWeek=days.reduce(function(s,d){return s+d.scans.length;},0);
  var avgScores=days.filter(function(d){return d.avg!==null;}).map(function(d){return d.avg;});
  var weekAvg=avgScores.length?Math.round(avgScores.reduce(function(a,b){return a+b;},0)/avgScores.length*10)/10:null;
  var bestDay=days.reduce(function(best,d){return(d.avg!==null&&(best.avg===null||d.avg>best.avg))?d:best;},{avg:null});

  // Trend: compare first half vs second half
  var firstHalf=days.slice(0,3).filter(function(d){return d.avg!==null;}).map(function(d){return d.avg;});
  var secondHalf=days.slice(4,7).filter(function(d){return d.avg!==null;}).map(function(d){return d.avg;});
  var firstAvg=firstHalf.length?firstHalf.reduce(function(a,b){return a+b;},0)/firstHalf.length:null;
  var secondAvg=secondHalf.length?secondHalf.reduce(function(a,b){return a+b;},0)/secondHalf.length:null;
  var trendHTML='';
  if(firstAvg!==null&&secondAvg!==null){
    var diff=Math.round((secondAvg-firstAvg)*10)/10;
    if(diff>0.3) trendHTML='<div class="weekly-trend"><div class="trend-icon">📈</div><div class="trend-text">Your scores are <strong>improving</strong> this week (+'+diff+' pts vs last 3 days). Keep going!</div></div>';
    else if(diff<-0.3) trendHTML='<div class="weekly-trend"><div class="trend-icon">📉</div><div class="trend-text">Scores have <strong>dipped</strong> lately ('+diff+' pts). Try swapping for higher-rated alternatives.</div></div>';
    else trendHTML='<div class="weekly-trend"><div class="trend-icon">➡️</div><div class="trend-text">Your scores are <strong>consistent</strong> this week. Staying steady!</div></div>';
  }

  // SVG flowchart / bar chart
  var svgW=580, svgH=140, padL=32, padR=16, padB=30, padT=16;
  var chartW=svgW-padL-padR, chartH=svgH-padB-padT;
  var barW=Math.floor(chartW/7)-6;
  var maxScore=10;
  var points=[], barsHTML='', labelsHTML='', scoresHTML='';
  days.forEach(function(day,i){
    var x=padL+i*(chartW/7)+(chartW/7)/2;
    var barH=day.avg!==null?Math.round((day.avg/maxScore)*chartH):0;
    var y=padT+chartH-barH;
    var fillColor=day.avg===null?'none':day.avg>=7?'#C0FF33':day.avg>=5?'#ffd166':'#ff6b6b';
    if(day.avg!==null){
      barsHTML+='<rect x="'+(x-barW/2)+'" y="'+y+'" width="'+barW+'" height="'+barH+'" rx="4" fill="'+fillColor+'" opacity="0.85"/>';
      points.push({x:x,y:y});
      scoresHTML+='<text x="'+x+'" y="'+(y-4)+'" text-anchor="middle" font-size="9" fill="var(--text-muted)" font-family="DM Mono, monospace">'+day.avg+'</text>';
    }
    labelsHTML+='<text x="'+x+'" y="'+(svgH-6)+'" text-anchor="middle" font-size="9" fill="var(--gray)" font-family="DM Mono, monospace">'+day.label+'</text>';
  });
  // Line connecting bar tops
  var lineHTML='';
  if(points.length>=2){
    var pathD='M '+points[0].x+' '+points[0].y;
    for(var p=1;p<points.length;p++){
      // Smooth bezier
      var cx=(points[p-1].x+points[p].x)/2;
      pathD+=' C '+cx+' '+points[p-1].y+' '+cx+' '+points[p].y+' '+points[p].x+' '+points[p].y;
    }
    lineHTML='<path d="'+pathD+'" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 2" opacity="0.6"/>';
    // Dots
    points.forEach(function(pt){
      lineHTML+='<circle cx="'+pt.x+'" cy="'+pt.y+'" r="4" fill="var(--accent)" opacity="0.8"/>';
    });
  }
  var gridHTML='';
  [2,4,6,8,10].forEach(function(v){
    var gy=padT+chartH-(v/maxScore)*chartH;
    gridHTML+='<line x1="'+padL+'" y1="'+gy+'" x2="'+(svgW-padR)+'" y2="'+gy+'" stroke="var(--border)" stroke-width="1" opacity="0.5"/>';
    gridHTML+='<text x="'+(padL-4)+'" y="'+(gy+3)+'" text-anchor="end" font-size="8" fill="var(--gray)" font-family="DM Mono, monospace">'+v+'</text>';
  });

  var statClass=weekAvg===null?'':weekAvg>=7?'stat-good':weekAvg>=5?'stat-warn':'stat-bad';
  panel.innerHTML='<div class="weekly-section">'
    +'<div class="weekly-header"><div class="weekly-title">📊 Weekly Health Summary</div><div class="weekly-period">Last 7 days</div></div>'
    +'<div class="weekly-stats-row">'
    +'<div class="weekly-stat"><div class="weekly-stat-num">'+scansThisWeek+'</div><div class="weekly-stat-lbl">Scans</div></div>'
    +'<div class="weekly-stat '+statClass+'"><div class="weekly-stat-num">'+(weekAvg!==null?weekAvg:'—')+'</div><div class="weekly-stat-lbl">Avg Score</div></div>'
    +'<div class="weekly-stat"><div class="weekly-stat-num">'+(bestDay.avg!==null?bestDay.avg+'<span style="font-size:0.7rem;font-weight:400;color:var(--text-muted)"> / 10</span>':'—')+'</div><div class="weekly-stat-lbl">Best Day</div></div>'
    +'</div>'
    +'<div class="chart-label">HEALTH SCORE BY DAY</div>'
    +'<div class="flowchart-wrap">'
    +'<svg class="flowchart-svg" viewBox="0 0 '+svgW+' '+svgH+'" xmlns="http://www.w3.org/2000/svg">'
    +gridHTML+barsHTML+lineHTML+scoresHTML+labelsHTML
    +'</svg></div>'
    +trendHTML
    +'</div>';
}

/* ══════════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════════ */
var AUTH_KEY='swapify-auth-v1';
var currentUser=null;
function loadAuth(){ try{currentUser=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');}catch(e){currentUser=null;} renderHeaderAuth(); }
function saveAuth(user){ currentUser=user; localStorage.setItem(AUTH_KEY,JSON.stringify(user)); renderHeaderAuth(); }
function clearAuth(){ currentUser=null; localStorage.removeItem(AUTH_KEY); renderHeaderAuth(); }

// Call this right after any authenticated fetch(). Returns true if the
// session had expired (401) and has now been cleaned up — callers should
// stop and treat the action as not completed. This is the fix for bug
// reports like "Invalid token" popping up when joining a challenge, rating,
// or reviewing: those all share one root cause (a stale token still stored
// locally), so it's handled once, here, instead of separately in each place.
var _sessionExpiredNotified = false;
function handleAuthExpiry(res){
  if(!res || res.status !== 401) return false;
  var wasLoggedIn = isReallyLoggedIn();
  clearAuth();
  if(wasLoggedIn && !_sessionExpiredNotified){
    _sessionExpiredNotified = true;
    setTimeout(function(){ _sessionExpiredNotified = false; }, 3000); // avoid stacking alerts from parallel requests
    alert('Your session has expired. Please log in again.');
    openAuthModal();
  }
  return true;
}
function renderHeaderAuth(){
  var area=document.getElementById('headerAuthArea');
  if(currentUser){
    var initials=(currentUser.name||'U').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    area.innerHTML='<div class="user-avatar" onclick="openProfilePanel()" title="Profile">'+initials+'</div>';
  } else {
    area.innerHTML='<button class="btn-login-header" onclick="openAuthModal()">Login</button>';
  }
  if(typeof checkHeaderNavFit==='function') checkHeaderNavFit();
}
function openAuthModal(){ document.getElementById('authOverlay').classList.add('active'); document.body.style.overflow='hidden'; switchAuthTab('login'); clearAuthError(); }
function closeAuthModal(){ document.getElementById('authOverlay').classList.remove('active'); document.body.style.overflow=''; }
function handleAuthOverlayClick(e){ if(e.target===document.getElementById('authOverlay')) closeAuthModal(); }
function switchAuthTab(tab){ document.getElementById('loginForm').style.display=tab==='login'?'':'none'; document.getElementById('registerForm').style.display=tab==='register'?'':'none'; document.getElementById('tabLogin').classList.toggle('active',tab==='login'); document.getElementById('tabRegister').classList.toggle('active',tab==='register'); clearAuthError(); }
function showAuthError(msg){ var e=document.getElementById('authError'); e.textContent=msg; e.classList.add('visible'); }
function clearAuthError(){ var e=document.getElementById('authError'); e.textContent=''; e.classList.remove('visible'); }
function doLogin(){
  clearAuthError();
  var email=document.getElementById('loginEmail').value.trim(), pass=document.getElementById('loginPassword').value;
  if(!email||!pass){showAuthError('Please fill in all fields.');return;}
  if(!/\S+@\S+\.\S+/.test(email)){showAuthError('Enter a valid email.');return;}
  performRealLogin(email,pass);
}
async function performRealLogin(email,pass){
  try{
    var res=await fetch(BACKEND_BASE_URL+'/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,password:pass})
    });
    if(!res.ok){
      var err=await res.json().catch(function(){return{};});
      showAuthError(err.detail||'Invalid email or password.');
      return;
    }
    var data=await res.json(); // {access_token, token_type}
    var profile=await fetchBackendProfile(data.access_token);
    saveAuth({name:(profile&&profile.username)||email.split('@')[0],email:email,token:data.access_token,userId:profile&&profile.id});
    await fetchPreferencesFromBackend();
    await fetchFavoritesFromBackend();
    await fetchShoppingListFromBackend();
    closeAuthModal(); openProfilePanel();
  }catch(networkErr){
    // Backend unreachable — fall back to a local-only pseudo-account so the
    // rest of the demo still works offline. This account will NOT satisfy
    // backend-authenticated calls (e.g. /rate-product) until the real
    // backend is reachable and the user logs in again.
    try{
      var stored=JSON.parse(localStorage.getItem('swapify-users-v1')||'{}');
      if(!stored[email]){showAuthError('Backend unreachable, and no local account found. Start the backend or register first.');return;}
      if(stored[email].password!==btoa(pass)){showAuthError('Incorrect password.');return;}
      saveAuth({name:stored[email].name,email:email,token:null,localOnly:true});
      closeAuthModal(); openProfilePanel();
    }catch(e){ showAuthError('Login failed. Backend unreachable.'); }
  }
}

function doRegister(){
  clearAuthError();
  var name=document.getElementById('regName').value.trim(), email=document.getElementById('regEmail').value.trim(), pass=document.getElementById('regPassword').value;
  if(!name||!email||!pass){showAuthError('Please fill in all fields.');return;}
  if(!/\S+@\S+\.\S+/.test(email)){showAuthError('Enter a valid email.');return;}
  if(pass.length<6){showAuthError('Password must be at least 6 characters.');return;}
  performRealRegister(name,email,pass);
}
async function performRealRegister(name,email,pass){
  try{
    var res=await fetch(BACKEND_BASE_URL+'/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:name,email:email,password:pass})
    });
    if(!res.ok){
      var err=await res.json().catch(function(){return{};});
      showAuthError(err.detail||'Registration failed.');
      return;
    }
    // Registration succeeded — immediately log in to obtain a real JWT.
    await performRealLogin(email,pass);
  }catch(networkErr){
    // Backend unreachable — fall back to a local-only pseudo-account.
    try{
      var stored=JSON.parse(localStorage.getItem('swapify-users-v1')||'{}');
      if(stored[email]){showAuthError('Backend unreachable, and a local account with this email already exists. Try logging in.');return;}
      stored[email]={name:name,password:btoa(pass)};
      localStorage.setItem('swapify-users-v1',JSON.stringify(stored));
      saveAuth({name:name,email:email,token:null,localOnly:true});
      closeAuthModal(); openProfilePanel();
    }catch(e){ showAuthError('Registration failed. Backend unreachable.'); }
  }
}

async function fetchBackendProfile(token){
  try{
    var res=await fetch(BACKEND_BASE_URL+'/profile',{headers:{'Authorization':'Bearer '+token}});
    if(!res.ok) return null;
    return await res.json(); // {id, username, email, created_at}
  }catch(e){ return null; }
}

function doLogout(){ clearAuth(); closeProfilePanel(); showPage('home'); }
function getAuthHeaders(){ if(currentUser&&currentUser.token) return{'Authorization':'Bearer '+currentUser.token}; return{}; }
function isReallyLoggedIn(){ return !!(currentUser&&currentUser.token&&!currentUser.localOnly); }

/* ══════════════════════════════════════════════════════
   SCAN HISTORY
   ══════════════════════════════════════════════════════ */
var HISTORY_KEY='swapify-history-v1';
function loadHistory(){ try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');}catch(e){return[];} }
var LIFETIME_SCANS_KEY='swapify-lifetime-scans-v1';
function loadLifetimeScanCount(){ var v=parseInt(localStorage.getItem(LIFETIME_SCANS_KEY)||'0',10); return isNaN(v)?0:v; }
function bumpLifetimeScanCount(){ var v=loadLifetimeScanCount()+1; localStorage.setItem(LIFETIME_SCANS_KEY,String(v)); return v; }
// The cap below used to be 50, which could silently undercount the Weekly/
// Monthly reports for active users: those panels filter this SAME array by
// date, so once more than 50 scans happened (even within one month), older
// entries from that same period were evicted and vanished from the monthly
// total — while Profile's "All-Time Scans" (bumpLifetimeScanCount, below)
// kept counting correctly, making the numbers look mismatched/buggy. Raised
// to 500 so a realistic month/week of scanning is never evicted; localStorage
// easily holds this many small entries.
function addToHistory(entry){ var h=loadHistory(); h.unshift(entry); if(h.length>500) h=h.slice(0,500); localStorage.setItem(HISTORY_KEY,JSON.stringify(h)); bumpLifetimeScanCount(); }
function calcDashboardStats(){
  var h=loadHistory();
  // "total" is the true lifetime scan count (not capped at 50); avg/streak
  // still use the recent-history window since that's all that's stored in detail.
  var total=loadLifetimeScanCount()||h.length;
  var avg=h.length?Math.round(h.reduce(function(s,i){return s+i.score;},0)/h.length*10)/10:null;
  var streak=0;
  if(total>0){
    var today=new Date(); today.setHours(0,0,0,0);
    var byDay={};
    h.forEach(function(item){ var d=new Date(item.timestamp); d.setHours(0,0,0,0); var k=d.getTime(); if(!byDay[k])byDay[k]=[]; byDay[k].push(item); });
    var cur=today.getTime();
    for(var i=0;i<365;i++){
      var di=byDay[cur]; if(!di){if(i===0){cur-=86400000;continue;} break;}
      streak++; // any scan that day counts — no longer requires score>6
      cur-=86400000;
    }
  }
  return{total:total,avg:avg,streak:streak,history:h};
}

/* ══════════════════════════════════════════════════════
   PROFILE PANEL
   ══════════════════════════════════════════════════════ */
/* Profile is a full page (Task 1) — profileOverlay/profilePanel still exist
   in the DOM purely as the hidden source template that showPage('profile')
   clones from, so keep rendering into it, just navigate to the page instead
   of popping a modal. */
function openProfilePanel(){ renderProfilePanel(); showPage('profile'); }
function closeProfilePanel(){ /* no-op: profile lives on its own page now */ }
function handleProfileOverlayClick(e){ if(e.target===document.getElementById('profileOverlay')) closeProfilePanel(); }
function renderProfilePanel(){
  var user=currentUser;
  var initials=user?(user.name||'U').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase():'G';
  document.getElementById('profileAvatarLg').textContent=initials;
  document.getElementById('profileName').textContent=user?user.name:'Guest User';
  document.getElementById('profileEmailDisplay').textContent=user?user.email:'Not logged in';
  document.getElementById('profileLogoutBtn').style.display=user?'':'none';
  var stats=calcDashboardStats();
  document.getElementById('statTotalScans').textContent=stats.total;
  document.getElementById('statAvgScore').textContent=stats.avg!==null?stats.avg:'—';
  document.getElementById('statStreak').textContent=stats.streak;
  if(stats.streak>0){ document.getElementById('streakText').textContent='🔥 '+stats.streak+'-day streak! Keep it up!'; document.getElementById('streakSub').textContent='Scanned '+stats.streak+' day'+(stats.streak>1?'s':'')+' in a row'; }
  else { document.getElementById('streakText').textContent='Start scanning to build a streak!'; document.getElementById('streakSub').textContent='Scan any product daily to build your streak'; }
  renderBarChart(stats.history.slice(0,7).reverse());
  renderRecentScans(stats.history.slice(0,6));
  // The count above is this browser's local lifetime counter, which only
  // reflects scans made on THIS device — it can under-report for anyone
  // who's also scanned from another browser/device on the same account,
  // which is what made it drift from Weekly/Monthly's backend-synced totals.
  // Reconcile it with the account's true cross-device count once it loads.
  if(typeof isReallyLoggedIn==='function'&&isReallyLoggedIn()) syncProfileTotalScansFromBackend();
}
async function syncProfileTotalScansFromBackend(){
  try{
    var profile=await fetchBackendProfile(currentUser.token);
    if(profile&&typeof profile.total_scans==='number'){
      var el=document.getElementById('statTotalScans');
      if(el) el.textContent=profile.total_scans;
    }
  }catch(e){ /* offline/unreachable backend — the local lifetime count already stands */ }
}
function renderBarChart(items){
  var el=document.getElementById('scoreBarChart');
  if(!items||!items.length){ el.innerHTML='<div class="scan-empty" style="flex:1;height:auto;padding:10px;">No scans yet</div>'; return; }
  el.innerHTML=items.map(function(item){ var pct=Math.round(item.score/10*100); var fc=item.score>=7?'':item.score>=5?'bar-mid':'bar-low'; var ds=new Date(item.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short'}); return '<div class="bar-item"><div class="bar-fill-wrap"><div class="bar-fill '+fc+'" style="height:'+pct+'%;"></div></div><div class="bar-score">'+item.score+'</div><div class="bar-label">'+ds+'</div></div>'; }).join('');
}
function renderRecentScans(items){
  var el=document.getElementById('recentScansList');
  if(!items||!items.length){ el.innerHTML='<div class="scan-empty">No scans yet — scan a product to get started!</div>'; return; }
  el.innerHTML=items.map(function(item){ var gc=item.score>=9?'score-a':item.score>=7?'score-b':item.score>=5?'score-c':item.score>=3?'score-d':'score-f'; var ds=new Date(item.timestamp).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); return '<div class="scan-item"><div class="scan-item-score '+gc+'">'+item.grade+'</div><div class="scan-item-info"><div class="scan-item-name">'+(item.name||'Unknown')+'</div><div class="scan-item-date">'+ds+' · Score: '+item.score+'/10</div></div></div>'; }).join('');
}

/* ══════════════════════════════════════════════════════
   PREFERENCES
   ══════════════════════════════════════════════════════ */
var PREF_KEY='swapify-prefs-v1', userPrefs={};
var PREF_META={
  low_sugar:{label:'Low Sugar',icon:'🍬',check:function(n){return n.sugar!==undefined&&n.sugar<=10;}},
  high_protein:{label:'High Protein',icon:'💪',check:function(n){return n.protein!==undefined&&n.protein>=8;}},
  low_sodium:{label:'Low Sodium',icon:'🧂',check:function(n){return n.sodiumMg!==undefined&&n.sodiumMg<=400;}},
  low_fat:{label:'Low Fat',icon:'🥑',check:function(n){return n.satFat!==undefined&&n.satFat<=4;}},
  high_fiber:{label:'High Fiber',icon:'🌾',check:function(n){return n.fiber!==undefined&&n.fiber>=5;}},
  low_calorie:{label:'Low Calorie',icon:'⚡',check:function(n){return n.calories!==undefined&&n.calories<=200;}},
  vegan:{label:'Vegan',icon:'🌿',check:function(n,ing){return!/(milk|cream|egg|butter|honey|gelatin|whey|casein|lactose)/i.test(ing||'');}},
  vegetarian:{label:'Vegetarian',icon:'🥦',check:function(n,ing){return!/(chicken|beef|pork|lamb|fish|shrimp|prawn|mutton|meat)/i.test(ing||'');}},
  diabetic_friendly:{label:'Diabetic Friendly',icon:'🩺',check:function(n){return n.sugar!==undefined&&n.sugar<=5&&(n.fiber===undefined||n.fiber>=2);}},
  heart_healthy:{label:'Heart Healthy',icon:'❤️',check:function(n){return(n.satFat===undefined||n.satFat<=4)&&(n.sodiumMg===undefined||n.sodiumMg<=400);}}
};
function loadPrefs(){ try{userPrefs=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');}catch(e){userPrefs={};} }
function savePrefs(){
  document.querySelectorAll('#prefOverlay .pref-toggle').forEach(function(el){ userPrefs[el.getAttribute('data-pref')]=el.classList.contains('active'); });
  localStorage.setItem(PREF_KEY,JSON.stringify(userPrefs)); closePrefPanel(); renderPrefStrip();
  syncPreferencesToBackend();
  if(lastScannedProduct) loadAlternatives(lastScannedProduct);
  showToast('Preferences saved!','success');
}
function resetPrefs(){ userPrefs={}; localStorage.removeItem(PREF_KEY); document.querySelectorAll('#prefOverlay .pref-toggle').forEach(function(el){el.classList.remove('active');}); renderPrefStrip(); showToast('Preferences reset.','info'); }
function activePrefsArray(){ return Object.keys(userPrefs).filter(function(k){return userPrefs[k];}); }
function renderPrefStrip(){
  var active=activePrefsArray(), strip=document.getElementById('activePrefStrip'), chips=document.getElementById('activePrefChips');
  if(!active.length){strip.classList.remove('visible');return;}
  chips.innerHTML=active.map(function(p){var m=PREF_META[p];return'<span class="pref-chip-active">'+(m?m.icon+' '+m.label:p)+'</span>';}).join('');
  strip.classList.add('visible');
}
function syncPrefToggles(){ document.querySelectorAll('#prefOverlay .pref-toggle').forEach(function(el){el.classList.toggle('active',!!userPrefs[el.getAttribute('data-pref')]);});}
function togglePref(el){el.classList.toggle('active');}
/* Preferences is now a full page (Task 1) — openPrefPanel/closePrefPanel are kept
   as compatibility shims since older code paths still call them by name. */
function openPrefPanel(){ showPage('preferences'); }
function closePrefPanel(){ /* no-op: preferences lives on its own page now */ }
function handlePrefOverlayClick(e){ /* no-op: no longer a dismissible modal */ }
function checkPrefMatch(normalized,ingredientsText){
  var active=activePrefsArray(); if(!active.length) return{matches:[],misses:[]};
  var matches=[],misses=[];
  active.forEach(function(p){var m=PREF_META[p];if(!m)return;if(m.check(normalized,ingredientsText))matches.push(p);else misses.push(p);});
  return{matches:matches,misses:misses};
}
function prefRelevanceScore(normalized,ingredientsText){
  if(!activePrefsArray().length) return 0;
  return checkPrefMatch(normalized,ingredientsText).matches.length;
}

/* ══════════════════════════════════════════════════════
   ONBOARDING (first-visit preference picker)
   ══════════════════════════════════════════════════════ */
var ONBOARD_KEY='swapify-onboarded-v1';
var PREFS_URL=BACKEND_BASE_URL+'/update-preferences';

function maybeShowOnboarding(){
  if(localStorage.getItem(ONBOARD_KEY)) return;
  document.querySelectorAll('#onboardOverlay .pref-toggle').forEach(function(el){
    el.classList.toggle('active', !!userPrefs[el.getAttribute('data-pref')]);
  });
  document.getElementById('onboardOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}

function completeOnboarding(save){
  if(save){
    document.querySelectorAll('#onboardOverlay .pref-toggle').forEach(function(el){
      userPrefs[el.getAttribute('data-pref')]=el.classList.contains('active');
    });
    localStorage.setItem(PREF_KEY,JSON.stringify(userPrefs));
    renderPrefStrip();
    syncPreferencesToBackend();
  }
  localStorage.setItem(ONBOARD_KEY,'1');
  document.getElementById('onboardOverlay').classList.remove('active');
  document.body.style.overflow='';
}

// Sends the user's saved preferences to the backend (app.py's
// /update-preferences) when they're logged in, so preferences can travel
// with the account rather than staying stuck on one device/browser.
// Silently no-ops for guests or if the backend is unreachable — preferences
// always still work locally either way since localStorage is the source of
// truth for scoring/filtering on this device.
async function syncPreferencesToBackend(){
  if(!currentUser||!currentUser.token) return;
  try{
    var res=await fetch(PREFS_URL,{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify(userPrefs)
    });
    if(!res.ok) handleAuthExpiry(res);
  }catch(e){ /* offline/unreachable backend — local prefs still apply */ }
}

// Pulls the account's saved preferences down from the backend (GET /preferences)
// and applies them locally. Called right after a real (non-local-only) login so
// a user who set preferences on another device gets them here too, instead of
// preferences silently only ever traveling one-way (local -> backend).
var PREFS_GET_URL=BACKEND_BASE_URL+'/preferences';
async function fetchPreferencesFromBackend(){
  if(!currentUser||!currentUser.token||currentUser.localOnly) return;
  try{
    var res=await fetch(PREFS_GET_URL,{headers:getAuthHeaders()});
    if(!res.ok){ handleAuthExpiry(res); return; }
    var data=await res.json();
    if(data&&data.preferences&&typeof data.preferences==='object'){
      // Merge rather than replace: the backend's VALID_PREFERENCES list is
      // currently narrower than the frontend's preference set (it doesn't
      // yet know about low_calorie / vegetarian / diabetic_friendly /
      // heart_healthy), so a full overwrite would silently erase those
      // locally-saved flags every time this runs. Backend-recognized keys
      // still win (that's the whole point of syncing), unrecognized
      // frontend-only keys are left exactly as they were locally.
      userPrefs=Object.assign({},userPrefs,data.preferences);
      localStorage.setItem(PREF_KEY,JSON.stringify(userPrefs));
      renderPrefStrip();
      syncPrefToggles();
    }
  }catch(e){ /* offline/unreachable backend — local prefs remain source of truth */ }
}

/* ══════════════════════════════════════════════════════
   SHARE
   ══════════════════════════════════════════════════════ */
function openShareModal(prod){
  var p=prod.data,r=prod.result;
  var g=(r.grade||'C').toUpperCase();
  var isDark=document.documentElement.getAttribute('data-theme')==='dark';
  var colorSet=HERO_GRADE_COLORS[g]||HERO_GRADE_COLORS.C;
  var strokeColor=isDark?colorSet.dark:colorSet.light;
  var pillBg=isDark?colorSet.bgDark:colorSet.bgLight;

  document.getElementById('sc-name').textContent=p.product_name||'Unknown Product';
  document.getElementById('sc-brand').textContent=p.brand||p.brands||'';
  document.getElementById('sc-grade-num').textContent=r.score;
  document.getElementById('sc-grade-num').style.color=strokeColor;
  document.getElementById('sc-badge').textContent='Grade '+g;
  document.getElementById('sc-badge').style.color=strokeColor;
  document.getElementById('sc-badge').style.background=pillBg;
  document.getElementById('sc-warnings').innerHTML=r.flags.map(function(f){return'<span class="'+(f.c==='tag-green'?'share-card-warn-good':'share-card-warn-tag')+'">'+f.t+'</span>';}).join('');

  // Real product photo when one exists (not the shared "no image" placeholder);
  // otherwise keep the generic package icon already in the markup.
  var thumb=document.getElementById('sc-thumb');
  var imgUrl=p.image_url;
  if(imgUrl && imgUrl.indexOf('_placeholder.svg')===-1){
    thumb.innerHTML='<img src="'+imgUrl+'" alt="">';
  } else {
    thumb.innerHTML='<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>';
  }

  document.getElementById('shareModalOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeShareModal(){ document.getElementById('shareModalOverlay').classList.remove('active'); document.body.style.overflow=''; }
function handleShareOverlayClick(e){ if(e.target===document.getElementById('shareModalOverlay')) closeShareModal(); }
function captureShareCard(){ return html2canvas(document.getElementById('shareCardPreview'),{scale:2,useCORS:true,backgroundColor:null,logging:false}); }
function downloadShareCard(){ captureShareCard().then(function(c){var a=document.createElement('a');a.download='swapify-score.png';a.href=c.toDataURL('image/png');a.click();}).catch(function(){alert('Download failed. Try copying instead.');}); }
function copyShareCard(){ captureShareCard().then(function(c){c.toBlob(function(blob){try{navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){var b=document.querySelector('.share-btn-copy');b.textContent='✓ Copied!';setTimeout(function(){b.textContent='📋 Copy Image';},2000);}).catch(function(){alert('Copy not supported. Please download instead.');});}catch(e){alert('Copy not supported. Please download instead.');}});}).catch(function(){alert('Capture failed.');}); }

/* ══════════════════════════════════════════════════════
   CAMERA
   ══════════════════════════════════════════════════════ */
var html5QrCode=null,cameraActive=false;
var CAMERA_SUPPORTED=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
(function(){if(!CAMERA_SUPPORTED) document.getElementById('btnCamera').classList.add('camera-disabled');})();
function toggleCamera(){if(!CAMERA_SUPPORTED){showCameraError('Browser not supported','Camera requires a modern browser over HTTPS.',{https:true});return;} cameraActive?stopCamera():startCamera();}
function startCamera(){
  hideCameraError(); document.getElementById('cameraSection').classList.add('active'); setCameraButtonState(true); cameraActive=true;
  html5QrCode=new Html5Qrcode('reader');
  html5QrCode.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:120},aspectRatio:1.5,
    formatsToSupport:[Html5QrcodeSupportedFormats.EAN_13,Html5QrcodeSupportedFormats.EAN_8,Html5QrcodeSupportedFormats.UPC_A,Html5QrcodeSupportedFormats.UPC_E,Html5QrcodeSupportedFormats.CODE_128,Html5QrcodeSupportedFormats.CODE_39,Html5QrcodeSupportedFormats.ITF]},
    function(txt){ document.getElementById('barcodeInput').value=txt; var s=document.getElementById('cameraSection'); s.style.borderColor='#C0FF33'; stopCamera(); setTimeout(function(){s.style.borderColor='';scanProduct();},300); },
    function(){}
  ).catch(function(err){
    var n=(err&&err.name)||'',m=((err&&err.message)||'').toLowerCase(),title,msg,tips={};
    if(n==='NotAllowedError'||m.indexOf('permission')!==-1){title='Camera permission denied';msg='Allow camera access in your browser\'s site settings.';tips={permission:true,reload:true};}
    else if(n==='NotFoundError'){title='No camera detected';msg='No camera found. Enter the barcode manually.';}
    else if(n==='NotReadableError'){title='Camera already in use';msg='Camera is busy. Close other apps and try again.';tips={reload:true};}
    else{title='Camera unavailable';msg='Something went wrong: '+(err&&err.message?err.message:'unknown');}
    showCameraError(title,msg,tips);
  });
}
function stopCamera(){
  cameraActive=false; setCameraButtonState(false);
  var cs=document.getElementById('cameraSection');
  if(html5QrCode){ var qr=html5QrCode; html5QrCode=null; qr.stop().catch(function(){}).finally(function(){try{qr.clear();}catch(e){} var r=document.getElementById('reader');if(r)r.innerHTML=''; cs.classList.remove('active');}); }
  else { var r=document.getElementById('reader');if(r)r.innerHTML=''; cs.classList.remove('active'); }
}
function setCameraButtonState(active){
  var btn=document.getElementById('btnCamera');
  btn.innerHTML=active
    ?'<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> <span class="btn-camera-label">Close</span>'
    :'<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> <span class="btn-camera-label">Camera</span>';
}
function showCameraError(title,msg,tips){ stopCamera(); tips=tips||{}; document.getElementById('cameraErrorTitle').textContent=title||'Camera unavailable'; document.getElementById('cameraErrorMsg').textContent=msg||'Please enter the barcode manually.'; document.getElementById('tipPermission').style.display=tips.permission?'':'none'; document.getElementById('tipReload').style.display=tips.reload?'':'none'; document.getElementById('tipHTTPS').style.display=tips.https?'':'none'; document.getElementById('cameraError').classList.add('visible'); var inp=document.getElementById('barcodeInput'); inp.placeholder='Type barcode here ↵'; inp.classList.add('fallback-highlight'); inp.addEventListener('focus',function f(){inp.classList.remove('fallback-highlight');inp.placeholder='Enter barcode, say it, or scan…';inp.removeEventListener('focus',f);}); setTimeout(function(){inp.focus();},120); }
function hideCameraError(){document.getElementById('cameraError').classList.remove('visible');}
function dismissCameraError(){ hideCameraError(); var inp=document.getElementById('barcodeInput'); inp.classList.remove('fallback-highlight'); inp.placeholder='Enter barcode, say it, or scan…'; }

/* ══════════════════════════════════════════════════════
   CSV DATABASE
   ══════════════════════════════════════════════════════ */
// This CSV is a frontend static asset (bundled/served alongside index.html),
// NOT a backend API call — it stays relative so it loads from whatever
// server is hosting the frontend itself, independent of BACKEND_BASE_URL.
var CSV_FILE="swapify_products.csv";
var csvDB={},csvDBLoaded=false,csvCount=0;
var csvStatEl=document.getElementById('csvStatus');
function parseCSVLine(line){ var res=[],cur='',inQ=false; for(var i=0;i<line.length;i++){var c=line[i];if(c==='"'){inQ=!inQ;}else if(c===','&&!inQ){res.push(cur.trim());cur='';}else if(c!=='\r'){cur+=c;}} res.push(cur.trim()); return res; }
function csvVal(v){ if(!v||v===''||v.toUpperCase()==='NULL'||v==='--') return null; var n=parseFloat(v.replace(/\s*(g|mg|kcal|cal)\s*$/i,'').trim()); return isNaN(n)?null:n; }
function csvStr(v){ return(!v||v==='')?'Unknown':v.trim(); }
(async function loadCSV(){
  csvStatEl.className='db-status db-warn'; csvStatEl.textContent='⏳ Loading product database…';
  try{
    var res=await fetch(CSV_FILE); if(!res.ok) throw new Error('HTTP '+res.status);
    var text=await res.text();
    if(text.substring(0,5)==='%PDF-'){csvStatEl.className='db-status db-error';csvStatEl.innerHTML='✗ File is a PDF, not CSV!';return;}
    text=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
    var lines=text.split('\n'), header=parseCSVLine(lines[0]), hj=header.join(' ').toLowerCase();
    var missing=['barcode','sugar','sodium','protein'].filter(function(k){return hj.indexOf(k)===-1;});
    if(missing.length>0){csvStatEl.className='db-status db-error';csvStatEl.innerHTML='✗ Missing columns: '+missing.join(', ');return;}
    function fc(kws){for(var i=0;i<header.length;i++){var h=header[i].toLowerCase();if(kws.every(function(k){return h.indexOf(k)!==-1;}))return i;}return-1;}
    var COL={barcode:fc(['barcode'])!==-1?fc(['barcode']):1,name:fc(['product','name'])!==-1?fc(['product','name']):2,brand:fc(['brand'])!==-1?fc(['brand']):3,serving:fc(['serving'])!==-1?fc(['serving']):4,sugar:fc(['sugar'])!==-1?fc(['sugar']):5,satfat:fc(['saturated'])!==-1?fc(['saturated']):6,sodium:fc(['sodium'])!==-1?fc(['sodium']):7,protein:fc(['protein'])!==-1?fc(['protein']):8,fiber:fc(['fiber'])!==-1?fc(['fiber']):9,cal:fc(['calori'])!==-1?fc(['calori']):10};
    var skipped=0;
    for(var i=1;i<lines.length;i++){
      var line=lines[i].trim(); if(!line) continue;
      var cols=parseCSVLine(line); if(cols.length<6){skipped++;continue;}
      var barcode=String(cols[COL.barcode]||'').trim(); if(!barcode||barcode.length<3){skipped++;continue;}
      csvDB[barcode]={barcode:barcode,product_name:csvStr(cols[COL.name]),brand:csvStr(cols[COL.brand]),serving_size_g:csvVal(cols[COL.serving]),sugar_g_per_serving:csvVal(cols[COL.sugar]),saturated_fat_g_per_serving:csvVal(cols[COL.satfat]),sodium_mg_per_serving:csvVal(cols[COL.sodium]),protein_g_per_serving:csvVal(cols[COL.protein]),fiber_g_per_serving:csvVal(cols[COL.fiber]),calories_kcal_per_serving:csvVal(cols[COL.cal])};
      csvCount++;
    }
    if(csvCount===0){csvStatEl.className='db-status db-error';csvStatEl.innerHTML='✗ 0 products loaded.';return;}
    csvDBLoaded=true;
    if(csvCount<50){csvStatEl.className='db-status db-warn';csvStatEl.innerHTML='⚠ Only <strong>'+csvCount+' products</strong> loaded'+(skipped>0?' ('+skipped+' rows skipped)':'');}
    else{csvStatEl.className='db-status db-loaded';csvStatEl.textContent='✓ Product DB: '+csvCount+' products loaded';}
  }catch(e){csvStatEl.className='db-status db-error';csvStatEl.innerHTML='✗ CSV not found. Place <code>'+CSV_FILE+'</code> in same folder.';}
})();

// All of these hit the FastAPI backend, so they're built from BACKEND_BASE_URL.
// Previously these were relative ('/product/', '/chat', etc.), which only
// worked when FastAPI itself served this HTML file. Now that frontend and
// backend run as separate services (per standard dev workflow), every one of
// these must be an absolute URL pointing at the backend's actual origin.
var BACKEND_URL=BACKEND_BASE_URL+'/product/', SIMILAR_URL=BACKEND_BASE_URL+'/similar/', OFF_API_URL='https://world.openfoodfacts.org/api/v0/product/', CHAT_URL=BACKEND_BASE_URL+'/chat', HEALTH_URL=BACKEND_BASE_URL+'/health';
var backendAvailable=false, backendStatEl=document.getElementById('backendStatus');
(async function checkBackend(){
  try{
    var res=await fetch(HEALTH_URL);
    if(res.ok){
      backendAvailable=true;
      backendStatEl.className='db-status db-loaded';
      backendStatEl.textContent='✓ Backend connected: '+BACKEND_URL;
    } else {
      backendAvailable=false;
      backendStatEl.className='db-status db-warn';
      backendStatEl.textContent='⚠ Backend HTTP '+res.status+' — using CSV + Open Food Facts.';
    }
  }catch(e){
    backendAvailable=false;
    backendStatEl.className='db-status db-warn';
    backendStatEl.innerHTML='ℹ Backend offline — using CSV + Open Food Facts.';
  }
})();

/* ══════════════════════════════════════════════════════
   OFF IMAGE HANDLING
   ══════════════════════════════════════════════════════ */
function getOFFImageCandidates(product){

    var candidates = [];
    var bc = (product.code || product._id || "").toString();

    if (product.image_front_url)
        candidates.push(product.image_front_url);

    if (product.image_front_small_url)
        candidates.push(product.image_front_small_url);

    if (product.image_url)
        candidates.push(product.image_url);

    if (product.image_small_url)
        candidates.push(product.image_small_url);

    if (bc && bc.length >= 8) {

        var dir =
            bc.length <= 8
                ? bc
                : bc.substring(0,3) + "/" +
                  bc.substring(3,6) + "/" +
                  bc.substring(6,9) + "/" +
                  bc.substring(9);

        var base = "https://images.openfoodfacts.org/images/products/" + dir;

        candidates.push(base + "/front_en.400.jpg");
        candidates.push(base + "/front.400.jpg");
        candidates.push(base + "/1.400.jpg");
    }

    var seen = {};

    return candidates.filter(function(url){
        if (!url || seen[url]) return false;
        seen[url] = true;
        return true;
    });
}
function tryImageUrls(urls,index){
  if(!urls||index>=urls.length) return Promise.resolve(null);
  return new Promise(function(resolve){
    var img=new Image(); img.crossOrigin='anonymous';
    var timer=setTimeout(function(){img.src='';resolve(tryImageUrls(urls,index+1));},5000);
    img.onload=function(){clearTimeout(timer);(img.naturalWidth<10||img.naturalHeight<10)?resolve(tryImageUrls(urls,index+1)):resolve(urls[index]);};
    img.onerror=function(){clearTimeout(timer);resolve(tryImageUrls(urls,index+1));};
    img.src=urls[index];
  });
}
function renderOFFImageAsync(containerId,urls,altText){
  var container=document.getElementById(containerId); if(!container) return;
  container.innerHTML='<div class="img-loading-wrap"></div>';
  tryImageUrls(urls,0).then(function(workingUrl){
    var c=document.getElementById(containerId); if(!c) return;
    c.innerHTML=workingUrl?'<img class="product-image" src="'+workingUrl+'" alt="'+(altText||'Product')+'" crossorigin="anonymous" onerror="this.parentNode.innerHTML=getPlaceholderHTML()">':getPlaceholderHTML();
  });
}

/* ══════════════════════════════════════════════════════
   NUTRIENT NORMALIZERS
   ══════════════════════════════════════════════════════ */
function normBackend(p){ function g(k){var v=p[k];if(v===undefined||v===null||v==='NULL'||v==='')return undefined;var n=Number(v);return isNaN(n)?undefined:n;} var smg=g('sodium_mg_per_serving'); return{sugar:g('sugar_g_per_serving'),satFat:g('saturated_fat_g_per_serving'),sodium:smg!==undefined?smg/1000:undefined,protein:g('protein_g_per_serving'),fiber:g('fiber_g_per_serving'),calories:g('calories_kcal_per_serving'),sodiumMg:smg}; }
function titleCaseIngredient(s){
  var ACRONYMS=['TBHQ','MSG','BHA','BHT','EDTA','PGPR','CMC'];
  var t=String(s||'').replace(/\b\w/g,function(c){return c.toUpperCase();});
  ACRONYMS.forEach(function(a){ t=t.replace(new RegExp('\\b'+a+'\\b','i'),a); });
  return t;
}
function normOFF(n){ function g(k){var v=n[k];if(v===undefined||v===null||v==='')return undefined;return Number(v);} var rs=g('sodium_100g'),sg=rs; if(rs!==undefined){var u=(n['sodium_unit']||'g').toLowerCase();if(u==='mg')sg=rs/1000;else if(u==='µg'||u==='ug')sg=rs/1000000;} return{sugar:g('sugars_100g'),satFat:g('saturated-fat_100g'),sodium:sg,protein:g('proteins_100g'),fiber:g('fiber_100g'),calories:g('energy-kcal_100g'),sodiumMg:sg!==undefined?sg*1000:undefined}; }

/* ══════════════════════════════════════════════════════
   INGREDIENT DATABASE
   (derived from the Swapify "Scoring Logic" research doc —
   Two-Sided Ingredient Risk & Benefit Scoring Framework)
   ══════════════════════════════════════════════════════ */
var NEG_CAPS={'Oils & Fats':2.5,'Sugars & Sweeteners':2.5,'Preservatives':2.0,'Artificial Colors':2.0,'Flavor Enhancers':1.5,'Emulsifiers & Stabilizers':1.5,'Refined Carbohydrates':1.0,'Caffeine & Stimulants':2.0,'Other Additives':1.5,'Sodium':2.0};
var POS_CAPS={'Protein Quality':2.0,'Fiber':1.5,'Healthy Fats & Oils':1.0,'Natural Sweeteners':1.0,'Natural Preservation':1.0,'Micronutrients':1.0,'Probiotics & Gut Health':0.75,'Whole-Food / Minimal Processing':1.0};

var NEGATIVE_INGREDIENTS=[
  // 3.1 Oils & Fats
  {re:/partially hydrogenated|vanaspati/i,label:'Partially Hydrogenated Oil / Vanaspati',cat:'Oils & Fats',val:1.2},
  {re:/interesterified fat/i,label:'Interesterified Fat',cat:'Oils & Fats',val:0.7},
  {re:/palm oil|palmolein/i,label:'Palm Oil / Palmolein',cat:'Oils & Fats',val:0.6},
  {re:/cottonseed oil/i,label:'Cottonseed Oil',cat:'Oils & Fats',val:0.3},
  {re:/fractionated (fat|oil)/i,label:'Fractionated Fat',cat:'Oils & Fats',val:0.7},
  // 3.2 Sugars & Sweeteners
  {re:/\bsugar\b/i,label:'Sugar',cat:'Sugars & Sweeteners',val:0.8},
  {re:/high fructose corn syrup|hfcs/i,label:'High Fructose Corn Syrup',cat:'Sugars & Sweeteners',val:1.0},
  {re:/(?<!high fructose )corn syrup/i,label:'Corn Syrup',cat:'Sugars & Sweeteners',val:0.6},
  {re:/invert sugar/i,label:'Invert Sugar Syrup',cat:'Sugars & Sweeteners',val:0.6},
  {re:/aspartame/i,label:'Aspartame',cat:'Sugars & Sweeteners',val:0.6},
  {re:/acesulfame/i,label:'Acesulfame-K',cat:'Sugars & Sweeteners',val:0.4},
  {re:/sucralose/i,label:'Sucralose',cat:'Sugars & Sweeteners',val:0.3},
  {re:/saccharin/i,label:'Saccharin',cat:'Sugars & Sweeteners',val:0.4},
  {re:/neotame/i,label:'Neotame',cat:'Sugars & Sweeteners',val:0.4},
  {re:/maltodextrin/i,label:'Maltodextrin',cat:'Sugars & Sweeteners',val:0.4},
  // 3.2b Sodium (ingredient-level — separate from the nutrition-panel sodium
  // deduction below, but shares the same 'Sodium' category cap so the two
  // don't double-stack beyond the –2.0 cap)
  {re:/\bsalt\b/i,label:'Salt',cat:'Sodium',val:1.0},
  // 3.3 Preservatives
  {re:/sodium nitrite|sodium nitrate|potassium nitrate/i,label:'Sodium Nitrite / Nitrate',cat:'Preservatives',val:1.2},
  {re:/\bbha\b|butylated hydroxyanisole/i,label:'BHA (E320)',cat:'Preservatives',val:1.0},
  {re:/\btbhq\b/i,label:'TBHQ',cat:'Preservatives',val:0.8},
  {re:/sulphur dioxide|sulphite|sulfite/i,label:'Sulphur Dioxide / Sulphites',cat:'Preservatives',val:0.6},
  {re:/sodium benzoate/i,label:'Sodium Benzoate (E211)',cat:'Preservatives',val:0.6},
  {re:/\bbht\b|butylated hydroxytoluene/i,label:'BHT (E321)',cat:'Preservatives',val:0.5},
  {re:/potassium sorbate/i,label:'Potassium Sorbate',cat:'Preservatives',val:0.2},
  // 3.4 Artificial Colors
  {re:/tartrazine|yellow\s*5|\be102\b/i,label:'Tartrazine (Yellow 5 / E102)',cat:'Artificial Colors',val:0.7},
  {re:/sunset yellow|\be110\b/i,label:'Sunset Yellow (E110)',cat:'Artificial Colors',val:0.7},
  {re:/carmoisine|\be122\b/i,label:'Carmoisine (E122)',cat:'Artificial Colors',val:0.6},
  {re:/allura red|\be129\b/i,label:'Allura Red (E129)',cat:'Artificial Colors',val:0.6},
  {re:/erythrosine|\be127\b/i,label:'Erythrosine (E127)',cat:'Artificial Colors',val:0.5},
  {re:/caramel colou?r/i,label:'Caramel Color',cat:'Artificial Colors',val:0.5},
  // 3.5 Flavor Enhancers
  {re:/monosodium glutamate|\bmsg\b|\be621\b/i,label:'MSG (E621)',cat:'Flavor Enhancers',val:0.5},
  {re:/yeast extract/i,label:'Yeast Extract (Disguised MSG)',cat:'Flavor Enhancers',val:0.5},
  {re:/disodium inosinate|disodium guanylate|\be631\b|\be627\b/i,label:'Disodium Inosinate / Guanylate',cat:'Flavor Enhancers',val:0.3},
  {re:/artificial flavou?r(ing)?/i,label:'Artificial Flavoring',cat:'Flavor Enhancers',val:0.3},
  // 3.6 Emulsifiers & Stabilizers
  {re:/soy lecithin|soya lecithin|\blecithin\b/i,label:'Soy Lecithin',cat:'Emulsifiers & Stabilizers',val:0.2},
  {re:/polysorbate\s*80/i,label:'Polysorbate 80',cat:'Emulsifiers & Stabilizers',val:0.5},
  {re:/carboxymethyl cellulose|\bcmc\b/i,label:'Carboxymethyl Cellulose (CMC)',cat:'Emulsifiers & Stabilizers',val:0.5},
  {re:/sodium stearoyl lactylate/i,label:'Sodium Stearoyl Lactylate',cat:'Emulsifiers & Stabilizers',val:0.2},
  // 3.8 Refined Carbohydrates
  {re:/\bmaida\b|refined wheat flour/i,label:'Maida (Refined Wheat Flour)',cat:'Refined Carbohydrates',val:0.5},
  {re:/modified starch/i,label:'Modified Starch',cat:'Refined Carbohydrates',val:0.3},
  // 3.9 Caffeine & Stimulants
  {re:/taurine/i,label:'Caffeine + Taurine Combo',cat:'Caffeine & Stimulants',val:0.6},
  // 3.10 Other Additives of Concern
  {re:/\bvanillin\b/i,label:'Vanillin',cat:'Other Additives',val:0.2},
  {re:/potassium bromate/i,label:'Potassium Bromate',cat:'Other Additives',val:1.2},
  {re:/titanium dioxide|\be171\b/i,label:'Titanium Dioxide (E171)',cat:'Other Additives',val:0.7},
  {re:/propylene glycol/i,label:'Propylene Glycol',cat:'Other Additives',val:0.3}
];

var POSITIVE_INGREDIENTS=[
  // 4.1 Protein Quality
  {re:/whey protein/i,label:'Whey Protein',cat:'Protein Quality',val:0.8},
  {re:/pea protein|soy protein isolate/i,label:'Pea / Soy Protein Isolate',cat:'Protein Quality',val:0.7},
  {re:/paneer|\bcurd\b|milk solids|skimmed milk|skim milk/i,label:'Milk Solids / Paneer / Curd',cat:'Protein Quality',val:0.5},
  {re:/lentil|chickpea|\bbesan\b/i,label:'Lentil / Chickpea / Besan',cat:'Protein Quality',val:0.5},
  {re:/almond|\bchia\b/i,label:'Nuts & Seeds',cat:'Protein Quality',val:0.4},
  {re:/\begg\b|egg powder/i,label:'Egg / Egg Powder',cat:'Protein Quality',val:0.4},
  // 4.2 Fiber
  {re:/whole wheat|whole grain|\bjowar\b|\bbajra\b|\bragi\b/i,label:'Whole Wheat / Whole Grain',cat:'Fiber',val:0.7},
  {re:/\boats\b|oat bran|wheat bran/i,label:'Oats / Oat Bran / Wheat Bran',cat:'Fiber',val:0.6},
  {re:/psyllium|isabgol/i,label:'Psyllium Husk (Isabgol)',cat:'Fiber',val:0.4},
  {re:/inulin|chicory root/i,label:'Inulin / Chicory Root Fiber',cat:'Fiber',val:0.4},
  // 4.3 Healthy Fats & Oils
  {re:/peanut/i,label:'Peanuts',cat:'Healthy Fats & Oils',val:0.4},
  {re:/hazelnut/i,label:'Hazelnuts',cat:'Healthy Fats & Oils',val:0.4},
  {re:/cold[\s-]?pressed|virgin (mustard|groundnut|coconut|olive)/i,label:'Cold-Pressed / Virgin Oil',cat:'Healthy Fats & Oils',val:0.5},
  {re:/olive oil|rice bran oil/i,label:'Olive Oil / Rice Bran Oil',cat:'Healthy Fats & Oils',val:0.4},
  {re:/omega-?3|flax(seed)?|walnut/i,label:'Omega-3 Source',cat:'Healthy Fats & Oils',val:0.4},
  // 4.4 Natural Sweeteners & Low-Sugar Design
  {re:/jaggery|date paste|\bhoney\b/i,label:'Jaggery / Date Paste / Honey',cat:'Natural Sweeteners',val:0.4},
  {re:/\bstevia\b/i,label:'Stevia',cat:'Natural Sweeteners',val:0.4},
  {re:/monk fruit/i,label:'Monk Fruit Extract',cat:'Natural Sweeteners',val:0.3},
  // 4.5 Natural Preservation & Clean-Label
  {re:/tocopherol|vitamin e/i,label:'Vitamin E / Tocopherols',cat:'Natural Preservation',val:0.3},
  {re:/rosemary extract/i,label:'Rosemary Extract',cat:'Natural Preservation',val:0.3},
  // 4.6 Micronutrients & Fortification
  {re:/folic acid|iron fortif/i,label:'Iron + Folic Acid Fortification',cat:'Micronutrients',val:0.4},
  {re:/vitamin d/i,label:'Vitamin D Fortification',cat:'Micronutrients',val:0.4},
  {re:/vitamin b12/i,label:'Vitamin B12 Fortification',cat:'Micronutrients',val:0.3},
  {re:/\bcalcium\b/i,label:'Calcium Fortification',cat:'Micronutrients',val:0.2},
  {re:/\bzinc\b/i,label:'Zinc Fortification',cat:'Micronutrients',val:0.2},
  // 4.7 Probiotics & Gut Health
  {re:/lactobacillus|bifidobacterium/i,label:'Named Probiotic Strains',cat:'Probiotics & Gut Health',val:0.5},
  {re:/live (active )?culture/i,label:'Live Active Cultures',cat:'Probiotics & Gut Health',val:0.4}
];

function ingPositionMultiplier(idx){ if(idx<0) return 1.0; if(idx<3) return 1.5; if(idx<8) return 1.0; return 0.5; }
function applyCategoryCaps(matches,caps){
  var byCat={};
  matches.forEach(function(m){ (byCat[m.cat]=byCat[m.cat]||[]).push(m); });
  Object.keys(byCat).forEach(function(cat){
    var arr=byCat[cat], cap=caps[cat];
    if(cap===undefined) return;
    var total=arr.reduce(function(s,m){return s+m.amount;},0);
    if(total>cap&&total>0){
      var scale=cap/total;
      arr.forEach(function(m){ m.amount=Math.round(m.amount*scale*100)/100; });
    }
  });
  return matches;
}
function scanIngredients(ingredientsText){
  var negatives=[],positives=[];
  if(ingredientsText){
    var segments=ingredientsText.split(',').map(function(s){return s.trim();}).filter(Boolean);
    function findIdx(re){ for(var i=0;i<segments.length;i++){ if(re.test(segments[i])) return i; } return -1; }
    NEGATIVE_INGREDIENTS.forEach(function(rule){
      if(rule.re.test(ingredientsText)){
        var idx=findIdx(rule.re), mult=ingPositionMultiplier(idx);
        negatives.push({label:rule.label,cat:rule.cat,amount:Math.round(rule.val*mult*100)/100});
      }
    });
    POSITIVE_INGREDIENTS.forEach(function(rule){
      if(rule.re.test(ingredientsText)){
        var idx=findIdx(rule.re), mult=ingPositionMultiplier(idx);
        positives.push({label:rule.label,cat:rule.cat,amount:Math.round(rule.val*mult*100)/100});
      }
    });
  }
  return{negatives:negatives,positives:positives};
}

var VAGUE_DISCLOSURE_TERMS=[/\bemulsifiers?\b/i,/\bémulsifiants?\b/i,/\bflavou?rings?\b/i,/\bpermitted\b/i,/\braising agents?\b/i,/\bacidity regulators?\b/i,/\bstabili[sz]ers?\b/i,/\bspices\b/i];
function computeTransparency(ingredientsText,hasSpecificMatches){
  if(!ingredientsText) return{mult:1.0,label:'No ingredient list available — neutral'};
  var vague=VAGUE_DISCLOSURE_TERMS.some(function(re){return re.test(ingredientsText);});
  if(vague) return{mult:0.95,label:'Vague/undisclosed additive terms found in ingredient list'};
  if(hasSpecificMatches) return{mult:1.05,label:'Ingredients clearly named & disclosed (specific compounds identified)'};
  return{mult:1.0,label:'No special disclosure either way — neutral'};
}

/* ══════════════════════════════════════════════════════
   SCORE
   ══════════════════════════════════════════════════════ */
function calculateScore(nt,ing){
  var s=nt.sugar,sf=nt.satFat,pr=nt.protein,fi=nt.fiber,cal=nt.calories;
  var smgV=nt.sodiumMg!==undefined?nt.sodiumMg:(nt.sodium!==undefined?nt.sodium*1000:undefined);
  var flags=[],miss=[],kp=[s,sf,nt.sodium,cal].filter(function(v){return v!==undefined;}).length;
  var cl,cc;
  if(kp>=4){cl='High';cc='confidence-high';}else if(kp>=2){cl='Medium';cc='confidence-medium';}else{cl='Low';cc='confidence-low';}
  var allM=(s===undefined&&sf===undefined&&nt.sodium===undefined);

  var base=5.0;

  var negItems=[],posItems=[];

  if(s!==undefined){
    if(s>15){flags.push({t:'High Sugar ('+s+'g)',c:'tag-red'});negItems.push({label:'Sugar ('+s+'g)',cat:'Sugars & Sweeteners',amount:2});}
    else if(s>=5){flags.push({t:'Moderate Sugar ('+s+'g)',c:'tag-yellow'});negItems.push({label:'Sugar ('+s+'g)',cat:'Sugars & Sweeteners',amount:1});}
  } else miss.push('sugar');

  if(sf!==undefined){
    if(sf>6){flags.push({t:'High Saturated Fat ('+sf+'g)',c:'tag-red'});negItems.push({label:'Saturated Fat ('+sf+'g)',cat:'Oils & Fats',amount:2});}
    else if(sf>3){flags.push({t:'Moderate Saturated Fat ('+sf+'g)',c:'tag-yellow'});negItems.push({label:'Saturated Fat ('+sf+'g)',cat:'Oils & Fats',amount:1});}
  } else miss.push('saturated fat');

  if(smgV!==undefined){
    if(smgV>800){flags.push({t:'Very High Salt ('+Math.round(smgV)+'mg)',c:'tag-red'});negItems.push({label:'Sodium ('+Math.round(smgV)+'mg)',cat:'Sodium',amount:3});}
    else if(smgV>400){flags.push({t:'High Salt ('+Math.round(smgV)+'mg)',c:'tag-red'});negItems.push({label:'Sodium ('+Math.round(smgV)+'mg)',cat:'Sodium',amount:2});}
  } else miss.push('sodium');

  if(pr!==undefined){
    if(pr>8){flags.push({t:'Good Protein ('+pr+'g)',c:'tag-green'});posItems.push({label:'Protein ('+pr+'g)',cat:'Protein Quality',amount:1});}
  } else miss.push('protein');

  if(fi!==undefined){
    if(fi>5){flags.push({t:'Good Fiber ('+fi+'g)',c:'tag-green'});posItems.push({label:'Fiber ('+fi+'g)',cat:'Fiber',amount:1});}
  } else miss.push('fiber');

  if(cal!==undefined&&cal>300) flags.push({t:'High Cal ('+cal+'kcal)',c:'tag-orange'});
  if(cal===undefined) miss.push('calories');

  var ingredientFlags=[];
  var ingScan=scanIngredients(ing);
  ingScan.negatives.forEach(function(m){ negItems.push(m); ingredientFlags.push({label:m.label,cat:m.cat}); });
  ingScan.positives.forEach(function(m){ posItems.push(m); });

  applyCategoryCaps(negItems,NEG_CAPS);
  applyCategoryCaps(posItems,POS_CAPS);

  var breakdown=[{label:'Base Score',amount:base,kind:'base'}];
  var totalNeg=0,totalPos=0;
  negItems.forEach(function(m){ totalNeg+=m.amount; breakdown.push({label:m.label,cat:m.cat,amount:-m.amount,kind:'penalty'}); });
  posItems.forEach(function(m){ totalPos+=m.amount; breakdown.push({label:m.label,cat:m.cat,amount:m.amount,kind:'bonus'}); });

  var subtotal=base-totalNeg+totalPos;

  var transparency=computeTransparency(ing,(ingScan.negatives.length+ingScan.positives.length)>0);
  breakdown.push({label:'Transparency Multiplier',amount:transparency.mult,kind:'multiplier',note:transparency.label});
  var scoreRaw=subtotal*transparency.mult;

  var score=Math.max(0,Math.min(10,scoreRaw));
  score=Math.round(score*10)/10;
  if(score===Math.round(score)) score=Math.round(score);

  var gr,gc;
  if(score>=9){gr='A';gc='score-a';}else if(score>=7){gr='B';gc='score-b';}else if(score>=5){gr='C';gc='score-c';}else if(score>=3){gr='D';gc='score-d';}else{gr='F';gc='score-f';}

  return{score:score,grade:gr,gradeClass:gc,flags:flags,missingData:miss,confidence:cl,confidenceClass:cc,insufficientData:allM,breakdown:breakdown,ingredientFlags:ingredientFlags,transparency:transparency};
}

/* ══════════════════════════════════════════════════════
   IMAGE HELPERS
   ══════════════════════════════════════════════════════ */
var PH_SVG='<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
function getPlaceholderHTML(){return'<div class="placeholder-img">'+PH_SVG+'<span>No image</span></div>';}
function onImgError(el){var d=document.createElement('div');d.className='placeholder-img';d.innerHTML=PH_SVG+'<span>No image</span>';el.parentNode.replaceChild(d,el);}

/* ══════════════════════════════════════════════════════
   CATEGORIES
   ══════════════════════════════════════════════════════ */
var CATEGORIES=[
  {id:'beverage',keywords:['cola','coke','sprite','fanta','dew','thums','limca','juice','drink','lassi','chaas','latte','cafe','nescafe','red bull','monster','frooti','maaza','tang','rasna','glucon','rooh afza','minute maid','diet coke']},
  {id:'chocolate',keywords:['chocolate','cadbury','snickers','kitkat','five star','milkybar','fuse','chocobar','chocopie','dairy milk','sparkle','fruit and nut']},
  {id:'protein_bar',keywords:['protein bar','whole truth','yoga bar','max protein','muscleblaze','datebite']},
  {id:'biscuit',keywords:['biscuit','cookie','bourbon','marie','hide and seek','parle g','oreo','good day','jim jam','dark fantasy','unibic']},
  {id:'chips',keywords:['chips','bhujiya','namkeen','takatak','makhana',"lay's",'aaloo']},
  {id:'cereal',keywords:['oats','cereal','muesli','museli','corn flakes','chocos','cerelac','ragabites','horlicks','pediasure','slurrp','overnight']},
  {id:'ice_cream',keywords:['ice cream','ice bar','cornett']},
  {id:'instant',keywords:['maggi','noodle','upma','schezwan','masala oats']},
  {id:'spread',keywords:['nutella','peanut butter','choco spread','chocolate spread','hazelnut spread','nut butter','jam','marmalade']},
  {id:'supplement',keywords:['eno','glucon','chyawanprash','antioxidant']}
];
var RELATED_GROUPS={chocolate:['biscuit','protein_bar','spread'],biscuit:['chocolate','protein_bar'],protein_bar:['cereal','chips'],chips:['makhana','protein_bar'],beverage:[],cereal:['protein_bar','instant'],instant:['cereal','chips'],ice_cream:['beverage','chocolate'],spread:['chocolate','biscuit'],supplement:['cereal','beverage'],other:[]};
function detectCategory(name){
  var l=(name||'').toLowerCase();
  for(var i=0;i<CATEGORIES.length;i++){
    if(CATEGORIES[i].keywords.some(function(k){
      var esc=k.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp('\\b'+esc+'\\b','i').test(l);
    })) return CATEGORIES[i].id;
  }
  return'other';
}

/* ══════════════════════════════════════════════════════
   FETCH PRODUCT
   ══════════════════════════════════════════════════════ */
var resultEl=document.getElementById('result'),altEl=document.getElementById('alternativesResult'),compareEl=document.getElementById('compareResult'),inputEl=document.getElementById('barcodeInput');
var lastScannedProduct=null;

async function fetchProduct(barcode){
  var hdrs=getAuthHeaders();
  if (backendAvailable) {
    try {
        const br = await fetch(BACKEND_URL + encodeURIComponent(barcode), {
            headers: getAuthHeaders()
        });

        if (br.status === 200) {
            const bd = await br.json();

            if (bd && bd.product_name) {
                const n = normBackend(bd);
                const bdIngredients = bd.ingredients_text || bd.ingredients || bd.ingredient_list || '';

                let result =
                    (bd.score !== undefined && bd.grade)
                        ? {
                            score: bd.score,
                            grade: bd.grade,
                            gradeClass:
                                bd.score >= 9 ? 'score-a' :
                                bd.score >= 7 ? 'score-b' :
                                bd.score >= 5 ? 'score-c' :
                                bd.score >= 3 ? 'score-d' : 'score-f',
                            flags: [],
                            missingData: [],
                            confidence: 'High',
                            confidenceClass: 'confidence-high',
                            insufficientData: false
                        }
                        : calculateScore(n, bdIngredients);

                if (bd.score !== undefined) {
                    const lr = calculateScore(n, bdIngredients);
                    result.flags = lr.flags;
                    result.missingData = lr.missingData;
                    result.breakdown = lr.breakdown;
                    result.ingredientFlags = (Array.isArray(bd.ingredient_flags) && bd.ingredient_flags.length)
                        ? bd.ingredient_flags.map(function(f){
                            if (typeof f === 'string') return { label: titleCaseIngredient(f), cat: 'Flagged' };
                            return {
                                label: titleCaseIngredient(f.name || f.label || f.ingredient || ''),
                                cat: f.risk || f.cat || f.risk_level || f.severity || 'Flagged'
                            };
                          }).filter(function(f){ return f.label; })
                        : lr.ingredientFlags;
                    result.transparency = lr.transparency;
                }

                return {
                    data: bd,
                    barcode,
                    source: "BACKEND API",
                    badgeClass: "source-backend",
                    type: "csv",
                    normalized: n,
                    result,
                    imageUrl: null,
                    ingredients: bdIngredients
                };
            }
        }

        if (br.status === 404) {
            console.log("Not found in backend, checking CSV...");
        }

    } catch (e) {
        console.warn("Backend unavailable:", e.message);
    }
  }

if (csvDBLoaded && csvDB[barcode]) {
    var cp = csvDB[barcode];
    var n2 = normBackend(cp);

    return {
        data: cp,
        barcode: barcode,
        source: "SWAPIFY DB",
        badgeClass: "source-csv",
        type: "csv",
        normalized: n2,
        result: calculateScore(n2, ""),
        imageUrl: null,
        ingredients: ""
    };
}

try {

    var or2 = await fetch(OFF_API_URL + encodeURIComponent(barcode) + ".json");

    var od = await or2.json();

    if (od.status !== 1 || !od.product) {
        throw new Error("Not found");
    }

    var p = od.product;

    var n3 = normOFF(p.nutriments || {});
    var ing = p.ingredients_text || "";

    return {
        data: p,
        barcode: barcode,
        source: "OPEN FOOD FACTS",
        badgeClass: "source-off",
        type: "off",
        normalized: n3,
        result: calculateScore(n3, ing),
        imageUrl: null,
        ingredients: ing
    };

}
catch(e){
    throw e;
    }
}

/* ══════════════════════════════════════════════════════
   ALTERNATIVES
   ══════════════════════════════════════════════════════ */
async function findAlternatives(scannedProduct){
  var barcode=scannedProduct.barcode,curScore=scannedProduct.result.score;
  try{ var res=await fetch(SIMILAR_URL+encodeURIComponent(barcode),{headers:getAuthHeaders()}); if(res.ok){var data=await res.json();if(Array.isArray(data)&&data.length>0){return data.map(function(item){return{barcode:item.barcode,product_name:item.product_name,brand:item.brand,health_score:item.health_score||item.score,grade:item.grade,image_url:item.image_url||null,delta:(item.health_score||item.score)-curScore,prefScore:0};});}} }catch(e){}
  if(!csvDBLoaded) return[];
  var cat=detectCategory(scannedProduct.data.product_name||'');
  var candidates=searchCategory(cat,barcode,curScore);
  if(candidates.length<3){var related=RELATED_GROUPS[cat]||[];for(var r=0;r<related.length&&candidates.length<3;r++){var more=searchCategory(related[r],barcode,curScore);more.forEach(function(m){if(candidates.length<3&&!candidates.some(function(c){return c.barcode===m.barcode;}))candidates.push(m);});}}
  candidates.sort(function(a,b){if(b.prefScore!==a.prefScore)return b.prefScore-a.prefScore;return b.health_score-a.health_score;});
  return candidates.slice(0,3);
}
function searchCategory(cat,excludeBarcode,minScore){
  var results=[],keys=Object.keys(csvDB);
  for(var i=0;i<keys.length;i++){
    var bc=keys[i];if(bc===excludeBarcode)continue;
    var prod=csvDB[bc];if(detectCategory(prod.product_name)!==cat)continue;
    var norm=normBackend(prod),result=calculateScore(norm,''),ps=prefRelevanceScore(norm,'');
    if(result.score>minScore||ps>0){results.push({barcode:bc,product_name:prod.product_name,brand:prod.brand,health_score:result.score,grade:result.grade,gradeClass:result.gradeClass,image_url:null,delta:result.score-minScore,prefScore:ps,normalized:norm});}
  }
  return results;
}

/* ══════════════════════════════════════════════════════
   SCAN PRODUCT
   ══════════════════════════════════════════════════════ */
inputEl.addEventListener('keydown',function(e){if(e.key==='Enter')scanProduct();});
function quickScan(c, isSample){ inputEl.value=c; scanProduct(isSample); }

async function scanProduct(isSample) {

    resultEl.innerHTML = "";
    resultEl.className = "";
    altEl.innerHTML = "";
    altEl.className = "";
    compareEl.innerHTML = "";
    compareEl.className = "";
    lastScannedProduct = null;

    var barcode = inputEl.value.trim();

    if (!barcode) {
        showError("Please enter a barcode.");
        return;
    }

    if (!/^\d+$/.test(barcode)) {
        showError("Barcodes should contain digits only.");
        return;
    }

    // Task 3 — log this scan attempt with device info for Dhruv's experiments.
    // Fire-and-forget: not awaited, wrapped so a logging failure can never
    // interrupt or break the actual product scan below.
    logScanEvent(barcode, { event: 'scan_attempt' });

    resultEl.className = "visible";
    resultEl.innerHTML = '<div class="loading-spinner">Scanning…</div>';

    try {

        var prod = await fetchProduct(barcode);

        if (!prod) {
            throw new Error("No product returned");
        }

        lastScannedProduct = prod;

        logScanEvent(barcode, { event: 'scan_result', outcome: 'found', source: prod.type || 'swapify', score: prod.result ? prod.result.score : null });

        addToHistory({
            barcode: prod.barcode,
            name: (prod.data && (prod.data.product_name || prod.data.name)) || 'Unknown Product',
            score: prod.result.score,
            grade: prod.result.grade,
            timestamp: new Date().toISOString()
        });

if (prod.type === "off") {
    renderOFF(prod);
} else {
    renderSwapify(prod);
}

await loadAlternatives(prod);

    } catch (e) {

        console.error("Scan Error:", e);

        // Task 5 — handle API errors gracefully: a genuine "not found" (checked
        // every source and came up empty) gets the friendly fallback screen;
        // an actual network/backend failure (can't reach the API at all) gets
        // a distinct message so the user isn't told a real product is missing
        // when the real problem is connectivity.
        if (isNetworkError(e)) {
            logScanEvent(barcode, { event: 'scan_result', outcome: 'network_error' });
            showNetworkError(barcode);
        } else {
            logScanEvent(barcode, { event: 'scan_result', outcome: 'not_found' });
            showProductNotFound(barcode);
        }

    }
}

/* ══════════════════════════════════════════════════════
   TASK 3 — DEVICE INFO CAPTURE & LOGGING FOR EXPERIMENTS
   Captures basic, non-identifying device/browser info from the browser
   and sends it with every scan attempt to Dhruv's real, now-live logging
   endpoint (POST /experiment/log-scan — see API_DOCS.md §30). Never allowed
   to affect the actual scan flow — every failure is caught and swallowed
   silently (console.debug only).
   ══════════════════════════════════════════════════════ */

// ✅ Dhruv's real endpoint (API_DOCS.md §30 "Real-World Experiment Logging API").
var SCAN_LOG_ENDPOINT = BACKEND_BASE_URL + '/experiment/log-scan';

// A stable per-device ID, so repeat visits from the same browser count as one
// device in Dhruv's unique_devices analytic instead of a new fingerprint each
// time. Persisted in localStorage (a real deployed site, not a Claude
// artifact, so localStorage is fine here). Falls back gracefully if storage
// is unavailable (private browsing, etc.) — logging just omits device_id and
// the backend derives its own fingerprint from device_info + User-Agent.
function getOrCreateDeviceId() {
    try {
        var key = 'swapify_device_id';
        var existing = window.localStorage.getItem(key);
        if (existing) return existing;
        var fresh = 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        window.localStorage.setItem(key, fresh);
        return fresh;
    } catch (e) {
        return null;
    }
}

function getDeviceInfo() {
    try {
        var ua = navigator.userAgent || '';

        // Device type — matches the backend's DEVICE_TYPES bucket set
        // (mobile / tablet / desktop / scanner / unknown).
        var deviceType = 'desktop';
        if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
            deviceType = 'tablet';
        } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
            deviceType = 'mobile';
        }

        // Operating system
        var os = 'Unknown';
        if (/Windows NT/i.test(ua)) os = 'Windows';
        else if (/Mac OS X/i.test(ua)) os = 'macOS';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        // Browser name + version (order matters: Edge/Opera/Chrome all include "Chrome" in UA)
        var browser = 'Unknown', version = '', m;
        if ((m = ua.match(/Edg\/([\d.]+)/))) { browser = 'Edge'; version = m[1]; }
        else if ((m = ua.match(/OPR\/([\d.]+)/))) { browser = 'Opera'; version = m[1]; }
        else if (/Chrome\//.test(ua) && !/Edg\/|OPR\//.test(ua) && (m = ua.match(/Chrome\/([\d.]+)/))) { browser = 'Chrome'; version = m[1]; }
        else if ((m = ua.match(/Firefox\/([\d.]+)/))) { browser = 'Firefox'; version = m[1]; }
        else if (/Safari\//.test(ua) && !/Chrome\//.test(ua) && (m = ua.match(/Version\/([\d.]+)/))) { browser = 'Safari'; version = m[1]; }

        return {
            device_type: deviceType,
            os: os,
            browser: browser,
            browser_version: version,
            screen_width: (window.screen && window.screen.width) || null,
            screen_height: (window.screen && window.screen.height) || null,
            viewport_width: window.innerWidth || null,
            viewport_height: window.innerHeight || null,
            pixel_ratio: window.devicePixelRatio || 1,
            language: navigator.language || null,
            platform: navigator.platform || null
        };
    } catch (e) {
        // Even device-info capture itself must never throw and break a scan.
        return { device_type: 'unknown' };
    }
}

function logScanEvent(barcode, extra) {
    try {
        var info = getDeviceInfo();
        extra = extra || {};

        // Shaped to match the live ExperimentScanLog schema exactly
        // (API_DOCS.md §30A): barcode, device_type, device_info, timestamp,
        // device_id, notes. Anything we want to track that isn't part of that
        // schema (event/outcome/score) is folded into a short `notes` string
        // rather than invented extra fields the backend doesn't expect.
        var noteParts = [];
        if (extra.event) noteParts.push('event=' + extra.event);
        if (extra.outcome) noteParts.push('outcome=' + extra.outcome);
        if (extra.source) noteParts.push('source=' + extra.source);
        if (extra.score !== undefined && extra.score !== null) noteParts.push('score=' + extra.score);

        var payload = {
            barcode: barcode,
            device_type: info.device_type,
            device_info: info,
            timestamp: new Date().toISOString(),
            device_id: getOrCreateDeviceId(),
            notes: noteParts.length ? noteParts.join(', ') : null
        };

        // Not awaited on purpose — this must never delay or block a scan.
        fetch(SCAN_LOG_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function (err) {
            // Task 3C — graceful, silent failure. The product scan already
            // succeeded/failed independently of this call.
            console.debug('Scan logging unavailable (non-fatal):', err && err.message);
        });
    } catch (err) {
        console.debug('Scan logging skipped (non-fatal):', err && err.message);
    }
}

// Distinguishes "the backend/network is unreachable" from "we looked
// everywhere and the product genuinely isn't in any source". fetch() throws
// a generic TypeError ("Failed to fetch"/"NetworkError...") when it can't
// reach a host at all (offline, DNS failure, CORS block, backend down).
function isNetworkError(e) {
    if (!e) return false;
    if (e instanceof TypeError) return true;
    var m = (e.message || '').toLowerCase();
    return m.indexOf('failed to fetch') !== -1 ||
           m.indexOf('networkerror') !== -1 ||
           m.indexOf('load failed') !== -1;
}

/* ══════════════════════════════════════════════════════
   NETWORK ERROR — distinct from "product not found" (Task 5)
   ══════════════════════════════════════════════════════ */
function showNetworkError(barcode) {
    resultEl.className = 'visible';
    resultEl.innerHTML =
        '<div class="net-error-box">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>' +
        '<div><div style="font-weight:700;margin-bottom:2px;">Can\u2019t reach Swapify\u2019s servers</div>' +
        '<div>Check your connection and try again. If this keeps happening, the backend service may be temporarily down.</div>' +
        '<button class="net-error-retry" onclick="quickScan(\'' + barcode + '\')">Retry scan</button>' +
        '</div></div>';
    altEl.className = '';
    altEl.innerHTML = '';
}
async function loadAlternatives(prod){
  altEl.className='visible';altEl.innerHTML='<div class="alt-section"><div class="loading-spinner">Finding healthier alternatives…</div></div>';
  var alts=await findAlternatives(prod);renderAlternatives(alts,prod);
}
function showError(msg){ resultEl.className='visible'; resultEl.innerHTML='<div class="error-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>'+msg+'</span></div>'; }

/* ══════════════════════════════════════════════════════
   PRODUCT NOT FOUND — fallback screen (Task 6)
   Shown when a barcode isn't in the Backend, the Swapify CSV, or
   Open Food Facts. Offers three recovery paths: scan again, search
   by name (reuses the existing name-autocomplete box), or upload a
   photo of the label for OCR scoring.
   ══════════════════════════════════════════════════════ */
function showProductNotFound(barcode) {
    resultEl.className = 'visible';
    altEl.className = '';
    altEl.innerHTML = '';
    compareEl.className = '';
    compareEl.innerHTML = '';

    resultEl.innerHTML =
        '<div class="pnf-card">' +
            '<div class="pnf-icon-wrap">' +
                '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' +
                    '<rect x="3" y="7" width="18" height="4" rx="1"/><path d="M5 11v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/><path d="M8 15l8 4M16 15l-8 4"/>' +
                '</svg>' +
            '</div>' +
            '<div class="pnf-title">We couldn\u2019t find that one</div>' +
            '<div class="pnf-sub">This barcode isn\u2019t in our database yet. Rescan, or help us add it.</div>' +
            (barcode ? '<div class="pnf-barcode">Barcode: ' + barcode + '</div>' : '<div style="height:14px;"></div>') +
            '<div class="pnf-actions">' +
                '<button class="pnf-btn primary" onclick="pnfScanAgain()">' +
                    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 5v5h5"/></svg>' +
                    'Try scanning again' +
                '</button>' +
                '<button class="pnf-btn secondary" onclick="pnfUploadLabelPhoto()">' +
                    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l4.5-6 3.5 4.5 2.5-3L20 16"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>' +
                    'Upload photo of label (OCR)' +
                '</button>' +
            '</div>' +
            '<div class="pnf-link-row">' +
                '<button class="pnf-link" onclick="pnfSearchByName()">Search by name</button>' +
                '<button class="pnf-link" onclick="pnfReportMissing(\'' + (barcode || '') + '\')">Report missing product</button>' +
            '</div>' +
            '<div class="pnf-ocr-status" id="pnfOcrStatus"></div>' +
            '<div class="pnf-smart-section" id="pnfSmartSection" style="display:none;">' +
                '<div class="pnf-smart-label">' +
                    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>' +
                    'While you\u2019re here \u2014 similar products we do have' +
                '</div>' +
                '<div id="pnfSmartList"></div>' +
            '</div>' +
        '</div>';

    _loadPnfTrending();
}

async function _loadPnfTrending() {
    try {
        var res = await fetch(RECS_URL + '?limit=5');
        if (!res.ok) return;
        var data = await res.json();
        var items = (data.recommendations || []).slice(0, 2);
        if (!items.length) return;
        var section = document.getElementById('pnfSmartSection');
        var list = document.getElementById('pnfSmartList');
        if (!section || !list) return;
        list.innerHTML = items.map(function (p) {
            var initial = (p.product_name || '?').trim().charAt(0).toUpperCase();
            var gc = p.grade === 'A' ? '#2ECC71' : p.grade === 'B' ? '#8BC34A' : p.grade === 'C' ? '#FFC107' : '#F4432E';
            return '<div class="pnf-similar-card" onclick="quickScan(\'' + p.barcode + '\')">' +
                '<div class="pnf-similar-thumb">' + initial + '</div>' +
                '<div class="pnf-similar-info"><div class="pnf-similar-name">' + (p.product_name || 'Unknown') + '</div><div class="pnf-similar-brand">' + (p.brand || '') + '</div></div>' +
                '<div class="pnf-similar-score" style="color:' + gc + ';background:' + gc + '1a;">' + Math.round((p.health_score || 0) * 10) + '</div>' +
            '</div>';
        }).join('');
        section.style.display = '';
    } catch (e) {
        // Trending products are a nice-to-have here — never surface this failure.
    }
}

function pnfReportMissing(barcode) {
    if (!isReallyLoggedIn()) {
        alert('Please log in to report a missing product \u2014 this helps us credit contributors.');
        openAuthModal();
        return;
    }
    var name = (prompt('What\u2019s this product called? (optional)') || '').trim();
    (async function () {
        try {
            var res = await fetch(BACKEND_BASE_URL + '/report-missing', {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders()),
                body: JSON.stringify({ barcode: barcode, product_name: name || null })
            });
            if (!res.ok) {
                if (handleAuthExpiry(res)) return;
                alert('Could not submit the report \u2014 please try again.');
                return;
            }
            showToast('Thanks! We\u2019ve logged this product for review.','success');
        } catch (e) {
            alert('Backend unreachable \u2014 could not submit the report.');
        }
    })();
}

function pnfScanAgain() {
    // The PNF card renders on page-product, but the barcode input and camera
    // live on page-scanner — navigate there first or the buttons look "dead".
    showPage('scanner');
    inputEl.value = '';
    inputEl.placeholder = 'Enter barcode, say it, or scan…';
    setTimeout(function () { inputEl.focus(); }, 50);
}

function pnfSearchByName() {
    showPage('scanner');
    inputEl.value = '';
    inputEl.placeholder = 'Type a product or brand name…';
    setTimeout(function () {
        inputEl.focus();
        var box = document.getElementById('searchSuggestList');
        if (box) { box.innerHTML = '<div class="search-suggest-status">Start typing a product name…</div>'; box.classList.add('visible'); }
    }, 50);
}

function pnfUploadLabelPhoto() {
    // File input lives outside any page wrapper, but the OCR status message
    // renders back into the PNF card on page-product — no navigation needed,
    // just open the file picker.
    var input = document.getElementById('ocrLabelFileInput');
    if (input) input.click();
}

function handleOcrLabelFileSelected(files) {
    if (!files || !files.length) return;
    var file = files[0];
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
        setPnfOcrStatus('Please choose a JPEG or PNG image.', true);
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        setPnfOcrStatus('Image is too large \u2014 please use one under 2\u2009MB.', true);
        return;
    }
    uploadLabelForOCR(file);
    // reset so selecting the same file again still fires 'change'
    document.getElementById('ocrLabelFileInput').value = '';
}

function setPnfOcrStatus(msg, isError, spinning) {
    var el = document.getElementById('pnfOcrStatus');
    if (!el) return;
    el.className = 'pnf-ocr-status visible' + (isError ? ' error' : '');
    el.innerHTML = (spinning ? '<div class="pnf-ocr-spinner"></div>' : '') + '<span>' + msg + '</span>';
}

async function uploadLabelForOCR(file) {
    setPnfOcrStatus('Reading the label\u2026', false, true);
    try {
        var formData = new FormData();
        formData.append('file', file);

        var res = await fetch(BACKEND_BASE_URL + '/ocr/scan-label', {
            method: 'POST',
            body: formData
        });

        if (res.status === 503) {
            setPnfOcrStatus('Label scanning isn\u2019t available on this server right now. Try search by name instead.', true);
            return;
        }
        if (!res.ok) {
            var errBody = await res.json().catch(function(){ return {}; });
            setPnfOcrStatus(errBody.detail || 'Couldn\u2019t read that label. Try a clearer, well-lit photo.', true);
            return;
        }

        var data = await res.json();
        setPnfOcrStatus('Label scanned successfully.', false);
        renderOcrResult(data, file);

    } catch (e) {
        console.error('OCR upload error:', e);
        if (isNetworkError(e)) {
            setPnfOcrStatus('Can\u2019t reach the server to scan this label. Check your connection and try again.', true);
        } else {
            setPnfOcrStatus('Something went wrong reading that label. Please try again.', true);
        }
    }
}

function renderOcrResult(data, file) {
    var score = (typeof data.score === 'number') ? data.score : 5;
    var grade = data.grade || '?';
    var gradeClass = score >= 9 ? 'score-a' : score >= 7 ? 'score-b' : score >= 5 ? 'score-c' : score >= 3 ? 'score-d' : 'score-f';
    var ingredientFlagHTML = (typeof buildIngredientFlagsHTML === 'function')
        ? buildIngredientFlagsHTML((data.ingredient_flags || []).map(function(f){
            return { label: titleCaseIngredient(f.name || f.ingredient || f), cat: f.risk || f.severity || 'Flagged' };
          }))
        : '';
    var previewHTML = '';
    try {
        var objUrl = URL.createObjectURL(file);
        previewHTML = '<img src="' + objUrl + '" alt="Scanned label" style="width:140px;max-height:140px;object-fit:cover;display:block;margin:0 auto 16px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">';
    } catch (e) {}

    var hero = buildHeroScoreHTML(score, grade, gradeClass);
    resultEl.className = 'visible';
    resultEl.innerHTML =
        hero.html +
        '<div class="barcode-row"><span class="barcode-num">OCR SCAN</span><span class="barcode-status">Scanned from label photo</span></div>' +
        previewHTML +
        '<div class="product-header"><div><div class="product-name">Scanned Label <span class="source-badge" style="background:#efe6ff;color:#6e46ff;">OCR</span></div>' +
        '<div class="product-brand">Brand/name unknown \u2014 scored from label text only</div></div></div>' +
        ingredientFlagHTML +
        '<div class="section" style="margin-top:16px;"><div class="section-label">Extracted Ingredients</div><div class="info-box">' + (data.ingredients_text || 'Not detected') + '</div></div>' +
        '<div class="section"><div class="section-label">Raw OCR Text</div><div class="info-box" style="white-space:pre-wrap;max-height:160px;overflow:auto;">' + (data.raw_text || 'Not available') + '</div></div>' +
        '<div style="margin-top:16px;text-align:center;"><button class="btn-camera" style="background:var(--off-white);color:var(--text);" onclick="pnfScanAgain()">Scan a different product</button></div>';
    animateHeroScore(hero.uid, score);
}

/* ── PREF MATCH BADGE (v2) ── */
function buildPrefMatchHTML(normalized,ingredients){
  var r=checkPrefMatch(normalized,ingredients||'');
  if(!r.matches.length&&!r.misses.length) return'';
  var html='<div class="pref-match-banner-v2">';
  if(r.matches.length){
    html+='<div class="pref-match-line pref-match-line-yes">✅ <strong>Matches:</strong> '+r.matches.map(function(p){return PREF_META[p].icon+' '+PREF_META[p].label;}).join(', ')+'</div>';
  }
  if(r.misses.length){
    html+='<div class="pref-match-line pref-match-line-no">❌ <strong>Does Not Match:</strong> '+r.misses.map(function(p){return PREF_META[p].icon+' '+PREF_META[p].label;}).join(', ')+'</div>';
  }
  html+='</div>';
  return html;
}

/* ══════════════════════════════════════════════════════
   HERO SCORE CARD — Task 1A (score is the first thing seen,
   large/bold, proper contrast) + Task 2A (dial + number animate
   from 0 to the actual score on open).
   ══════════════════════════════════════════════════════ */
var _heroScoreUidCounter = 0;
var HERO_DIAL_R = 70;
var HERO_DIAL_CIRCUMFERENCE = 2 * Math.PI * HERO_DIAL_R;

var HERO_GRADE_COLORS = {
  A: { light: '#2ECC71', dark: '#3ddc82', bgLight: '#E8F9EE', bgDark: '#0e2a18' },
  B: { light: '#7cb342', dark: '#96d15c', bgLight: '#F1F8E4', bgDark: '#1a2a0e' },
  C: { light: '#e0a300', dark: '#ffd166', bgLight: '#FFF7E0', bgDark: '#2a2000' },
  D: { light: '#e0562e', dark: '#ff8a5c', bgLight: '#FDEEE7', bgDark: '#2a1408' },
  F: { light: '#F4432E', dark: '#ff5a4a', bgLight: '#FDE9E7', bgDark: '#300a08' }
};

function buildHeroScoreHTML(score, grade, gradeClass) {
    _heroScoreUidCounter += 1;
    var uid = 'h' + _heroScoreUidCounter + '_' + Date.now();
    var g = (grade || 'C').toUpperCase();
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var colorSet = HERO_GRADE_COLORS[g] || HERO_GRADE_COLORS.C;
    var strokeColor = isDark ? colorSet.dark : colorSet.light;
    var pillBg = isDark ? colorSet.bgDark : colorSet.bgLight;
    var clampedScore = Math.max(0, Math.min(10, Number(score) || 0));

    var html =
        '<div class="hero-score-card ' + (gradeClass || '') + '" id="heroCard-' + uid + '" data-uid="' + uid + '" data-score="' + clampedScore + '" data-stroke="' + strokeColor + '">' +
            '<div class="hero-score-dial-wrap">' +
                '<svg class="hero-score-dial" viewBox="0 0 160 160">' +
                    '<circle class="hero-dial-track" cx="80" cy="80" r="' + HERO_DIAL_R + '"></circle>' +
                    '<circle class="hero-dial-progress" id="heroDial-' + uid + '" cx="80" cy="80" r="' + HERO_DIAL_R + '" ' +
                        'transform="rotate(-90 80 80)" ' +
                        'style="stroke:' + strokeColor + ';stroke-dasharray:' + HERO_DIAL_CIRCUMFERENCE.toFixed(1) + ';stroke-dashoffset:' + HERO_DIAL_CIRCUMFERENCE.toFixed(1) + ';">' +
                    '</circle>' +
                '</svg>' +
                '<div class="hero-score-puck"></div>' +
                '<div class="hero-score-center">' +
                    '<div class="hero-score-number" id="heroNum-' + uid + '" style="color:' + strokeColor + ';">0</div>' +
                    '<div class="hero-score-outof">out of 10</div>' +
                    '<div class="hero-score-grade-pill" style="color:' + strokeColor + ';background:' + pillBg + ';">Grade ' + g + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    return { html: html, uid: uid };
}

function animateHeroScore(uid, score, durationMs) {
    durationMs = durationMs || 900;
    var dial = document.getElementById('heroDial-' + uid);
    var numEl = document.getElementById('heroNum-' + uid);
    if (!dial || !numEl) return;
    var target = Math.max(0, Math.min(10, Number(score) || 0));
    var targetOffset = HERO_DIAL_CIRCUMFERENCE * (1 - target / 10);
    var start = null;

    function step(ts) {
        if (!start) start = ts;
        var progress = Math.min(1, (ts - start) / durationMs);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        dial.style.strokeDashoffset = (HERO_DIAL_CIRCUMFERENCE - eased * (HERO_DIAL_CIRCUMFERENCE - targetOffset)).toFixed(2);
        var shown = eased * target;
        numEl.textContent = Number.isInteger(target) ? Math.round(shown) : shown.toFixed(1);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            numEl.textContent = Number.isInteger(target) ? target : target.toFixed(1);
        }
    }
    requestAnimationFrame(step);
}

/* ── SCORE BREAKDOWN CARD ── */
function buildBreakdownHTML(r){
  var finalCls='amt-final-'+r.grade.toLowerCase();
  var rows=r.breakdown.map(function(b){
    if(b.kind==='multiplier'){
      return '<div class="breakdown-row breakdown-multiplier" data-tooltip="'+(b.note||'')+'"><span class="breakdown-label">✦ Transparency Multiplier<span class="breakdown-cat">'+(b.note||'')+'</span></span><span class="breakdown-amount amt-base">×'+b.amount+'</span></div>';
    }
    if(b.kind==='base'){
      // Task 4 — the base score is a neutral starting point (5.0/10), not an
      // earned result, so it gets its own visually distinct row rather than
      // blending in with the penalty/bonus lines below it.
      return '<div class="breakdown-row breakdown-base"><span class="breakdown-label">\u2696\uFE0F '+b.label+'<span class="breakdown-cat">Neutral starting point — every product begins here</span></span><span class="breakdown-amount amt-base-num">'+b.amount+'</span></div>';
    }
    var cls=b.kind==='base'?'amt-base':(b.amount<0?'amt-neg':'amt-pos');
    var sign=b.amount>0?'+':'';
    var catTag=b.cat?'<span class="breakdown-cat">'+b.cat+'</span>':'';
    return '<div class="breakdown-row"><span class="breakdown-label">'+b.label+catTag+'</span><span class="breakdown-amount '+cls+'">'+sign+b.amount+'</span></div>';
  }).join('');
  return '<div class="score-breakdown-card">'
    +'<div class="score-breakdown-title"><span>📐 Score Breakdown</span><button class="breakdown-how-link" onclick="showPage(\'how-scoring-works\')">How this works \u2192</button></div>'
    +rows
    +'<div class="breakdown-row breakdown-final"><span class="breakdown-label">Final Score</span><span class="breakdown-amount '+finalCls+'">'+r.score+'/10 ('+r.grade+')</span></div>'
    +'</div>';
}

/* ── INGREDIENT FLAG WARNING BOX ── */
function buildIngredientFlagsHTML(ingredientFlags){
  if(!ingredientFlags||!ingredientFlags.length) return'';
  var items=ingredientFlags.map(function(f){
    if(!f) return '';
    var label = (typeof f==='string') ? f : (f.label||f.name||f.ingredient||'');
    var cat = (typeof f==='string') ? 'Flagged' : (f.cat||f.risk||f.risk_level||f.severity||'Flagged');
    label = escapeChatText(label);
    cat = escapeChatText(cat);
    if(!label) return '';
    return '<div class="ingredient-flag-item">⚠ '+label+' <span class="ingredient-flag-cat">('+cat+')</span></div>';
  }).join('');
  if(!items) return'';
  return '<div class="ingredient-flag-box">'
    +'<div class="ingredient-flag-title">⚠ Harmful Ingredients Detected</div>'
    +'<div class="ingredient-flag-list">'+items+'</div>'
    +'</div>';
}

/* ── COPY SCORE ── */
function copyScore(){
  var el=document.getElementById('copyScoreData');if(!el)return;
  navigator.clipboard.writeText(el.getAttribute('data-copy')).then(function(){
    var b=document.getElementById('copyScoreBtn');b.classList.add('copied');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    setTimeout(function(){b.classList.remove('copied');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Score';},2000);
  });
}

/* ══════════════════════════════════════════════════════
   MULTI-PRODUCT COMPARE (TASK 1)
   ══════════════════════════════════════════════════════ */
var COMPARE_LIST_KEY='swapify-compare-list-v1';
var compareList=[]; // array of {barcode, data, result, normalized, source, badgeClass}
var MAX_COMPARE=4;

function loadCompareList(){
  try{ compareList=JSON.parse(sessionStorage.getItem(COMPARE_LIST_KEY)||'[]'); }catch(e){ compareList=[]; }
}
function saveCompareList(){ sessionStorage.setItem(COMPARE_LIST_KEY,JSON.stringify(compareList)); }

function isInCompareList(barcode){ return compareList.some(function(p){ return p.barcode===barcode; }); }

function compareSnapshot(prod){
  // Strip down to only what the comparison table needs, so we can safely
  // persist it (full OFF product objects can be huge / circular-ish).
  return{
    barcode: prod.barcode,
    name: (prod.data && (prod.data.product_name||prod.data.name)) || 'Unknown',
    brand: (prod.data && (prod.data.brand||prod.data.brands)) || '',
    source: prod.source,
    badgeClass: prod.badgeClass,
    result: prod.result,
    normalized: prod.normalized,
    ingredients: prod.ingredients || ''
  };
}

function addToCompareList(prod){
  if(!prod) return;
  if(isInCompareList(prod.barcode)){ removeFromCompareList(prod.barcode); return; }
  if(compareList.length>=MAX_COMPARE){
    alert('You can compare up to '+MAX_COMPARE+' products at once. Remove one first.');
    return;
  }
  compareList.push(compareSnapshot(prod));
  saveCompareList();
  refreshCompareUI();
}

function addAltToCompareList(alt){
  // alt has {barcode, product_name, brand, health_score, grade, gradeClass, normalized}
  if(isInCompareList(alt.barcode)){ removeFromCompareList(alt.barcode); return; }
  if(compareList.length>=MAX_COMPARE){
    alert('You can compare up to '+MAX_COMPARE+' products at once. Remove one first.');
    return;
  }
  compareList.push({
    barcode: alt.barcode,
    name: alt.product_name||'Unknown',
    brand: alt.brand||'',
    source: 'SWAPIFY DB',
    badgeClass: 'source-csv',
    result: {score:alt.health_score,grade:alt.grade,gradeClass:alt.gradeClass||('score-'+(alt.grade||'c').toLowerCase()),flags:[],ingredientFlags:[]},
    normalized: alt.normalized||{},
    ingredients: ''
  });
  saveCompareList();
  refreshCompareUI();
}

function removeFromCompareList(barcode){
  compareList=compareList.filter(function(p){ return p.barcode!==barcode; });
  saveCompareList();
  refreshCompareUI();
}

function clearCompareList(){
  compareList=[];
  saveCompareList();
  refreshCompareUI();
}

function refreshCompareUI(){
  // Fab visibility/count
  var fab=document.getElementById('compareFab');
  var count=document.getElementById('compareFabCount');
  if(count) count.textContent=compareList.length;
  if(fab) fab.classList.toggle('visible',compareList.length>0);

  // Sync any "Add to compare" buttons currently in the DOM
  document.querySelectorAll('[data-compare-barcode]').forEach(function(btn){
    var bc=btn.getAttribute('data-compare-barcode');
    var inList=isInCompareList(bc);
    btn.classList.toggle('in-compare',inList);
    if(btn.classList.contains('btn-add-compare')){
      btn.innerHTML=inList?'✓ In Compare':'+ Compare';
    } else if(btn.classList.contains('alt-add-compare-btn')){
      btn.innerHTML=inList?'✓':'+';
      btn.title=inList?'Remove from compare':'Add to compare';
    }
  });

  // If the panel is open, re-render its table live
  if(document.getElementById('multiCompareOverlay').classList.contains('active')){
    renderMultiCompareTable();
  }
}

/* Compare is now a full page (Task 1) — these are kept as compatibility
   shims since older code paths (Compare FAB, dashboard quick action) still
   call them by name. */
function openMultiComparePanel(){ showPage('compare'); }
function closeMultiComparePanel(){ showPage('home'); }
function handleMultiCompareOverlayClick(e){ /* no-op: no longer a dismissible modal */ }

function mcScoreClass(score){ return score>=9?'mc-score-a':score>=7?'mc-score-b':score>=5?'mc-score-c':score>=3?'mc-score-d':'mc-score-f'; }

function renderMultiCompareTable(){
  var body=document.getElementById('multiCompareBody');
  if(!compareList.length){
    body.innerHTML='<div class="compare-panel-empty">⚖️ No products added yet.<br>Scan a product and tap <strong>+ Compare</strong>, or use the same button on alternative cards, to add it here.</div>';
    return;
  }

  function fv(v,suffix){ return(v!==undefined&&v!==null)?(Math.round(v*10)/10)+(suffix||''):'—'; }

  // Determine "best" value per metric for highlighting
  function bestIdx(getter,higherBetter){
    var vals=compareList.map(getter);
    var defined=vals.filter(function(v){return v!==undefined&&v!==null;});
    if(!defined.length) return -1;
    var best=higherBetter?Math.max.apply(null,defined):Math.min.apply(null,defined);
    return vals.indexOf(best);
  }

  var rowsDef=[
    {label:'Health Score',getter:function(p){return p.result.score;},fmt:function(v){return v+'/10';},higher:true,isScore:true},
    {label:'Sugar (g)',getter:function(p){return p.normalized.sugar;},fmt:function(v){return fv(v,'g');},higher:false},
    {label:'Saturated Fat (g)',getter:function(p){return p.normalized.satFat;},fmt:function(v){return fv(v,'g');},higher:false},
    {label:'Sodium (mg)',getter:function(p){return p.normalized.sodiumMg!==undefined?p.normalized.sodiumMg:(p.normalized.sodium!==undefined?p.normalized.sodium*1000:undefined);},fmt:function(v){return fv(v,'mg');},higher:false},
    {label:'Protein (g)',getter:function(p){return p.normalized.protein;},fmt:function(v){return fv(v,'g');},higher:true},
    {label:'Calories (kcal)',getter:function(p){return p.normalized.calories;},fmt:function(v){return fv(v,'');},higher:false}
  ];

  var headerCells=compareList.map(function(p){
    return '<th class="mc-col-header"><button class="mc-remove-btn" onclick="removeFromCompareList(\''+p.barcode+'\')" title="Remove">✕</button>'
      +'<div class="mc-product-name">'+(p.name||'Unknown')+'</div>'
      +'<div class="mc-product-brand">'+(p.brand||'')+'</div></th>';
  }).join('');

  var bodyRows=rowsDef.map(function(row){
    var bIdx=bestIdx(row.getter,row.higher);
    var cells=compareList.map(function(p,i){
      var v=row.getter(p);
      var cellHTML;
      if(row.isScore){
        cellHTML='<span class="mc-score-pill '+mcScoreClass(v)+'">'+row.fmt(v)+' ('+p.result.grade+')</span>';
      } else {
        cellHTML=row.fmt(v);
      }
      var cls=(i===bIdx&&compareList.length>1)?' class="mc-best-cell"':'';
      return '<td'+cls+'>'+cellHTML+'</td>';
    }).join('');
    return '<tr><td class="mc-row-label">'+row.label+'</td>'+cells+'</tr>';
  }).join('');

  // Ingredient flags row
  var flagCells=compareList.map(function(p){
    var flags=(p.result.ingredientFlags||[]);
    if(!flags.length) return '<td><span class="mc-no-flags">No flagged ingredients</span></td>';
    var chips=flags.slice(0,6).map(function(f){
      var label=(typeof f==='string')?f:(f.label||f.name||'');
      return '<span class="mc-flag-chip">⚠ '+escapeChatText(label)+'</span>';
    }).join('');
    return '<td>'+chips+'</td>';
  }).join('');

  body.innerHTML='<table class="multi-compare-table"><thead><tr><th class="mc-row-label">Metric</th>'+headerCells+'</tr></thead><tbody>'
    +bodyRows
    +'<tr><td class="mc-row-label">Ingredient Flags</td>'+flagCells+'</tr>'
    +'</tbody></table>';
}

/* ── ACTION ROW (with Favorite + Compare buttons) ── */
function actionRowHTML(prod){
  var barcode=prod.barcode;
  var name=prod.data.product_name||'Unknown', brand=prod.data.brand||prod.data.brands||'';
  var score=prod.result.score, grade=prod.result.grade;
  var isFav=isInFavorites(barcode);
  var inCompare=isInCompareList(barcode);
  var cd='Product: '+name+' | Score: '+score+'/10 ('+grade+') | Warnings: '+(prod.result.flags.map(function(x){return x.t;}).join(', ')||'None');
  return '<div id="copyScoreData" data-copy="'+cd.replace(/"/g,'&quot;')+'">'
    +'<div class="action-btn-row">'
    +'<button id="copyScoreBtn" class="copy-score-btn" onclick="copyScore()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Score'
    +'</button>'
    +'<button id="favBtn" class="btn-fav'+(isFav?' fav-active':'')+'" onclick="toggleFavorite(\''+barcode+'\',\''+name.replace(/'/g,"\\'")+ '\',\''+brand.replace(/'/g,"\\'")+'\','+score+',\''+grade+'\')">'
    +(isFav?'★ Saved':'☆ Favorite')
    +'</button>'
    +'<button id="addCompareBtn" class="btn-add-compare'+(inCompare?' in-compare':'')+'" data-compare-barcode="'+barcode+'" onclick="addToCompareList(lastScannedProduct)">'
    +(inCompare?'✓ In Compare':'+ Compare')
    +'</button>'
    +'<button class="btn-compare" onclick="openCompareModal()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg> Quick Compare'
    +'</button>'
    +'<button class="btn-share" onclick="openShareModal(lastScannedProduct)">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share'
    +'</button>'
    +'<button class="btn-chat-ai" onclick="openChatWithAI()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Chat with AI'
    +'</button>'
    +'</div></div>';
}

/* ── NUTRITION TABLE HELPER ── */
function nutrTableHTML(rows, perLabel){
  var html='<table class="nutr-table"><thead><tr><th>Nutrient</th><th>Per '+perLabel+'</th></tr></thead><tbody>';
  rows.forEach(function(row){
    var valClass='';
    if(row.warn) valClass=' class="val-warn"';
    else if(row.ok) valClass=' class="val-ok"';
    html+='<tr><td>'+row.label+'</td><td'+valClass+'>'+row.val+'</td></tr>';
  });
  return html+'</tbody></table>';
}

/* ── RENDER: SWAPIFY ── */
function renderSwapify(prod){
  var p=prod.data,r=prod.result,bc=prod.barcode,src=prod.source,badge=prod.badgeClass;
  function f(v,u){if(v===undefined||v===null||v==='NULL')return'—';return parseFloat(v)+' '+u;}
  var sv=p.serving_size_g||'?';
  var nutritionRows=[
    {label:'Calories',val:f(p.calories_kcal_per_serving,'kcal'),warn:p.calories_kcal_per_serving>300},
    {label:'Sugar',val:f(p.sugar_g_per_serving,'g'),warn:p.sugar_g_per_serving>10,ok:p.sugar_g_per_serving!==null&&p.sugar_g_per_serving<=5},
    {label:'Saturated Fat',val:f(p.saturated_fat_g_per_serving,'g'),warn:p.saturated_fat_g_per_serving>4},
    {label:'Sodium',val:f(p.sodium_mg_per_serving,'mg'),warn:p.sodium_mg_per_serving>400},
    {label:'Protein',val:f(p.protein_g_per_serving,'g'),ok:p.protein_g_per_serving>8},
    {label:'Fiber',val:f(p.fiber_g_per_serving,'g'),ok:p.fiber_g_per_serving>5}
  ];
  var fh=r.flags.length?'<div class="tags">'+r.flags.map(function(x){return'<span class="tag '+x.c+'">'+x.t+'</span>';}).join('')+'</div>':'';
  var ih=r.insufficientData?'<div class="insufficient-data-box"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Insufficient data – default 5/10</div>':'';
  var mh=r.missingData.length?'<div class="section"><div class="section-label">Missing Data</div><div class="missing-list">'+r.missingData.map(function(m){return'<div class="missing-item">'+m+'</div>';}).join('')+'</div></div>':'';
  var prefHTML=buildPrefMatchHTML(prod.normalized,prod.ingredients);
  var breakdownHTML=buildBreakdownHTML(r);
  var ingredientFlagHTML=buildIngredientFlagsHTML(r.ingredientFlags);
  var hero=buildHeroScoreHTML(r.score,r.grade,r.gradeClass);
  resultEl.className='visible';
  resultEl.innerHTML=
    hero.html+
    '<div class="barcode-row"><span class="barcode-num">'+bc+'</span><span class="barcode-status">OK · '+src+'</span></div>'+
    getPlaceholderHTML()+
    '<div class="product-header"><div><div class="product-name">'+(p.product_name||'Unknown')+' <span class="source-badge '+badge+'">'+src+'</span>'+buildRecommendedBadgeHTML(p,r)+'</div><div class="product-brand">'+(p.brand||'Unknown')+'</div><div style="margin-top:5px;font-family:\'DM Mono\',monospace;font-size:0.82rem;color:var(--text-muted);">Confidence: <span class="confidence-badge '+r.confidenceClass+'">'+r.confidence+'</span></div></div></div>'+
    buildRatingSectionHTML(bc,p.product_name||'Unknown')+
    buildGallerySectionHTML(bc,p.product_name||'Unknown')+
    buildReviewsSectionHTML(bc,p.product_name||'Unknown')+
    prefHTML+ih+
    breakdownHTML+
    ingredientFlagHTML+
    fh+
    actionRowHTML(prod)+
    '<div class="section" style="margin-top:16px;"><div class="section-label">Nutrition per serving ('+sv+'g)</div>'+nutrTableHTML(nutritionRows,sv+'g')+'</div>'+mh;
  animateHeroScore(hero.uid,r.score);
  refreshCompareUI();
  refreshRatingSectionFromBackend(bc,p.product_name||'Unknown');
  if(typeof p.is_recommended!=='boolean') refreshRecommendedBadgeFromBackend(bc);
  refreshReviewsSection(bc);
}

/* ── RENDER: OPEN FOOD FACTS ── */
function renderOFF(prod){
  var p=prod.data,r=prod.result,bc=prod.barcode,n=p.nutriments||{};
  function nv(k,u){var v=n[k];return(v!==undefined&&v!==null&&v!=='')?parseFloat(v).toFixed(1)+' '+u:'—';}
  var nutritionRows=[
    {label:'Calories',val:nv('energy-kcal_100g','kcal'),warn:n['energy-kcal_100g']>300},
    {label:'Sugars',val:nv('sugars_100g','g'),warn:n['sugars_100g']>10,ok:n['sugars_100g']!==undefined&&n['sugars_100g']<=5},
    {label:'Saturated Fat',val:nv('saturated-fat_100g','g'),warn:n['saturated-fat_100g']>4},
    {label:'Protein',val:nv('proteins_100g','g'),ok:n['proteins_100g']>8},
    {label:'Sodium',val:nv('sodium_100g','g'),warn:n['sodium_100g']>0.4},
    {label:'Fiber',val:nv('fiber_100g','g'),ok:n['fiber_100g']>5},
    {label:'Carbohydrates',val:nv('carbohydrates_100g','g')}
  ];
  var fh=r.flags.length?'<div class="tags">'+r.flags.map(function(x){return'<span class="tag '+x.c+'">'+x.t+'</span>';}).join('')+'</div>':'';
  var prefHTML=buildPrefMatchHTML(prod.normalized,prod.ingredients);
  var breakdownHTML=buildBreakdownHTML(r);
  var ingredientFlagHTML=buildIngredientFlagsHTML(r.ingredientFlags);
  var imgWrapperId='off-img-'+bc.replace(/\W/g,'');
  var hero=buildHeroScoreHTML(r.score,r.grade,r.gradeClass);
  resultEl.className='visible';
  resultEl.innerHTML=
    hero.html+
    '<div class="barcode-row"><span class="barcode-num">'+bc+'</span><span class="barcode-status">OK · OPEN FOOD FACTS</span></div>'+
    '<div id="'+imgWrapperId+'"><div class="img-loading-wrap"></div></div>'+
    '<div class="product-header"><div><div class="product-name">'+(p.product_name||'Unknown')+' <span class="source-badge source-off">OPEN FOOD FACTS</span>'+buildRecommendedBadgeHTML(p,r)+'</div><div class="product-brand">'+(p.brands||'Unknown')+'</div><div style="margin-top:5px;font-family:\'DM Mono\',monospace;font-size:0.82rem;color:var(--text-muted);">Confidence: <span class="confidence-badge '+r.confidenceClass+'">'+r.confidence+'</span></div></div></div>'+
    buildRatingSectionHTML(bc,p.product_name||'Unknown')+
    buildGallerySectionHTML(bc,p.product_name||'Unknown')+
    buildReviewsSectionHTML(bc,p.product_name||'Unknown')+
    prefHTML+
    breakdownHTML+
    ingredientFlagHTML+
    fh+
    actionRowHTML(prod)+
    '<div class="section" style="margin-top:16px;"><div class="section-label">Nutrition per 100g</div>'+nutrTableHTML(nutritionRows,'100g')+'</div>'+
    '<div class="section"><div class="section-label">Ingredients</div><div class="info-box">'+(p.ingredients_text||'Not available')+'</div></div>';
  animateHeroScore(hero.uid,r.score);
  renderOFFImageAsync(imgWrapperId,getOFFImageCandidates(p),p.product_name||'Product');
  refreshCompareUI();
  refreshRatingSectionFromBackend(bc,p.product_name||'Unknown');
  if(typeof p.is_recommended!=='boolean') refreshRecommendedBadgeFromBackend(bc);
  refreshReviewsSection(bc);
}

/* ── RENDER: ALTERNATIVES ── */
function renderAlternatives(alts,scannedProd){
  var curScore=scannedProd.result.score, hasPrefs=activePrefsArray().length>0;
  var headerHTML='<div class="alt-header-row"><div class="alt-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Better Alternatives</div></div>';

  if(curScore>=7){
    altEl.className='visible';
    altEl.innerHTML='<div class="alt-section">'+headerHTML+'<div class="alt-best">✅ No better alternatives needed — this product is already among the best in its category!</div></div>';
    return;
  }

  if(!alts||alts.length===0){
    altEl.className='visible';
    altEl.innerHTML='<div class="alt-section">'+headerHTML+'<div class="alt-none">🔍 No better alternatives found in this category.</div></div>';
    return;
  }
  var prefNoteHTML=hasPrefs?'<span class="alt-pref-note visible">✦ Sorted by your preferences</span>':'';
  window.__altLookup=window.__altLookup||{};
  var cardsHTML=alts.map(function(alt){
    window.__altLookup[alt.barcode]=alt;
    var gc=alt.health_score>=9?'score-a':alt.health_score>=7?'score-b':alt.health_score>=5?'score-c':alt.health_score>=3?'score-d':'score-f';
    var gr=alt.grade||(alt.health_score>=9?'A':alt.health_score>=7?'B':alt.health_score>=5?'C':alt.health_score>=3?'D':'F');
    var barPct=Math.min(100,alt.health_score*10), barClass=alt.health_score>=7?'':('alt-bar-fill '+(alt.health_score>=5?'low':'below'));
    var deltaPositive=alt.delta>=0;
    var imgHTML=alt.image_url?'<img src="'+resolveBackendUrl(alt.image_url)+'" onerror="onImgError(this)">':PH_SVG;
    var inCompare=isInCompareList(alt.barcode);
    var swapSaved=isSwapSaved(scannedProd.barcode,alt.barcode);
    return'<div class="alt-card">'
      +'<button class="alt-add-compare-btn'+(inCompare?' in-compare':'')+'" data-compare-barcode="'+alt.barcode+'" title="'+(inCompare?'Remove from compare':'Add to compare')+'" onclick="addAltToCompareList(window.__altLookup[\''+alt.barcode+'\'])">'+(inCompare?'✓':'+')+'</button>'
      +'<div class="alt-card-badges"><div class="alt-swap-badge">💚 Healthier Swap</div>'
      +(hasPrefs&&alt.prefScore>0?'<div class="alt-pref-ribbon">✦ Pref Match</div>':'')
      +'</div>'
      +'<div class="alt-card-img">'+imgHTML+'</div>'
      +'<div class="alt-card-name">'+(alt.product_name||'Unknown')+'</div>'
      +'<div class="alt-card-brand">'+(alt.brand||'')+'</div>'
      +'<div class="alt-score-row"><div class="alt-score-badge '+gc+'">'+gr+'<span class="alt-lbl">'+alt.health_score+'/10</span></div><span class="alt-delta-pill'+(deltaPositive?'':' neg')+'">'+(deltaPositive?'+':'')+alt.delta+' pts</span></div>'
      +'<div class="alt-progress-wrap"><div class="alt-progress-label"><span>Health score</span><strong>'+alt.health_score+' / 10</strong></div><div class="alt-bar-track"><div class="alt-bar-fill '+barClass+'" style="width:'+barPct+'%;"></div></div></div>'
      +'<button class="alt-compare-btn" onclick="compareWithAlt(\''+alt.barcode+'\')">⚖️ Compare →</button>'
      +'<button class="alt-save-swap-btn'+(swapSaved?' saved':'')+'" data-swap-orig="'+scannedProd.barcode+'" data-swap-alt="'+alt.barcode+'" onclick="saveSwapFromAlt(\''+scannedProd.barcode+'\',\''+alt.barcode+'\')">'+(swapSaved?'✓ Saved to My Swaps':'💾 Save Swap')+'</button>'
      +'</div>';
  }).join('');
  altEl.className='visible';
  altEl.innerHTML='<div class="alt-section"><div class="alt-header-row"><div class="alt-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Better Alternatives</div>'+prefNoteHTML+'</div><div class="alt-grid">'+cardsHTML+'</div></div>';
  refreshCompareUI();
}

async function compareWithAlt(barcode2){
  if(!lastScannedProduct)return;
  compareEl.className='visible';compareEl.innerHTML='<div class="compare-card"><div class="loading-spinner">Loading comparison…</div></div>';
  try{var prod2=await fetchProduct(barcode2);renderComparison(lastScannedProduct,prod2);compareEl.scrollIntoView({behavior:'smooth',block:'start'});}
  catch(e){compareEl.innerHTML='<div class="compare-card"><div class="error-box">Could not load product.</div></div>';}
}

/* ── COMPARE (legacy 2-product quick compare) ── */
function openCompareModal(){if(!lastScannedProduct){alert('Scan a product first!');return;}document.getElementById('compareModal').classList.add('active');document.getElementById('compareInput').value='';document.getElementById('compareInput').focus();}

/* ══════════════════════════════════════════════════════
   AI NUTRITIONIST CHAT (incl. Task 3 ingredient substitution)
   ══════════════════════════════════════════════════════ */
var chatHistory=[]; // {role:'user'|'ai', text}
var chatOpen=false;
var chatPending=false;

function escapeChatText(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Task 3 — consistent AI chat formatting. The backend's /chat responses vary
// in shape (sometimes a numbered list, sometimes bullet points, sometimes
// plain prose) since that's up to the LLM's own output style. Previously the
// frontend just HTML-escaped the raw text and dumped it in one block, so a
// numbered list looked identical to a paragraph — inconsistent by definition.
// This renders any of those shapes into real, consistent HTML: <ol>/<ul> for
// lists, <p> for paragraphs, <br> for single line breaks within a paragraph,
// and **bold** markdown into <strong>. Text is escaped before any tag is
// built, so nothing in the model's output can inject markup.
function inlineFormatChatText(s){
  return s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
}
function formatChatResponse(text){
  var esc=escapeChatText(text).replace(/\r\n/g,'\n');
  var lines=esc.split('\n');
  var html='',listBuffer=[],listType=null,paraBuffer=[];

  function flushList(){
    if(!listBuffer.length) return;
    var tag=listType==='ol'?'ol':'ul';
    html+='<'+tag+' class="chat-list">'+listBuffer.map(function(item){return'<li>'+item+'</li>';}).join('')+'</'+tag+'>';
    listBuffer=[]; listType=null;
  }
  function flushPara(){
    if(!paraBuffer.length) return;
    html+='<p>'+paraBuffer.join('<br>')+'</p>';
    paraBuffer=[];
  }

  lines.forEach(function(line){
    var trimmed=line.trim();
    var olMatch=trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    var ulMatch=trimmed.match(/^[-*•]\s+(.*)$/);
    if(olMatch){
      flushPara();
      if(listType!=='ol') flushList();
      listType='ol'; listBuffer.push(inlineFormatChatText(olMatch[2]));
    } else if(ulMatch){
      flushPara();
      if(listType!=='ul') flushList();
      listType='ul'; listBuffer.push(inlineFormatChatText(ulMatch[1]));
    } else if(trimmed===''){
      flushList(); flushPara();
    } else {
      flushList();
      paraBuffer.push(inlineFormatChatText(trimmed));
    }
  });
  flushList(); flushPara();
  return html||'<p></p>';
}

function chatCurrentContext(){
  if(!lastScannedProduct) return null;
  var p=lastScannedProduct;
  return{
    barcode:p.barcode,
    name:(p.data&&(p.data.product_name))||'this product',
    score:p.result&&p.result.score,
    grade:p.result&&p.result.grade
  };
}

function updateChatContextPill(){
  var ctx=chatCurrentContext();
  var pill=document.getElementById('chatContextPill');
  if(ctx){
    document.getElementById('chatContextName').textContent=ctx.name+(ctx.score!==undefined?' ('+ctx.score+'/10 '+ctx.grade+')':'');
    pill.classList.add('visible');
  } else {
    pill.classList.remove('visible');
  }
}

function toggleChatWindow(forceState){
  var win=document.getElementById('chatWindow');
  var fab=document.getElementById('chatFab');
  var willOpen = (typeof forceState==='boolean') ? forceState : !chatOpen;
  chatOpen=willOpen;
  win.classList.toggle('active',willOpen);
  fab.classList.toggle('hidden',willOpen);
  if(willOpen){
    updateChatContextPill();
    document.getElementById('chatSuggestions').style.display = chatHistory.length ? 'none' : 'flex';
    setTimeout(function(){var i=document.getElementById('chatInput');if(i)i.focus();},150);
    scrollChatToBottom();
  }
}

function openChatWithAI(){
  toggleChatWindow(true);
  var sugg=document.getElementById('chatSuggestions');
  if(sugg) sugg.style.display = chatHistory.length ? 'none' : 'flex';
}

function scrollChatToBottom(){
  var m=document.getElementById('chatMessages');
  if(m) m.scrollTop=m.scrollHeight;
}

function renderChatBubble(role,text,isError){
  var empty=document.getElementById('chatEmptyState');
  if(empty) empty.remove();
  var m=document.getElementById('chatMessages');
  var div=document.createElement('div');
  div.className='chat-bubble '+(role==='user'?'chat-bubble-user':'chat-bubble-ai')+(isError?' chat-error':'');
  div.innerHTML=role==='ai'?formatChatResponse(text):escapeChatText(text);
  m.appendChild(div);
  scrollChatToBottom();
  return div;
}

function showChatTyping(){
  var m=document.getElementById('chatMessages');
  var div=document.createElement('div');
  div.className='chat-bubble chat-bubble-ai';
  div.id='chatTypingBubble';
  div.innerHTML='<span class="chat-typing-dots"><span></span><span></span><span></span></span>';
  m.appendChild(div);
  scrollChatToBottom();
}

function hideChatTyping(){
  var t=document.getElementById('chatTypingBubble');
  if(t) t.remove();
}

function setChatSending(isSending){
  chatPending=isSending;
  var btn=document.getElementById('chatSendBtn');
  var input=document.getElementById('chatInput');
  if(btn) btn.disabled=isSending;
  if(input) input.disabled=isSending;
}

// Local fallback ingredient-substitution knowledge, used only if the
// backend /chat endpoint is unreachable, so the substitution chips still
// feel useful offline / before a backend is wired up.
var SUBSTITUTION_FALLBACK=[
  {re:/sugar/i,answer:"Common sugar substitutes: stevia, monk fruit extract, erythritol, jaggery (in moderation), or mashed dates/banana for baking. These lower the glycemic impact while keeping sweetness."},
  {re:/salt|sodium/i,answer:"To cut sodium: use herbs, garlic, lemon juice, or a potassium-based salt substitute. Smoked paprika and black pepper add flavor without raising sodium."},
  {re:/(maida|flour)/i,answer:"Swap refined flour (maida) for whole wheat flour, oat flour, almond flour, or millet (ragi/jowar/bajra) flour for more fiber and nutrients."},
  {re:/(palm oil|saturated|oil)/i,answer:"Try cold-pressed olive oil, mustard oil, or rice bran oil instead of palm oil/vanaspati — they have a better fatty-acid profile."},
  {re:/(aspartame|sucralose|artificial sweetener)/i,answer:"For artificial sweeteners, consider stevia or monk fruit as more natural-tasting, well-studied alternatives."}
];
function localSubstitutionFallback(question){
  for(var i=0;i<SUBSTITUTION_FALLBACK.length;i++){
    if(SUBSTITUTION_FALLBACK[i].re.test(question)) return SUBSTITUTION_FALLBACK[i].answer;
  }
  return null;
}

async function sendChatMessage(presetText){
  if(chatPending) return;
  var input=document.getElementById('chatInput');
  var question=(typeof presetText==='string' ? presetText : (input?input.value:'')).trim();
  if(!question) return;

  document.getElementById('chatSuggestions').style.display='none';
  renderChatBubble('user',question);
  chatHistory.push({role:'user',text:question});
  if(input) input.value='';

  setChatSending(true);
  showChatTyping();

  var ctx=chatCurrentContext();
  var isSubQuestion=/substitut/i.test(question);

  try{
    var resp=await fetch(CHAT_URL,{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify({
        question:question,
        barcode: ctx ? ctx.barcode : null,
        intent: isSubQuestion ? 'ingredient_substitution' : 'general'
      })
    });

    hideChatTyping();

    if(!resp.ok){
      throw new Error('Chat API returned status '+resp.status);
    }

    var data=await resp.json();
    var answer=(data && (data.response || data.answer || data.message || data.reply)) || "I couldn't find a clear answer to that — try rephrasing your question.";
    renderChatBubble('ai',answer);
    chatHistory.push({role:'ai',text:answer});

  }catch(err){
    hideChatTyping();
    if(isSubQuestion){
      var fb=localSubstitutionFallback(question);
      if(fb){
        renderChatBubble('ai',fb);
        chatHistory.push({role:'ai',text:fb});
        setChatSending(false);
        if(input) input.focus();
        return;
      }
    }
    renderChatBubble('ai','⚠️ Sorry, I couldn\'t reach the AI Nutritionist right now. Please check your connection or try again in a moment.',true);
  }finally{
    setChatSending(false);
    if(input) input.focus();
  }
}
function closeCompareModal(){document.getElementById('compareModal').classList.remove('active');}
document.getElementById('compareInput').addEventListener('keydown',function(e){if(e.key==='Enter')runCompare();});
async function runCompare(){
  var bc2=document.getElementById('compareInput').value.trim();if(!bc2||!/^\d+$/.test(bc2)){alert('Enter a valid barcode.');return;}
  closeCompareModal();compareEl.className='visible';compareEl.innerHTML='<div class="compare-card"><div class="loading-spinner">Fetching…</div></div>';
  try{var prod2=await fetchProduct(bc2);renderComparison(lastScannedProduct,prod2);}
  catch(e){compareEl.innerHTML='<div class="compare-card"><div class="error-box">Product <strong>('+bc2+')</strong> not found.</div></div>';}
}
function getName(prod){return prod.data.product_name||'Unknown';}
function renderComparison(a,b){
  var na=getName(a),nb=getName(b),ra=a.result,rb=b.result,na2=a.normalized,nb2=b.normalized;
  function fv(v){return(v!==undefined&&v!==null)?Number(v).toFixed(1):'—';}
  function cls(nA,nB,higher){if(nA===undefined||nA===null||nB===undefined||nB===null)return['equal','equal'];if(nA===nB)return['equal','equal'];if(higher)return nA>nB?['better','worse']:['worse','better'];else return nA<nB?['better','worse']:['worse','better'];}
  var rows=[{label:'Health Score',vA:ra.score+'/10 ('+ra.grade+')',vB:rb.score+'/10 ('+rb.grade+')',nA:ra.score,nB:rb.score,higher:true},{label:'Sugar (g)',vA:fv(na2.sugar),vB:fv(nb2.sugar),nA:na2.sugar,nB:nb2.sugar,higher:false},{label:'Sat. Fat (g)',vA:fv(na2.satFat),vB:fv(nb2.satFat),nA:na2.satFat,nB:nb2.satFat,higher:false},{label:'Sodium (mg)',vA:fv(a.normalized.sodiumMg),vB:fv(b.normalized.sodiumMg),nA:a.normalized.sodiumMg,nB:b.normalized.sodiumMg,higher:false},{label:'Protein (g)',vA:fv(na2.protein),vB:fv(nb2.protein),nA:na2.protein,nB:nb2.protein,higher:true},{label:'Fiber (g)',vA:fv(na2.fiber),vB:fv(nb2.fiber),nA:na2.fiber,nB:nb2.fiber,higher:true},{label:'Calories',vA:fv(na2.calories),vB:fv(nb2.calories),nA:na2.calories,nB:nb2.calories,higher:false}];
  var tbl='<table class="compare-table"><thead><tr><th>Nutrient</th><th>'+na+'</th><th>'+nb+'</th></tr></thead><tbody>';
  rows.forEach(function(row){var c=cls(row.nA,row.nB,row.higher);tbl+='<tr><td>'+row.label+'</td><td class="'+c[0]+'">'+row.vA+'</td><td class="'+c[1]+'">'+row.vB+'</td></tr>';});
  tbl+='</tbody></table>';
  var win=ra.score>rb.score?'<div class="compare-winner winner-a">🏆 '+na+' wins ('+ra.score+'/10 vs '+rb.score+'/10)</div>':rb.score>ra.score?'<div class="compare-winner winner-b">🏆 '+nb+' wins ('+rb.score+'/10 vs '+ra.score+'/10)</div>':'<div class="compare-winner winner-tie">🤝 Tie! Both scored '+ra.score+'/10</div>';
  compareEl.className='visible';
  compareEl.innerHTML='<div class="compare-card"><div class="compare-title">⚖️ Product Comparison</div>'+tbl+win+'<div style="text-align:center;margin-top:14px;"><span class="source-badge '+a.badgeClass+'" style="margin:0 4px;">'+a.source+'</span><span class="source-badge '+b.badgeClass+'" style="margin:0 4px;">'+b.source+'</span></div></div>';
}

/* ══════════════════════════════════════════════════════
   MONTHLY HEALTH REPORT (TASK 2)
   ══════════════════════════════════════════════════════ */
var monthlyPanelOpen=false;
var monthlyOffset=0; // 0 = current month, -1 = last month, etc.
var monthlyChartInstances={};

function toggleMonthlyPanel(){
  monthlyPanelOpen=!monthlyPanelOpen;
  var panel=document.getElementById('monthlyPanel');
  if(monthlyPanelOpen){ monthlyOffset=0; renderMonthlyPanel(); panel.style.display=''; }
  else panel.style.display='none';
}

function monthBounds(offset){
  var now=new Date();
  var first=new Date(now.getFullYear(),now.getMonth()+offset,1);
  var last=new Date(now.getFullYear(),now.getMonth()+offset+1,0,23,59,59,999);
  return{first:first,last:last};
}

function navMonthly(delta){
  monthlyOffset+=delta;
  if(monthlyOffset>0) monthlyOffset=0; // can't go into the future
  renderMonthlyPanel();
  syncMonthlyPanelToVisiblePage();
}

// #monthlyPanel is a hidden (display:none) template; #monthlyPanelPage is
// the visible clone actually shown on the Monthly Report page. Anything
// that changes the report's content (navigating months, a fresh backend
// fetch landing, etc.) has to copy the template's HTML across and redraw
// the Chart.js trend chart onto the VISIBLE canvas — document.getElementById
// always resolves to the hidden template's canvas first (it comes first in
// the page's markup), so re-rendering without an explicit canvas reference
// draws onto a canvas nobody can see. navMonthly() used to skip this step
// entirely, so the ‹ › month-navigation arrows silently did nothing visible
// for anyone not on the backend-synced path (i.e. every guest/local-only
// user).
function syncMonthlyPanelToVisiblePage(){
  var mpSrc=document.getElementById('monthlyPanel'), mpDst=document.getElementById('monthlyPanelPage');
  if(!mpSrc||!mpDst) return;
  mpDst.innerHTML=mpSrc.innerHTML;
  var visibleCanvas=mpDst.querySelector('#monthlyTrendCanvas');
  if(visibleCanvas) renderMonthlyTrendChart(calcMonthlyStats(monthlyOffset),visibleCanvas);
}

var MONTHLY_REPORT_URL=BACKEND_BASE_URL+'/monthly-report';
var _monthlyBackendCache={};
var _monthlyBackendFetchInFlight={};
function monthKeyFor(offset){
  var b=monthBounds(offset);
  return b.first.getFullYear()+'-'+String(b.first.getMonth()+1).padStart(2,'0');
}
// Translates a backend /monthly-report payload (+ the previous month's report,
// used only to compute "vs last month" trend the same way the local calc
// does) into the exact same shape calcMonthlyStats() already returns, so
// every renderer downstream (panel HTML, Chart.js trend chart) works
// completely unchanged regardless of which source the data came from.
function _translateMonthlyReport(data,prevData,offset){
  var catCounts={};
  (data.category_breakdown||[]).forEach(function(c){ catCounts[c.category]=c.count; });
  var history=(data.daily_trends||[]).map(function(d){
    return{score:d.average_score,timestamp:new Date(d.date+'T12:00:00').getTime()};
  });
  var avg=data.total_scans?data.average_score:null;
  var prevAvg=(prevData&&prevData.total_scans)?prevData.average_score:null;
  var trend='flat',trendDiff=0;
  if(avg!==null&&prevAvg!==null){
    trendDiff=Math.round((avg-prevAvg)*10)/10;
    if(trendDiff>0.3) trend='up'; else if(trendDiff<-0.3) trend='down'; else trend='flat';
  }
  return{
    bounds:monthBounds(offset),
    total:data.total_scans||0,
    avg:avg,
    best:data.best_product?{name:data.best_product.product_name,score:data.best_product.score,grade:data.best_product.grade}:null,
    worst:data.worst_product?{name:data.worst_product.product_name,score:data.worst_product.score,grade:data.worst_product.grade}:null,
    catCounts:catCounts,
    trend:trend,
    trendDiff:trendDiff,
    history:history
  };
}
async function fetchMonthlyReportFromBackend(offset){
  try{
    var res=await fetch(MONTHLY_REPORT_URL+'?month='+monthKeyFor(offset),{headers:getAuthHeaders()});
    if(!res.ok){ handleAuthExpiry(res); _monthlyBackendFetchInFlight[offset]=false; return; }
    var data=await res.json();
    var prevData=null;
    try{
      var prevRes=await fetch(MONTHLY_REPORT_URL+'?month='+monthKeyFor(offset-1),{headers:getAuthHeaders()});
      if(prevRes.ok) prevData=await prevRes.json();
    }catch(e){ /* trend just falls back to 'flat' without previous-month data */ }
    _monthlyBackendCache[offset]=_translateMonthlyReport(data,prevData,offset);
    _monthlyBackendFetchInFlight[offset]=false;
    if(offset===0&&document.getElementById('quickStats')) renderQuickStats();
    if(monthlyOffset===offset){
      renderMonthlyPanel();
      syncMonthlyPanelToVisiblePage();
    }
  }catch(e){ _monthlyBackendFetchInFlight[offset]=false; /* offline/unreachable backend — local render already stands */ }
}

function calcMonthlyStats(offset){
  if(_monthlyBackendCache.hasOwnProperty(offset)) return _monthlyBackendCache[offset];
  if(currentUser&&currentUser.token&&!currentUser.localOnly&&!_monthlyBackendFetchInFlight[offset]){
    _monthlyBackendFetchInFlight[offset]=true;
    fetchMonthlyReportFromBackend(offset);
  }
  var bounds=monthBounds(offset);
  var h=loadHistory().filter(function(item){
    var t=new Date(item.timestamp).getTime();
    return t>=bounds.first.getTime()&&t<=bounds.last.getTime();
  });
  var total=h.length;
  var avg=total?Math.round(h.reduce(function(s,i){return s+i.score;},0)/total*10)/10:null;
  var best=null,worst=null;
  h.forEach(function(item){
    if(!best||item.score>best.score) best=item;
    if(!worst||item.score<worst.score) worst=item;
  });
  // Category breakdown using detectCategory() on stored product names
  var catCounts={};
  h.forEach(function(item){
    var cat=detectCategory(item.name||'');
    catCounts[cat]=(catCounts[cat]||0)+1;
  });
  // Trend vs previous month
  var prevBounds=monthBounds(offset-1);
  var prevH=loadHistory().filter(function(item){
    var t=new Date(item.timestamp).getTime();
    return t>=prevBounds.first.getTime()&&t<=prevBounds.last.getTime();
  });
  var prevAvg=prevH.length?prevH.reduce(function(s,i){return s+i.score;},0)/prevH.length:null;
  var trend='flat',trendDiff=0;
  if(avg!==null&&prevAvg!==null){
    trendDiff=Math.round((avg-prevAvg)*10)/10;
    if(trendDiff>0.3) trend='up'; else if(trendDiff<-0.3) trend='down'; else trend='flat';
  } else if(avg!==null&&prevAvg===null){
    trend='flat';
  }
  return{bounds:bounds,total:total,avg:avg,best:best,worst:worst,catCounts:catCounts,trend:trend,trendDiff:trendDiff,history:h};
}

function monthLabel(offset){
  var bounds=monthBounds(offset);
  return bounds.first.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
}

function renderMonthlyPanel(){
  var stats=calcMonthlyStats(monthlyOffset);
  var panel=document.getElementById('monthlyPanel');
  var canGoNext=monthlyOffset<0;

  var navHTML='<div class="monthly-month-nav">'
    +'<button class="month-nav-btn" onclick="navMonthly(-1)" title="Previous month">‹</button>'
    +'<span class="monthly-month-label">'+monthLabel(monthlyOffset)+'</span>'
    +'<button class="month-nav-btn" onclick="navMonthly(1)" '+(canGoNext?'':'disabled')+' title="Next month">›</button>'
    +'</div>';

  if(stats.total===0){
    panel.innerHTML='<div class="weekly-section"><div class="monthly-section" style="padding:0;">'
      +'<div class="monthly-header"><div class="monthly-title">🗓️ Monthly Health Report</div>'+navHTML+'</div>'
      +'<div class="monthly-empty">No scans recorded in '+monthLabel(monthlyOffset)+'. Scan some products to build this report!</div>'
      +'</div></div>';
    return;
  }

  var avgClass=stats.avg>=7?'stat-good':stats.avg>=5?'stat-warn':'stat-bad';
  var trendIcon=stats.trend==='up'?'📈':stats.trend==='down'?'📉':'➡️';
  var trendCls=stats.trend==='up'?'monthly-trend-up':stats.trend==='down'?'monthly-trend-down':'monthly-trend-flat';
  var trendText=stats.trend==='up'?('Improving (+'+stats.trendDiff+' pts vs last month)'):stats.trend==='down'?('Declining ('+stats.trendDiff+' pts vs last month)'):'Stable vs last month';

  var bestHTML=stats.best?('<div class="bw-name">'+(stats.best.name||'Unknown')+'</div><div class="bw-score">'+stats.best.score+'/10 ('+stats.best.grade+')</div>'):'<div class="bw-name">—</div>';
  var worstHTML=stats.worst?('<div class="bw-name">'+(stats.worst.name||'Unknown')+'</div><div class="bw-score">'+stats.worst.score+'/10 ('+stats.worst.grade+')</div>'):'<div class="bw-name">—</div>';

  var statsGridHTML='<div class="monthly-stats-grid">'
    +'<div class="monthly-stat-card"><div class="monthly-stat-num">'+stats.total+'</div><div class="monthly-stat-lbl">Scans This Month</div></div>'
    +'<div class="monthly-stat-card"><div class="monthly-stat-num '+avgClass+'">'+stats.avg+'</div><div class="monthly-stat-lbl">Avg Score</div></div>'
    +'<div class="monthly-stat-card"><div class="monthly-stat-num stat-good">'+(stats.best?stats.best.score:'—')+'</div><div class="monthly-stat-lbl">Highest</div></div>'
    +'<div class="monthly-stat-card"><div class="monthly-stat-num stat-bad">'+(stats.worst?stats.worst.score:'—')+'</div><div class="monthly-stat-lbl">Lowest</div></div>'
    +'</div>';

  var bwHTML='<div class="monthly-best-worst">'
    +'<div class="bw-card bw-best"><div class="bw-label">🏆 Best Scoring</div>'+bestHTML+'</div>'
    +'<div class="bw-card bw-worst"><div class="bw-label">⚠️ Lowest Scoring</div>'+worstHTML+'</div>'
    +'</div>';

  var catEntries=Object.keys(stats.catCounts).sort(function(a,b){return stats.catCounts[b]-stats.catCounts[a];});
  var maxCat=catEntries.length?stats.catCounts[catEntries[0]]:1;
  var catBarsHTML=catEntries.length
    ? catEntries.map(function(cat){
        var c=stats.catCounts[cat], pct=Math.round((c/maxCat)*100);
        return '<div class="category-bar-row"><div class="category-bar-label">'+cat.replace(/_/g,' ')+'</div><div class="category-bar-track"><div class="category-bar-fill" style="width:'+pct+'%;"></div></div><div class="category-bar-count">'+c+'</div></div>';
      }).join('')
    : '<div class="scan-empty">No category data</div>';

  panel.innerHTML='<div class="weekly-section"><div class="monthly-section" style="padding:0;">'
    +'<div class="monthly-header"><div class="monthly-title">🗓️ Monthly Health Report</div>'+navHTML+'</div>'
    +statsGridHTML
    +bwHTML
    +'<div class="monthly-chart-row">'
    +'<div class="monthly-chart-block"><div class="monthly-chart-label">Score Trend</div><div class="chart-canvas-wrap"><canvas id="monthlyTrendCanvas"></canvas></div>'
    +'<div class="monthly-trend-pill '+trendCls+'">'+trendIcon+' '+trendText+'</div></div>'
    +'<div class="monthly-chart-block"><div class="monthly-chart-label">Category Breakdown</div>'+catBarsHTML+'</div>'
    +'</div>'
    +'</div></div>';

  renderMonthlyTrendChart(stats);
}

function renderMonthlyTrendChart(stats,canvasEl){
  // Accepts an explicit canvas element (preferred) because the page has a
  // hidden template (#monthlyPanel, display:none) AND a visible clone
  // (#monthlyPanelPage) that both contain an element with
  // id="monthlyTrendCanvas" at the same time. document.getElementById()
  // always returns the FIRST one in document order — the hidden template,
  // which appears earlier in index.html — so the chart silently drew onto
  // an invisible canvas while the real, visible one stayed blank forever.
  var canvas=canvasEl||document.getElementById('monthlyTrendCanvas');
  if(!canvas||typeof Chart==='undefined') return;
  // Build day-by-day average for the month
  var bounds=stats.bounds;
  var daysInMonth=bounds.last.getDate();
  var byDay={};
  stats.history.forEach(function(item){
    var d=new Date(item.timestamp).getDate();
    (byDay[d]=byDay[d]||[]).push(item.score);
  });
  var labels=[],data=[];
  for(var d=1;d<=daysInMonth;d++){
    if(byDay[d]){
      labels.push(d);
      var avg=byDay[d].reduce(function(a,b){return a+b;},0)/byDay[d].length;
      data.push(Math.round(avg*10)/10);
    }
  }
  if(monthlyChartInstances.trend){ monthlyChartInstances.trend.destroy(); }
  var rootStyles=getComputedStyle(document.documentElement);
  var accentColor=rootStyles.getPropertyValue('--accent').trim()||'#3b6bff';
  var limeColor=rootStyles.getPropertyValue('--lime').trim()||'#C0FF33';
  var textColor=rootStyles.getPropertyValue('--text-muted').trim()||'#6a7a9a';
  monthlyChartInstances.trend=new Chart(canvas.getContext('2d'),{
    type:'line',
    data:{
      labels:labels,
      datasets:[{
        label:'Avg score',
        data:data,
        borderColor:accentColor,
        backgroundColor:limeColor+'33',
        fill:true,
        tension:0.35,
        pointRadius:3,
        pointBackgroundColor:limeColor
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{min:0,max:10,ticks:{color:textColor,stepSize:2},grid:{color:'rgba(128,128,128,0.15)'}},
        x:{ticks:{color:textColor},grid:{display:false}}
      }
    }
  });
}

/* ══════════════════════════════════════════════════════
   BADGE SYSTEM (TASK 3 — Gamification)
   ══════════════════════════════════════════════════════ */
var BADGE_KEY='swapify-badges-v1';

var BADGE_DEFS=[
  {id:'health_champion',icon:'🏅',name:'Health Champion',desc:'Scan 100+ products',target:100,
   metric:function(h){ return h.length; }},
  {id:'sugar_detective',icon:'️‍🕵️‍♂️',name:'Sugar Detective',desc:'Avoid 10+ high-sugar products',target:10,
   metric:function(h){ return h.filter(function(i){return i.score>=5&&i.name&&/(cola|candy|chocolate|cookie|biscuit)/i.test(i.name);}).length; }},
  {id:'protein_hunter',icon:'💪',name:'Protein Hunter',desc:'Chose high-protein alternatives 10+ times',target:10,
   metric:function(h){ return h.filter(function(i){return i.score>=7;}).length; }},
  {id:'scanner_pro',icon:'📡',name:'Scanner Pro',desc:'Scan for 7 consecutive days',target:7,
   metric:function(h){
     if(!h.length) return 0;
     var byDay={};
     h.forEach(function(i){ var d=new Date(i.timestamp); d.setHours(0,0,0,0); byDay[d.getTime()]=true; });
     var today=new Date(); today.setHours(0,0,0,0);
     var streak=0;
     for(var i=0;i<30;i++){
       var dt=today.getTime()-i*86400000;
       if(byDay[dt]) streak++; else if(i>0) break;
     }
     return streak;
   }},
  {id:'community_contributor',icon:'🌟',name:'Community Contributor',desc:'Scan 20+ different products',target:20,
   metric:function(h){ var s=new Set(h.map(function(i){return i.barcode;})); return s.size; }},
  {id:'clean_eater',icon:'🥗',name:'Clean Eater',desc:'Scan 50+ products scoring ≥7',target:50,
   metric:function(h){ return h.filter(function(i){return i.score>=7;}).length; }}
];

var _badgeState={};
function loadBadgeState(){ try{_badgeState=JSON.parse(localStorage.getItem(BADGE_KEY)||'{}');}catch(e){_badgeState={};} }
function saveBadgeState(){ localStorage.setItem(BADGE_KEY,JSON.stringify(_badgeState)); }

function calcBadgeProgress(){
  var h=loadHistory();
  var results={};
  BADGE_DEFS.forEach(function(def){
    var val=def.metric(h);
    var earned=val>=def.target;
    var prev=_badgeState[def.id];
    results[def.id]={earned:earned,progress:Math.min(val,def.target),target:def.target,pct:Math.min(100,Math.round(val/def.target*100))};
    if(earned&&!prev){
      // Newly earned
      _badgeState[def.id]=true;
      saveBadgeState();
      showBadgeToast(def);
    }
  });
  return results;
}

function earnedBadges(){
  var progress=calcBadgeProgress();
  return BADGE_DEFS.filter(function(def){ return progress[def.id]&&progress[def.id].earned; });
}

function showBadgeToast(def){
  var existing=document.getElementById('badgeToast');
  if(existing) existing.remove();
  var toast=document.createElement('div');
  toast.id='badgeToast';
  toast.className='badge-toast';
  toast.innerHTML='<div class="badge-toast-icon">'+def.icon+'</div>'
    +'<div class="badge-toast-text"><div class="badge-toast-title">Badge Unlocked!</div>'
    +'<div class="badge-toast-sub">'+def.name+' — '+def.desc+'</div></div>';
  document.body.appendChild(toast);
  setTimeout(function(){
    toast.classList.add('hiding');
    setTimeout(function(){ if(toast.parentNode) toast.remove(); },350);
  },3500);
}

var badgesPanelOpen=false;
function toggleBadgesPanel(){
  badgesPanelOpen=!badgesPanelOpen;
  var panel=document.getElementById('badgesPanel');
  if(badgesPanelOpen){ renderBadgesPanel(); panel.style.display=''; }
  else panel.style.display='none';
}

function renderBadgesPanel(){
  var progress=calcBadgeProgress();
  var panel=document.getElementById('badgesPanel');
  var earned=BADGE_DEFS.filter(function(d){ return progress[d.id]&&progress[d.id].earned; }).length;
  var cards=BADGE_DEFS.map(function(def){
    var p=progress[def.id]||{earned:false,pct:0,progress:0,target:def.target};
    var cls=p.earned?'earned':'locked';
    return '<div class="badge-card '+cls+'">'
      +(p.earned?'<div class="badge-earned-ribbon">✓ Earned</div>':'')
      +'<div class="badge-icon-wrap">'+def.icon+'</div>'
      +'<div class="badge-name">'+def.name+'</div>'
      +'<div class="badge-desc">'+def.desc+'</div>'
      +(p.earned?'':'<div class="badge-progress-wrap"><div class="badge-progress-fill" style="width:'+p.pct+'%;"></div></div>'
        +'<div class="badge-progress-label">'+p.progress+' / '+p.target+'</div>')
      +'</div>';
  }).join('');
  panel.innerHTML='<div class="badges-panel">'
    +'<div class="badges-header-row">'
    +'<div class="badges-title">🏅 Achievements <span class="badge-earned-count">'+earned+'/'+BADGE_DEFS.length+'</span></div>'
    +'</div>'
    +'<div class="badges-grid">'+cards+'</div>'
    +'</div>';
}

function renderProfileBadges(){
  var progress=calcBadgeProgress();
  var grid=document.getElementById('profileBadgesGrid');
  if(!grid) return;
  grid.innerHTML=BADGE_DEFS.map(function(def){
    var p=progress[def.id];
    var cls=(p&&p.earned)?'earned':'locked';
    return '<div class="profile-badge-item '+cls+'" title="'+def.desc+(p&&!p.earned?' ('+p.pct+'% complete)':'')+'">'
      +'<span class="profile-badge-icon">'+def.icon+'</span>'
      +'<div class="profile-badge-name">'+def.name+'</div>'
      +'</div>';
  }).join('');
}

/* ══════════════════════════════════════════════════════
   ENHANCED SHARE (with badges + WhatsApp)
   ══════════════════════════════════════════════════════ */
var _lastShareProd=null;
var _origOpenShareModal=openShareModal;
openShareModal=function(prod){
  _lastShareProd=prod;
  _origOpenShareModal(prod);
  var badgesRow=document.getElementById('sc-badges-row');
  if(badgesRow){
    var earned=earnedBadges();
    badgesRow.innerHTML=earned.slice(0,4).map(function(b){
      return '<span class="share-card-badge-pill">'+b.icon+' '+b.name+'</span>';
    }).join('');
  }
};

function shareToWhatsApp(){
  if(!_lastShareProd) return;
  var p=_lastShareProd.data, r=_lastShareProd.result;
  var name=p.product_name||p.name||'this product';
  var score=r.score, grade=r.grade;
  var earned=earnedBadges();
  var badgeStr=earned.slice(0,3).map(function(b){return b.icon+' '+b.name;}).join(' | ');
  var msg='I just scanned '+name+' — Score: '+score+'/10 (Grade '+grade+') via Swapify 🔬';
  if(badgeStr) msg+='\n'+badgeStr;
  msg+='\nScan smarter: swapify.app';
  var url='https://wa.me/?text='+encodeURIComponent(msg);
  window.open(url,'_blank');
}

/* ══════════════════════════════════════════════════════
   AI PERSONALIZED RECOMMENDATIONS (TASK 2)
   ══════════════════════════════════════════════════════ */
var RECS_URL=BACKEND_BASE_URL+'/recommendations';
var recsPanelOpen=false;
var _recsCache=null;
var _recsCacheTime=0;
var RECS_TTL=120000; // 2-min cache

// Mock recommendations for offline/demo mode
var MOCK_RECS=[
  {barcode:'8906097760011',name:'True Elements Rolled Oats',brand:'True Elements',score:8.5,grade:'B',reason:'Matches your High Protein preference',category:'cereal'},
  {barcode:'8906068720018',name:'Max Protein Peanut Chikki',brand:'Max Protein',score:7.8,grade:'B',reason:'High protein, low sugar – aligns with your goals',category:'protein_bar'},
  {barcode:'8901058000532',name:'Yoga Bar Oats & Berries',brand:'Yoga Bar',score:7.2,grade:'B',reason:'Clean label – no artificial colours or preservatives',category:'cereal'}
];

async function loadRecommendations(forceRefresh){
  var now=Date.now();
  if(!forceRefresh&&_recsCache&&(now-_recsCacheTime)<RECS_TTL) return _recsCache;
  var h=loadHistory();
  // Real backend contract (Dhruv, app.py): GET /recommendations
  //   - query params: user_id (optional int), limit (optional int, 5-10)
  //   - auth: falls back to Authorization: Bearer token when user_id is omitted
  //   - response: {personalized, count, recommendations:[{barcode,product_name,brand,health_score,grade,reason}]}
  try{
    var url=RECS_URL+'?limit=8';
    var res=await fetch(url,{headers:getAuthHeaders()});
    if(res.ok){
      var data=await res.json();
      if(data && Array.isArray(data.recommendations) && data.recommendations.length){
        var mapped=data.recommendations.map(function(r){
          return{barcode:r.barcode,name:r.product_name,brand:r.brand,score:r.health_score,grade:r.grade,reason:r.reason};
        });
        _recsCache=mapped; _recsCacheTime=now;
        return mapped;
      }
    }
  }catch(e){}
  // Local smart fallback: rank CSV products by pref match + score
  var recs=[];
  if(csvDBLoaded){
    var scanBarcodes=new Set(h.map(function(i){return i.barcode;}));
    var cats=h.slice(0,15).map(function(i){return detectCategory(i.name||'');});
    var catFreq={};
    cats.forEach(function(c){ catFreq[c]=(catFreq[c]||0)+1; });
    var topCats=Object.keys(catFreq).sort(function(a,b){return catFreq[b]-catFreq[a];}).slice(0,3);
    var keys=Object.keys(csvDB).slice(0,300);
    var scored=[];
    keys.forEach(function(bc){
      if(scanBarcodes.has(bc)) return;
      var prod=csvDB[bc];
      var norm=normBackend(prod), res=calculateScore(norm,''), ps=prefRelevanceScore(norm,'');
      var cat=detectCategory(prod.product_name||'');
      var catBonus=topCats.indexOf(cat)>=0?1:0;
      scored.push({barcode:bc,name:prod.product_name,brand:prod.brand,score:res.score,grade:res.grade,normalized:norm,prefScore:ps,catBonus:catBonus});
    });
    scored.sort(function(a,b){
      var aRank=(a.prefScore*2)+(a.catBonus)+(a.score*0.5);
      var bRank=(b.prefScore*2)+(b.catBonus)+(b.score*0.5);
      return bRank-aRank;
    });
    recs=scored.slice(0,5).map(function(item){
      var reasonParts=[];
      if(item.prefScore>0){
        var matchedPrefs=activePrefsArray().filter(function(p){var m=PREF_META[p];return m&&m.check(item.normalized,'');});
        if(matchedPrefs.length) reasonParts.push('Matches: '+matchedPrefs.slice(0,2).map(function(p){return PREF_META[p].label;}).join(', '));
      }
      if(item.catBonus) reasonParts.push('Category you scan often');
      if(!reasonParts.length) reasonParts.push('High health score');
      return{barcode:item.barcode,name:item.name,brand:item.brand,score:item.score,grade:item.grade,reason:reasonParts[0]};
    });
  }
  if(!recs.length) recs=MOCK_RECS.slice(0,3);
  _recsCache=recs; _recsCacheTime=now;
  return recs;
}

function toggleRecsPanel(){
  recsPanelOpen=!recsPanelOpen;
  var panel=document.getElementById('recommendationsPanel');
  if(recsPanelOpen){ renderRecsPanel(); panel.style.display=''; }
  else panel.style.display='none';
}

async function renderRecsPanel(forceRefresh){
  var panel=document.getElementById('recommendationsPanel');
  panel.innerHTML='<div class="rec-section"><div class="rec-header-row"><div class="rec-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> AI Recommendations</div><span class="rec-ai-badge">AI ✦</span></div>'+skeletonRows(3)+'</div>';
  try{
    var recs=await loadRecommendations(forceRefresh);
    var h=loadHistory();
    if(!recs||!recs.length){
      panel.innerHTML='<div class="rec-section"><div class="rec-header-row"><div class="rec-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> AI Recommendations</div><span class="rec-ai-badge">AI ✦</span><button class="rec-refresh-btn" onclick="renderRecsPanel(true)">↻ Refresh</button></div><div class="rec-empty">Scan more products to unlock personalised recommendations!</div></div>';
      return;
    }
    var contextNote=h.length?'Based on your '+h.length+' scan'+(h.length>1?'s':'')+(activePrefsArray().length?' & preferences':''):'Curated picks for you';
    var cardsHTML=recs.map(function(rec){
      var gc=rec.score>=9?'score-a':rec.score>=7?'score-b':rec.score>=5?'score-c':rec.score>=3?'score-d':'score-f';
      var gr=rec.grade||(rec.score>=9?'A':rec.score>=7?'B':rec.score>=5?'C':rec.score>=3?'D':'F');
      return '<div class="rec-card">'
        +'<div class="rec-card-score '+gc+'">'+gr+'<span class="rec-lbl">'+rec.score+'</span></div>'
        +'<div class="rec-card-info">'
        +'<div class="rec-card-name">'+(rec.name||'Unknown')+' '+buildRecommendedBadgeHTML(null,{score:rec.score},true)+'</div>'
        +'<div class="rec-card-brand">'+(rec.brand||'')+'</div>'
        +'<span class="rec-card-reason">'+escapeChatText(rec.reason||'Recommended for you')+'</span>'
        +'</div>'
        +'<div class="rec-card-actions">'
        +'<button class="rec-view-btn" onclick="quickScan(\''+rec.barcode+'\')">View</button>'
        +'</div></div>';
    }).join('');
    panel.innerHTML='<div class="rec-section">'
      +'<div class="rec-header-row"><div class="rec-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> AI Recommendations</div><span class="rec-ai-badge">AI ✦</span><button class="rec-refresh-btn" onclick="renderRecsPanel(true)">↻ Refresh</button></div>'
      +'<div style="font-family:\'DM Mono\',monospace;font-size:0.68rem;color:var(--text-muted);margin-bottom:10px;">'+contextNote+'</div>'
      +'<div class="rec-grid">'+cardsHTML+'</div>'
      +'</div>';
  }catch(e){
    panel.innerHTML='<div class="rec-section"><div class="rec-empty">Could not load recommendations.</div></div>';
  }
}

/* ══════════════════════════════════════════════════════
   ENHANCED MONTHLY REPORT + PDF (TASK 1)
   ══════════════════════════════════════════════════════ */

// Override the existing renderMonthlyPanel with enhanced version
var _origRenderMonthlyPanel=renderMonthlyPanel;
renderMonthlyPanel=function(){
  var stats=calcMonthlyStats(monthlyOffset);
  var panel=document.getElementById('monthlyPanel');
  var canGoNext=monthlyOffset<0;

  var navHTML='<div class="monthly-month-nav">'
    +'<button class="month-nav-btn" onclick="navMonthly(-1)" title="Previous month">‹</button>'
    +'<span class="monthly-month-label">'+monthLabel(monthlyOffset)+'</span>'
    +'<button class="month-nav-btn" onclick="navMonthly(1)" '+(canGoNext?'':'disabled')+' title="Next month">›</button>'
    +'</div>';

  if(stats.total===0){
    panel.innerHTML='<div class="weekly-section"><div class="monthly-section" style="padding:0;">'
      +'<div class="monthly-header"><div class="monthly-title">🗓️ Monthly Health Report</div>'+navHTML+'</div>'
      +'<div class="monthly-empty">No scans recorded in '+monthLabel(monthlyOffset)+'. Scan some products to build this report!</div>'
      +'</div></div>';
    return;
  }

  var avgClass=stats.avg>=7?'stat-good':stats.avg>=5?'stat-warn':'stat-bad';
  var trendIcon=stats.trend==='up'?'📈':stats.trend==='down'?'📉':'➡️';
  var trendCls=stats.trend==='up'?'monthly-trend-up':stats.trend==='down'?'monthly-trend-down':'monthly-trend-flat';
  var trendText=stats.trend==='up'?'Improving (+'+stats.trendDiff+' pts vs last month)':stats.trend==='down'?'Declining ('+stats.trendDiff+' pts vs last month)':'Stable vs last month';

  // Score ring SVG
  var pct=stats.avg!==null?stats.avg/10:0;
  var r=42, cx=50, cy=50, circ=2*Math.PI*r;
  var strokeColor=stats.avg>=7?'#C0FF33':stats.avg>=5?'#ffd166':'#ff6b6b';
  var ringHTML='<div class="score-ring-wrap">'
    +'<svg class="score-ring-svg" viewBox="0 0 100 100">'
    +'<circle class="score-ring-track" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>'
    +'<circle class="score-ring-fill" cx="'+cx+'" cy="'+cy+'" r="'+r
      +'" stroke="'+strokeColor+'" stroke-dasharray="'+circ+'" stroke-dashoffset="'+(circ*(1-pct))+'" transform="rotate(-90 50 50)"/>'
    +'<text class="score-ring-text" x="50" y="46" text-anchor="middle" dominant-baseline="middle">'+stats.avg+'</text>'
    +'<text class="score-ring-sub" x="50" y="60" text-anchor="middle">/ 10 avg</text>'
    +'</svg>'
    +'<div class="monthly-trend-pill '+trendCls+'" style="margin-top:6px;">'+trendIcon+' '+trendText+'</div>'
    +'</div>';

  // KPI cards
  var kpiHTML='<div class="monthly-kpi-row">'
    +'<div class="monthly-kpi-card"><div class="monthly-kpi-icon kpi-blue">📊</div><div><div class="monthly-kpi-num">'+stats.total+'</div><div class="monthly-kpi-lbl">Scans This Month</div></div></div>'
    +'<div class="monthly-kpi-card"><div class="monthly-kpi-icon kpi-green">🏆</div><div><div class="monthly-kpi-num stat-good">'+(stats.best?stats.best.score:'—')+'</div><div class="monthly-kpi-lbl">Best Score</div></div></div>'
    +'<div class="monthly-kpi-card"><div class="monthly-kpi-icon kpi-red">⚠️</div><div><div class="monthly-kpi-num stat-bad">'+(stats.worst?stats.worst.score:'—')+'</div><div class="monthly-kpi-lbl">Lowest Score</div></div></div>'
    +'<div class="monthly-kpi-card"><div class="monthly-kpi-icon kpi-gold">🔥</div><div><div class="monthly-kpi-num">'+(calcDashboardStats().streak||0)+'</div><div class="monthly-kpi-lbl">Day Streak</div></div></div>'
    +'</div>';

  var bestHTML=stats.best?('<div class="bw-name">'+(stats.best.name||'Unknown')+'</div><div class="bw-score">'+stats.best.score+'/10 ('+stats.best.grade+')</div>'):'<div class="bw-name">—</div>';
  var worstHTML=stats.worst?('<div class="bw-name">'+(stats.worst.name||'Unknown')+'</div><div class="bw-score">'+stats.worst.score+'/10 ('+stats.worst.grade+')</div>'):'<div class="bw-name">—</div>';
  var bwHTML='<div class="monthly-best-worst"><div class="bw-card bw-best"><div class="bw-label">🏆 Best Scoring</div>'+bestHTML+'</div><div class="bw-card bw-worst"><div class="bw-label">⚠️ Lowest Scoring</div>'+worstHTML+'</div></div>';

  var catEntries=Object.keys(stats.catCounts).sort(function(a,b){return stats.catCounts[b]-stats.catCounts[a];});
  var maxCat=catEntries.length?stats.catCounts[catEntries[0]]:1;
  var catBarsHTML=catEntries.length
    ? catEntries.map(function(cat){
        var c=stats.catCounts[cat], pct=Math.round((c/maxCat)*100);
        return '<div class="category-bar-row"><div class="category-bar-label">'+cat.replace(/_/g,' ')+'</div><div class="category-bar-track"><div class="category-bar-fill" style="width:'+pct+'%;"></div></div><div class="category-bar-count">'+c+'</div></div>';
      }).join('')
    : '<div class="scan-empty">No category data</div>';

  panel.innerHTML='<div class="weekly-section"><div class="monthly-section" style="padding:0;">'
    +'<div class="monthly-header">'
    +'<div class="monthly-title">🗓️ Monthly Health Report</div>'
    +'<div style="display:flex;gap:8px;align-items:center;">'+navHTML
    +'<button class="monthly-pdf-btn" onclick="downloadMonthlyPDF()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    +' Download PDF</button>'
    +'</div></div>'
    +kpiHTML
    +'<div class="monthly-chart-row">'
    +'<div class="monthly-chart-block">'
    +'<div class="monthly-chart-label">Score Trend</div>'
    +'<div class="chart-canvas-wrap"><canvas id="monthlyTrendCanvas"></canvas></div>'
    +'</div>'
    +'<div class="monthly-chart-block" style="display:flex;flex-direction:column;gap:10px;">'
    +ringHTML
    +'</div>'
    +'</div>'
    +'<div class="monthly-chart-block" style="margin-top:12px;background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">'
    +'<div class="monthly-chart-label">Category Breakdown</div>'+catBarsHTML+'</div>'
    +bwHTML
    +'</div></div>';

  renderMonthlyTrendChart(stats);
};

/* ── PDF DOWNLOAD ── */
async function downloadMonthlyPDF(){
  var stats=calcMonthlyStats(monthlyOffset);
  var user=currentUser;
  var monthStr=monthLabel(monthlyOffset);

  if(typeof window.jspdf==='undefined'){
    alert('PDF library not loaded. Please check your internet connection.');
    return;
  }

  var btn=document.querySelector('.monthly-pdf-btn');
  if(btn){ btn.textContent='Generating…'; btn.disabled=true; }

  try{
    var jsPDF=window.jspdf.jsPDF;
    var doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    var PAGE_W=210, PAGE_H=297, M=18, CW=PAGE_W-M*2;

    // ─── Header ────────────────────────────────────────
    doc.setFillColor(7,29,74);
    doc.rect(0,0,PAGE_W,30,'F');
    doc.setTextColor(192,255,51);
    doc.setFontSize(18);doc.setFont('helvetica','bold');
    doc.text('Swapify',M,18);
    doc.setTextColor(255,255,255);
    doc.setFontSize(10);doc.setFont('helvetica','normal');
    doc.text('Monthly Health Report',M+28,18);
    doc.setFontSize(9);
    doc.text(monthStr+(user?' — '+user.name:''),PAGE_W-M,14,{align:'right'});

    var y=42;

    // ─── KPI Summary ───────────────────────────────────
    doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(10,42,102);
    doc.text('Summary',M,y); y+=7;

    var kpis=[
      ['Total Scans',String(stats.total),'#3b6bff'],
      ['Average Score',(stats.avg!==null?String(stats.avg):'—')+(stats.avg>=7?' (Good)':stats.avg>=5?' (OK)':' (Low)'),stats.avg>=7?'#5a9216':stats.avg>=5?'#c08a00':'#d9534f'],
      ['Best Score',(stats.best?stats.best.score+'  '+stats.best.name:'—'),'#5a9216'],
      ['Worst Score',(stats.worst?stats.worst.score+'  '+stats.worst.name:'—'),'#d9534f'],
      ['Trend',stats.trend==='up'?'Improving (+'+stats.trendDiff+' pts)':stats.trend==='down'?'Declining ('+stats.trendDiff+' pts)':'Stable',stats.trend==='up'?'#5a9216':stats.trend==='down'?'#d9534f':'#c08a00']
    ];

    kpis.forEach(function(kpi){
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(106,122,154);
      doc.text(kpi[0]+':',M,y);
      doc.setFont('helvetica','normal');
      var rgb=hexToRgb(kpi[2])||{r:10,g:42,b:102};
      doc.setTextColor(rgb.r,rgb.g,rgb.b);
      doc.text(String(kpi[1]),M+42,y);
      y+=6;
    });

    y+=4;

    // ─── Category Breakdown ─────────────────────────────
    var cats=Object.keys(stats.catCounts).sort(function(a,b){return stats.catCounts[b]-stats.catCounts[a];});
    if(cats.length){
      doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(10,42,102);
      doc.text('Category Breakdown',M,y); y+=6;
      var maxC=stats.catCounts[cats[0]];
      cats.slice(0,6).forEach(function(cat){
        var c=stats.catCounts[cat];
        var pct=c/maxC;
        var barW=CW*0.55;
        doc.setFillColor(220,230,245);
        doc.roundedRect(M+46,y-3.5,barW,5,1,1,'F');
        doc.setFillColor(59,107,255);
        doc.roundedRect(M+46,y-3.5,barW*pct,5,1,1,'F');
        doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(106,122,154);
        doc.text(cat.replace(/_/g,' '),M,y);
        doc.text(String(c),M+46+barW+3,y);
        y+=8;
      });
    }

    y+=4;

    // ─── Recent Scans ───────────────────────────────────
    if(stats.history.length){
      doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(10,42,102);
      doc.text('Recent Scans This Month',M,y); y+=6;
      stats.history.slice(0,8).forEach(function(item){
        var gradeColor=item.score>=9?'#5a9e00':item.score>=7?'#2a7dd4':item.score>=5?'#c98000':'#e03a3a';
        var rgb=hexToRgb(gradeColor)||{r:10,g:42,b:102};
        var ds=new Date(item.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
        doc.setFillColor(245,247,252);
        doc.roundedRect(M,y-4,CW,8,2,2,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(rgb.r,rgb.g,rgb.b);
        doc.text(String(item.score)+'/10',M+2,y);
        doc.setFont('helvetica','normal');doc.setTextColor(10,42,102);
        doc.text((item.name||'Unknown').substring(0,40),M+16,y);
        doc.setTextColor(106,122,154);
        doc.text(ds,PAGE_W-M,y,{align:'right'});
        y+=10;
        if(y>PAGE_H-30){ doc.addPage(); y=22; }
      });
    }

    // ─── Badges ─────────────────────────────────────────
    var earned=earnedBadges();
    if(earned.length){
      y+=4;
      doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(10,42,102);
      doc.text('Badges Earned',M,y); y+=6;
      doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(10,42,102);
      earned.forEach(function(b){ doc.text(b.icon+' '+b.name+' — '+b.desc,M,y); y+=6; });
    }

    // ─── Footer ─────────────────────────────────────────
    doc.setFillColor(7,29,74);
    doc.rect(0,PAGE_H-14,PAGE_W,14,'F');
    doc.setTextColor(192,255,51);doc.setFontSize(8);
    doc.text('Swapify  ·  Scan. Compare. Eat Smarter.  ·  swapify.app',PAGE_W/2,PAGE_H-5,{align:'center'});

    doc.save('Swapify-Monthly-Report-'+monthStr.replace(/\s/g,'-')+'.pdf');
  }catch(err){
    console.error('PDF error:',err);
    alert('PDF generation failed: '+err.message);
  } finally {
    if(btn){ btn.textContent='⬇ Download PDF'; btn.disabled=false; }
  }
}

function hexToRgb(hex){
  var r=null;
  if(hex&&hex[0]==='#'){
    var big=parseInt(hex.slice(1),16);
    if(hex.length===7) r={r:(big>>16)&255,g:(big>>8)&255,b:big&255};
    else if(hex.length===4) r={r:((big>>8)&15)*17,g:((big>>4)&15)*17,b:(big&15)*17};
  }
  return r;
}

/* ══════════════════════════════════════════════════════
   TASK 1: CROWDSOURCED PRODUCT RATINGS
   ══════════════════════════════════════════════════════ */
// Real backend contract (Dhruv, app.py):
//   POST /rate-product   body:{barcode, taste_rating, quality_rating, value_rating} (each 1-5 int)
//                         requires Authorization: Bearer <token> (Depends(get_current_user) — NOT optional)
//   GET  /product/{barcode}/ratings  -> {barcode,total_ratings,average_ratings:{taste,quality,value,overall}}
//   GET  /user/ratings  (auth) -> this user's own past ratings
// localStorage remains the fallback when the backend is unreachable or the
// user hasn't logged in yet, so the UI still works standalone.
var RATINGS_KEY='swapify-ratings-v1'; // {barcode:[{taste,quality,value,ts,mine}]} — local fallback only
var MY_OWN_RATINGS_KEY='swapify-my-ratings-v1'; // {barcode:{taste,quality,value}}
var _ratingModalBarcode=null, _ratingModalName='';
var _ratingDraft={taste:0,quality:0,value:0};
var _backendRatingCache={}; // {barcode:{count,taste,quality,value}} — last-known server truth

function loadAllRatings(){ try{return JSON.parse(localStorage.getItem(RATINGS_KEY)||'{}');}catch(e){return{};} }
function saveAllRatings(obj){ localStorage.setItem(RATINGS_KEY,JSON.stringify(obj)); }
function loadMyOwnRatings(){ try{return JSON.parse(localStorage.getItem(MY_OWN_RATINGS_KEY)||'{}');}catch(e){return{};} }
function saveMyOwnRatings(obj){ localStorage.setItem(MY_OWN_RATINGS_KEY,JSON.stringify(obj)); }

function computeLocalRatingAverages(barcode){
  var all=loadAllRatings(), entries=all[barcode]||[];
  if(!entries.length) return null;
  function avg(key){ return entries.reduce(function(s,e){return s+(e[key]||0);},0)/entries.length; }
  return{count:entries.length,taste:avg('taste'),quality:avg('quality'),value:avg('value')};
}

function starsDisplayHTML(avg){
  var rounded=Math.round(avg);
  var html='';
  for(var i=1;i<=5;i++){ html+= i<=rounded ? '\u2605' : '<span class="star-empty">\u2605</span>'; }
  return html;
}

function buildRatingSectionHTML(barcode,productName){
  // Prefer real community data already fetched from the backend this session;
  // fall back to this browser's own local ratings until that arrives.
  var stats=_backendRatingCache[barcode]||computeLocalRatingAverages(barcode);
  var body;
  if(!stats||!stats.count){
    body='<div class="rating-none-yet">No ratings yet — be the first to rate this product!</div>';
  } else {
    body='<div class="rating-avg-grid">'
      +'<div class="rating-avg-item"><div class="rating-avg-label">\uD83D\uDE0B Taste</div><div class="rating-stars-display">'+starsDisplayHTML(stats.taste)+'</div><div class="rating-avg-num">'+stats.taste.toFixed(1)+'</div></div>'
      +'<div class="rating-avg-item"><div class="rating-avg-label">\uD83C\uDFC6 Quality</div><div class="rating-stars-display">'+starsDisplayHTML(stats.quality)+'</div><div class="rating-avg-num">'+stats.quality.toFixed(1)+'</div></div>'
      +'<div class="rating-avg-item"><div class="rating-avg-label">\uD83D\uDCB0 Value</div><div class="rating-stars-display">'+starsDisplayHTML(stats.value)+'</div><div class="rating-avg-num">'+stats.value.toFixed(1)+'</div></div>'
      +'</div>'
      +'<div class="rating-count-note">Based on '+stats.count+' rating'+(stats.count>1?'s':'')+' (community average)</div>';
  }
  // Bug fix: "your rating" was never shown anywhere — only the pooled
  // community average. Surface it separately, above the average, whenever
  // this browser has a saved rating for this product.
  var mine=loadMyOwnRatings()[barcode];
  var mineHTML=mine
    ? '<div class="rating-mine-row">'
      +'<div class="rating-mine-label">\u2B50 Your Rating</div>'
      +'<div class="rating-avg-grid">'
        +'<div class="rating-avg-item"><div class="rating-avg-label">\uD83D\uDE0B Taste</div><div class="rating-stars-display">'+starsDisplayHTML(mine.taste)+'</div></div>'
        +'<div class="rating-avg-item"><div class="rating-avg-label">\uD83C\uDFC6 Quality</div><div class="rating-stars-display">'+starsDisplayHTML(mine.quality)+'</div></div>'
        +'<div class="rating-avg-item"><div class="rating-avg-label">\uD83D\uDCB0 Value</div><div class="rating-stars-display">'+starsDisplayHTML(mine.value)+'</div></div>'
      +'</div>'
      +'</div>'
    : '';
  var safeName=(productName||'').replace(/'/g,"\\'");
  return '<div class="rating-section-card" id="ratingSectionCard-'+barcode+'">'
    +'<div class="rating-section-header"><div class="rating-section-title">\u2B50 Community Ratings</div>'
    +'<button class="btn-rate-product" onclick="openRatingModal(\''+barcode+'\',\''+safeName+'\')">\u270D Rate This Product</button></div>'
    +mineHTML
    +body
    +'</div>';
}

// Fetches the real community average from the backend and patches the rating
// card in place once it arrives (called right after the product renders).
async function refreshRatingSectionFromBackend(barcode,productName){
  try{
    var res=await fetch(BACKEND_BASE_URL+'/product/'+encodeURIComponent(barcode)+'/ratings');
    if(!res.ok) return;
    var data=await res.json();
    var a=data.average_ratings||{};
    _backendRatingCache[barcode]={count:data.total_ratings||0,taste:a.taste||0,quality:a.quality||0,value:a.value||0};
    var card=document.getElementById('ratingSectionCard-'+barcode);
    if(card) card.outerHTML=buildRatingSectionHTML(barcode,productName);
  }catch(e){ /* backend unreachable — local/no-data display stands */ }
}

function openRatingModal(barcode,name){
  // Allow ratings without login — saved locally and synced if user later logs in
  _ratingModalBarcode=barcode; _ratingModalName=name||'this product';
  document.getElementById('ratingModalProductName').textContent=_ratingModalName;
  var mine=loadMyOwnRatings()[barcode];
  _ratingDraft={taste:mine?mine.taste:0,quality:mine?mine.quality:0,value:mine?mine.value:0};
  document.getElementById('ratingModalHint').textContent=mine?'You already rated this — tap to update your rating.':'Tap stars to rate, then submit.';
  renderStarRow('starRowTaste','taste');
  renderStarRow('starRowQuality','quality');
  renderStarRow('starRowValue','value');
  document.getElementById('ratingModalOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeRatingModal(){ document.getElementById('ratingModalOverlay').classList.remove('active'); document.body.style.overflow=''; }
function handleRatingOverlayClick(e){ if(e.target===document.getElementById('ratingModalOverlay')) closeRatingModal(); }

function renderStarRow(elId,param){
  var el=document.getElementById(elId);
  var html='';
  for(var i=1;i<=5;i++){
    html+='<span class="star-btn'+(i<=_ratingDraft[param]?' filled':'')+'" onclick="setRatingDraft(\''+param+'\','+i+')">\u2605</span>';
  }
  el.innerHTML=html;
}
function setRatingDraft(param,val){
  _ratingDraft[param]=val;
  var map={taste:'starRowTaste',quality:'starRowQuality',value:'starRowValue'};
  renderStarRow(map[param],param);
}

async function submitProductRating(){
  if(!_ratingModalBarcode) return;
  if(!_ratingDraft.taste||!_ratingDraft.quality||!_ratingDraft.value){
    alert('Please rate all three: Taste, Quality, and Value for Money.');
    return;
  }
  var barcode=_ratingModalBarcode;

  // Always keep a local copy so the UI works even if the backend call fails.
  var all=loadAllRatings();
  var myRatings=loadMyOwnRatings();
  var entries=all[barcode]||[];
  var idx=entries.findIndex(function(e){return e.mine===true;});
  if(idx!==-1) entries.splice(idx,1);
  entries.push({taste:_ratingDraft.taste,quality:_ratingDraft.quality,value:_ratingDraft.value,ts:Date.now(),mine:true});
  all[barcode]=entries;
  saveAllRatings(all);
  myRatings[barcode]={taste:_ratingDraft.taste,quality:_ratingDraft.quality,value:_ratingDraft.value};
  saveMyOwnRatings(myRatings);

  closeRatingModal();
  showToast('Rating saved — thanks!','success');

  try{
    var res=await fetch(BACKEND_BASE_URL+'/rate-product',{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify({
        barcode:barcode,
        taste_rating:_ratingDraft.taste,
        quality_rating:_ratingDraft.quality,
        value_rating:_ratingDraft.value
      })
    });
    if(res.ok){
      // Pull the fresh server-side community average back into the card.
      await refreshRatingSectionFromBackend(barcode,(lastScannedProduct&&lastScannedProduct.data&&lastScannedProduct.data.product_name)||_ratingModalName);
      return;
    }
    handleAuthExpiry(res); // if the token had expired, log out cleanly and say so once
  }catch(e){ /* backend unreachable — local rating already saved below */ }

  // Backend call failed/unreachable: at least refresh the card from local data.
  var card=document.getElementById('ratingSectionCard-'+barcode);
  if(card){
    card.outerHTML=buildRatingSectionHTML(barcode,(lastScannedProduct&&lastScannedProduct.data&&lastScannedProduct.data.product_name)||_ratingModalName);
  }
}

/* ══════════════════════════════════════════════════════
   TASK 2: MY SWAPS
   ══════════════════════════════════════════════════════ */
var MY_SWAPS_KEY='swapify-my-swaps-v1';
var mySwapsPanelOpen=false;

function loadMySwaps(){ try{return JSON.parse(localStorage.getItem(MY_SWAPS_KEY)||'[]');}catch(e){return[];} }
function saveMySwapsList(list){ localStorage.setItem(MY_SWAPS_KEY,JSON.stringify(list)); }
function isSwapSaved(origBarcode,altBarcode){ return loadMySwaps().some(function(s){return s.originalBarcode===origBarcode&&s.altBarcode===altBarcode;}); }

function saveSwapFromAlt(origBarcode,altBarcode){
  if(isSwapSaved(origBarcode,altBarcode)){
    var list=loadMySwaps().filter(function(s){return !(s.originalBarcode===origBarcode&&s.altBarcode===altBarcode);});
    saveMySwapsList(list);
    refreshSwapButtons();
    if(mySwapsPanelOpen) renderMySwapsPanel();
    return;
  }
  var alt=(window.__altLookup&&window.__altLookup[altBarcode])||null;
  if(!alt) return;
  var originalName=(lastScannedProduct&&lastScannedProduct.data&&(lastScannedProduct.data.product_name||lastScannedProduct.data.name))||'Unknown';
  var list=loadMySwaps();
  list.unshift({
    id:'swap_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
    originalBarcode:origBarcode,
    originalName:originalName,
    altBarcode:altBarcode,
    altName:alt.product_name||'Unknown',
    altBrand:alt.brand||'',
    altScore:alt.health_score,
    altGrade:alt.grade,
    note:'',
    addedAt:Date.now()
  });
  saveMySwapsList(list);
  refreshSwapButtons();
  if(mySwapsPanelOpen) renderMySwapsPanel();
}

function refreshSwapButtons(){
  document.querySelectorAll('.alt-save-swap-btn').forEach(function(btn){
    var orig=btn.getAttribute('data-swap-orig'), alt=btn.getAttribute('data-swap-alt');
    var saved=isSwapSaved(orig,alt);
    btn.classList.toggle('saved',saved);
    btn.textContent=saved?'\u2713 Saved to My Swaps':'\uD83D\uDCBE Save Swap';
  });
}

function removeSwap(id){
  var list=loadMySwaps().filter(function(s){return s.id!==id;});
  saveMySwapsList(list);
  renderMySwapsPanel();
  refreshSwapButtons();
}

function updateSwapNote(id,note){
  var list=loadMySwaps();
  var item=list.find(function(s){return s.id===id;});
  if(item){ item.note=note; saveMySwapsList(list); }
}

function toggleMySwapsPanel(){
  mySwapsPanelOpen=!mySwapsPanelOpen;
  var panel=document.getElementById('mySwapsPanel');
  if(mySwapsPanelOpen){ renderMySwapsPanel(); panel.style.display=''; }
  else panel.style.display='none';
}
function openMySwapsPanel(){
  mySwapsPanelOpen=true;
  renderMySwapsPanel();
  var panel=document.getElementById('mySwapsPanel');
  panel.style.display='';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderMySwapsPanel(){
  var swaps=loadMySwaps();
  var panel=document.getElementById('mySwapsPanel');
  var itemsHTML=swaps.length===0
    ? '<div class="swap-empty">\uD83D\uDECD\uFE0F No saved swaps yet. Scan a product, find a Healthier Swap below it, and tap "Save Swap" to build your personal library here.</div>'
    : swaps.map(function(s){
        var gc=s.altScore>=9?'score-a':s.altScore>=7?'score-b':s.altScore>=5?'score-c':s.altScore>=3?'score-d':'score-f';
        return '<div class="swap-item">'
          +'<div class="swap-item-flow">'
          +'<div class="swap-item-orig">'+(s.originalName||'Unknown')+'</div>'
          +'<div class="swap-arrow">\u2192</div>'
          +'<div class="swap-item-alt-wrap"><div class="swap-item-alt-name">'+(s.altName||'Unknown')+'</div><div class="swap-item-alt-brand">'+(s.altBrand||'')+'</div></div>'
          +'<div class="swap-item-score '+gc+'">'+s.altGrade+'</div>'
          +'</div>'
          +'<div class="swap-note-row"><input type="text" class="swap-note-input" placeholder="Add a note e.g. tastes better than original" value="'+(s.note||'').replace(/"/g,'&quot;')+'" onchange="updateSwapNote(\''+s.id+'\',this.value)"></div>'
          +'<div class="swap-item-actions"><button class="btn-swap-remove" onclick="removeSwap(\''+s.id+'\')">\u2715 Remove</button></div>'
          +'</div>';
      }).join('');
  panel.innerHTML='<div class="swap-section">'
    +'<div class="swap-header-row"><div class="swap-title">\uD83D\uDECD\uFE0F My Swaps <span class="swap-count-badge">'+swaps.length+'</span></div></div>'
    +'<div class="swap-grid">'+itemsHTML+'</div></div>';
}

/* ══════════════════════════════════════════════════════
   TASK 3: PERSONALIZED HOME DASHBOARD
   ══════════════════════════════════════════════════════ */
function dashScoreClass(score){ return score>=9?'score-a':score>=7?'score-b':score>=5?'score-c':score>=3?'score-d':'score-f'; }

function dashQuickActionsHTML(){
  return '<div class="dash-quick-actions">'
    +'<div class="dash-quick-btn" onclick="dashGoScan()"><span class="dash-quick-icon">\uD83D\uDCF7</span>Scan</div>'
    +'<div class="dash-quick-btn" onclick="openMultiComparePanel()"><span class="dash-quick-icon">\u2696\uFE0F</span>Compare</div>'
    +'<div class="dash-quick-btn" onclick="openProfilePanel()"><span class="dash-quick-icon">\uD83D\uDCDC</span>History</div>'
    +'<div class="dash-quick-btn" onclick="openMySwapsPanel()"><span class="dash-quick-icon">\uD83D\uDECD\uFE0F</span>My Swaps</div>'
    +'</div>';
}
function dashGoScan(){
  document.querySelector('.card').scrollIntoView({behavior:'smooth',block:'start'});
  setTimeout(function(){var i=document.getElementById('barcodeInput');if(i)i.focus();},350);
}

// Assumed contract (Dhruv, app.py) — not yet confirmed against his real
// implementation, verify & adjust field names once he shares the exact spec.
// GET /home-feed, Authorization: Bearer optional (only called when a real
// logged-in session exists — see isReallyLoggedIn() below).
// Assumed response: {personalized, recent_scans:[{barcode,product_name,score,
// grade,scanned_at}], recommendations:[{barcode,product_name,brand,
// health_score,grade,reason}], badges_earned:[{name,icon,description}],
// challenge_progress:[{name,icon,current,target}]}.
// Any field that's missing/malformed falls back to this file's existing
// local computation per-section, so the dashboard degrades gracefully.
// Confirmed contract (Dhruv, app.py / API_DOCS.md #26): GET /home-feed works
// for BOTH anonymous and authenticated callers (no auth required, but sends
// the token when present so authenticated users get personalization).
// Response: {user_id, logged_in, personalized, recently_scanned:[{barcode,
// product_name,health_score,grade,scanned_at}], recommended_products:[{barcode,
// product_name,brand,health_score,grade,reason}], weekly_challenge:{id,code,
// title,description,goal_type,target,period,badge,joined,progress:{current,
// target,completed,percent,remaining}|null}, badges_earned:[{badge,
// challenge_id,title}]}.
var HOME_FEED_URL=BACKEND_BASE_URL+'/home-feed';
async function tryFetchHomeFeed(){
  try{
    var res=await fetch(HOME_FEED_URL,{headers:getAuthHeaders()});
    if(!res.ok) return null;
    return await res.json();
  }catch(e){ return null; }
}
function _wchalIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 14.5 7 22l5-3 5 3-2-7.5"/></svg>';
}
function _wchalDaysHTML(pct){
  var done=Math.max(0,Math.min(7,Math.round((pct/100)*7)));
  var dots='';
  for(var i=0;i<7;i++){
    var cls=i<done?'done':(i===done?'today':'');
    dots+='<div class="wchal-day '+cls+'"></div>';
  }
  return '<div class="wchal-days">'+dots+'</div>';
}
// Renders the single weekly_challenge object /home-feed returns (not a list).
// If the user hasn't joined it yet, `progress` is null and we show a "Join"
// prompt instead of a bar, per the documented anonymous/unjoined shape.
async function buildChallengePreviewFromFeed(c){
  if(!c) return await buildChallengesPreviewHTML();
  var title=c.title||'Weekly Challenge';
  if(!c.progress){
    return '<div class="wchal-card">'
      +'<div class="wchal-top"><div class="wchal-eyebrow">\u2605 This Week\u2019s Challenge</div></div>'
      +'<div class="wchal-title">'+title+'</div>'
      +'<div class="wchal-sub">'+(c.description||'')+'</div>'
      +'<button class="wchal-join-btn" onclick="toggleChallengesPanel()">Join This Challenge</button>'
      +'</div>';
  }
  var p=c.progress, pct=p.percent!==undefined?p.percent:Math.min(100,Math.round((p.current/p.target)*100));
  return '<div class="wchal-card">'
    +'<div class="wchal-top"><div class="wchal-eyebrow">\u2605 This Week\u2019s Challenge</div><div class="wchal-pct-pill">'+pct+'% there</div></div>'
    +'<div class="wchal-title">'+title+'</div>'
    +'<div class="wchal-sub">'+(c.description||'')+'</div>'
    +'<div class="wchal-progress-row"><div class="wchal-track"><div class="wchal-fill" style="width:'+pct+'%;"></div></div><div class="wchal-count">'+p.current+'/'+p.target+'</div></div>'
    +_wchalDaysHTML(pct)
    +'<div class="wchal-footer"><div class="wchal-reward"><div class="wchal-reward-badge">'+_wchalIcon()+'</div><div class="wchal-reward-text"><b>'+(c.badge||'Challenge badge')+'</b>'+(p.remaining>0?p.remaining+' more to unlock':'Unlocked!')+'</div></div><button class="wchal-cta" onclick="toggleChallengesPanel()">View challenge \u2192</button></div>'
    +'</div>';
}

async function renderHomeDashboard(){
  var el=document.getElementById('homeDashboard');
  if(!el) return;
  var h=loadHistory();
  var user=currentUser;
  var greeting=user?('\uD83D\uDC4B Welcome back, '+user.name):'\uD83D\uDC4B Welcome to Swapify';
  var sub=user?'Your personalized health feed':'Scan a product or log in to personalize this feed';

  var feed=await tryFetchHomeFeed();
  var feedNote=''; // Task 2C: was a dev-only "via /home-feed" badge leaking an internal endpoint name into the UI
  var isPersonalized=!!(feed&&feed.personalized);

  if(!isPersonalized && !h.length){
    var trendingHTML='<div class="dash-empty-note">Scan your first product to start building your personalized feed!</div>';
    var genericFromFeed=(feed&&Array.isArray(feed.recommended_products)&&feed.recommended_products.length)?feed.recommended_products:null;
    if(genericFromFeed){
      trendingHTML='<div class="dash-recent-row">'+genericFromFeed.slice(0,5).map(function(t){
        return '<div class="dash-mini-card" onclick="quickScan(\''+t.barcode+'\')"><div class="dash-mini-score '+dashScoreClass(t.health_score)+'">'+t.grade+'</div><div class="dash-mini-name">'+(t.product_name||'Unknown')+'</div><div class="dash-mini-meta">'+t.health_score+'/10</div></div>';
      }).join('')+'</div>';
    } else if(csvDBLoaded){
      var keys=Object.keys(csvDB).slice(0,20);
      var scored=keys.map(function(bc){var prod=csvDB[bc];var norm=normBackend(prod);var res=calculateScore(norm,'');return{barcode:bc,name:prod.product_name,brand:prod.brand,score:res.score,grade:res.grade};});
      scored.sort(function(a,b){return b.score-a.score;});
      var top=scored.slice(0,5);
      if(top.length){
        trendingHTML='<div class="dash-recent-row">'+top.map(function(t){
          return '<div class="dash-mini-card" onclick="quickScan(\''+t.barcode+'\')"><div class="dash-mini-score '+dashScoreClass(t.score)+'">'+t.grade+'</div><div class="dash-mini-name">'+(t.name||'Unknown')+'</div><div class="dash-mini-meta">'+t.score+'/10</div></div>';
        }).join('')+'</div>';
      }
    }
    var chalPreview=(feed&&feed.weekly_challenge)?await buildChallengePreviewFromFeed(feed.weekly_challenge):await buildChallengesPreviewHTML();
    el.innerHTML='<div class="dash-section">'
      +'<div class="dash-welcome-row"><div><div class="dash-welcome-title">'+greeting+' '+feedNote+'</div><div class="dash-welcome-sub">'+sub+'</div></div></div>'
      +dashQuickActionsHTML()
      +'<div class="dash-block"><div class="dash-block-header"><div class="dash-block-title">\uD83C\uDFC6 This Week\u2019s Challenge</div><button class="dash-view-all-btn" onclick="toggleChallengesPanel()">View All \u2192</button></div>'+chalPreview+'</div>'
      +'<div class="dash-block"><div class="dash-block-header"><div class="dash-block-title">\u2728 Popular Products</div><span class="dash-generic-tag">Trending</span></div>'+trendingHTML+'</div>'
      +'</div>';
    return;
  }

  var recentHTML;
  if(feed&&Array.isArray(feed.recently_scanned)&&feed.recently_scanned.length){
    recentHTML='<div class="dash-recent-row">'+feed.recently_scanned.slice(0,5).map(function(item){
      var gc=dashScoreClass(item.health_score);
      var ds=item.scanned_at?new Date(item.scanned_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'';
      return '<div class="dash-mini-card" onclick="quickScan(\''+item.barcode+'\')"><div class="dash-mini-score '+gc+'">'+item.grade+'</div><div class="dash-mini-name">'+(item.product_name||'Unknown')+'</div><div class="dash-mini-meta">'+item.health_score+'/10'+(ds?' \u00b7 '+ds:'')+'</div></div>';
    }).join('')+'</div>';
  } else {
    var recent=h.slice(0,5);
    recentHTML='<div class="dash-recent-row">'+recent.map(function(item){
      var gc=dashScoreClass(item.score);
      var ds=new Date(item.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      return '<div class="dash-mini-card" onclick="quickScan(\''+item.barcode+'\')"><div class="dash-mini-score '+gc+'">'+item.grade+'</div><div class="dash-mini-name">'+(item.name||'Unknown')+'</div><div class="dash-mini-meta">'+item.score+'/10 \u00b7 '+ds+'</div></div>';
    }).join('')+'</div>';
  }

  var recs=[];
  if(feed&&Array.isArray(feed.recommended_products)&&feed.recommended_products.length){
    recs=feed.recommended_products.map(function(r){return{barcode:r.barcode,name:r.product_name,brand:r.brand,score:r.health_score,grade:r.grade,reason:r.reason};});
  } else {
    try{ recs=await loadRecommendations(); }catch(e){ recs=[]; }
  }
  // Task 2D: nothing scoring 7 or below is ever labeled a "Top Pick" — the
  // /recommendations backend ranks by relevance (category match, preferences,
  // community rating), not a health-score floor, so a mediocre product could
  // otherwise surface here. Filtered client-side until this is enforced
  // server-side (coordinate with Dhruv on adding the same >7 floor the
  // "Swapify Recommended" badge already uses).
  recs=(recs||[]).filter(function(rec){ return (rec.score||0)>7; });
  var recsHTML=recs&&recs.length
    ? '<div class="dash-rec-row">'+recs.slice(0,3).map(function(rec){
        var gc=dashScoreClass(rec.score);
        var gr=rec.grade||(rec.score>=9?'A':rec.score>=7?'B':rec.score>=5?'C':rec.score>=3?'D':'F');
        return '<div class="dash-rec-card" onclick="quickScan(\''+rec.barcode+'\')"><div class="dash-rec-score '+gc+'">'+gr+'</div><div><div class="dash-rec-name">'+(rec.name||'Unknown')+' '+buildRecommendedBadgeHTML(null,{score:rec.score},true)+'</div><div class="dash-rec-reason">'+escapeChatText(rec.reason||'Recommended for you')+'</div></div></div>';
      }).join('')+'</div>'
    : '<div class="dash-empty-note">No products score high enough for a Top Pick yet — keep scanning to discover healthier options!</div>';

  var earned=[];
  if(feed&&Array.isArray(feed.badges_earned)&&feed.badges_earned.length){
    earned=feed.badges_earned.map(function(b){return{icon:'\uD83C\uDFC5',name:b.title||b.badge||'Badge'};});
  } else {
    try{ earned=earnedBadges(); }catch(e){ earned=[]; }
  }
  var badgesHTML=earned.length
    ? '<div class="dash-badges-row">'+earned.slice(0,6).map(function(b){
        return '<div class="dash-badge-mini"><span class="dash-badge-mini-icon">'+b.icon+'</span><span class="dash-badge-mini-name">'+b.name+'</span></div>';
      }).join('')+'</div>'
    : '<div class="dash-empty-note">No badges yet — keep scanning to earn your first one!</div>';

  var challengesHTML=(feed&&feed.weekly_challenge)?await buildChallengePreviewFromFeed(feed.weekly_challenge):await buildChallengesPreviewHTML();

  el.innerHTML='<div class="dash-section">'
    +'<div class="dash-welcome-row"><div><div class="dash-welcome-title">'+greeting+' '+feedNote+'</div><div class="dash-welcome-sub">'+sub+'</div></div></div>'
    +dashQuickActionsHTML()
    +'<div class="dash-block"><div class="dash-block-header"><div class="dash-block-title">\uD83C\uDFC6 This Week\u2019s Challenge</div><button class="dash-view-all-btn" onclick="toggleChallengesPanel()">View All \u2192</button></div>'+challengesHTML+'</div>'
    +'<div class="dash-block"><div class="dash-block-header"><div class="dash-block-title">\uD83D\uDD53 Recently Scanned</div></div>'+recentHTML+'</div>'
    +'<div class="dash-block"><div class="dash-block-header"><div class="dash-block-title">\u2728 Top Picks For You</div></div>'+recsHTML+'</div>'
    +'<div class="dash-block"><div class="dash-block-header"><div class="dash-block-title">\uD83C\uDFC5 Achievements</div></div>'+badgesHTML+'</div>'
    +'</div>';
}

/* ══════════════════════════════════════════════════════
   HOMEPAGE QUICK STATS ROW (mockup reference)
   ══════════════════════════════════════════════════════ */
function renderQuickStats(){
  var el=document.getElementById('quickStats');
  if(!el) return;
  var h=loadHistory();
  var now=new Date();
  var scansThisMonth=h.filter(function(item){
    var d=new Date(item.timestamp);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  }).length;
  // For a real (non-local-only) logged-in account, prefer the backend's
  // authoritative count for the current month — the same one the Monthly
  // Report page uses (calcMonthlyStats/fetchMonthlyReportFromBackend). The
  // local-only count above only reflects scans made on THIS browser, so for
  // anyone using more than one device (or who ever cleared this browser's
  // storage) it used to drift from — and look inconsistent with — the
  // Monthly Report's "Scans This Month" for the exact same period.
  if(typeof isReallyLoggedIn==='function'&&isReallyLoggedIn()){
    if(typeof _monthlyBackendCache!=='undefined'&&_monthlyBackendCache.hasOwnProperty(0)){
      scansThisMonth=_monthlyBackendCache[0].total;
    } else if(typeof _monthlyBackendFetchInFlight!=='undefined'&&!_monthlyBackendFetchInFlight[0]){
      _monthlyBackendFetchInFlight[0]=true;
      fetchMonthlyReportFromBackend(0);
    }
  }
  // Task 2B: the catalogue count is genuinely live (never hardcoded — csvCount
  // comes from the loaded database), but "Products available" undersold real
  // coverage since a scan also falls back to Open Food Facts when a barcode
  // isn't in the curated catalogue. Label reflects both sources honestly.
  var productsAvailable=csvDBLoaded?(csvCount+'+'):'…';
  el.innerHTML=
    '<div class="quick-stat-card"><span class="quick-stat-num">'+productsAvailable+'</span><span class="quick-stat-label">Curated products <span class="quick-stat-sub">+ global database coverage</span></span></div>'
    +'<div class="quick-stat-card"><span class="quick-stat-num">'+scansThisMonth+'</span><span class="quick-stat-label">Scans this month</span></div>';
  // Task 2A: "4.8★ User rating" was a fabricated number — no real rating data
  // ever existed to back it, which runs directly against Swapify's core promise
  // of only ever showing real numbers. Removed rather than faked. A genuine
  // in-app rating (rate the app itself, from Settings, shown once enough
  // ratings exist) is a reasonable follow-up feature if this stat is wanted
  // back — flagged here rather than quietly reintroduced with placeholder data.
}

/* ══════════════════════════════════════════════════════
   TASK 1 (round 2): STREAK & DAILY GOAL TRACKER
   ══════════════════════════════════════════════════════ */
var DAILY_GOAL_KEY='swapify-daily-goal-v1';
var GOAL_MILESTONE_KEY='swapify-goal-milestone-date-v1'; // last date the "goal reached" toast was shown

function loadDailyGoal(){
  var v=parseInt(localStorage.getItem(DAILY_GOAL_KEY),10);
  return(isNaN(v)||v<1)?3:v;
}
function saveDailyGoal(v){ localStorage.setItem(DAILY_GOAL_KEY,String(v)); }
function adjustDailyGoal(delta){
  var g=loadDailyGoal()+delta;
  if(g<1) g=1; if(g>20) g=20;
  saveDailyGoal(g);
  renderStreakGoalCard();
}

function todayDateKey(){ var d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }
function getTodayScanCount(){
  var h=loadHistory(), key=todayDateKey();
  return h.filter(function(item){ var d=new Date(item.timestamp); d.setHours(0,0,0,0); return d.getTime()===key; }).length;
}

function renderStreakGoalCard(){
  var el=document.getElementById('streakGoalCard');
  if(!el) return;
  var stats=calcDashboardStats();
  var goal=loadDailyGoal();
  var todayCount=getTodayScanCount();
  var pct=Math.min(100,Math.round((todayCount/goal)*100));
  var complete=todayCount>=goal;
  var streakText=stats.streak>0
    ? 'You\u2019ve scanned for '+stats.streak+' day'+(stats.streak>1?'s':'')+' in a row!'
    : 'Scan today to start a streak!';

  checkDailyGoalMilestone(complete);

  el.innerHTML='<div class="streak-goal-outer">'
    +'<div class="streak-goal-top-row">'
    +'<div class="streak-flame-block"><span class="streak-flame-icon'+(stats.streak>0?' active':'')+'">\uD83D\uDD25</span><div><div class="streak-flame-num">'+stats.streak+'</div><div class="streak-flame-lbl">'+streakText+'</div></div></div>'
    +'<div class="goal-stepper"><span class="goal-stepper-label">Daily goal:</span>'
    +'<button class="goal-stepper-btn" onclick="adjustDailyGoal(-1)">\u2212</button>'
    +'<span class="goal-stepper-num">'+goal+'</span>'
    +'<button class="goal-stepper-btn" onclick="adjustDailyGoal(1)">+</button>'
    +'</div>'
    +'</div>'
    +'<div class="goal-progress-wrap">'
    +'<div class="goal-progress-label-row"><span class="goal-progress-text">Today\u2019s goal: scan <strong>'+goal+'</strong> product'+(goal>1?'s':'')+'</span><span class="goal-progress-text"><strong>'+todayCount+'</strong> / '+goal+'</span></div>'
    +'<div class="goal-progress-track"><div class="goal-progress-fill'+(complete?' complete':'')+'" style="width:'+pct+'%;"></div></div>'
    +(complete?'<div class="goal-complete-note"><span class="goal-complete-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Daily goal reached — nice work!</div>':'')
    +'</div>'
    +'</div>';
}

// Shows a one-time celebratory toast the first moment the daily goal is hit
// each day, reusing the existing badge-toast visual style.
function checkDailyGoalMilestone(isComplete){
  if(!isComplete) return;
  var key=todayDateKey();
  var lastShown=localStorage.getItem(GOAL_MILESTONE_KEY);
  if(String(key)===lastShown) return;
  localStorage.setItem(GOAL_MILESTONE_KEY,String(key));
  showBadgeToast({icon:'\uD83C\uDFAF',name:'Daily Goal Reached!',desc:'You hit your scan goal for today.'});
}

/* ══════════════════════════════════════════════════════
   TASK 2: PRODUCT CATEGORIES PAGE
   ══════════════════════════════════════════════════════ */
var CATEGORY_META={
  beverage:{label:'Beverages',icon:'\uD83E\uDD64'},
  chocolate:{label:'Chocolate',icon:'\uD83C\uDF6B'},
  protein_bar:{label:'Protein Bars',icon:'\uD83D\uDCAA'},
  biscuit:{label:'Biscuits',icon:'\uD83C\uDF6A'},
  chips:{label:'Chips & Namkeen',icon:'\uD83E\uDD54'},
  cereal:{label:'Cereals & Oats',icon:'\uD83E\uDD63'},
  ice_cream:{label:'Ice Cream',icon:'\uD83C\uDF66'},
  instant:{label:'Instant Food',icon:'\uD83C\uDF5C'},
  spread:{label:'Spreads',icon:'\uD83E\uDD5C'},
  supplement:{label:'Supplements',icon:'\uD83D\uDC8A'},
  other:{label:'Other',icon:'\uD83D\uDCE6'}
};
var categoriesPanelOpen=false;
var _currentCategoryView=null; // null = grid view, or a category id

// Renders into BOTH the hidden #categoriesPanel (source template) and the
// visible #categoriesPanelPage (what showPage('categories') actually shows).
// Fixes the bug where clicking a subcategory updated only the hidden panel,
// so the product list never appeared until the header nav was clicked again.
function _setCategoriesHTML(html){
  var panel=document.getElementById('categoriesPanel');
  var page=document.getElementById('categoriesPanelPage');
  if(panel) panel.innerHTML=html;
  if(page) page.innerHTML=html;
}

function toggleCategoriesPanel(){
  categoriesPanelOpen=!categoriesPanelOpen;
  var panel=document.getElementById('categoriesPanel');
  if(categoriesPanelOpen){ _currentCategoryView=null; renderCategoriesPanel(); panel.style.display=''; }
  else panel.style.display='none';
}

var _categoryIndexCache=null; // rebuilt only when the CSV (re)loads, not on every click

function buildCategoryIndex(){
  // {catId: [{barcode,name,brand,score,grade}...]}
  if(_categoryIndexCache) return _categoryIndexCache;
  var index={};
  if(!csvDBLoaded) return index;
  Object.keys(csvDB).forEach(function(bc){
    var prod=csvDB[bc];
    var cat=detectCategory(prod.product_name||'');
    var norm=normBackend(prod), res=calculateScore(norm,'');
    (index[cat]=index[cat]||[]).push({barcode:bc,name:prod.product_name,brand:prod.brand,score:res.score,grade:res.grade});
  });
  _categoryIndexCache=index;
  return index;
}

function renderCategoriesPanel(){
  if(_currentCategoryView){
    renderCategoryDetailView(_currentCategoryView);
    return;
  }
  if(!csvDBLoaded){
    _setCategoriesHTML('<div class="cat-section"><div class="cat-header-row"><div class="cat-title">\uD83D\uDDC2\uFE0F Browse by Category</div></div><div class="cat-empty">Loading product database…</div></div>');
    return;
  }
  var index=buildCategoryIndex();
  var cardsHTML=Object.keys(CATEGORY_META).map(function(catId){
    var meta=CATEGORY_META[catId];
    var items=index[catId]||[];
    if(!items.length) return '';
    return '<div class="cat-card" onclick="openCategoryDetail(\''+catId+'\')">'
      +'<div class="cat-card-icon">'+meta.icon+'</div>'
      +'<div class="cat-card-name">'+meta.label+'</div>'
      +'<div class="cat-card-count">'+items.length+' product'+(items.length>1?'s':'')+'</div>'
      +'</div>';
  }).join('');
  _setCategoriesHTML('<div class="cat-section">'
    +'<div class="cat-header-row"><div class="cat-title">\uD83D\uDDC2\uFE0F Browse by Category</div></div>'
    +'<div class="cat-grid">'+(cardsHTML||'<div class="cat-empty">No categorized products found.</div>')+'</div>'
    +'</div>');
}

function openCategoryDetail(catId){
  _currentCategoryView=catId;
  renderCategoryDetailView(catId);
}
function backToCategoriesGrid(){
  _currentCategoryView=null;
  renderCategoriesPanel();
}

function renderCategoryDetailView(catId){
  var meta=CATEGORY_META[catId]||{label:catId,icon:'\uD83D\uDCE6'};
  var index=buildCategoryIndex();
  var items=(index[catId]||[]).slice().sort(function(a,b){return b.score-a.score;});
  var listHTML=items.length
    ? items.map(function(item,i){
        var gc=item.score>=9?'score-a':item.score>=7?'score-b':item.score>=5?'score-c':item.score>=3?'score-d':'score-f';
        return '<div class="cat-product-item" onclick="quickScan(\''+item.barcode+'\')">'
          +'<div class="cat-product-rank">#'+(i+1)+'</div>'
          +'<div class="cat-product-score '+gc+'">'+item.grade+'</div>'
          +'<div class="cat-product-info"><div class="cat-product-name">'+(item.name||'Unknown')+'</div><div class="cat-product-brand">'+(item.brand||'')+' \u00b7 '+item.score+'/10</div></div>'
          +'</div>';
      }).join('')
    : '<div class="cat-empty">No products found in this category.</div>';
  _setCategoriesHTML('<div class="cat-section">'
    +'<button class="btn-cat-back" onclick="backToCategoriesGrid()">\u2190 All Categories</button>'
    +'<div class="cat-header-row"><div class="cat-title">'+meta.icon+' '+meta.label+' <span style="font-family:\'DM Mono\',monospace;font-size:0.68rem;color:var(--text-muted);font-weight:400;">(top rated first)</span></div></div>'
    +'<div class="cat-product-list">'+listHTML+'</div>'
    +'</div>');
}

/* ══════════════════════════════════════════════════════
   TASK 3: PRODUCT IMAGE GALLERY
   ══════════════════════════════════════════════════════ */
var GALLERY_KEY='swapify-image-gallery-v1'; // {barcode:[{dataUrl,addedAt}]}
var MAX_GALLERY_IMAGES=8;
var _galleryUploadBarcode=null;

function loadAllGalleries(){ try{return JSON.parse(localStorage.getItem(GALLERY_KEY)||'{}');}catch(e){return{};} }
function saveAllGalleries(obj){
  try{ localStorage.setItem(GALLERY_KEY,JSON.stringify(obj)); return true; }
  catch(e){ alert('Could not save image — your browser storage is full. Try removing an older photo first.'); return false; }
}
function getProductGallery(barcode){ var all=loadAllGalleries(); return all[barcode]||[]; }

function buildGallerySectionHTML(barcode,productName){
  var images=getProductGallery(barcode);
  var thumbsHTML=images.length
    ? images.map(function(img,i){
        return '<div class="gallery-thumb-wrap">'
          +'<img class="gallery-thumb" src="'+img.dataUrl+'" onclick="openGalleryLightbox(\''+barcode+'\','+i+')" alt="'+(productName||'Product').replace(/"/g,'&quot;')+'">'
          +'<button class="gallery-thumb-remove" onclick="removeGalleryImage(\''+barcode+'\','+i+',event)" title="Remove">\u2715</button>'
          +'</div>';
      }).join('')
    : '';
  return '<div class="gallery-section-card" id="gallerySectionCard-'+barcode+'">'
    +'<div class="gallery-header-row"><div class="gallery-title">\uD83D\uDCF8 Product Images</div>'
    +'<button class="btn-upload-image" onclick="triggerImageUpload(\''+barcode+'\')">\u2795 Upload Image</button></div>'
    +(images.length?'<div class="gallery-row">'+thumbsHTML+'</div><div class="gallery-count-note">'+images.length+' / '+MAX_GALLERY_IMAGES+' community photos</div>'
      :'<div class="gallery-empty-note">No photos yet — be the first to add one!</div>')
    +'</div>';
}

function triggerImageUpload(barcode){
  var gallery=getProductGallery(barcode);
  if(gallery.length>=MAX_GALLERY_IMAGES){
    alert('This product already has the maximum of '+MAX_GALLERY_IMAGES+' photos. Remove one first.');
    return;
  }
  _galleryUploadBarcode=barcode;
  document.getElementById('galleryUploadInput').value='';
  document.getElementById('galleryUploadInput').click();
}

function handleGalleryFileSelected(e){
  var file=e.target.files&&e.target.files[0];
  if(!file||!_galleryUploadBarcode) return;
  if(!file.type.startsWith('image/')){ alert('Please choose an image file.'); return; }
  if(file.size>8*1024*1024){ alert('Image too large — please choose a photo under 8MB.'); return; }

  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      // Downscale to keep localStorage usage reasonable
      var maxW=640;
      var scale=Math.min(1,maxW/img.width);
      var canvas=document.createElement('canvas');
      canvas.width=Math.round(img.width*scale);
      canvas.height=Math.round(img.height*scale);
      var ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      var dataUrl=canvas.toDataURL('image/jpeg',0.8);
      saveGalleryImage(_galleryUploadBarcode,dataUrl);
    };
    img.onerror=function(){ alert('Could not read that image. Please try a different file.'); };
    img.src=ev.target.result;
  };
  reader.onerror=function(){ alert('Could not read that file.'); };
  reader.readAsDataURL(file);
}

function saveGalleryImage(barcode,dataUrl){
  var all=loadAllGalleries();
  var list=all[barcode]||[];
  list.push({dataUrl:dataUrl,addedAt:Date.now()});
  all[barcode]=list;
  if(saveAllGalleries(all)){
    var card=document.getElementById('gallerySectionCard-'+barcode);
    if(card){
      var name=(lastScannedProduct&&lastScannedProduct.data&&lastScannedProduct.data.product_name)||'';
      card.outerHTML=buildGallerySectionHTML(barcode,name);
    }
  }
}

function removeGalleryImage(barcode,index,evt){
  if(evt) evt.stopPropagation();
  var all=loadAllGalleries();
  var list=all[barcode]||[];
  list.splice(index,1);
  all[barcode]=list;
  saveAllGalleries(all);
  var card=document.getElementById('gallerySectionCard-'+barcode);
  if(card){
    var name=(lastScannedProduct&&lastScannedProduct.data&&lastScannedProduct.data.product_name)||'';
    card.outerHTML=buildGallerySectionHTML(barcode,name);
  }
}

function openGalleryLightbox(barcode,index){
  var images=getProductGallery(barcode);
  var img=images[index];
  if(!img) return;
  document.getElementById('galleryLightboxImg').src=img.dataUrl;
  document.getElementById('galleryLightboxOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeGalleryLightbox(){
  document.getElementById('galleryLightboxOverlay').classList.remove('active');
  document.body.style.overflow='';
  document.getElementById('galleryLightboxImg').src='';
}
function handleGalleryLightboxClick(e){ if(e.target===document.getElementById('galleryLightboxOverlay')) closeGalleryLightbox(); }

/* ══════════════════════════════════════════════════════
   TASK 1: WEEKLY CHALLENGES & LEADERBOARD
   ══════════════════════════════════════════════════════ */
// Confirmed contract (Dhruv, app.py / API_DOCS.md #23):
//   GET  /challenges                    (auth optional — adds joined/progress)
//   POST /challenges/{id}/join          (auth required)
//   GET  /challenges/{id}/progress      (auth required)
//   GET  /leaderboard?period=&limit=    (public)
var CHALLENGES_URL=BACKEND_BASE_URL+'/challenges';
var LEADERBOARD_URL=BACKEND_BASE_URL+'/leaderboard';
var challengesPanelOpen=false;
var _challengesActiveTab='challenges';
var _leaderboardPeriod='weekly';
var _challengesCache=null; // last successful GET /challenges active_challenges array

async function fetchChallenges(){
  try{
    var res=await fetch(CHALLENGES_URL,{headers:getAuthHeaders()});
    if(!res.ok) return null;
    var data=await res.json();
    _challengesCache=data.active_challenges||[];
    return _challengesCache;
  }catch(e){ return null; }
}

async function joinChallenge(id){
  if(!isReallyLoggedIn()){
    alert('Please log in to join a challenge.');
    openAuthModal();
    return;
  }
  try{
    var res=await fetch(CHALLENGES_URL+'/'+id+'/join',{
      method:'POST',
      headers:getAuthHeaders()
    });
    if(!res.ok){
      if(handleAuthExpiry(res)) return;
      var err=await res.json().catch(function(){return{};});
      alert(err.detail||'Could not join that challenge.');
      return;
    }
  }catch(e){ alert('Backend unreachable — could not join the challenge.'); return; }
  showToast('You\u2019re in! Challenge joined.','success');
  if (typeof CURRENT_PAGE !== 'undefined' && CURRENT_PAGE === 'challenges') { renderChallengesPage(); }
  else { renderChallengesPanel(); }
  renderHomeDashboard();
}

async function buildChallengesPreviewHTML(){
  var list=_challengesCache||await fetchChallenges();
  if(!list||!list.length) return '<div class="dash-empty-note">No active challenges right now — check back soon!</div>';
  var joined=list.filter(function(c){return c.joined;});
  var featured=(joined.length?joined:list)[0];
  var title=featured.title||'Weekly Challenge';
  if(!featured.progress){
    return '<div class="wchal-card">'
      +'<div class="wchal-top"><div class="wchal-eyebrow">\u2605 This Week\u2019s Challenge</div><div class="wchal-pct-pill">'+(featured.participant_count||0)+' joined</div></div>'
      +'<div class="wchal-title">'+title+'</div>'
      +'<div class="wchal-sub">'+(featured.description||'')+'</div>'
      +'<button class="wchal-join-btn" onclick="toggleChallengesPanel()">Join This Challenge</button>'
      +'</div>';
  }
  var p=featured.progress, pct=p.percent!==undefined?p.percent:Math.min(100,Math.round((p.current/p.target)*100));
  return '<div class="wchal-card">'
    +'<div class="wchal-top"><div class="wchal-eyebrow">\u2605 This Week\u2019s Challenge</div><div class="wchal-pct-pill">'+pct+'% there</div></div>'
    +'<div class="wchal-title">'+title+'</div>'
    +'<div class="wchal-sub">'+(featured.description||'')+'</div>'
    +'<div class="wchal-progress-row"><div class="wchal-track"><div class="wchal-fill" style="width:'+pct+'%;"></div></div><div class="wchal-count">'+p.current+'/'+p.target+'</div></div>'
    +_wchalDaysHTML(pct)
    +'<div class="wchal-footer"><div class="wchal-reward"><div class="wchal-reward-badge">'+_wchalIcon()+'</div><div class="wchal-reward-text"><b>'+(featured.badge||'Challenge badge')+'</b>'+(p.remaining>0?p.remaining+' more to unlock':'Unlocked!')+'</div></div><button class="wchal-cta" onclick="toggleChallengesPanel()">View challenge \u2192</button></div>'
    +'</div>';
}

function toggleChallengesPanel(){
  challengesPanelOpen=!challengesPanelOpen;
  var panel=document.getElementById('challengesPanel');
  if(challengesPanelOpen){ renderChallengesPanel(); panel.style.display=''; panel.scrollIntoView({behavior:'smooth',block:'start'}); }
  else panel.style.display='none';
}
function switchChallengesTab(tab){ _challengesActiveTab=tab; renderChallengesPanel(); }
function switchLeaderboardPeriod(period){
  _leaderboardPeriod=period;
  if (typeof CURRENT_PAGE !== 'undefined' && CURRENT_PAGE === 'leaderboard') { renderLeaderboardPage(); }
  else { renderChallengesPanel(); }
}

/* ── TASK 1: standalone Leaderboard & Challenges pages ──
   Reuse the same data builders as the legacy embedded profile panel, just
   render straight into the dedicated page containers. */
async function renderLeaderboardPage(){
  var dst=document.getElementById('leaderboardPanelFullPage');
  if(!dst) return;
  dst.innerHTML='<div class="cat-section">'+skeletonRows(5)+'</div>';
  var body=await buildLeaderboardHTML();
  dst.innerHTML='<div class="cat-section">'+body+'</div>';
}
async function renderChallengesPage(){
  var dst=document.getElementById('challengesPanelFullPage');
  if(!dst) return;
  dst.innerHTML='<div class="cat-section">'+skeletonRows(4)+'</div>';
  var body=await buildChallengesListHTML();
  dst.innerHTML='<div class="cat-section">'+body+'</div>';
}

async function renderChallengesPanel(){
  var panel=document.getElementById('challengesPanel');
  if(!panel) return;
  var tabsHTML='<div class="chal-tabs">'
    +'<button class="chal-tab-btn'+(_challengesActiveTab==='challenges'?' active':'')+'" onclick="switchChallengesTab(\'challenges\')">\uD83C\uDFC6 Challenges</button>'
    +'<button class="chal-tab-btn'+(_challengesActiveTab==='leaderboard'?' active':'')+'" onclick="switchChallengesTab(\'leaderboard\')">\uD83D\uDCCA Leaderboard</button>'
    +'</div>';
  panel.innerHTML='<div class="cat-section">'+tabsHTML+skeletonRows(4)+'</div>';
  var body=_challengesActiveTab==='challenges'?await buildChallengesListHTML():await buildLeaderboardHTML();
  panel.innerHTML='<div class="cat-section">'+tabsHTML+body+'</div>';
}

function _checkIconSmall(){
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><polyline points="20 6 9 17 4 12"/></svg>';
}

async function buildChallengesListHTML(){
  var list=await fetchChallenges();
  if(!list) return '<div class="cat-empty">Could not load challenges — is the backend running?</div>';
  if(!list.length) return '<div class="cat-empty">No active challenges right now.</div>';
  return list.map(function(c){
    var p=c.progress;
    var progressHTML=p
      ? '<div class="chal-progress-track"><div class="chal-progress-fill'+(p.completed?' done':'')+'" style="width:'+p.percent+'%;"></div></div>'
        +'<div class="chal-progress-text"><span>'+p.current+' / '+p.target+'</span><span>'+(p.completed?_checkIconSmall()+' Complete!':p.percent+'%')+'</span></div>'
      : '<div class="chal-progress-text"><span>'+(c.participant_count||0)+' participant'+(c.participant_count===1?'':'s')+' so far</span></div>';
    return '<div class="chal-card'+(c.joined?' joined':'')+'">'
      +'<div class="chal-card-top"><div class="chal-card-icon-name"><span class="chal-card-icon">\uD83C\uDFC6</span><div><div class="chal-card-name">'+(c.title||'Challenge')+'</div><div class="chal-card-desc">'+(c.description||'')+'</div></div></div>'
      +'<button class="btn-join-challenge'+(c.joined?' joined-btn':'')+'" onclick="joinChallenge('+c.id+')" '+(c.joined?'disabled':'')+'>'+(c.joined?_checkIconSmall()+' Joined':'Join Challenge')+'</button></div>'
      +progressHTML
      +(c.badge?'<div class="chal-reward-pill">\uD83C\uDF81 '+c.badge+' badge on completion</div>':'')
      +'</div>';
  }).join('');
}

async function buildLeaderboardHTML(){
  var periodTabsHTML='<div class="chal-tabs" style="margin-bottom:14px;">'
    +['weekly','monthly','all-time'].map(function(p){
      return '<button class="chal-tab-btn'+(_leaderboardPeriod===p?' active':'')+'" onclick="switchLeaderboardPeriod(\''+p+'\')">'+p.charAt(0).toUpperCase()+p.slice(1)+'</button>';
    }).join('')+'</div>';
  var data=null;
  try{
    var res=await fetch(LEADERBOARD_URL+'?period='+_leaderboardPeriod+'&limit=10');
    if(res.ok) data=await res.json();
  }catch(e){}
  if(!data||!Array.isArray(data.leaderboard)){
    return periodTabsHTML+'<div class="cat-empty">Could not load the leaderboard — is the backend running?</div>';
  }
  if(!data.leaderboard.length){
    return periodTabsHTML+'<div class="cat-empty">No activity recorded for this period yet.</div>';
  }
  var myName=isReallyLoggedIn()?currentUser.name:null;
  var myRow=myName?data.leaderboard.find(function(u){return u.username===myName;}):null;
  var meCardHTML=myRow
    ? '<div class="lb-user-card"><div class="lb-user-rank">#'+myRow.rank+'</div><div class="lb-user-info"><div class="lb-user-name">Your Rank</div><div class="lb-user-score">'+myRow.score+' points \u00b7 '+(myRow.badge_count||0)+' badge'+(myRow.badge_count===1?'':'s')+' earned</div></div></div>'
    : (isReallyLoggedIn()?'<div class="lb-note">You haven\u2019t shown up on this leaderboard yet — scan, compare or rate a few products to start climbing!</div>':'<div class="lb-note">Log in to see your own rank highlighted here.</div>');
  var rowsHTML=data.leaderboard.map(function(u){
    var isMe=myName&&u.username===myName;
    return '<div class="lb-row'+(isMe?' is-me':'')+'"><div class="lb-rank-num'+(u.rank<=3?' top3':'')+'">#'+u.rank+'</div><div class="lb-row-name">'+u.username+'</div><div class="lb-row-badges">'+'\uD83C\uDFC5'.repeat(Math.min(u.badge_count||0,3))+'</div><div class="lb-row-score">'+u.score+' pts</div></div>';
  }).join('');
  return periodTabsHTML+meCardHTML+'<div class="lb-list">'+rowsHTML+'</div>'
    +'<div class="lb-note">\uD83D\uDCCA Scoring: scan=1, rate=2, share=1, favorite=1, compare=3 pt each, over the selected period.</div>';
}

/* ══════════════════════════════════════════════════════
   TASK 2: SMART CART / SHOPPING LIST
   ══════════════════════════════════════════════════════ */
// Confirmed contract (Dhruv, app.py / API_DOCS.md #24):
//   POST   /shopping-list                 body:{items:[barcodes], name?}
//   GET    /shopping-list/{id}
//   GET    /shopping-list/{id}/optimize
//   POST   /shopping-list/{id}/replace     body:{old_barcode,new_barcode}
//   DELETE /shopping-list/{id}
// The backend has no incremental add/remove-item endpoint — every add/remove
// re-POSTs the full current item set to (re)create the server-side list, and
// we keep the resulting numeric list id locally so Optimize/Replace/Delete
// can target it. A local barcode array remains the instant-feedback source
// of truth for what's "on the list"; backend-scored data enriches display
// once each sync completes.
var SHOPPING_LIST_URL=BACKEND_BASE_URL+'/shopping-list';
async function fetchShoppingListFromBackend(){
  if(!currentUser||!currentUser.token||currentUser.localOnly) return;
  try{
    var res=await fetch(SHOPPING_LIST_URL+'/mine',{headers:getAuthHeaders()});
    if(!res.ok){ handleAuthExpiry(res); return; }
    var data=await res.json();
    if(!data||!data.id) return; // no list saved on this account yet
    var backendBarcodes=(data.items||[]).map(function(it){ return it.barcode; });
    var local=loadCartItems();
    var merged=backendBarcodes.concat(local.filter(function(b){ return backendBarcodes.indexOf(b)===-1; }));
    saveCartItems(merged);
    saveCartListId(data.id);
    _cartSyncedItems=data.items||[];
    _cartOptimizeData=null;
    if(shoppingListPanelOpen) renderShoppingListPanel();
    // If anything was local-only (added while offline or as a guest),
    // push the merged list back up so the backend has the full picture too.
    if(merged.length!==backendBarcodes.length) syncShoppingListToBackend();
  }catch(e){ /* offline/unreachable backend — local cart remains usable */ }
}
var CART_ITEMS_KEY='swapify-shopping-list-items-v1';
var CART_LIST_ID_KEY='swapify-shopping-list-id-v1';
var CART_LIST_NAME_KEY='swapify-shopping-list-name-v1';
var shoppingListPanelOpen=false;
var _cartSyncedItems=[];
var _cartOptimizeData=null;
var _cartSyncing=false;

function loadCartItems(){ try{return JSON.parse(localStorage.getItem(CART_ITEMS_KEY)||'[]');}catch(e){return[];} }
function saveCartItems(arr){ localStorage.setItem(CART_ITEMS_KEY,JSON.stringify(arr)); }
function loadCartListId(){ var v=localStorage.getItem(CART_LIST_ID_KEY); return v?parseInt(v,10):null; }
function saveCartListId(id){ localStorage.setItem(CART_LIST_ID_KEY,String(id)); }
function loadCartListName(){ return localStorage.getItem(CART_LIST_NAME_KEY)||'My Shopping List'; }

async function syncShoppingListToBackend(){
  var items=loadCartItems();
  if(!items.length){ _cartSyncedItems=[]; _cartOptimizeData=null; renderShoppingListPanel(); return; }
  _cartSyncing=true;
  renderShoppingListPanel();
  try{
    var res=await fetch(SHOPPING_LIST_URL,{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify({name:loadCartListName(),items:items})
    });
    if(res.ok){
      var data=await res.json();
      saveCartListId(data.id);
      _cartSyncedItems=data.items||[];
      _cartOptimizeData=null; // stale after any list change
    }
  }catch(e){ /* offline — keep last known synced items / local preview */ }
  _cartSyncing=false;
  renderShoppingListPanel();
}

function toggleShoppingListPanel(){
  shoppingListPanelOpen=!shoppingListPanelOpen;
  var panel=document.getElementById('shoppingListPanel');
  if(shoppingListPanelOpen){
    renderShoppingListPanel();
    if(loadCartItems().length && !_cartSyncedItems.length) syncShoppingListToBackend();
    panel.style.display='';
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  } else panel.style.display='none';
}

function cartSearchInput(query,inputEl){
  // Find the suggestion box that belongs to THIS input, not just "the first
  // element in the document with id=cartSuggestList". The page keeps a
  // hidden template (#shoppingListPanel, display:none) alongside the visible
  // clone (#shoppingListPanelPage) that's shown on the Cart page, and both
  // contain an element with id="cartSuggestList" at the same time —
  // document.getElementById always returns the hidden template's one, so
  // suggestions were rendering somewhere the user could never see or click.
  var box=inputEl&&inputEl.closest?inputEl.closest('.cart-suggest-dropdown').querySelector('.cart-suggest-list'):document.getElementById('cartSuggestList');
  if(!box) return;
  var rawQuery=(query||'').trim();
  query=rawQuery.toLowerCase();
  if(!query||!csvDBLoaded){ box.innerHTML=''; box.style.display='none'; return; }
  // Match on product name OR barcode, so pasting/typing a barcode works too.
  var matches=Object.keys(csvDB).filter(function(bc){
    return(csvDB[bc].product_name||'').toLowerCase().indexOf(query)!==-1
      || bc.indexOf(rawQuery)!==-1;
  }).slice(0,8);
  if(!matches.length){ box.innerHTML=''; box.style.display='none'; return; }
  box.innerHTML=matches.map(function(bc){
    var p=csvDB[bc];
    return '<div class="cart-suggest-item" onclick="addToShoppingListByBarcode(\''+bc+'\',this)">'+(p.product_name||'Unknown')+' <span style="color:var(--text-muted);font-size:0.7rem;">('+(p.brand||'')+')</span></div>';
  }).join('');
  box.style.display='block';
}

function addToShoppingListByBarcode(barcode,fromEl){
  var items=loadCartItems();
  if(items.indexOf(barcode)!==-1){ alert('That product is already on your list.'); return; }
  items.push(barcode);
  saveCartItems(items);
  // Same DOM-relationship fix as above: clear/hide the box that's actually
  // visible (the one the click came from), not whichever one the document
  // happens to hand back first for that id.
  var dropdown=fromEl&&fromEl.closest?fromEl.closest('.cart-suggest-dropdown'):null;
  var input=dropdown?dropdown.querySelector('#cartSearchInput,.cart-add-row input'):document.getElementById('cartSearchInput');
  var box=dropdown?dropdown.querySelector('.cart-suggest-list'):document.getElementById('cartSuggestList');
  if(input) input.value='';
  if(box) box.style.display='none';
  syncShoppingListToBackend();
}

function removeFromShoppingList(barcode){
  var items=loadCartItems().filter(function(b){return b!==barcode;});
  saveCartItems(items);
  syncShoppingListToBackend();
}

async function optimizeShoppingList(){
  var listId=loadCartListId();
  if(!listId||!_cartSyncedItems.length){ await syncShoppingListToBackend(); listId=loadCartListId(); }
  if(!listId){ alert('Could not sync your list with the backend. Check your connection and try again.'); return; }
  _cartSyncing=true; renderShoppingListPanel();
  try{
    var res=await fetch(SHOPPING_LIST_URL+'/'+listId+'/optimize',{headers:getAuthHeaders()});
    if(res.ok){ _cartOptimizeData=await res.json(); }
    else{ alert('Could not optimize the list right now.'); }
  }catch(e){ alert('Backend unreachable — could not optimize.'); }
  _cartSyncing=false;
  renderShoppingListPanel();
}

async function replaceCartItem(oldBarcode,newBarcode){
  var listId=loadCartListId();
  if(!listId) return;
  try{
    var res=await fetch(SHOPPING_LIST_URL+'/'+listId+'/replace',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({old_barcode:oldBarcode,new_barcode:newBarcode})
    });
    if(res.ok){
      var data=await res.json();
      _cartSyncedItems=data.items||[];
      var items=loadCartItems().map(function(b){return b===oldBarcode?newBarcode:b;});
      saveCartItems(items);
      _cartOptimizeData=null;
    } else {
      var err=await res.json().catch(function(){return{};});
      alert(err.detail||'Could not replace that item.');
    }
  }catch(e){ alert('Backend unreachable — could not replace that item.'); }
  renderShoppingListPanel();
}

function clearShoppingList(){
  if(!confirm('Clear your entire shopping list?')) return;
  var listId=loadCartListId();
  saveCartItems([]);
  _cartSyncedItems=[]; _cartOptimizeData=null;
  localStorage.removeItem(CART_LIST_ID_KEY);
  if(listId){ fetch(SHOPPING_LIST_URL+'/'+listId,{method:'DELETE'}).catch(function(){}); }
  renderShoppingListPanel();
}

function renderShoppingListPanel(){
  var panel=document.getElementById('shoppingListPanel');
  if(!panel) return;
  var localItems=loadCartItems();
  var displayItems;
  if(_cartSyncedItems.length===localItems.length && _cartSyncedItems.length>0){
    displayItems=_cartSyncedItems.map(function(it){
      return{barcode:it.barcode,name:it.product_name,brand:it.brand,score:it.score,grade:it.grade,found:it.found!==false};
    });
  } else {
    displayItems=localItems.map(function(bc){
      var prod=csvDBLoaded?csvDB[bc]:null;
      if(prod){ var norm=normBackend(prod),res=calculateScore(norm,''); return{barcode:bc,name:prod.product_name,brand:prod.brand,score:res.score,grade:res.grade,found:true}; }
      return{barcode:bc,name:bc,brand:'',score:0,grade:'?',found:false};
    });
  }

  var scored=displayItems.filter(function(i){return typeof i.score==='number';});
  var avgScore=scored.length?Math.round(scored.reduce(function(s,i){return s+i.score;},0)/scored.length*10)/10:0;
  var healthyCount=scored.filter(function(i){return i.score>=7;}).length;
  var summaryHTML='<div class="cart-summary-row">'
    +'<div class="cart-summary-item"><div class="cart-summary-num">'+displayItems.length+'</div><div class="cart-summary-lbl">Items</div></div>'
    +'<div class="cart-summary-item"><div class="cart-summary-num">'+(scored.length?avgScore:'\u2014')+'</div><div class="cart-summary-lbl">Avg Score</div></div>'
    +'<div class="cart-summary-item"><div class="cart-summary-num">'+healthyCount+'</div><div class="cart-summary-lbl">Healthy (7+)</div></div>'
    +'</div>';

  var optByBarcode={};
  if(_cartOptimizeData&&Array.isArray(_cartOptimizeData.items)){
    _cartOptimizeData.items.forEach(function(entry){ if(entry.original) optByBarcode[entry.original.barcode]=entry; });
  }

  var itemsHTML=displayItems.length
    ? displayItems.map(function(item){
        var gc=item.score>=9?'score-a':item.score>=7?'score-b':item.score>=5?'score-c':item.score>=3?'score-d':'score-f';
        var altHTML='';
        var opt=optByBarcode[item.barcode];
        if(opt&&opt.has_healthier_option&&opt.alternatives&&opt.alternatives.length){
          altHTML='<div class="cart-alt-box"><div class="cart-alt-label">\uD83D\uDCA1 Healthier Alternatives (potential +'+opt.potential_gain+' pts)</div>'
            +opt.alternatives.map(function(a){
              var agc=a.health_score>=9?'score-a':a.health_score>=7?'score-b':a.health_score>=5?'score-c':a.health_score>=3?'score-d':'score-f';
              return '<div class="cart-alt-row"><div class="cart-alt-score '+agc+'">'+a.grade+'</div><div class="cart-alt-info">'+(a.product_name||'Unknown')+' \u00b7 '+a.health_score+'/10</div><button class="btn-cart-replace" onclick="replaceCartItem(\''+item.barcode+'\',\''+a.barcode+'\')">Replace</button></div>';
            }).join('')
            +'</div>';
        } else if(opt&&!opt.has_healthier_option){
          altHTML='<div class="cart-alt-box"><div class="cart-alt-none">\u2713 Already a great pick — no better alternative found.</div></div>';
        }
        return '<div class="cart-item"><div class="cart-item-top">'
          +'<div class="cart-item-score '+gc+'">'+item.grade+'</div>'
          +'<div class="cart-item-info"><div class="cart-item-name">'+(item.name||'Unknown')+(item.found===false?' <span style="color:var(--coral);font-size:0.66rem;">(not found)</span>':'')+'</div><div class="cart-item-meta">'+(item.brand||'')+(typeof item.score==='number'?' \u00b7 '+item.score+'/10':'')+'</div></div>'
          +'<button class="btn-cart-remove" onclick="removeFromShoppingList(\''+item.barcode+'\')">\u2715 Remove</button>'
          +'</div>'
          +altHTML
          +'</div>';
      }).join('')
    : '<div class="cart-empty">\uD83D\uDED2 Your shopping list is empty. Search for a product below to add it.</div>';

  panel.innerHTML='<div class="cat-section">'
    +'<div class="cat-header-row"><div class="cat-title">\uD83D\uDED2 Smart Cart — Shopping List'+(_cartSyncing?' <span class="dash-feed-source">syncing…</span>':(_cartSyncedItems.length?' <span class="dash-feed-source">synced</span>':''))+'</div>'
    +(displayItems.length?'<button class="btn-join-challenge" onclick="optimizeShoppingList()">\u2728 Optimize List</button>':'')
    +'</div>'
    +'<div class="cart-suggest-dropdown">'
    +'<div class="cart-add-row"><input type="text" id="cartSearchInput" placeholder="Search a product to add…" oninput="cartSearchInput(this.value,this)"></div>'
    +'<div class="cart-suggest-list" id="cartSuggestList" style="display:none;"></div>'
    +'</div>'
    +summaryHTML
    +'<div class="cart-list">'+itemsHTML+'</div>'
    +(displayItems.length?'<button class="btn-cart-remove" style="width:100%;margin-top:10px;" onclick="clearShoppingList()">\uD83D\uDDD1 Clear List</button>':'')
    +'</div>';

  // Keep the visible Cart page (#shoppingListPanelPage) in sync with this
  // hidden template every time it re-renders. Previously only showPage('cart')
  // did this copy, exactly once, on navigation — so anything that changed
  // the list afterwards (Optimize List, Replace, Remove, Add) updated this
  // hidden template correctly but the user's actual on-screen page never
  // refreshed and looked stuck/unresponsive.
  var _cartPageEl=document.getElementById('shoppingListPanelPage');
  if(_cartPageEl) _cartPageEl.innerHTML=panel.innerHTML;
}

/* ══════════════════════════════════════════════════════
   TASK 3: COMMUNITY REVIEWS & DISCUSSIONS
   ══════════════════════════════════════════════════════ */
// Confirmed contract (Dhruv, app.py / API_DOCS.md #25):
//   POST   /reviews                    (auth) body:{barcode,rating(1-5),review_text}
//   GET    /product/{barcode}/reviews  (public) -> {total_reviews,average_rating,reviews:[...]}
//   DELETE /reviews/{id}               (auth, own only)
//   POST   /reviews/{id}/vote          (auth) body:{vote:"up"|"down"} — toggles
//   POST   /reviews/{id}/replies       (auth) body:{reply_text}
// There is no edit/update endpoint — "editing" is emulated client-side as
// delete-then-resubmit, which is why an edited review moves to the top and
// gets a new id (documented behavior, not a bug).
var REVIEWS_URL=BACKEND_BASE_URL+'/reviews';
var _reviewModalBarcode=null, _reviewModalName='', _reviewDraftStars=0, _editingReviewId=null;
var _reviewsCache={}; // {barcode:{total_reviews,average_rating,reviews:[...]}} — last-known server truth

function computeReviewAverage(reviews){ if(!reviews||!reviews.length) return 0; return reviews.reduce(function(s,r){return s+r.rating;},0)/reviews.length; }

function buildReviewsSectionHTML(barcode,productName){
  var cached=_reviewsCache[barcode];
  var reviews=cached?cached.reviews:[];
  var avg=cached?cached.average_rating:0;
  var summaryHTML=reviews.length
    ? '<div class="reviews-summary-row"><div class="reviews-summary-num">'+avg.toFixed(1)+'</div><div><div class="reviews-summary-stars">'+starsDisplayHTML(avg)+'</div><div class="reviews-summary-count">'+reviews.length+' review'+(reviews.length>1?'s':'')+'</div></div></div>'
    : '';
  var listHTML= !cached
    ? skeletonRows(2)
    : (reviews.length ? reviews.map(function(r){ return buildSingleReviewHTML(barcode,r); }).join('') : '<div class="reviews-empty">No reviews yet — share your experience with this product!</div>');
  var safeName=(productName||'').replace(/'/g,"\\'");
  return '<div class="reviews-section-card" id="reviewsSectionCard-'+barcode+'">'
    +'<div class="reviews-header-row"><div class="reviews-title">\uD83D\uDCAC Reviews</div><button class="btn-write-review" onclick="openReviewModal(\''+barcode+'\',\''+safeName+'\')">\u270D Write a Review</button></div>'
    +summaryHTML
    +listHTML
    +'</div>';
}

function buildSingleReviewHTML(barcode,r){
  var mine=isReallyLoggedIn()&&currentUser.userId&&r.user_id===currentUser.userId;
  var ds=r.created_at?new Date(r.created_at.replace(' ','T')).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'';
  var repliesHTML=(r.replies&&r.replies.length)
    ? '<div class="review-replies">'+r.replies.map(function(rep){
        return '<div class="review-reply-item"><strong>'+(rep.username||'User')+':</strong> '+escapeChatText(rep.reply_text)+'</div>';
      }).join('')+'</div>'
    : '';
  return '<div class="review-item'+(mine?' mine':'')+'">'
    +'<div class="review-item-top"><div><span class="review-item-stars">'+starsDisplayHTML(r.rating)+'</span>'+(mine?'<span class="review-item-you">You</span>':'<span class="review-item-you" style="background:none;color:var(--text-muted);">'+(r.username||'')+'</span>')+'</div><span class="review-item-date">'+ds+'</span></div>'
    +'<div class="review-item-text">'+escapeChatText(r.review_text)+'</div>'
    +repliesHTML
    +'<div class="review-item-actions">'
    +'<button class="btn-review-edit" onclick="voteReview(\''+barcode+'\','+r.id+',\'up\')">\uD83D\uDC4D '+(r.upvotes||0)+'</button>'
    +'<button class="btn-review-edit" onclick="voteReview(\''+barcode+'\','+r.id+',\'down\')">\uD83D\uDC4E '+(r.downvotes||0)+'</button>'
    +'<button class="btn-review-edit" onclick="replyToReview(\''+barcode+'\','+r.id+')">\uD83D\uDCAC Reply'+(r.reply_count?' ('+r.reply_count+')':'')+'</button>'
    +(mine?'<button class="btn-review-edit" onclick="editReview(\''+barcode+'\','+r.id+')">\u270E Edit</button><button class="btn-review-delete" onclick="deleteReview(\''+barcode+'\','+r.id+')">\uD83D\uDDD1 Delete</button>':'')
    +'</div>'
    +'</div>';
}

async function refreshReviewsSection(barcode){
  try{
    var res=await fetch(BACKEND_BASE_URL+'/product/'+encodeURIComponent(barcode)+'/reviews');
    if(res.ok){ _reviewsCache[barcode]=await res.json(); }
  }catch(e){ /* backend unreachable — leave "Loading reviews…" or last-known cache */ }
  var card=document.getElementById('reviewsSectionCard-'+barcode);
  if(card){
    var name=(lastScannedProduct&&lastScannedProduct.data&&lastScannedProduct.data.product_name)||'';
    card.outerHTML=buildReviewsSectionHTML(barcode,name);
  }
}

function openReviewModal(barcode,name,editId){
  // Bug fix: POST /reviews requires authentication on the backend (no
  // anonymous reviews). Previously this modal let anyone type and submit a
  // review, which then failed server-side with a raw "Invalid token" alert —
  // the review was never actually saved, but the modal still closed as if it
  // had been, which looked like "it just submits but nothing shows up".
  // Gate it up front instead, with a clear, friendly message.
  if(!isReallyLoggedIn()){
    alert('Please log in to write a review.');
    openAuthModal();
    return;
  }
  _reviewModalBarcode=barcode; _reviewModalName=name||'this product'; _editingReviewId=editId||null;
  document.getElementById('reviewModalProductName').textContent=_reviewModalName;
  var textEl=document.getElementById('reviewTextInput');
  if(editId){
    var cached=_reviewsCache[barcode];
    var review=cached?cached.reviews.find(function(r){return r.id===editId;}):null;
    _reviewDraftStars=review?review.rating:0;
    textEl.value=review?review.review_text:'';
  } else {
    _reviewDraftStars=0;
    textEl.value='';
  }
  document.getElementById('reviewCharCount').textContent=textEl.value.length+' / 500';
  renderReviewStarRow();
  document.getElementById('reviewModalOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeReviewModal(){ document.getElementById('reviewModalOverlay').classList.remove('active'); document.body.style.overflow=''; _editingReviewId=null; }
function handleReviewOverlayClick(e){ if(e.target===document.getElementById('reviewModalOverlay')) closeReviewModal(); }

function renderReviewStarRow(){
  var el=document.getElementById('reviewStarRow');
  var html='';
  for(var i=1;i<=5;i++){
    html+='<span class="star-btn'+(i<=_reviewDraftStars?' filled':'')+'" onclick="setReviewDraftStars('+i+')">\u2605</span>';
  }
  el.innerHTML=html;
}
function setReviewDraftStars(val){ _reviewDraftStars=val; renderReviewStarRow(); }
function editReview(barcode,id){ openReviewModal(barcode,(lastScannedProduct&&lastScannedProduct.data&&lastScannedProduct.data.product_name)||'',id); }

async function deleteReview(barcode,id){
  if(!confirm('Delete this review?')) return;
  try{
    var res=await fetch(REVIEWS_URL+'/'+id,{method:'DELETE',headers:getAuthHeaders()});
    if(!res.ok){
      if(handleAuthExpiry(res)) return;
      var err=await res.json().catch(function(){return{};});
      alert(err.detail||'Could not delete that review.');
      return;
    }
  }catch(e){ alert('Backend unreachable — could not delete.'); return; }
  refreshReviewsSection(barcode);
}

async function submitReview(){
  var text=document.getElementById('reviewTextInput').value.trim();
  if(!_reviewDraftStars){ alert('Please select an overall star rating.'); return; }
  if(!text){ alert('Please write a short review.'); return; }
  if(!isReallyLoggedIn()){ alert('Your session has expired — please log in again to submit this review.'); closeReviewModal(); openAuthModal(); return; }
  var barcode=_reviewModalBarcode;
  var editId=_editingReviewId;

  // Bug fix: the modal used to close immediately (before the network call),
  // so a failed submission (e.g. expired token -> "Invalid token" from the
  // backend) looked identical to a successful one — the review silently
  // never appeared and the average never changed. Now the modal only closes,
  // and the list only refreshes, on a *confirmed* success.
  try{
    if(editId){
      // No PATCH endpoint exists — emulate edit as delete-then-resubmit.
      await fetch(REVIEWS_URL+'/'+editId,{method:'DELETE',headers:getAuthHeaders()});
    }
    var res=await fetch(REVIEWS_URL,{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify({barcode:barcode,rating:_reviewDraftStars,review_text:text})
    });
    if(!res.ok){
      if(handleAuthExpiry(res)) return; // modal stays open, draft preserved
      var err=await res.json().catch(function(){return{};});
      alert(err.detail||'Could not submit that review.');
      return; // modal stays open with the user's text intact so nothing is lost
    }
  }catch(e){
    alert('Backend unreachable — could not submit the review. Please try again.');
    return; // modal stays open
  }

  // Confirmed success — now it's safe to close and refresh.
  closeReviewModal();
  showToast('Review posted — thanks for sharing!','success');
  await refreshReviewsSection(barcode);
}

async function voteReview(barcode,id,vote){
  if(!isReallyLoggedIn()){ alert('Please log in to vote on a review.'); openAuthModal(); return; }
  try{
    var res=await fetch(REVIEWS_URL+'/'+id+'/vote',{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify({vote:vote})
    });
    if(!res.ok && handleAuthExpiry(res)) return;
  }catch(e){ /* ignore — refresh below will just show unchanged counts */ }
  refreshReviewsSection(barcode);
}

async function replyToReview(barcode,id){
  if(!isReallyLoggedIn()){ alert('Please log in to reply.'); openAuthModal(); return; }
  var text=(prompt('Write a reply:')||'').trim();
  if(!text) return;
  try{
    var res=await fetch(REVIEWS_URL+'/'+id+'/replies',{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()),
      body:JSON.stringify({reply_text:text})
    });
    if(!res.ok){
      if(handleAuthExpiry(res)) return;
      var err=await res.json().catch(function(){return{};});
      alert(err.detail||'Could not post that reply.');
    }
  }catch(e){ alert('Backend unreachable — could not post the reply.'); }
  refreshReviewsSection(barcode);
}

/* ══════════════════════════════════════════════════════
   TASK 2: SMART SEARCH WITH AUTOCOMPLETE
   ══════════════════════════════════════════════════════ */
// Confirmed contract (Dhruv, app.py / API_DOCS.md): GET /search/autocomplete?
// q=<text>&limit=1-10 (default 8). Response: {query, count, suggestions:
// [{product_name, brand, barcode}]} — note there is NO score/grade in this
// endpoint (it's a lightweight typeahead over product_name/brand only). We
// enrich each suggestion with a score/grade from the loaded CSV when the
// barcode happens to be in it, purely for a nicer dropdown — otherwise the
// row just shows name+brand with no score chip.
var AUTOCOMPLETE_URL=BACKEND_BASE_URL+'/search/autocomplete';
var _searchDebounceTimer=null;
var _searchRequestSeq=0;

function handleSearchAutocompleteInput(value){
  var box=document.getElementById('searchSuggestList');
  var query=(value||'').trim();
  if(_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
  if(query.length<2){ hideSearchSuggestions(); return; }
  box.innerHTML='<div class="search-suggest-status">Searching…</div>';
  box.classList.add('visible');
  _searchDebounceTimer=setTimeout(function(){ runAutocompleteSearch(query); },300);
}

async function runAutocompleteSearch(query){
  var mySeq=++_searchRequestSeq;
  var results=null;
  try{
    var res=await fetch(AUTOCOMPLETE_URL+'?q='+encodeURIComponent(query)+'&limit=8');
    if(res.ok){
      var data=await res.json();
      if(Array.isArray(data.suggestions)){
        results=data.suggestions.map(function(r){
          var enrich=(csvDBLoaded&&csvDB[r.barcode])?(function(){
            var norm=normBackend(csvDB[r.barcode]); return calculateScore(norm,'');
          })():null;
          return{barcode:r.barcode,name:r.product_name,brand:r.brand,score:enrich?enrich.score:undefined,grade:enrich?enrich.grade:undefined};
        });
      }
    }
  }catch(e){ /* fall through to local search below */ }

  if(mySeq!==_searchRequestSeq) return;

  if(!results){
    results=[];
    if(csvDBLoaded){
      var q=query.toLowerCase();
      results=Object.keys(csvDB).filter(function(bc){
        return(csvDB[bc].product_name||'').toLowerCase().indexOf(q)!==-1;
      }).slice(0,8).map(function(bc){
        var prod=csvDB[bc], norm=normBackend(prod), res=calculateScore(norm,'');
        return{barcode:bc,name:prod.product_name,brand:prod.brand,score:res.score,grade:res.grade};
      });
    }
  }
  renderSearchSuggestions(results);
}

function renderSearchSuggestions(results){
  var box=document.getElementById('searchSuggestList');
  if(!box) return;
  if(!results||!results.length){
    box.innerHTML='<div class="search-suggest-status">No matching products found.</div>';
    box.classList.add('visible');
    return;
  }
  box.innerHTML=results.map(function(r){
    var hasScore=typeof r.score==='number';
    var gc=!hasScore?'':(r.score>=9?'score-a':r.score>=7?'score-b':r.score>=5?'score-c':r.score>=3?'score-d':'score-f');
    var scoreCol=hasScore
      ? '<div class="search-suggest-score '+gc+'">'+(r.grade||'?')+'</div>'
      : '<div class="search-suggest-score" style="background:var(--off-white);color:var(--text-muted);">?</div>';
    return '<div class="search-suggest-row" onclick="selectSearchSuggestion(\''+r.barcode+'\')">'
      +scoreCol
      +'<div class="search-suggest-info"><div class="search-suggest-name">'+(r.name||'Unknown')+(hasScore?' '+buildRecommendedBadgeHTML(null,{score:r.score},true):'')+'</div><div class="search-suggest-brand">'+(r.brand||'')+(hasScore?' \u00b7 '+r.score+'/10':'')+'</div></div>'
      +'</div>';
  }).join('');
  box.classList.add('visible');
}

function selectSearchSuggestion(barcode){
  hideSearchSuggestions();
  quickScan(barcode);
}
function hideSearchSuggestions(){
  var box=document.getElementById('searchSuggestList');
  if(box){ box.classList.remove('visible'); box.innerHTML=''; }
}
document.addEventListener('click',function(e){
  var box=document.getElementById('searchSuggestList');
  var input=document.getElementById('barcodeInput');
  if(!box||!input) return;
  if(!box.contains(e.target)&&e.target!==input) hideSearchSuggestions();
});

function computeRecommendedBadgeSync(resultLike){
  if(!resultLike||typeof resultLike.score!=='number') return false;
  if(resultLike.score<=7) return false;
  var flags=resultLike.ingredientFlags||[];
  var hasHighRisk=flags.some(function(f){
    var risk=((f&&(f.risk||f.cat))||'').toString().toLowerCase();
    return risk==='severe'||risk==='high';
  });
  return !hasHighRisk;
}
function buildRecommendedBadgeHTML(productData,resultLike,small){
  var qualifies;
  if(productData && typeof productData.is_recommended==='boolean'){
    qualifies=productData.is_recommended;
  } else {
    qualifies=computeRecommendedBadgeSync(resultLike);
  }
  if(!qualifies) return '';
  return '<span class="swapify-rec-badge'+(small?' swapify-rec-badge-sm':'')+'" title="Meets Swapify\u2019s bar for a genuinely healthy pick">'
    +'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 21 12 17.77 5.8 21 7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>'
    +'Swapify Recommended</span>';
}
async function refreshRecommendedBadgeFromBackend(barcode){
  try{
    var res=await fetch(BACKEND_BASE_URL+'/product/'+encodeURIComponent(barcode)+'/badge');
    if(!res.ok) return;
    var data=await res.json();
    if(typeof data.is_recommended!=='boolean') return;
    var nameEl=document.querySelector('#result .product-name');
    if(!nameEl) return;
    var existing=nameEl.querySelector('.swapify-rec-badge');
    if(data.is_recommended && !existing){
      nameEl.insertAdjacentHTML('beforeend',' '+buildRecommendedBadgeHTML({is_recommended:true}));
    } else if(!data.is_recommended && existing){
      existing.remove();
    }
  }catch(e){ /* endpoint unreachable — sync heuristic badge stands */ }
}

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
loadPrefs();
renderPrefStrip();
loadCompareList();
loadBadgeState();
calcBadgeProgress(); // check for any already-earned badges silently
refreshCompareUI();
maybeShowOnboarding();
loadAuth();
if(currentUser&&currentUser.token&&!currentUser.localOnly){ fetchPreferencesFromBackend(); fetchFavoritesFromBackend(); fetchShoppingListFromBackend(); }
renderHomeDashboard();
renderStreakGoalCard();
renderQuickStats();

// Auto-show recommendations after first scan
var _origAddToHistory=addToHistory;
addToHistory=function(entry){
  _origAddToHistory(entry);
  if(typeof _monthlyBackendCache!=='undefined'){ delete _monthlyBackendCache[0]; _monthlyBackendFetchInFlight[0]=false; }
  calcBadgeProgress(); // check for new badges on every scan
  // Refresh recs cache
  _recsCache=null;
  renderHomeDashboard();
  renderStreakGoalCard();
  renderQuickStats();
};

// Refresh the dashboard's greeting + personalized/generic split on login/logout
var _origSaveAuth=saveAuth, _origClearAuth=clearAuth;
saveAuth=function(user){ _origSaveAuth(user); _monthlyBackendCache={}; _monthlyBackendFetchInFlight={}; renderHomeDashboard(); };
clearAuth=function(){ _origClearAuth(); _monthlyBackendCache={}; _monthlyBackendFetchInFlight={}; renderHomeDashboard(); };

// Refresh trending fallback + categories once the CSV finishes loading (it
// loads async and may finish after the first render calls above)
var _dashCsvCheckTimer=setInterval(function(){
  if(csvDBLoaded){
    clearInterval(_dashCsvCheckTimer);
    renderHomeDashboard();
    renderQuickStats();
    if(categoriesPanelOpen) renderCategoriesPanel();
  }
},400);
setTimeout(function(){ clearInterval(_dashCsvCheckTimer); },15000);

// Override renderProfilePanel to include badges
var _origRenderProfilePanel=renderProfilePanel;
renderProfilePanel=function(){
  _origRenderProfilePanel();
  renderProfileBadges();
};

/* ══════════════════════════════════════════════════════
   MULTI-PAGE NAVIGATION
   ══════════════════════════════════════════════════════ */
var CURRENT_PAGE = 'home';

function showPage(page) {
  /* Hide all pages */
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });

  /* Show target page */
  var el = document.getElementById('page-' + page);
  if (!el) { console.warn('showPage: no page-' + page); return; }
  el.classList.add('active');

  /* Update bottom nav — highlight parent tab for sub-pages */
  document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active'); });
  var nb = document.getElementById('nav-' + page);
  if (nb) {
    nb.classList.add('active');
  } else {
    /* Sub-pages (swaps, categories, cart, product, scanner) highlight Home */
    var nh = document.getElementById('nav-home');
    if (nh) nh.classList.add('active');
  }

  CURRENT_PAGE = page;
  window.scrollTo(0, 0);

  /* ── PAGE-SPECIFIC RENDERING ──────────────────────────── */

  if (page === 'home') {
    renderHomeDashboard && renderHomeDashboard();
    renderStreakGoalCard && renderStreakGoalCard();
    renderQuickStats && renderQuickStats();
  }

  /* page-scanner: input/camera/mic/chips live there permanently now */
  /* page-product: #result/#alternativesResult/#compareResult already live there */

  if (page === 'history') {
    /* Weekly chart */
    renderWeeklyPanel();
    var wpSrc = document.getElementById('weeklyPanel');
    var wpDst = document.getElementById('weeklyPanelPage');
    if (wpSrc && wpDst) wpDst.innerHTML = wpSrc.innerHTML;

    /* Monthly report — copy HTML then re-initialise Chart.js on the new canvas */
    renderMonthlyPanel();
    /* Give the browser a tick to paint the canvas, then draw the chart */
    setTimeout(function(){ syncMonthlyPanelToVisiblePage(); }, 100);
  }

  if (page === 'favorites') {
    renderFavoritesPanel();
    var fpSrc = document.getElementById('favoritesPanel');
    var fpDst = document.getElementById('favoritesPanelPage');
    if (fpSrc && fpDst) fpDst.innerHTML = fpSrc.innerHTML;
  }

  if (page === 'profile') {
    /* Profile stats panel */
    if (typeof renderProfilePanel === 'function') {
      renderProfilePanel();
      var profSrc = document.getElementById('profilePanel');
      var ppDst   = document.getElementById('profilePanelPage');
      if (profSrc && ppDst) ppDst.innerHTML = profSrc.innerHTML;
    }

    /* Challenges + Leaderboard — render async, show spinner while loading */
    (function() {
      var cpDst = document.getElementById('challengesPanelPage');
      if (!cpDst || typeof renderChallengesPanel !== 'function') return;
      cpDst.innerHTML = '<div style="padding:28px;text-align:center;font-family:\'DM Mono\',monospace;font-size:0.82rem;color:var(--text-muted);">'
        + '<div style="font-size:1.4rem;margin-bottom:8px;">⏳</div>Loading challenges &amp; leaderboard…</div>';
      /* Temporarily swap IDs so renderChallengesPanel renders into cpDst */
      var hiddenPanel = document.getElementById('challengesPanel');
      if (hiddenPanel) hiddenPanel.id = '_challengesPanelOff';
      cpDst.id = 'challengesPanel';
      Promise.resolve(renderChallengesPanel()).then(function(){
        cpDst.id = 'challengesPanelPage';
        if (hiddenPanel) hiddenPanel.id = 'challengesPanel';
      });
    })();

    /* Badges */
    if (typeof renderBadgesPanel === 'function') {
      renderBadgesPanel();
      var bpSrc = document.getElementById('badgesPanel');
      var bpDst = document.getElementById('badgesPanelPage');
      if (bpSrc && bpDst) bpDst.innerHTML = bpSrc.innerHTML;
    }
  }

  if (page === 'swaps') {
    if (typeof renderMySwapsPanel === 'function') {
      renderMySwapsPanel();
      var swSrc = document.getElementById('mySwapsPanel');
      var swDst = document.getElementById('mySwapsPanelPage');
      if (swSrc && swDst) swDst.innerHTML = swSrc.innerHTML;
    }
  }

  if (page === 'categories') {
    if (typeof renderCategoriesPanel === 'function') {
      _currentCategoryView = null; // fresh grid each time Categories is opened from the header
      renderCategoriesPanel();
    }
  }

  if (page === 'cart') {
    if (typeof renderShoppingListPanel === 'function') {
      renderShoppingListPanel();
      var cartSrc = document.getElementById('shoppingListPanel');
      var cartDst = document.getElementById('shoppingListPanelPage');
      if (cartSrc && cartDst) cartDst.innerHTML = cartSrc.innerHTML;
    }
  }

  if (page === 'compare') {
    if (typeof renderMultiCompareTable === 'function') renderMultiCompareTable();
  }

  if (page === 'preferences') {
    if (typeof syncPrefToggles === 'function') syncPrefToggles();
  }

  if (page === 'leaderboard') {
    if (typeof renderLeaderboardPage === 'function') renderLeaderboardPage();
  }

  if (page === 'challenges') {
    if (typeof renderChallengesPage === 'function') renderChallengesPage();
  }

  if (page === 'settings') {
    if (typeof renderSettingsPage === 'function') renderSettingsPage();
  }
}

/* ── Redirect old toggle functions → correct pages ─────── */
var _panelPageMap = {
  toggleFavoritesPanel:    'favorites',
  toggleWeeklyPanel:       'history',
  toggleMonthlyPanel:      'history',
  toggleBadgesPanel:       'profile',
  toggleChallengesPanel:   'challenges',
  toggleRecsPanel:         'home',
  toggleMySwapsPanel:      'swaps',
  openMySwapsPanel:        'swaps',
  toggleCategoriesPanel:   'categories',
  toggleShoppingListPanel: 'cart'
};
Object.keys(_panelPageMap).forEach(function(fnName) {
  window[fnName] = function() { showPage(_panelPageMap[fnName]); };
});

/* Fix quick-action "My Swaps" button from home dashboard */
function dashGoScan() { showPage('scanner'); }

/* ── scanProduct: result divs live in page-product permanently ─ */
var _origScanProduct = typeof scanProduct === 'function' ? scanProduct : null;
if (_origScanProduct) {
  scanProduct = async function() {
    /* Navigate to product page first so the DOM elements are visible */
    showPage('product');
    await _origScanProduct.apply(this, arguments);
    /* Scroll result into view */
    var rEl = document.getElementById('result');
    if (rEl && rEl.innerHTML.trim()) {
      setTimeout(function(){ rEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }
  };
}

/* ── Copy score with visible toast ─────────────────────── */
/* ══════════════════════════════════════════════════════
   POLISH PASS — skeleton loader helper
   Used by any panel that fetches before it can render (recommendations,
   leaderboard, challenges, reviews) instead of a plain "Loading…" line.
   ══════════════════════════════════════════════════════ */
function skeletonRows(n){
  var rows='';
  for(var i=0;i<(n||3);i++){
    rows+='<div class="skel-row"><div class="skeleton skel-circle"></div><div class="skel-lines"><div class="skeleton skel-line w70"></div><div class="skeleton skel-line w45"></div></div></div>';
  }
  return rows;
}

/* ══════════════════════════════════════════════════════
   POLISH PASS — shared toast notification system
   Native alert() dialogs are jarring and dated (they block the whole page,
   look like the browser rather than the app, and can't be dismissed by
   clicking elsewhere). This is the app's standard, professional replacement
   for confirmations that don't require the user to acknowledge before
   continuing — success/info messages surface here now instead.
   ══════════════════════════════════════════════════════ */
var _toastQueue=[],_toastShowing=false;
var TOAST_ICONS={
  success:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  error:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};
function showToast(message,type){
  type=(type==='error'||type==='info')?type:'success';
  _toastQueue.push({message:message,type:type});
  if(!_toastShowing) _drainToastQueue();
}
function _drainToastQueue(){
  var next=_toastQueue.shift();
  if(!next){ _toastShowing=false; return; }
  _toastShowing=true;
  var old=document.getElementById('swapifyToast');
  if(old) old.remove();
  var t=document.createElement('div');
  t.id='swapifyToast';
  t.className='swapify-toast toast-'+next.type;
  t.innerHTML='<span class="swapify-toast-icon">'+TOAST_ICONS[next.type]+'</span><span>'+next.message+'</span>';
  document.body.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add('show'); });
  setTimeout(function(){
    t.classList.remove('show');
    setTimeout(function(){ t.remove(); _drainToastQueue(); },250);
  },2600);
}

function copyScoreToClipboard(score) {
  var txt = String(score);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).catch(function(){});
  } else {
    var ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }
  showToast('Score copied!','success');
}

/* ── Header button nav targets ─────────────────────────── */
/* Override onclick on the header buttons now that we have new pages */
(function(){
  var btnMap = {
    btnMySwapsHeader:      'swaps',
    btnCategoriesHeader:   'categories',
    btnShoppingListHeader: 'cart',
    btnChallengesHeader:   'challenges',
    btnLeaderboardHeader:  'leaderboard',
    btnSettingsHeader:     'settings',
    btnWeeklyHeader:       'history',
    btnMonthlyHeader:      'history',
    btnRecsHeader:         'home'
  };
  Object.keys(btnMap).forEach(function(id){
    var btn = document.getElementById(id);
    if (btn) btn.onclick = function(){ showPage(btnMap[id]); };
  });
})();

/* ── Logo click → home ─────────────────────────────────── */
var _logoEl = document.querySelector('.logo');
if (_logoEl) _logoEl.onclick = function(){ showPage('home'); };