const {
  getUsers,
  createUser,
  setCurrentUserId,
  deleteUser,
} = require("../../utils/userStore");

Page({
  data: {
    avatarUrl: "",
    nickName: "",
    users: [],
  },

  onShow() {
    this.loadUsers();
  },

  loadUsers() {
    this.setData({
      users: getUsers(),
    });
  },

  onChooseAvatar(e) {
    this.setData({
      avatarUrl: e.detail.avatarUrl || "",
    });
  },

  onNickNameInput(e) {
    this.setData({
      nickName: e.detail.value || "",
    });
  },

  onCreateAndLogin() {
    const nickName = (this.data.nickName || "").trim();
    if (!nickName) {
      wx.showToast({
        title: "请填写昵称",
        icon: "none",
      });
      return;
    }

    const user = createUser({
      nickName,
      avatarUrl: this.data.avatarUrl,
    });
    setCurrentUserId(user.id);

    wx.showToast({
      title: "登录成功",
      icon: "success",
    });

    wx.reLaunch({
      url: "/pages/home/index",
    });
  },

  onQuickLogin(e) {
    const id = e.currentTarget.dataset.id;
    setCurrentUserId(id);
    wx.reLaunch({
      url: "/pages/home/index",
    });
  },

  onDeleteUser(e) {
    const id = e.currentTarget.dataset.id;
    const user = this.data.users.find((u) => u.id === id);
    wx.showModal({
      title: "删除用户",
      content: `确定删除「${user ? user.nickName : ""}」吗？`,
      confirmColor: "#f53f3f",
      success: (res) => {
        if (!res.confirm) return;
        deleteUser(id);
        this.loadUsers();
        wx.showToast({ title: "已删除", icon: "success" });
      },
    });
  },
});
