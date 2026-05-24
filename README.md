# Realtime Chat Application — Go + ReactJS

A real-time chat app built with a Go WebSocket backend and a React frontend.

---

## Prerequisites

- [Go](https://golang.org/dl/) (1.21 or later)
- [Node.js](https://nodejs.org/) (16 or later) + npm

---

## Running the App

### 1. Start the Backend

Open a terminal and run:

```powershell
cd backend
go mod download
go run main.go
```

You should see:
```
Distributed Chat App v0.01
```
The WebSocket server is now running at `ws://localhost:8080/ws`.

---

### 2. Start the Frontend

Open a **second** terminal and run:

```powershell
cd frontend
Remove-Item yarn.lock
npm install
npm start
```

The React app will open automatically at `http://localhost:3000`.

> **First time only:** The `Remove-Item yarn.lock` step clears the old lockfile so npm installs the correct updated dependencies.

---

## Testing

1. Open **two browser tabs** at `http://localhost:3000`
2. Enter a different username (callsign) in each tab and click **JACK IN**
3. Type a message in one tab and press **Enter**
4. The message should appear in **both tabs** in real time
5. You will also see system messages like `New User Joined...` and `User Disconnected...`

---

## Building with Docker (Backend only)

```powershell
cd backend
docker build -t realtime-chat-backend .
docker run -p 8080:8080 realtime-chat-backend
```
