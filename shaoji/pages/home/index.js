const { getCurrentUser } = require("../../utils/userStore");
const { getUserStats } = require("../../utils/statsStore");

Page({
  data: {
    user: null,
    totalRounds: 0,
    totalEarnings: 0,
    wins: 0,
    losses: 0,
    winRate: "0",
  },

  onShow() {
    const user = getCurrentUser();
    if (!user) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }
    this.setData({ user });
    this.loadStats(user);
  },

  loadStats(user) {
    const stats = getUserStats(user.id);
    this.setData({
      totalRounds: stats.totalRounds,
      totalEarnings: stats.totalEarnings,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.winRate,
    });
  },

  onStartGame() {
    wx.navigateTo({ url: "/pages/room/index?action=create" });
  },

  onViewHistory() {
    wx.navigateTo({ url: "/pages/index/index" });
  },

  onScanJoin() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const result = res.result || "";
        let roomCode = "";
        if (result.startsWith("SHAOJI:")) {
          roomCode = result.replace("SHAOJI:", "").trim();
        } else if (/^\d{6}$/.test(result.trim())) {
          roomCode = result.trim();
        }

        if (roomCode) {
          wx.navigateTo({ url: `/pages/room/index?roomCode=${roomCode}` });
        } else {
          this.showManualJoin();
        }
      },
      fail: () => {
        this.showManualJoin();
      },
    });
  },

  showManualJoin() {
    wx.showModal({
      title: "输入房间号",
      placeholderText: "请输入6位房间号",
      editable: true,
      success: (res) => {
        if (!res.confirm) return;
        const code = (res.content || "").trim();
        if (/^\d{6}$/.test(code)) {
          wx.navigateTo({ url: `/pages/room/index?roomCode=${code}` });
        } else if (code) {
          wx.showToast({ title: "房间号应为6位数字", icon: "none" });
        }
      },
    });
  },

  onManual() {
    wx.navigateTo({ url: "/pages/manual/index" });
  },

  onSwitchAccount() {
    wx.reLaunch({ url: "/pages/login/index" });
  },
});
