
(function(){
  function initChatWidget(pageName='app') {
    if (document.getElementById('chat-toggle')) return;
    const toggle = document.createElement('div');
    toggle.id = 'chat-toggle';
    toggle.className = 'chat-toggle';
    toggle.textContent = '🤖';

    const box = document.createElement('div');
    box.id = 'chat-box';
    box.className = 'chat-box';
    box.innerHTML = `
      <div class="chat-head">EnergieBuddy AI</div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-wrap">
        <input id="chat-input" class="input" placeholder="Stel een vraag over je app of je verbruik..." />
        <button id="chat-send" class="btn small">Verstuur</button>
      </div>`;

    document.body.appendChild(toggle);
    document.body.appendChild(box);

    const messages = box.querySelector('#chat-messages');
    const input = box.querySelector('#chat-input');
    const send = box.querySelector('#chat-send');
    const storageKey = 'eb_chat_history';

    function loadHistory() {
      try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
    }
    function saveHistory(items) {
      localStorage.setItem(storageKey, JSON.stringify(items.slice(-30)));
    }
    function addBubble(text, who) {
      const el = document.createElement('div');
      el.className = `bubble ${who}`;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    const history = loadHistory();
    if (!history.length) {
      const welcome = 'Hallo! Ik ben je EnergieBuddy AI. Stel gerust vragen over je score, apparaten, tips of deze pagina.';
      addBubble(welcome, 'bot');
      saveHistory([{ who: 'bot', text: welcome }]);
    } else {
      history.forEach(item => addBubble(item.text, item.who));
    }

    toggle.onclick = () => box.classList.toggle('open');

    async function submit() {
      const message = input.value.trim();
      if (!message) return;
      addBubble(message, 'user');
      const current = loadHistory();
      current.push({ who: 'user', text: message });
      saveHistory(current);
      input.value = '';
      try {
        const data = await api('/chat', {
          method: 'POST',
          body: JSON.stringify({ message, page: pageName })
        });
        addBubble(data.reply || 'Geen antwoord ontvangen.', 'bot');
        const updated = loadHistory();
        updated.push({ who: 'bot', text: data.reply || 'Geen antwoord ontvangen.' });
        saveHistory(updated);
      } catch (err) {
        const reply = 'De AI kon nu niet antwoorden. Controleer of je bent ingelogd en of GROQ_API_KEY goed staat.';
        addBubble(reply, 'bot');
      }
    }

    send.onclick = submit;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }
  window.EBChat = { initChatWidget };
})();
