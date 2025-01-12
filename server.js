// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const gameLogic = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const MAX_ROOMS = 3;
const rooms = {};
const playerNames = {};

/**
 * destroyRoom - removes the specified room from memory
 */
function destroyRoom(roomId) {
  if (rooms[roomId]) {
    delete rooms[roomId];
    console.log(`Room "${roomId}" destroyed.`);
  }
}

/**
 * getSanitizedRoomData - returns an object safe to emit without exposing hidden choices
 */
function getSanitizedRoomData(roomId) {
  const room = rooms[roomId];
  if (!room) return null;
  const playerList = room.players.map((pid) => ({
    id: pid,
    name: playerNames[pid] || 'Anonymous'
  }));
  return {
    roomId,
    players: playerList
  };
}

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Save/update player's name
  socket.on('setName', ({ name }) => {
    playerNames[socket.id] = name;
    console.log(`Socket ${socket.id} set name to "${name}"`);
  });

  // Create a room
  socket.on('createRoom', ({ roomId }) => {
    if (Object.keys(rooms).length >= MAX_ROOMS) {
      socket.emit('errorMessage', 'Maximum number of rooms reached.');
      return;
    }

    if (rooms[roomId]) {
      socket.emit('errorMessage', 'Room already exists. Choose a different name.');
      return;
    }

    rooms[roomId] = {
      players: [],
      choices: {}
    };
    console.log(`Room "${roomId}" created.`);
    socket.emit('roomCreated', { roomId });
  });

  // Join a room
  socket.on('joinRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('errorMessage', 'Room does not exist.');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('errorMessage', 'This room is already full.');
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room "${roomId}".`);

    socket.emit('joinedRoom', { roomId, playerId: socket.id });
    io.to(roomId).emit('roomData', getSanitizedRoomData(roomId));
  });

  // Handle a player's choice
  socket.on('playerChoice', ({ roomId, choice }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('errorMessage', 'Room does not exist.');
      return;
    }

    // Announce that the player made a choice
    const playerName = playerNames[socket.id] || 'Anonymous';
    io.to(roomId).emit(
      'choiceAnnouncement',
      `${playerName} has made their choice.`
    );

    const result = gameLogic.onChoice(room, socket.id, choice);
    if (result) {
      const { p1, p2, outcome, messages } = result;

      // Instead of broadcasting both outcomes to the entire room,
      // send each outcome privately to each player:
      io.to(p1).emit('showOutcome', {
        name: playerNames[p1] || 'You',
        years: outcome.player1,
        msg: messages.player1
      });
      io.to(p2).emit('showOutcome', {
        name: playerNames[p2] || 'You',
        years: outcome.player2,
        msg: messages.player2
      });
    }
  });

  // Exit/disconnect from room
  socket.on('exitRoom', ({ roomId }) => {
    destroyRoom(roomId);
    io.emit('roomListUpdate', rooms);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Optionally remove the player from rooms, etc.
  });
});

app.use(express.static('public'));

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
