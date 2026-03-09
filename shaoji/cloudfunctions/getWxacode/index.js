const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  try {
    const result = await cloud.openapi.wxacode.get({
      path: `pages/room/index?roomCode=${event.roomCode}`,
      width: 280,
    });

    if (result.contentType) {
      return {
        success: true,
        buffer: result.buffer.toString("base64"),
        contentType: result.contentType,
      };
    }

    return { success: false, error: "生成小程序码失败" };
  } catch (err) {
    return { success: false, error: err.message || "云函数调用失败" };
  }
};
