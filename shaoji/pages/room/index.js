const { getCurrentUser } = require("../../utils/userStore");
const {
  createRoom,
  getRoom,
  joinRoom,
  getCurrentRoomCode,
  setCurrentRoomCode,
  deleteRoom,
  updateRoomChipValue,
  addRoomFeed,
  updatePlayerScore,
} = require("../../utils/roomStore");
const { saveRound } = require("../../utils/statsStore");

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const AI_WIN_MSGS = [
  "手气不错嘛，继续保持！🎉",
  "大赢家就是你！稳如老狗 🐕",
  "财运亨通，今晚加鸡腿！🍗",
  "这波操作666，队友抱大腿了 💪",
  "赢麻了赢麻了，低调低调~",
  "恭喜恭喜！记得请大家喝奶茶 🧋",
  "你就是今晚最靓的仔！✨",
  "运气这东西，你今晚全占了 🍀",
];

const AI_LOSE_MSGS = [
  "别灰心，下一局翻盘！💪",
  "输了不可怕，可怕的是不敢再来 😎",
  "这只是战略性撤退！",
  "风水轮流转，好运马上来 🍀",
  "稳住心态，大的还在后面！",
  "小亏怡情，调整一下继续冲！",
  "没事没事，当交学费了 📖",
  "你的好运正在路上，耐心等一下~",
];

const AI_EVEN_MSGS = [
  "不赚不亏，稳如泰山 🗿",
  "打了个寂寞，下局来点刺激的！",
  "平进平出，保本大师就是你 😄",
  "不亏就是赢，继续稳住！",
];

function pickAIMsg(totalMoney) {
  let pool;
  if (totalMoney > 0) pool = AI_WIN_MSGS;
  else if (totalMoney < 0) pool = AI_LOSE_MSGS;
  else pool = AI_EVEN_MSGS;
  return pool[Math.floor(Math.random() * pool.length)];
}

