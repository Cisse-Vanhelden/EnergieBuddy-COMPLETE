
(function(){
  const SETTINGS_KEY = 'eb_settings_v3';
  let chartInstance = null;

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { pricePerKwh: 0.30, co2PerKwh: 0.385 }; }
    catch { return { pricePerKwh: 0.30, co2PerKwh: 0.385 }; }
  }
  function saveSettings(data) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); }
  function q(id){ return document.getElementById(id); }
  function money(v){ return '€' + Number(v || 0).toFixed(2); }
  function num(v, digits=2){ return Number(v || 0).toFixed(digits); }
  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function todayISO(){ return new Date().toISOString().slice(0,10); }
  function calcDeviceDailyKwh(d){ return ((Number(d.wattage)||0) * (Number(d.hours_per_day)||0)) / 1000; }
  function monthlyKwhFromDevices(devices){ return devices.reduce((sum, d) => sum + calcDeviceDailyKwh(d) * 30, 0); }
  function levelFromPoints(points){ return 1 + Math.floor((Number(points)||0) / 500); }
  function fillXpBar(points){
    const level = levelFromPoints(points);
    const prev = (level - 1) * 500;
    const pct = Math.min(100, ((Number(points)||0) - prev) / 500 * 100);
    const bar = q('xpBarFill');
    if (bar) bar.style.width = pct + '%';
    return level;
  }

  async function getUserAndMaybeProtect(protect = false) {
    const data = await EBAuth.getMeSafe();
    if (!data?.user && protect) {
      window.location.href = 'login.html';
      return null;
    }
    return data?.user || null;
  }

  function setActiveNav(){
    const file = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(a => {
      if (a.getAttribute('href') === file) a.classList.add('active');
    });
  }

  function wireAuthNav(user){
    const navSlot = q('auth-nav');
    if (!navSlot) return;
    if (user) {
      navSlot.innerHTML = `
        <span class="tag">👋 ${escapeHtml(user.display_name)}</span>
        <a href="profile.html">Profiel</a>
        <button id="logoutBtn" class="ghost-btn">Uitloggen</button>`;
      const btn = q('logoutBtn');
      if (btn) btn.onclick = () => EBAuth.logoutUser();
    } else {
      navSlot.innerHTML = `
        <a href="login.html">Login</a>
        <a href="register.html">Registreren</a>`;
    }
  }

  async function initCommon({ protect=false, chatPage='app' }={}) {
    setActiveNav();
    const user = await getUserAndMaybeProtect(protect);
    if (protect && !user) return null;
    wireAuthNav(user);
    if (window.EBChat && user) window.EBChat.initChatWidget(chatPage);
    return user;
  }

  async function initHome(){
    const user = await initCommon({ protect:false, chatPage:'home' });
    const settings = loadSettings();
    const leaderboardData = await api('/leaderboard').catch(() => ({ leaderboard: [] }));
    let devices = [];
    if (user) {
      const data = await api('/devices').catch(() => ({ devices: [] }));
      devices = data.devices || [];
    }
    const monthlyKwh = monthlyKwhFromDevices(devices);
    q('kpiKwh').textContent = user ? num(monthlyKwh) : '—';
    q('kpiCost').textContent = user ? money(monthlyKwh * settings.pricePerKwh) : '—';
    q('kpiCo2').textContent = user ? `${num(monthlyKwh * settings.co2PerKwh)} kg` : '—';

    if (user) {
      q('home-auth-message').innerHTML = `Welkom terug, <b>${escapeHtml(user.display_name)}</b>. Je data wordt nu geladen uit de database.`;
      q('username').value = user.display_name || '';
      q('username').disabled = true;
      q('btnSaveName').textContent = 'Naam via account';
      q('btnSaveName').disabled = true;
      q('level').textContent = levelFromPoints(user.total_points || 0);
      q('levelTitle').textContent = 'Database user';
      q('xp').textContent = user.total_points || 0;
      q('best').textContent = user.monthly_score || 0;
      q('score').textContent = user.daily_score || 0;
      q('streak').textContent = Math.max(0, Math.round((user.weekly_score || 0) / 100));
      q('todayKwh').textContent = num(monthlyKwh / 30);
      q('baselineKwh').textContent = num((monthlyKwh / 30) + 1.5);
      fillXpBar(user.total_points || 0);
      q('btnBaseline').onclick = () => location.href = 'input.html';
      q('btnClaim').textContent = 'Voeg een nieuwe entry toe';
      q('btnClaim').onclick = () => location.href = 'input.html#entry-form';
      q('btnCheat').textContent = 'Open leaderboard';
      q('btnCheat').onclick = () => location.href = 'leaderboard.html';
    } else {
      q('home-auth-message').innerHTML = 'Log in of maak een account aan om je echte persoonlijke data te zien.';
      q('username').value = 'Gast';
      q('username').disabled = true;
      q('btnSaveName').textContent = 'Login vereist';
      q('btnSaveName').disabled = true;
      ['level','xp','best','score','streak','todayKwh','baselineKwh'].forEach(id => q(id).textContent = '—');
      q('levelTitle').textContent = 'Gast';
      q('btnBaseline').onclick = () => location.href = 'login.html';
      q('btnClaim').textContent = 'Log in';
      q('btnClaim').onclick = () => location.href = 'login.html';
      q('btnCheat').textContent = 'Demo account';
      q('btnCheat').onclick = () => location.href = 'login.html?demo=1';
    }

    const tbody = document.querySelector('#lb tbody');
    const rows = leaderboardData.leaderboard || [];
    tbody.innerHTML = rows.length ? rows.map((r, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${escapeHtml(r.display_name)} ${r.is_demo ? ' <span class="small">(demo)</span>' : ''}</td>
        <td>${r.monthly_score || 0}</td>
        <td>${r.total_points || 0}</td>
        <td>${levelFromPoints(r.total_points || 0)}</td>
      </tr>`).join('') : '<tr><td colspan="5">Nog geen spelers gevonden.</td></tr>';
  }

  async function initDashboard(){
    const user = await initCommon({ protect:true, chatPage:'dashboard' });
    if (!user) return;
    const settings = loadSettings();
    const devicesRes = await api('/devices');
    const entriesRes = await api('/entries');
    const devices = devicesRes.devices || [];
    const entries = entriesRes.entries || [];
    const monthlyKwh = monthlyKwhFromDevices(devices);
    q('kpi-dash-kwh').textContent = num(monthlyKwh);
    q('kpi-dash-cost').textContent = money(monthlyKwh * settings.pricePerKwh);
    q('kpi-dash-co2').textContent = `${num(monthlyKwh * settings.co2PerKwh)} kg`;
    const top3 = [...devices].map(d => ({...d, monthlyKwh: calcDeviceDailyKwh(d)*30})).sort((a,b)=>b.monthlyKwh-a.monthlyKwh).slice(0,3);
    q('top3-list').innerHTML = top3.length ? top3.map((a, i) => `<li><b>#${i+1} ${escapeHtml(a.name)}</b> - ${num(a.monthlyKwh)} kWh/mnd</li>`).join('') : '<li>Geen apparaten gevonden.</li>';
    const ctx = q('deviceChart');
    if (ctx && window.Chart) {
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: devices.map(d => d.name),
          datasets: [{ label: 'Monthly kWh', data: devices.map(d => calcDeviceDailyKwh(d) * 30), backgroundColor: '#F4B400', borderRadius: 8 }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
    const summary = q('dashboard-summary');
    if (summary) {
      summary.innerHTML = entries.length
      ? `Je hebt <b>${entries.length}</b> energy entries opgeslagen. Je dagscore is momenteel <b>${user.daily_score || 0}</b>.`
      : 'Nog geen energy entries opgeslagen. Voeg er eentje toe op de Input-pagina om je dashboard te voeden.';
    }
  }

  async function initInput(){
    const user = await initCommon({ protect:true, chatPage:'input' });
    if (!user) return;
    const settings = loadSettings();
    q('setPrice').value = settings.pricePerKwh;
    q('setCo2').value = settings.co2PerKwh;
    q('btnSaveSet').onclick = () => {
      saveSettings({ pricePerKwh: Number(q('setPrice').value || 0.30), co2PerKwh: Number(q('setCo2').value || 0.385) });
      alert('Lokale instellingen opgeslagen in je browser.');
    };
    q('entryDate').value = todayISO();
    await renderDevicesAndEntries();
  }

  async function renderDevicesAndEntries(){
    const devicesRes = await api('/devices');
    const entriesRes = await api('/entries');
    const devices = devicesRes.devices || [];
    const entries = entriesRes.entries || [];
    const tb = q('appTbody');
    tb.innerHTML = devices.length ? devices.map(d => `
      <tr>
        <td><b>${escapeHtml(d.name)}</b><div class="small">${escapeHtml(d.category)}</div></td>
        <td>${d.wattage}</td>
        <td>${num(d.hours_per_day)}</td>
        <td>${num(calcDeviceDailyKwh(d) * 7)} kWh</td>
        <td><button class="btn secondary small" data-delete="${d.id}">Verwijder</button></td>
      </tr>`).join('') : '<tr><td colspan="5">Nog geen apparaten toegevoegd.</td></tr>';
    tb.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Apparaat verwijderen?')) return;
        await api(`/devices?id=${btn.dataset.delete}`, { method: 'DELETE' });
        await renderDevicesAndEntries();
      };
    });

    const select = q('entryDevice');
    select.innerHTML = '<option value="">Algemene entry</option>' + devices.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');

    q('entryTableBody').innerHTML = entries.length ? entries.slice(0,8).map(e => `
      <tr>
        <td>${escapeHtml(e.entry_date)}</td>
        <td>${escapeHtml(e.device_name || 'Algemeen')}</td>
        <td>${num(e.kwh_used)}</td>
        <td>${money(e.cost_eur)}</td>
        <td>${escapeHtml(e.notes || '')}</td>
      </tr>`).join('') : '<tr><td colspan="5">Nog geen entries opgeslagen.</td></tr>';
  }

  async function addApplianceRow(){
    const name = q('new-name').value.trim();
    const wattage = Number(q('new-watt').value || 0);
    const hours = Number(q('new-hours').value || 0);
    const category = q('new-days').value.trim() || 'Algemeen';
    if (!name) return alert('Geef een apparaatnaam op.');
    await api('/devices', { method: 'POST', body: JSON.stringify({ name, category, wattage, hoursPerDay: hours }) });
    q('new-name').value=''; q('new-watt').value=''; q('new-hours').value=''; q('new-days').value='';
    await renderDevicesAndEntries();
  }

  async function saveAllAppliances(){
    alert('Wijzigingen aan bestaande apparaten bewerk je nu door ze te verwijderen en opnieuw toe te voegen.');
  }

  async function addEntry(){
    const deviceId = q('entryDevice').value || null;
    const entryDate = q('entryDate').value;
    const kwhUsed = Number(q('entryKwh').value || 0);
    const costEur = Number(q('entryCost').value || 0);
    const notes = q('entryNotes').value.trim();
    await api('/entries', { method: 'POST', body: JSON.stringify({ deviceId, entryDate, kwhUsed, costEur, notes }) });
    q('entryKwh').value=''; q('entryCost').value=''; q('entryNotes').value='';
    await renderDevicesAndEntries();
    alert('Entry opgeslagen.');
  }

  async function initSavings(){
    const user = await initCommon({ protect:true, chatPage:'savings' });
    if (!user) return;
    const settings = loadSettings();
    const devicesRes = await api('/devices');
    const devices = devicesRes.devices || [];
    const monthlyKwh = monthlyKwhFromDevices(devices);
    const sl = q('savingsSlider');
    const bd = q('savingsBadge');
    function updateCalc() {
      const pct = Number(sl.value || 0) / 100;
      bd.textContent = `↘ ${sl.value}%`;
      const saveK = monthlyKwh * pct;
      const saveC = saveK * settings.pricePerKwh;
      const saveCo2 = saveK * settings.co2PerKwh;
      q('save-kwh').textContent = num(saveK);
      q('save-cost').textContent = money(saveC);
      q('save-co2').textContent = num(saveCo2);
      q('ann-eur').textContent = money(saveC * 12);
      q('ann-co2').textContent = num(saveCo2 * 12);
      q('ann-trees').textContent = Math.round((saveCo2 * 12) / 21);
      const afterKwh = monthlyKwh - saveK;
      if (window.Chart) {
        const ctx = q('savingsChart');
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: { labels:['Totale kWh','Totale Kost (€)','Totale CO₂ (kg)'], datasets:[
            { label:'Before', data:[monthlyKwh, monthlyKwh*settings.pricePerKwh, monthlyKwh*settings.co2PerKwh], backgroundColor:'#ff6b6b' },
            { label:'After', data:[afterKwh, afterKwh*settings.pricePerKwh, afterKwh*settings.co2PerKwh], backgroundColor:'#51cf66' }
          ]},
          options:{ responsive:true, scales:{ y:{ beginAtZero:true } } }
        });
      }
    }
    sl.oninput = updateCalc;
    updateCalc();
  }

  async function initTips(){
    const user = await initCommon({ protect:true, chatPage:'tips' });
    if (!user) return;
    const devicesRes = await api('/devices');
    const devices = (devicesRes.devices || []).map(d => ({ ...d, monthlyKwh: calcDeviceDailyKwh(d) * 30 }));
    const top = [...devices].sort((a,b)=>b.monthlyKwh-a.monthlyKwh).slice(0,3);
    q('tips-top-list').innerHTML = top.length ? top.map((a,i)=>`<tr><td><b>#${i+1} ${escapeHtml(a.name)}</b><div class="small">${escapeHtml(a.category)} • ${a.wattage}W • ${num(a.hours_per_day)}h/d</div></td><td style="text-align:right"><b style="font-size:22px">${num(a.monthlyKwh,1)}</b> <span class="small">kWh/mnd</span></td></tr>`).join('') : '<tr><td colspan="2">Geen apparaten ingevoerd.</td></tr>';
    const allTips = [
      { key:['koelkast','fridge','vriezer'], tip:'Controleer de temperatuur: koelkast 4°C en vriezer -18°C is vaak ideaal.', emoji:'🧊' },
      { key:['tv','televisie'], tip:'Schakel de tv volledig uit in plaats van standby te laten sluimeren.', emoji:'📺' },
      { key:['laptop','pc','computer'], tip:'Gebruik energiebesparende modus en verminder schermhelderheid voor stille winst.', emoji:'💻' },
      { key:['wasmachine','droger'], tip:'Bundel wasbeurten en draai op lagere temperaturen waar mogelijk.', emoji:'👕' },
      { key:['boiler','verwarming'], tip:'Verlaag de temperatuur een tikje en isoleer waar warmte ontsnapt.', emoji:'🔥' },
      { key:['lamp','licht'], tip:'Kies LED-verlichting en laat donkere kamers niet nodeloos branden.', emoji:'💡' }
    ];
    const chosen = [];
    top.forEach(device => {
      const match = allTips.find(t => t.key.some(k => device.name.toLowerCase().includes(k) || device.category.toLowerCase().includes(k)));
      if (match) chosen.push({ title: device.name, ...match });
    });
    while (chosen.length < 4) {
      chosen.push(allTips[chosen.length % allTips.length]);
    }
    q('tips-grid').innerHTML = chosen.slice(0,4).map(t => `
      <div class="card">
        <h2>${t.emoji} ${escapeHtml(t.title || 'Slimme tip')}</h2>
        <div class="hint">Kleine verandering, merkbaar effect.</div>
        <p class="small" style="margin-top:10px; line-height:1.6">${escapeHtml(t.tip)}</p>
      </div>`).join('');
    const btn = q('btn-download');
    if (btn) btn.onclick = () => {
      const html = document.documentElement.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'energiebuddy-tips-report.html'; a.click();
      URL.revokeObjectURL(url);
    };
  }

  async function initLeaderboard(){
    await initCommon({ protect:false, chatPage:'leaderboard' });
    const data = await api('/leaderboard').catch(() => ({ leaderboard: [] }));
    const body = q('leaderboard-body');
    const rows = data.leaderboard || [];
    body.innerHTML = rows.length ? rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.display_name)}</td><td>${r.weekly_score || 0}</td><td>${r.monthly_score || 0}</td><td>${r.total_points || 0}</td></tr>`).join('') : '<tr><td colspan="5">Nog geen scores.</td></tr>';
  }

  async function initProfile(){
    const user = await initCommon({ protect:true, chatPage:'profile' });
    if (!user) return;
    q('profile-name').textContent = user.display_name || '—';
    q('profile-email').textContent = user.email || '—';
    q('profile-household').textContent = user.household_size || '1';
    q('profile-home').textContent = user.home_type || '—';
    q('profile-city').textContent = user.city || '—';
    q('profile-bio').textContent = user.bio || 'Nog geen bio ingevuld.';
    q('profile-total').textContent = user.total_points || 0;
    q('profile-daily').textContent = user.daily_score || 0;
    q('profile-weekly').textContent = user.weekly_score || 0;
    q('profile-monthly').textContent = user.monthly_score || 0;
  }

  window.EB = { initHome, initDashboard, initInput, initSavings, initTips, initLeaderboard, initProfile, addApplianceRow, saveAllAppliances, addEntry };
})();
