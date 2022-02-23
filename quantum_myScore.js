// 验证卡密

const {
    sendNotify, getUserInfo
} = require('./quantum');


!(async () => {
    var user = await getUserInfo();
    await sendNotify(`您的剩余积分：${user.MaxEnvCount}`);
})();
