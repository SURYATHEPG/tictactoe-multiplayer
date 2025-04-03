const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Store player data
let players = {};
const playerSymbols = ["X", "O"];

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  if (Object.keys(players).length < 2) {
    const symbol = playerSymbols[Object.keys(players).length];
    players[socket.id] = symbol;
    socket.emit("playerRole", symbol);
    io.emit("playerCount", Object.keys(players).length);

    socket.on("playerMove", ({ index, symbol }) => {
      io.emit("updateBoard", { index, symbol });
    });

    socket.on("resetGame", () => {
      io.emit("resetBoard");
    });

    socket.on("disconnect", () => {
      delete players[socket.id];
      io.emit("playerCount", Object.keys(players).length);
    });

  } else {
    socket.emit("roomFull");
    socket.disconnect();
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
