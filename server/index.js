// V1
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// const users = {};

// io.on("connection", (socket) => {
//   console.log("New user connected:", socket.id);

//   socket.on("join", (roomId) => {
//     socket.join(roomId);
//     users[socket.id] = roomId;
//     socket.to(roomId).emit("user-joined", socket.id);
//     console.log(`User ${socket.id} joined room ${roomId}`);
//   });

//   socket.on("offer", (data) => {
//     socket.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
//   });

//   socket.on("answer", (data) => {
//     socket.to(data.to).emit("answer", { answer: data.answer, from: socket.id });
//   });

//   socket.on("ice-candidate", (data) => {
//     socket.to(data.to).emit("ice-candidate", {
//       candidate: data.candidate,
//       from: socket.id,
//     });
//   });

//   socket.on("disconnect", () => {
//     const roomId = users[socket.id];
//     socket.to(roomId).emit("user-left", socket.id);
//     delete users[socket.id];
//     console.log("User disconnected:", socket.id);
//   });

//   socket.on("toggle-mic", ({ enabled, to }) => {
//     socket.to(to).emit("toggle-mic", { enabled });
//   });
// });

// const PORT = 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// V2
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// const rooms = {};

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("join", (roomId) => {
//     socket.join(roomId);

//     if (!rooms[roomId]) rooms[roomId] = [];
//     rooms[roomId].push(socket.id);

//     const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
//     socket.emit("all-users", otherUsers);

//     otherUsers.forEach((id) => {
//       io.to(id).emit("user-joined", socket.id);
//     });
//   });

//   socket.on("offer", (data) => {
//     io.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
//   });

//   socket.on("answer", (data) => {
//     io.to(data.to).emit("answer", { answer: data.answer, from: socket.id });
//   });

//   socket.on("ice-candidate", (data) => {
//     io.to(data.to).emit("ice-candidate", {
//       candidate: data.candidate,
//       from: socket.id,
//     });
//   });

//   socket.on("disconnect", () => {
//     for (const roomId in rooms) {
//       rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
//       io.to(roomId).emit("user-left", socket.id);
//     }
//     console.log("User disconnected:", socket.id);
//   });
// });

// const PORT = 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// V3
// server.js
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// const rooms = {};

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("join", (roomId) => {
//     socket.join(roomId);

//     if (!rooms[roomId]) rooms[roomId] = [];
//     rooms[roomId].push(socket.id);

//     const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
//     // Tell the joining client who is already in the room
//     socket.emit("all-users", otherUsers);

//     // Notify existing users that a new user joined
//     otherUsers.forEach((id) => {
//       io.to(id).emit("user-joined", socket.id);
//     });
//   });

//   socket.on("offer", (data) => {
//     io.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
//   });

//   socket.on("answer", (data) => {
//     io.to(data.to).emit("answer", { answer: data.answer, from: socket.id });
//   });

//   socket.on("ice-candidate", (data) => {
//     io.to(data.to).emit("ice-candidate", {
//       candidate: data.candidate,
//       from: socket.id,
//     });
//   });

//   // Broadcast toggle-mic to all users in the same room
//   socket.on("toggle-mic", ({ enabled, roomId }) => {
//     // send who changed and the new state
//     io.to(roomId).emit("toggle-mic", { enabled, userId: socket.id });
//   });

//   socket.on("disconnect", () => {
//     // remove user from all rooms and notify
//     for (const roomId in rooms) {
//       rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
//       io.to(roomId).emit("user-left", { userId: socket.id });
//     }
//     console.log("User disconnected:", socket.id);
//   });
// });

// const PORT = 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// V4
// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// rooms structure:
// rooms[roomId] = {
//   [socketId]: { name: string, micEnabled: boolean, speaking: boolean }
// }
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // join with { roomId, userName }
  socket.on("join", ({ roomId, userName }) => {
    if (!roomId) return;
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = {};
    rooms[roomId][socket.id] = {
      name: userName || "Guest",
      micEnabled: true,
      speaking: false,
    };

    // send everyone the updated list
    const userList = Object.entries(rooms[roomId]).map(([id, info]) => ({
      userId: id,
      name: info.name,
      micEnabled: info.micEnabled,
      speaking: info.speaking,
    }));
    io.to(roomId).emit("users-in-room", userList);

    // Notify existing users only that new user joined (their socket ids)
    const otherIds = Object.keys(rooms[roomId]).filter(
      (id) => id !== socket.id
    );
    socket.emit("all-users", otherIds);
    otherIds.forEach((id) => {
      io.to(id).emit("user-joined", socket.id);
    });

    console.log(`User ${socket.id} (${userName}) joined room ${roomId}`);
  });

  socket.on("offer", (data) => {
    io.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
  });

  socket.on("answer", (data) => {
    io.to(data.to).emit("answer", { answer: data.answer, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.to).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  // toggle mic for a user, broadcast updated user list
  socket.on("toggle-mic", ({ enabled, roomId }) => {
    if (!rooms[roomId] || !rooms[roomId][socket.id]) return;
    rooms[roomId][socket.id].micEnabled = enabled;

    const userList = Object.entries(rooms[roomId]).map(([id, info]) => ({
      userId: id,
      name: info.name,
      micEnabled: info.micEnabled,
      speaking: info.speaking,
    }));
    io.to(roomId).emit("users-in-room", userList);
  });

  // speaking state (from VAD) - broadcast "user-speaking" quickly for UI
  socket.on("speaking", ({ speaking, roomId }) => {
    if (!rooms[roomId] || !rooms[roomId][socket.id]) return;
    rooms[roomId][socket.id].speaking = !!speaking;
    io.to(roomId).emit("user-speaking", {
      userId: socket.id,
      speaking: !!speaking,
    });
  });

  socket.on("disconnect", () => {
    // remove from all rooms and notify
    for (const roomId in rooms) {
      if (rooms[roomId][socket.id]) {
        delete rooms[roomId][socket.id];
        const userList = Object.entries(rooms[roomId]).map(([id, info]) => ({
          userId: id,
          name: info.name,
          micEnabled: info.micEnabled,
          speaking: info.speaking,
        }));
        io.to(roomId).emit("users-in-room", userList);
        io.to(roomId).emit("user-left", { userId: socket.id });
      }
    }
    console.log("User disconnected:", socket.id);
  });

  socket.on("ping-check", () => socket.emit("pong-check"));
});

app.get("/", async (req, res) => {
  res.send("welcome to home page")
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
