const USERS_KEY = "shaoji_users";
const CURRENT_USER_ID_KEY = "shaoji_current_user_id";

function getUsers() {
  return wx.getStorageSync(USERS_KEY) || [];
}

function setUsers(users) {
  wx.setStorageSync(USERS_KEY, users);
}

function getCurrentUserId() {
  return wx.getStorageSync(CURRENT_USER_ID_KEY) || "";
}

function setCurrentUserId(userId) {
  wx.setStorageSync(CURRENT_USER_ID_KEY, userId || "");
}

function getCurrentUser() {
  const users = getUsers();
  const currentId = getCurrentUserId();
  return users.find((u) => u.id === currentId) || null;
}

function createUser(payload) {
  const users = getUsers();
  const now = Date.now();
  const user = {
    id: `u_${now}_${Math.floor(Math.random() * 10000)}`,
    nickName: (payload.nickName || "").trim(),
    avatarUrl: payload.avatarUrl || "",
    createdAt: now,
    updatedAt: now,
  };
  users.unshift(user);
  setUsers(users);
  return user;
}

function updateUser(userId, patch) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) {
    return null;
  }
  const next = {
    ...users[idx],
    ...patch,
    nickName: (patch.nickName !== undefined ? patch.nickName : users[idx].nickName).trim(),
    updatedAt: Date.now(),
  };
  users[idx] = next;
  setUsers(users);
  return next;
}

function deleteUser(userId) {
  const users = getUsers();
  const nextUsers = users.filter((u) => u.id !== userId);
  setUsers(nextUsers);
  if (getCurrentUserId() === userId) {
    setCurrentUserId(nextUsers[0] ? nextUsers[0].id : "");
  }
}

module.exports = {
  getUsers,
  setUsers,
  getCurrentUserId,
  setCurrentUserId,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
};
