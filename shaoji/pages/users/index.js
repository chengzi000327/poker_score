const {
  getUsers,
  getCurrentUserId,
  setCurrentUserId,
  updateUser,
  deleteUser,
} = require("../../utils/userStore");

Page({
  data: {
    users: [],
    currentUserId: "",
  },

  onShow() {
    this.reload();
  },

  reload() {
    this.setData({
      users: getUsers(),
      currentUserId: getCurrentUserId(),
    });
  },

  onNickNameInput(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const users = this.data.users.slice();
    users[idx].nickName = e.detail.value || "";
    this.setData({ users });
  },

  onChooseAvatar(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const avatarUrl = e.detail.avatarUrl || "";
    const users = this.data.users.slice();
    users[idx].avatarUrl = avatarUrl;
    this.setData({ users });
  },

  onSaveUser(e) {
    const id = e.currentTarget.dataset.id;
    const target = this.data.users.find((u) => u.id === id);
    const nickName = (target?.nickName || "").trim();
    if (!nickName) {
      wx.showToast({
        title: "昵称不能为空",
        icon: "none",
      });
      return;
    }
    updateUser(id, {
      nickName,
      avatarUrl: target.avatarUrl || "",
    });
    wx.showToast({
      title: "已保存",
      icon: "success",
    });
    this.reload();
  },

  onSetCurrent(e) {
    const id = e.currentTarget.dataset.id;
    setCurrentUserId(id);
    wx.showToast({
      title: "已切换",
      icon: "success",
    });
    this.reload();
  },

  onDeleteUser(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除用户",
      content: "确认删除这个用户吗？",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        deleteUser(id);
        this.reload();
      },
    });
  },
});
