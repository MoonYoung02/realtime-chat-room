# Realtime Chat Room (Express + Socket.IO)

Single-room realtime chat: open a link, enter a name, and chat with everyone.

## You can play this! 
https://railway.com/project/f6f4a2de-286c-4a4e-8126-f48610ccaba0/service/736dff7d-ff1f-4cc4-b4a0-bc9ad3e6bd78/settings?environmentId=8eb7da6c-4e7e-4e5a-aad7-0a6c8fab4b59
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


