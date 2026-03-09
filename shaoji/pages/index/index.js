const { getCurrentUser } = require("../../utils/userStore");
const { getAllRounds } = require("../../utils/statsStore");

Page({
  data: {
    rounds: [],
    empty: true,
  },

  onShow() {
    const user = getCurrentUser();
    if (!user) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }

    const all = getAllRounds();
    const mine = all
      .filter((r) => r.userId === user.id)
      .sort((a, b) => b.time - a.time);

    const rounds = mine.map((r) => {
      const d = new Date(r.time);
      const pad = (n) => String(n).padStart(2, "0");
      return {
        ...r,
        dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        timeStr: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        moneyText: `${r.money >= 0 ? "+" : ""}${r.money}`,
        isWin: r.money > 0,
        isLose: r.money < 0,
      };
    });

    this.setData({ rounds, empty: rounds.length === 0 });
  },
});
