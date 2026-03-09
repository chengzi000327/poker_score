const ROOMS_KEY = "shaoji_rooms";
const CURRENT_ROOM_KEY = "shaoji_current_room";

function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getRooms() {
  return wx.getStorageSync(ROOMS_KEY) || {};
}

function saveRooms(rooms) {
  wx.setStorageSync(ROOMS_KEY, rooms);
}

function createRoom(hostUser) {
  const rooms = getRooms();
  const roomCode = generateRoomCode();
  const room = {
    roomCode,
    hostId: hostUser.id,
    hostName: hostUser.nickName,
    hostAvatar: hostUser.avatarUrl || "",
    players: [
      {
        id: hostUser.id,
        nickName: hostUser.nickName,
        avatarUrl: hostUser.avatarUrl || "",
        seat: 0,
        score: 0,
      },
    ],
    chipValue: "",
    feed: [],
    status: "waiting",
    createdAt: Date.now(),
  };
  rooms[roomCode] = room;
  saveRooms(rooms);
  setCurrentRoomCode(roomCode);
  return room;
}

function getRoom(roomCode) {
  const rooms = getRooms();
  return rooms[roomCode] || null;
}

function joinRoom(roomCode, user) {
  const rooms = getRooms();
  const room = rooms[roomCode];
  if (!room) {
    return null;
  }
  if (room.players.length >= 4) {
    return null;
  }
  const already = room.players.find((p) => p.id === user.id);
  if (already) {
    setCurrentRoomCode(roomCode);
    return room;
  }
  room.players.push({
    id: user.id,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl || "",
    seat: room.players.length,
    score: 0,
  });
  rooms[roomCode] = room;
  saveRooms(rooms);
  setCurrentRoomCode(roomCode);
  return room;
}

function updateRoomStatus(roomCode, status) {
  const rooms = getRooms();
  const room = rooms[roomCode];
  if (!room) return null;
  room.status = status;
  rooms[roomCode] = room;
  saveRooms(rooms);
  return room;
}

function updateRoomChipValue(roomCode, chipValue) {
  const rooms = getRooms();
  const room = rooms[roomCode];
  if (!room) return null;
  room.chipValue = chipValue;
  rooms[roomCode] = room;
  saveRooms(rooms);
  return room;
}

function addRoomFeed(roomCode, message, options) {
  const rooms = getRooms();
  const room = rooms[roomCode];
  if (!room) return null;
  if (!room.feed) room.feed = [];
  const entry = { time: Date.now(), message };
  if (options && options.isAI) entry.isAI = true;
  room.feed.push(entry);
  rooms[roomCode] = room;
  saveRooms(rooms);
  return room;
}

function updatePlayerScore(roomCode, playerId, delta) {
  const rooms = getRooms();
  const room = rooms[roomCode];
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.score = (player.score || 0) + delta;
  }
  rooms[roomCode] = room;
  saveRooms(rooms);
  return room;
}

function getCurrentRoomCode() {
  return wx.getStorageSync(CURRENT_ROOM_KEY) || "";
}

function setCurrentRoomCode(code) {
  wx.setStorageSync(CURRENT_ROOM_KEY, code || "");
}

function deleteRoom(roomCode) {
  const rooms = getRooms();
  delete rooms[roomCode];
  saveRooms(rooms);
  if (getCurrentRoomCode() === roomCode) {
    setCurrentRoomCode("");
  }
}

module.exports = {
  generateRoomCode,
  createRoom,
  getRoom,
  joinRoom,
  updateRoomStatus,
  updateRoomChipValue,
  addRoomFeed,
  updatePlayerScore,
  getCurrentRoomCode,
  setCurrentRoomCode,
  deleteRoom,
};
