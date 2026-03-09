const ROUNDS_KEY = "shaoji_user_rounds";

function getAllRounds() {
  return wx.getStorageSync(ROUNDS_KEY) || [];
}

function saveRound(record) {
  const rounds = getAllRounds();
  rounds.push({
    userId: record.userId,
    nickName: record.nickName,
    money: record.money,
    chips: record.chips,
    roomCode: record.roomCode || "",
    time: Date.now(),
  });
  wx.setStorageSync(ROUNDS_KEY, rounds);
}

function getUserStats(userId) {
  const rounds = getAllRounds();
  let totalRounds = 0;
  let totalEarnings = 0;
  let wins = 0;
  let losses = 0;

  rounds.forEach((r) => {
    if (r.userId !== userId) return;
    totalRounds += 1;
    totalEarnings += r.money || 0;
    if (r.money > 0) wins += 1;
    if (r.money < 0) losses += 1;
  });

  const played = wins + losses;
  const winRate = played > 0 ? ((wins / played) * 100).toFixed(0) : "0";

  return { totalRounds, totalEarnings, wins, losses, winRate };
}

module.exports = { saveRound, getUserStats, getAllRounds };
