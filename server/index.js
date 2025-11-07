const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { escapeHtml } = require('./sanitize');
const { TokenBucket } = require('./rateLimiter');
const crypto = require('crypto');

// Env
const PORT = Number(process.env.PORT || 3000);
const ROOM_NAME = process.env.ROOM_NAME || '공용 채팅방';
const HISTORY_SIZE = Number(process.env.HISTORY_SIZE || 100);
const RATE_LIMIT_MSG_PER_SEC = Number(process.env.RATE_LIMIT_MSG_PER_SEC || 5);
const RATE_LIMIT_BURST = Number(process.env.RATE_LIMIT_BURST || 10);

const app = express();

// Static assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Healthcheck
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, room: ROOM_NAME });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: false },
});

// State
/** @type {Map<string, { userId: string, userName: string, joinedAt: number }>} */
const activeUsers = new Map();
/** @type {Array<{ id: string, userId: string, userName: string, text: string, timestamp: number }>} */
const messageHistory = [];

/** @param {number} size */
function trimHistory(size) {
  while (messageHistory.length > size) {
    messageHistory.shift();
  }
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function getUsersList() {
  return Array.from(activeUsers.values()).map(u => ({ userId: u.userId, userName: u.userName }));
}

io.on('connection', (socket) => {
  const bucket = new TokenBucket({
    ratePerSecond: RATE_LIMIT_MSG_PER_SEC,
    burst: RATE_LIMIT_BURST,
  });

  let registered = false;
  let user = null;
  let lastTypingSentAt = 0;

  socket.on('join', (payload = {}) => {
    if (registered) return;
    const rawName = String(payload.userName || '').trim();
    if (rawName.length < 1 || rawName.length > 20) {
      socket.emit('errorMsg', { code: 'INVALID_NAME', message: '이름은 1~20자여야 합니다.' });
      return;
    }
    const userId = generateId();
    user = { userId, userName: rawName, joinedAt: Date.now() };
    activeUsers.set(socket.id, user);
    registered = true;

    // Initial sync
    socket.emit('history', { messages: messageHistory });
    io.emit('userlist', { users: getUsersList() });
    io.emit('joined', { userId, userName: rawName });
  });

  socket.on('message', (payload = {}) => {
    if (!registered) return;
    const rateOkay = bucket.tryRemoveTokens(1);
    if (!rateOkay) {
      // Optionally inform the client
      return;
    }
    let text = String(payload.text || '').trim();
    if (text.length < 1 || text.length > 500) return;
    text = escapeHtml(text);

    const msg = {
      id: generateId(),
      userId: user.userId,
      userName: user.userName,
      text,
      timestamp: Date.now(),
    };
    messageHistory.push(msg);
    trimHistory(HISTORY_SIZE);
    io.emit('message', msg);
  });

  socket.on('typing', (payload = {}) => {
    if (!registered) return;
    const now = Date.now();
    if (now - lastTypingSentAt < 1000) return; // throttle 1s
    lastTypingSentAt = now;
    const isTyping = Boolean(payload.isTyping);
    socket.broadcast.emit('typing', { userId: user.userId, userName: user.userName, isTyping });
  });

  socket.on('disconnect', () => {
    if (!registered) return;
    const u = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    io.emit('userlist', { users: getUsersList() });
    if (u) {
      io.emit('left', { userId: u.userId, userName: u.userName });
    }
  });
});

server.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT} (${ROOM_NAME})`);
});


