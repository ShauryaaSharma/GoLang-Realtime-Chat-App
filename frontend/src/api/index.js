// api/index.js
var socket = null;

let connect = (cb, onStatusChange) => {
  console.log("connecting...");

  // Allow configuring the WS URL via env var for production builds
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("Successfully Connected");
    if (onStatusChange) onStatusChange('connected');
  };

  socket.onmessage = (msg) => {
    console.log("Message from WebSocket: ", msg);
    cb(msg);
  };

  socket.onclose = (event) => {
    console.log("Socket Closed Connection: ", event);
    if (onStatusChange) onStatusChange('disconnected');
    // Attempt reconnect after 3 seconds
    setTimeout(() => connect(cb, onStatusChange), 3000);
  };

  socket.onerror = (error) => {
    console.log("Socket Error: ", error);
    if (onStatusChange) onStatusChange('error');
  };
};

let sendMsg = (msg) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not open. Message not sent.");
    return false;
  }
  console.log("sending msg: ", msg);
  socket.send(msg);
  return true;
};

let disconnect = () => {
  if (socket) {
    socket.onclose = null; // prevent auto-reconnect on manual close
    socket.close();
    socket = null;
  }
};

export { connect, sendMsg, disconnect };
