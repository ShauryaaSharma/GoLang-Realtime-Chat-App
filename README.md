# NEXUS — GoLang Realtime Chat App

> A full-stack, real-time group chat application built with a **Go WebSocket backend** and a **React frontend** featuring a cyberpunk/terminal aesthetic.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Backend — Deep Dive](#backend--deep-dive)
   - [Entry Point: main.go](#entry-point-maingo)
   - [WebSocket Upgrader: websocket.go](#websocket-upgrader-websocketgo)
   - [Client Model: client.go](#client-model-clientgo)
   - [Connection Pool: pool.go](#connection-pool-poolgo)
   - [Message Flow](#message-flow)
6. [Frontend — Deep Dive](#frontend--deep-dive)
   - [API Layer: api/index.js](#api-layer-apiindexjs)
   - [Root Component: App.js](#root-component-appjs)
   - [Header Component](#header-component)
   - [ChatHistory Component](#chathistory-component)
   - [Message Component](#message-component)
   - [ChatInput Component](#chatinput-component)
7. [Styling & Design System](#styling--design-system)
8. [Data Flow & Message Protocol](#data-flow--message-protocol)
9. [Gamification System](#gamification-system)
10. [Environment Configuration](#environment-configuration)
11. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Running Locally (Manual)](#running-locally-manual)
    - [Running with Docker](#running-with-docker)
12. [Key Engineering Decisions & Bug Fixes](#key-engineering-decisions--bug-fixes)
13. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Project Overview

NEXUS is a **real-time, multi-user group chat application** that allows multiple browser clients to communicate with each other simultaneously via WebSockets. When a user opens the app, they choose a callsign (username), then join a shared chat room where all connected users can send and receive messages instantly.

The application has a distinctive **cyberpunk terminal aesthetic** — neon glow effects, CRT scanlines, an Orbitron typeface, and a gamification layer (XP and levels) built on top of the core messaging features.

Key features:
- Real-time bidirectional communication via WebSockets (no polling)
- Shared broadcast room — all connected users see all messages
- System notifications when users join or disconnect
- Username/callsign selection at login
- Message attribution — own messages vs. others are visually differentiated
- Timestamps on every message
- Auto-scroll to the latest message
- Automatic WebSocket reconnection on disconnect
- XP and level progression system
- Live connection status indicator in the header
- Dockerized backend for easy deployment

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              React Frontend (port 3000)              │   │
│   │                                                      │   │
│   │  App.js  ──►  api/index.js  ──► WebSocket Client    │   │
│   │    │                                  │               │   │
│   │  Header                       ws://localhost:8080/ws │   │
│   │  ChatHistory                          │               │   │
│   │  ChatInput                            │               │   │
│   │  Message                             ▼               │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              │ WebSocket (RFC 6455)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│               Go Backend Server (port 8080)                  │
│                                                              │
│   main.go ──► serveWs() ──► websocket.Upgrade()            │
│                   │                                          │
│                   ▼                                          │
│           Client{ID, Conn, Pool}                             │
│                   │                                          │
│          pool.Register ◄──────────────────────────          │
│                   │                                          │
│   ┌───────────────────────────────────────────────────┐     │
│   │              Connection Pool (goroutine)           │     │
│   │                                                    │     │
│   │   Register ──► add client ──► broadcast join msg  │     │
│   │   Unregister ► remove client ► broadcast leave    │     │
│   │   Broadcast ──► fan-out message to all clients    │     │
│   └───────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

The architecture is intentionally simple: one Go HTTP server handles WebSocket upgrades and maintains a single in-memory connection pool. There is no database, no authentication, and no message persistence — all state lives in memory for the lifetime of the server process.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Backend language | Go | 1.21 | WebSocket server |
| WebSocket library | `gorilla/websocket` | v1.4.0 | HTTP→WS upgrade, read/write |
| Frontend framework | React | 16.14.0 | UI component tree |
| Build toolchain | Create React App / react-scripts | 5.0.1 | Dev server, bundling |
| Styling | SCSS (via `sass` package) | ^1.69.5 | Component-scoped styles |
| Fonts | Google Fonts (Orbitron, Share Tech Mono) | — | Cyberpunk typography |
| Containerization | Docker (alpine-based Go image) | golang:1.21-alpine | Backend deployment |

---

## Project Structure

```
GoLang-Realtime-Chat-App/
│
├── backend/                        # Go WebSocket server
│   ├── Dockerfile                  # Container definition for the backend
│   ├── go.mod                      # Go module definition (module path + dependencies)
│   ├── go.sum                      # Dependency checksums
│   ├── main.go                     # Entry point: HTTP server, route setup, WS handshake
│   └── pkg/
│       └── websocket/
│           ├── client.go           # Client struct, Message struct, read loop
│           ├── pool.go             # Connection pool, broadcast fan-out goroutine
│           └── websocket.go        # HTTP→WebSocket upgrader with origin checking
│
├── frontend/                       # React single-page application
│   ├── package.json                # npm dependencies and scripts
│   ├── public/
│   │   ├── index.html              # HTML shell / mount point
│   │   ├── favicon.ico
│   │   └── manifest.json           # PWA manifest
│   └── src/
│       ├── App.js                  # Root component: state management, login screen
│       ├── App.css                 # Global styles, design tokens, login overlay
│       ├── index.js                # React DOM render entry
│       ├── api/
│       │   └── index.js            # WebSocket connection, send/receive, auto-reconnect
│       └── components/
│           ├── Header/
│           │   ├── Header.jsx      # App bar: logo, status, XP bar, player tag
│           │   ├── Header.scss
│           │   └── index.js        # Re-export barrel
│           ├── ChatHistory/
│           │   ├── ChatHistory.jsx # Scrollable message list with auto-scroll
│           │   ├── ChatHistory.scss
│           │   └── index.js
│           ├── ChatInput/
│           │   ├── ChatInput.jsx   # Text input; sends on Enter keydown
│           │   ├── ChatInput.scss
│           │   └── index.js
│           └── Message/
│               ├── Message.jsx     # Single message bubble (own / other / system)
│               ├── Message.scss
│               └── index.js
│
├── Chathistory.scss                # Root-level SCSS stubs (legacy / unused)
├── Chatinput.scss
├── header.scss
├── message.scss
└── README.md                       # (This file)
```

> **Note:** The four `.scss` files in the project root (`Chathistory.scss`, `Chatinput.scss`, `header.scss`, `message.scss`) are legacy stubs and are not imported by any component. The active stylesheets live inside `frontend/src/components/`.

---

## Backend — Deep Dive

### Entry Point: `main.go`

```
backend/main.go
```

`main.go` is the server entry point. It does three things:

1. **Bootstraps a single connection `Pool`** by calling `websocket.NewPool()` and launches it as a goroutine with `go pool.Start()`. This goroutine runs forever and is responsible for processing all register/unregister/broadcast events.

2. **Registers the `/ws` HTTP route** using the standard library `net/http`. Every HTTP request to `/ws` is handed to `serveWs()`.

3. **Calls `http.ListenAndServe(":8080", nil)`** to start the HTTP server. The server binds to all interfaces on port `8080`.

The `serveWs` function:
- Calls `websocket.Upgrade()` to perform the HTTP→WebSocket handshake.
- Constructs a `Client` struct, using `r.RemoteAddr` (the TCP remote address, e.g. `127.0.0.1:54321`) as the client's unique ID.
- Sends the client to `pool.Register` (a channel), which adds it to the active pool.
- Calls `client.Read()` — a blocking loop that reads incoming messages from this client's WebSocket connection until it disconnects.

---

### WebSocket Upgrader: `websocket.go`

```
backend/pkg/websocket/websocket.go
```

This file defines the `upgrader` variable — a `gorilla/websocket.Upgrader` configured with:

- `ReadBufferSize: 1024` and `WriteBufferSize: 1024` bytes — suitable for text chat messages.
- A `CheckOrigin` function that implements a simple **environment-driven CORS policy**:
  - If the `ALLOWED_ORIGIN` environment variable is set, only requests whose `Origin` header matches that value are permitted. All others are rejected.
  - If `ALLOWED_ORIGIN` is not set (development mode), **all origins are allowed** (`return true`).

The exported `Upgrade()` function wraps `upgrader.Upgrade()` and returns the established `*websocket.Conn` or an error.

---

### Client Model: `client.go`

```
backend/pkg/websocket/client.go
```

**`Client` struct:**

```go
type Client struct {
    ID   string           // Unique identifier (TCP remote address)
    Conn *websocket.Conn  // The underlying WebSocket connection
    Pool *Pool            // Pointer back to the shared connection pool
    mu   sync.Mutex       // Guards concurrent writes to Conn
}
```

The `mu` mutex is critical. WebSocket connections are **not safe for concurrent writes**. Because the pool's `Start()` goroutine fans out messages to all clients simultaneously, a client could receive multiple write calls at the same time. `SafeWriteJSON()` acquires the mutex before every write to prevent data races.

**`Message` struct:**

```go
type Message struct {
    Type int    `json:"type"`
    Body string `json:"body"`
}
```

Every piece of data sent over the wire is a `Message`. `Type` is the WebSocket message type (1 = text). `Body` carries the payload — either a plain-text system notification or a JSON-encoded user message (see [Message Protocol](#data-flow--message-protocol)).

**`Read()` method:**

This is a blocking loop that calls `c.Conn.ReadMessage()` in a `for {}`. On each iteration:
- It reads the raw bytes from the WebSocket.
- Wraps them in a `Message` struct.
- Sends the `Message` to `c.Pool.Broadcast` (a channel).
- The deferred function sends the client to `c.Pool.Unregister` and closes the connection when the loop exits (i.e., when the client disconnects or an error occurs).

---

### Connection Pool: `pool.go`

```
backend/pkg/websocket/pool.go
```

The `Pool` struct is the heart of the server:

```go
type Pool struct {
    Register   chan *Client   // Clients connecting
    Unregister chan *Client   // Clients disconnecting
    Clients    map[*Client]bool  // Active client set
    Broadcast  chan Message   // Incoming messages to fan out
}
```

All four fields are created by `NewPool()`. The channels are unbuffered, meaning senders block until the pool's `Start()` goroutine is ready to receive.

**`Start()` goroutine — event loop:**

`Start()` runs an infinite `select` over the three channels:

- **`Register`**: Adds the new client to the `Clients` map. Then broadcasts a `"New User Joined..."` system message to every connected client (including the new one). Logs the current pool size.

- **`Unregister`**: Removes the client from the `Clients` map. Broadcasts a `"User Disconnected..."` system message to all remaining clients. Logs the current pool size.

- **`Broadcast`**: Fans out the received `Message` to every client in the pool using `SafeWriteJSON`. If writing to a client fails, it logs the error and uses `continue` (not `return`) so one bad connection does not crash the entire pool goroutine or starve other clients.

---

### Message Flow

A complete message lifecycle from user keystroke to all recipients' screens:

```
1. User presses Enter in the browser
      │
      ▼
2. App.js send() serialises { body, user } as JSON and calls sendMsg(payload)
      │
      ▼
3. api/index.js socket.send(payload) — raw string over WebSocket
      │
      ▼
4. Go: client.Read() receives the raw bytes
      │
      ▼
5. Go: wraps in Message{Type: 1, Body: rawString} and sends to pool.Broadcast channel
      │
      ▼
6. Go: pool.Start() receives from Broadcast, iterates all clients, calls SafeWriteJSON(message)
      │
      ▼
7. Every browser receives a MessageEvent
      │
      ▼
8. api/index.js socket.onmessage fires, calls the App.js callback
      │
      ▼
9. App.js appends { data: msg.data, timestamp } to chatHistory state
      │
      ▼
10. ChatHistory re-renders, passes each entry to <Message>
      │
      ▼
11. Message.jsx parses the outer JSON (from Go), then the inner JSON (the user payload),
    and renders a styled bubble attributed to the correct user
```

---

## Frontend — Deep Dive

### API Layer: `api/index.js`

This module is responsible for all WebSocket lifecycle management. It exposes three functions:

**`connect(cb, onStatusChange)`**

- Reads `process.env.REACT_APP_WS_URL` to determine the WebSocket URL; defaults to `ws://localhost:8080/ws`.
- Creates a `new WebSocket(wsUrl)` and attaches four event handlers:
  - `onopen` — calls `onStatusChange('connected')`.
  - `onmessage` — calls the `cb` callback with the raw `MessageEvent`. App.js reads `.data` from it.
  - `onclose` — calls `onStatusChange('disconnected')` then schedules a **reconnect after 3 seconds** via `setTimeout(() => connect(cb, onStatusChange), 3000)`. This means the app continuously attempts to re-establish the connection without user intervention.
  - `onerror` — calls `onStatusChange('error')`.

**`sendMsg(msg)`**

Checks that the socket exists and `readyState === WebSocket.OPEN` before calling `socket.send(msg)`. Returns `false` if the socket is not ready (prevents silent failures).

**`disconnect()`**

Sets `socket.onclose = null` before calling `socket.close()` to prevent the auto-reconnect from firing on a deliberate disconnect.

---

### Root Component: `App.js`

`App` is a class component that owns all top-level state:

| State field | Type | Purpose |
|---|---|---|
| `chatHistory` | `Array<{data, timestamp}>` | All messages received since connection |
| `username` | `string` | Confirmed callsign (empty = not logged in) |
| `usernameInput` | `string` | Controlled input value on the login screen |
| `connectionStatus` | `string` | `'connected'` / `'disconnected'` / `'error'` |
| `messageCount` | `number` | Number of messages sent by this user |
| `xp` | `number` | Accumulated XP points |

**Login gate:** If `username` is empty, a full-screen login overlay is rendered (`div.login-overlay`) with a callsign input and a "JACK IN" submit button. Once submitted, `username` is set and the main UI renders.

**`componentDidMount`:** Calls `connect()` from the API layer. The `onmessage` callback pushes `{ data: msg.data, timestamp: Date.now() }` into `chatHistory` and awards 5 XP. The status callback updates `connectionStatus`.

**`send(event)`:** Fires on `keydown`. Checks for `keyCode === 13` (Enter) and a non-empty trimmed value. Serialises `{ body, user }` as JSON and calls `sendMsg`. Clears the input, increments `messageCount`, and awards 10 XP.

**`getLevel()` / `getXpProgress()`:** Derive the current level (`Math.floor(xp / 100) + 1`) and the XP progress within the current level (`xp % 100`) from the raw `xp` value.

---

### Header Component

**`frontend/src/components/Header/Header.jsx`**

A stateless functional component that receives `{ username, level, xpProgress, messageCount, connectionStatus }` as props and renders three regions:

- **Left:** `[NEXUS]` logo with pink bracket accents, a pulsing status dot, and a status label (`ONLINE` / `OFFLINE` / `ERROR` / `CONNECTING`).
- **Center:** A level badge (`LVL N`), an animated XP progress bar (filled width driven by `xpProgress%`), and an XP label (`N/100 XP`). The bar uses a cyan-to-pink gradient and a smooth CSS transition.
- **Right:** A message count stat block and a player tag showing the user's callsign with a `◈` icon.

The `connectionStatus` prop drives conditional CSS classes on the dot and label to switch between green (connected), red (disconnected), and yellow (error) colouring.

---

### ChatHistory Component

**`frontend/src/components/ChatHistory/ChatHistory.jsx`**

A class component that renders the scrollable list of all messages. Key behaviours:

- **Empty state:** If `chatHistory` is empty, renders a centred placeholder with a 📡 icon and "Awaiting transmissions..." text.
- **Message rendering:** Maps over `chatHistory`, rendering a `<Message>` for each entry, keyed by array index. Passes `msg.data`, `username` (as `currentUser`), and `msg.timestamp`.
- **Auto-scroll:** Uses a `React.createRef()` pointing to an invisible `<div ref={this.chatEndRef} />` at the bottom of the list. `componentDidUpdate` calls `chatEndRef.current.scrollIntoView({ behavior: 'smooth' })` after every render, ensuring the view always follows the latest message.
- **Custom scrollbar:** SCSS sets a 4px cyan-tinted scrollbar via `::-webkit-scrollbar` and `scrollbar-width: thin`.

---

### Message Component

**`frontend/src/components/Message/Message.jsx`**

The most complex component. It handles **three message variants** by parsing the raw WebSocket data:

**Parsing logic (in `parseMessage()`):**

The Go backend wraps all messages in an outer JSON envelope: `{ "type": 1, "body": "..." }`. The `body` field contains either:

1. A plain string like `"New User Joined..."` — a system/server notification.
2. A JSON string like `{"body":"hello","user":"Alice"}` — a user-sent message.

`parseMessage()` attempts to `JSON.parse` the outer envelope first. Then it tries to `JSON.parse` the `body`. If the inner parse succeeds and the result has a `body` field, it is a user message. If the inner parse fails, `body` is plain text and it is treated as a system message. The result is stored in `this.state.parsed`.

**Rendering:**

- **System message** (`.system`): Centred, amber-coloured bubble with no author attribution.
- **Own message** (`.me`): Right-aligned, cyan-tinted bubble. No author label (it's you).
- **Other's message** (`.other`): Left-aligned, pink-tinted bubble with `◈ Username` attribution.

A timestamp is displayed in `HH:MM` format if present. Messages animate in with a subtle `slideIn` keyframe (fade + translate up 8px).

---

### ChatInput Component

**`frontend/src/components/ChatInput/ChatInput.jsx`**

A deliberately simple class component. Renders a styled `<input>` element with:

- `onKeyDown={this.props.send}` — delegates all key handling to `App.js`.
- `autoFocus` — the input is focused immediately when the main chat UI mounts.
- `maxLength={500}` — server-side messages are also capped implicitly by the WebSocket buffer.
- A `›` prompt glyph prepended via `::before` pseudo-element.
- An `"ENTER TO SEND"` hint label to the right.

---

## Styling & Design System

The app uses a consistent **cyberpunk/terminal design language** defined via CSS custom properties in `App.css`:

| Token | Value | Usage |
|---|---|---|
| `--neon-cyan` | `#00f5ff` | Primary accent, logos, own messages, borders |
| `--neon-pink` | `#ff00aa` | Secondary accent, other users' messages, logo brackets |
| `--neon-green` | `#00ff88` | Online status indicator |
| `--neon-yellow` | `#ffee00` | XP system warnings, system messages |
| `--bg-deep` | `#0a0a12` | Page background |
| `--bg-panel` | `#0f0f1e` | Header and input bar backgrounds |
| `--bg-card` | `#14142a` | Card surfaces |
| `--text-primary` | `#e0e8ff` | Primary readable text |
| `--text-dim` | `#4a5a7a` | Subdued labels, placeholders |

**Typography:**
- `Orbitron` (Google Fonts) — used for all headings, logo, and level badges. Bold, geometric, sci-fi.
- `Share Tech Mono` (Google Fonts) — used for all body copy and input text. Monospaced terminal feel.

**Special effects:**
- **CRT Scanlines:** An `App::before` pseudo-element overlays a repeating horizontal line gradient at z-index 9998, simulating an old CRT monitor.
- **Neon glow:** `text-shadow` and `box-shadow` with semi-transparent neon colours on nearly all interactive elements.
- **Radial background gradients:** Three overlapping radial gradients on the `.App` container subtly tint the background.
- **Logo flicker animation:** `@keyframes logo-flicker` on the login screen drops opacity at specific keyframes to simulate a flickering neon sign.
- **Pulsing status dot:** `@keyframes pulse-dot` fades and enlarges the green dot to draw attention to connectivity status.
- **Message slide-in:** `@keyframes slideIn` gives each new message a 200ms fade + upward translate.

---

## Data Flow & Message Protocol

All messages exchanged over the WebSocket use two layers of JSON:

**Layer 1 — Go backend envelope** (written by `pool.go` / `client.go` via `SafeWriteJSON`):

```json
{
  "type": 1,
  "body": "<string payload>"
}
```

**Layer 2 — User message payload** (written by `App.js send()`, embedded as a JSON string inside `body`):

```json
{
  "body": "The actual chat message text",
  "user": "Alice"
}
```

**System messages** do not have a Layer 2 — their `body` is a plain string:

```json
{ "type": 1, "body": "New User Joined..." }
{ "type": 1, "body": "User Disconnected..." }
```

The `Message.jsx` component must handle both cases, which it does via a nested try/catch parse strategy.

---

## Gamification System

The app includes a lightweight XP and level system that persists for the duration of a browser session (not stored server-side):

| Action | XP Reward |
|---|---|
| Receiving a message | +5 XP |
| Sending a message | +10 XP |

**Level calculation:**
- Level = `Math.floor(totalXP / 100) + 1`
- XP within current level = `totalXP % 100`
- The XP bar in the header shows progress from 0 to 100 within the current level.

This is all managed in `App.js` state (`xp`, `messageCount`) and passed down to `Header` as props. No server interaction is required.

---

## Environment Configuration

### Backend

| Variable | Default | Description |
|---|---|---|
| `ALLOWED_ORIGIN` | *(none)* | If set, restricts WebSocket connections to requests from this exact origin (e.g. `https://yourapp.com`). If unset, all origins are permitted (development mode). |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_WS_URL` | `ws://localhost:8080/ws` | WebSocket server URL. Override for production (e.g. `wss://yourserver.com/ws`). Must be set at build time as a `REACT_APP_` prefixed env var for Create React App. |

Create a `.env` file in `frontend/` for local overrides:

```env
REACT_APP_WS_URL=ws://localhost:8080/ws
```

---

## Getting Started

### Prerequisites

- **Go 1.21+** — [Install Go](https://go.dev/dl/)
- **Node.js 16+** and **npm** — [Install Node.js](https://nodejs.org/)
- **Docker** (optional, for containerised backend) — [Install Docker](https://docs.docker.com/get-docker/)

---

### Running Locally (Manual)

**Step 1: Start the backend**

```bash
cd backend
go mod download          # Fetch gorilla/websocket dependency
go run main.go           # Start the WebSocket server on :8080
```

You should see:
```
Distributed Chat App v0.01
```

**Step 2: Start the frontend**

In a separate terminal:

```bash
cd frontend
npm install              # Install React dependencies
npm start                # Start CRA dev server on :3000
```

The browser will open automatically at `http://localhost:3000`.

**Step 3: Test with multiple tabs**

Open two or more browser tabs at `http://localhost:3000`. Each tab acts as an independent user. Messages sent in one tab will appear instantly in all others.

---

### Running with Docker

The backend includes a `Dockerfile` based on `golang:1.21-alpine`:

```bash
cd backend
docker build -t nexus-backend .
docker run -p 8080:8080 -e ALLOWED_ORIGIN=http://localhost:3000 nexus-backend
```

Then start the frontend separately with `npm start` as described above.

For a production setup, build the React app and serve it from a static host or CDN:

```bash
cd frontend
REACT_APP_WS_URL=wss://your-backend-domain.com/ws npm run build
# Deploy the build/ directory to your static host
```

---

## Key Engineering Decisions & Bug Fixes

Several important issues were identified and resolved during development:

**1. Concurrent WebSocket writes (race condition)**

`gorilla/websocket` connections are not safe for concurrent writes. Since the pool fans out messages to all clients from a single goroutine but multiple events could arrive in quick succession, `client.go` introduces `sync.Mutex` (`mu`) and a `SafeWriteJSON` wrapper method. All writes go through this method.

**2. Pool goroutine survival on bad client**

The original `Broadcast` handler used `return` on write error, which would kill the pool's `Start()` goroutine entirely if any single client had a broken connection. This was changed to `continue` so the pool remains alive and serves all other connected clients.

**3. MessageEvent non-enumerable properties**

`msg.data` from a WebSocket `MessageEvent` is a non-enumerable property. Spreading the event object (`{ ...msg }`) loses it entirely. The `componentDidMount` callback in `App.js` explicitly captures `msg.data` rather than spreading the event.

**4. CSS class mismatch**

The SCSS defines `.me` and `.other` classes on `.Message`. An earlier version of `Message.jsx` applied `mine` and `theirs` — classes that don't exist in the stylesheet. The JSX was corrected to use `me` / `other`.

**5. System messages missing bubble wrapper**

System messages were rendered without the `.msg-bubble` wrapper `div`, meaning the SCSS rules for `.Message.system .msg-bubble` had no target. The system message render branch was updated to include the wrapper.

**6. Docker binary naming**

Without the `-o` flag, `go build` names the output binary after the working directory (`app`). The Dockerfile now uses `go build -o /app/realtime-chat-go-react .` for an unambiguous binary name.

**7. Origin checking in production**

The `CheckOrigin` function defaults to allowing all origins (safe for local development). For production, set `ALLOWED_ORIGIN` to your frontend's exact origin to prevent cross-origin WebSocket abuse.

---

## Known Limitations & Future Improvements

**Current limitations:**

- **No message persistence** — messages are lost when the server restarts or a client refreshes.
- **No private rooms or channels** — all clients share a single broadcast pool.
- **No authentication** — any callsign can be claimed by any user; there is no uniqueness enforcement.
- **Client ID is TCP address** — if clients share a NAT, they may have colliding IDs (though this only affects server-side logging, not functionality).
- **XP is session-only** — refreshing the page resets XP and level.
- **No message history on join** — new users see only messages received after they connect.

**Potential improvements:**

- Add Redis or a time-series database for message persistence and history replay on join.
- Implement named chat rooms with per-room pools.
- Add JWT-based authentication with unique username reservation.
- Introduce a `docker-compose.yml` to run backend and frontend together.
- Replace class components with React hooks (`useState`, `useEffect`, `useRef`).
- Add end-to-end tests (e.g. Playwright for the UI, `net/http/httptest` + `gorilla/websocket` for the backend).
- Add typing indicators via a lightweight broadcast of ephemeral events.
- Store XP/level in `localStorage` so it survives page refreshes.