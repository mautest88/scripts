const {
    sendNotify, getUserInfo
} = require('./quantum');

!(async () => {
    var user = await getUserInfo();
    await sendNotify(`绑定QQ：${user.qq || '未绑定'}
绑定微信：${user.wxid || '未绑定'}
Web用户：${user.UserName || '未绑定'}
用户权重：${user.Weight}
剩余积分：${user.MaxEnvCount}`);
})();