Page({
  data: {
    room: null,
    isHost: false,
    currentUser: null,
    seats: [],
    fourSlots: [null, null, null, null],
    feed: [],
    showChipModal: false,
    chipOptions: ["1", "2", "5", "10", "20", "50"],
    selectedChip: "",
    useCustomChip: false,
    customChipValue: "",

    showRoundModal: false,
    roundJiang: 0,
    roundBurn: 0,
    roundWin: "",
    roundLevel: 1,
    roundResult: null,
  },

  onLoad(options) {
    const user = getCurrentUser();
    if (!user) {
      wx.reLaunch({ url: "/pages/login/index" });
      return;
    }
    this.setData({ currentUser: user });

    if (options.action === "create") {
      this.doCreateRoom(user);
    } else if (options.roomCode) {
      this.doJoinRoom(options.roomCode, user);
    } else {
      const code = getCurrentRoomCode();
      if (code) {
        this.loadRoom(code, user);
      } else {
        wx.showToast({ title: "房间不存在", icon: "none" });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    }
  },

  doCreateRoom(user) {
    const room = createRoom(user);
    addRoomFeed(room.roomCode, `${user.nickName} 创建了房间。`);
    const updated = getRoom(room.roomCode);
    const seats = this.buildSeats(updated);
    this.setData({
      room: updated,
      isHost: true,
      seats,
      fourSlots: this.buildFourSlots(seats),
      feed: this.buildFeed(updated),
    });
    this.showChipPicker();
  },

  doJoinRoom(roomCode, user) {
    const room = joinRoom(roomCode, user);
    if (!room) {
      wx.showModal({
        title: "无法加入",
        content: "房间不存在或已满4人",
        showCancel: false,
        success: () => wx.navigateBack(),
      });
      return;
    }
    addRoomFeed(roomCode, `${user.nickName} 加入了房间。`);
    const updated = getRoom(roomCode);
    const seats = this.buildSeats(updated);
    this.setData({
      room: updated,
      isHost: updated.hostId === user.id,
      seats,
      fourSlots: this.buildFourSlots(seats),
      feed: this.buildFeed(updated),
    });
  },

  loadRoom(roomCode, user) {
    const room = getRoom(roomCode);
    if (!room) {
      wx.showToast({ title: "房间不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    const seats = this.buildSeats(room);
    this.setData({
      room,
      isHost: room.hostId === user.id,
      seats,
      fourSlots: this.buildFourSlots(seats),
      feed: this.buildFeed(room),
    });
  },

  buildSeats(room) {
    return (room.players || []).map((p) => ({
      ...p,
      score: p.score || 0,
    }));
  },

  buildFourSlots(seats) {
    const slots = [null, null, null, null];
    seats.forEach((p, i) => { if (i < 4) slots[i] = p; });
    return slots;
  },

  buildFeed(room) {
    return (room.feed || []).map((item) => ({
      ...item,
      timeStr: formatTime(item.time),
    }));
  },

  // ========== 记一局 ==========

  onStartRound() {
    if (!this.data.room) return;
    if (!this.data.room.chipValue) {
      this.showChipPicker();
      return;
    }
    this.setData({
      showRoundModal: true,
      roundJiang: 0,
      roundBurn: 0,
      roundWin: "",
      roundLevel: 1,
      roundResult: null,
    });
  },

  onCloseRoundModal() {
    this.setData({ showRoundModal: false, roundResult: null });
  },

  onStepJiang(e) {
    const d = Number(e.currentTarget.dataset.dir);
    this.setData({ roundJiang: Math.max(0, this.data.roundJiang + d) });
  },

  onStepBurn(e) {
    const d = Number(e.currentTarget.dataset.dir);
    this.setData({ roundBurn: Math.max(0, this.data.roundBurn + d) });
  },

  onSetWin(e) {
    this.setData({ roundWin: e.currentTarget.dataset.val === "true" });
  },

  onSetLevel(e) {
    this.setData({ roundLevel: Number(e.currentTarget.dataset.val) });
  },

  onSettleRound() {
    if (this.data.roundWin === "") {
      wx.showToast({ title: "请选择输赢", icon: "none" });
      return;
    }
    const chipValue = Number(this.data.room.chipValue) || 1;
    const awardChips = 3 * this.data.roundJiang;
    const burnChips = -3 * this.data.roundBurn;
    const teamChips = this.data.roundWin
      ? 1 * this.data.roundLevel
      : -1 * this.data.roundLevel;
    const totalChips = awardChips + burnChips + teamChips;
    const totalMoney = totalChips * chipValue;

    this.setData({
      roundResult: { awardChips, burnChips, teamChips, totalChips, totalMoney },
    });
  },

  onSaveRound() {
    const result = this.data.roundResult;
    if (!result) return;
    const room = this.data.room;
    const user = this.data.currentUser;

    updatePlayerScore(room.roomCode, user.id, result.totalMoney);

    saveRound({
      userId: user.id,
      nickName: user.nickName,
      money: result.totalMoney,
      chips: result.totalChips,
      roomCode: room.roomCode,
    });

    const winText = this.data.roundWin
      ? (this.data.roundLevel === 2 ? "关了对方" : "赢了1")
      : (this.data.roundLevel === 2 ? "被关了" : "输了1");
    const parts = [];
    if (this.data.roundJiang > 0) parts.push(`${this.data.roundJiang}个奖`);
    if (this.data.roundBurn > 0) parts.push(`烧${this.data.roundBurn}个鸡`);
    parts.push(winText);
    parts.push(`${result.totalMoney >= 0 ? "+" : ""}${result.totalMoney}元`);
    addRoomFeed(room.roomCode, `${user.nickName}：${parts.join("，")}`);

    const aiMsg = pickAIMsg(result.totalMoney);
    addRoomFeed(room.roomCode, `@${user.nickName} ${aiMsg}`, { isAI: true });

    const updated = getRoom(room.roomCode);
    const seats = this.buildSeats(updated);
    this.setData({
      room: updated,
      seats,
      fourSlots: this.buildFourSlots(seats),
      feed: this.buildFeed(updated),
      showRoundModal: false,
      roundResult: null,
    });

    wx.showToast({ title: "已记录", icon: "success" });
  },

  // ========== 筹码 ==========

  showChipPicker() {
    this.setData({ showChipModal: true });
  },

  onSelectChip(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ selectedChip: val, useCustomChip: false, customChipValue: "" });
  },

  onSelectCustomChip() {
    this.setData({ useCustomChip: true, selectedChip: "" });
  },

  onCustomChipInput(e) {
    this.setData({ customChipValue: e.detail.value });
  },

  onConfirmChip() {
    let chip = this.data.selectedChip;
    if (this.data.useCustomChip) {
      chip = this.data.customChipValue.trim();
      const num = Number(chip);
      if (!chip || !Number.isFinite(num) || num <= 0) {
        wx.showToast({ title: "请输入有效金额", icon: "none" });
        return;
      }
    }
    if (!chip) {
      wx.showToast({ title: "请选择筹码", icon: "none" });
      return;
    }
    const room = this.data.room;
    updateRoomChipValue(room.roomCode, chip);
    addRoomFeed(room.roomCode, `房主设置筹码为 ${chip}元/个。`);
    const updated = getRoom(room.roomCode);
    this.setData({
      room: updated,
      showChipModal: false,
      feed: this.buildFeed(updated),
    });
  },

  onCloseChipModal() {
    if (!this.data.room.chipValue) {
      wx.showToast({ title: "请先选择筹码", icon: "none" });
      return;
    }
    this.setData({ showChipModal: false });
  },

  // ========== 其他 ==========

  onSettleRoom() {
    if (!this.data.room) return;
    const players = this.data.seats;
    const lines = players.map(
      (p) => `${p.nickName}：${p.score >= 0 ? "+" : ""}${p.score}元`
    );
    wx.showModal({
      title: "房间结算",
      content: lines.join("\n") || "暂无数据",
      confirmText: "退出房间",
      cancelText: "继续玩",
      success: (res) => {
        if (!res.confirm) return;
        if (this.data.isHost && this.data.room) {
          deleteRoom(this.data.room.roomCode);
        } else {
          setCurrentRoomCode("");
        }
        wx.reLaunch({ url: "/pages/home/index" });
      },
    });
  },

  onLeaveRoom() {
    wx.showModal({
      title: "退出房间",
      content: "确认退出这个房间吗？",
      success: (res) => {
        if (!res.confirm) return;
        if (this.data.isHost && this.data.room) {
          deleteRoom(this.data.room.roomCode);
        } else {
          setCurrentRoomCode("");
        }
        wx.reLaunch({ url: "/pages/home/index" });
      },
    });
  },

  onTapInvite() {
    wx.showToast({ title: "点右上角 ··· 分享给好友", icon: "none" });
  },

  onShareAppMessage() {
    if (!this.data.room) return {};
    return {
      title: `来打烧鸡！房间号：${this.data.room.roomCode}`,
      path: `/pages/room/index?roomCode=${this.data.room.roomCode}`,
    };
  },
});
