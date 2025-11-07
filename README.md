# Realtime Chat Room (Express + Socket.IO)

Single-room realtime chat: open a link, enter a name, and chat with everyone.

## You can play this! 
https://realtime-chat-room-production-07cc.up.railway.app/
(serving on railway)
## Run locally

```bash
npm install
npm start
```

- App: http://localhost:3000
- Health: http://localhost:3000/healthz

Optional env (defaults shown):

```
PORT=3000
ROOM_NAME=공용 채팅방
HISTORY_SIZE=100
RATE_LIMIT_MSG_PER_SEC=5
RATE_LIMIT_BURST=10
```

## Features
- Join with a nickname
- Realtime messages with timestamps
- Presence: user count and list
- Join/leave notices
- Typing indicator
- Last N messages kept in memory
- Basic XSS protection and per-socket rate limit

## Notes
- In-memory state. For multiple instances, add Socket.IO Redis adapter and shared store.
- Messages are escaped server-side; do not render raw HTML from users.



