(() => {
  const socket = io();

  const joinModal = document.getElementById('joinModal');
  const nameInput = document.getElementById('nameInput');
  const joinBtn = document.getElementById('joinBtn');
  const joinError = document.getElementById('joinError');

  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const typingEl = document.getElementById('typing');
  const userListEl = document.getElementById('userList');
  const userCountEl = document.getElementById('userCount');

  let me = null;
  let isTyping = false;
  let typingTimeout = null;

  function openJoin() {
    joinModal.style.display = 'grid';
    nameInput.focus();
  }

  function closeJoin() {
    joinModal.style.display = 'none';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function appendSystemMessage(text) {
    const li = document.createElement('li');
    li.className = 'msg system';
    li.innerHTML = `<span>${escHtml(text)}</span>`;
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(msg) {
    const li = document.createElement('li');
    const mine = me && msg.userId === me.userId;
    li.className = `msg ${mine ? 'mine' : ''}`;
    const time = new Date(msg.timestamp).toLocaleTimeString();
    li.innerHTML = `
      <div class="meta">
        <span class="name">${escHtml(msg.userName)}</span>
        <span class="time">${time}</span>
      </div>
      <div class="text">${msg.text}</div>
    `;
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setUsers(list) {
    userListEl.innerHTML = '';
    list.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u.userName;
      userListEl.appendChild(li);
    });
    userCountEl.textContent = String(list.length);
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    socket.emit('message', { text });
    inputEl.value = '';
  }

  function updateTyping(on) {
    if (isTyping === on) return;
    isTyping = on;
    socket.emit('typing', { isTyping: on });
  }

  inputEl.addEventListener('input', () => {
    updateTyping(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => updateTyping(false), 1500);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  joinBtn.addEventListener('click', () => {
    const name = (nameInput.value || '').trim();
    if (name.length < 1 || name.length > 20) {
      joinError.textContent = '이름은 1~20자여야 합니다.';
      return;
    }
    joinError.textContent = '';
    socket.emit('join', { userName: name });
  });

  // Socket events
  socket.on('connect', () => {
    // fresh connection requires join
    openJoin();
  });

  socket.on('history', (payload) => {
    messagesEl.innerHTML = '';
    (payload.messages || []).forEach(appendMessage);
  });

  socket.on('userlist', (payload) => {
    setUsers(payload.users || []);
  });

  socket.on('joined', (payload) => {
    if (!me) {
      // First joined after join action refers to me as well; set me once
      me = { userId: payload.userId, userName: payload.userName };
      closeJoin();
    }
    appendSystemMessage(`${payload.userName} 님이 입장했습니다.`);
  });

  socket.on('left', (payload) => {
    appendSystemMessage(`${payload.userName} 님이 퇴장했습니다.`);
  });

  socket.on('message', (msg) => {
    appendMessage(msg);
  });

  socket.on('typing', (payload) => {
    const { userName, isTyping } = payload;
    if (isTyping) {
      typingEl.style.display = 'block';
      typingEl.textContent = `${userName} 님이 입력 중...`;
      setTimeout(() => {
        typingEl.style.display = 'none';
      }, 1500);
    } else {
      typingEl.style.display = 'none';
    }
  });

  socket.on('errorMsg', (e) => {
    joinError.textContent = e && e.message ? e.message : '오류가 발생했습니다.';
  });
})();


