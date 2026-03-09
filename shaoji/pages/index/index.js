const { getCurrentUser } = require("../../utils/userStore");
const { getAllRounds, clearUserRounds } = require("../../utils/statsStore");

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

  onClearHistory() {
    const user = getCurrentUser();
    if (!user) return;
    if (this.data.empty) {
      wx.showToast({ title: "暂无可清空的战绩", icon: "none" });
      return;
    }

    wx.showModal({
      title: "清空战绩",
      content: "确认清空当前账号的全部历史战绩吗？清空后无法恢复。",
      confirmText: "确认清空",
      confirmColor: "#f53f3f",
      success: (res) => {
        if (!res.confirm) return;
        clearUserRounds(user.id);
        this.setData({ rounds: [], empty: true });
        wx.showToast({ title: "已清空", icon: "success" });
      },
    });
  },
});
