/**
 * 
 * 用户提交美团CK
 * ADD_MEITUANCOOKIE_USE_SCORE 添加美团 CK需要多少积分。（设置为0 或者 不设置时则表示不需要积分。）
 * 
 * */


let ADD_MEITUANCOOKIE_USE_SCORE = (process.env.ADD_MEITUANCOOKIE_USE_SCORE || 0) * 1;
const { sendNotify, allEnvs, addEnvs, getUserInfo, updateUserInfo } = require('./quantum');

let user_id = process.env.user_id; //用户id
let command = process.env.command;

!(async () => {
    command += ";";
    var USERID = null;
    var token = null;
    try {
        token = command.match(/token=([^; ]+)(?=;?)/)[1];
        USERID = command.match(/userId=([^; ]+)(?=;?)/)[1]
    } catch {
        console.log("提交的信息中获取USERID失败！");
    }
    if (!token) {
        await sendNotify("提交的美团CK错误。")
        return;
    }
    console.log("USERID：" + USERID);
    var c = {
        Name: 'meituanCookie',
        Enable: true,
        Value: `token=${token};${(USERID ? `userId=${USERID};` : '')}`,
        UserRemark: USERID || "",
        UserId: user_id,
        EnvType: 2
    };
    if (!USERID) {
        console.log("没有USERID参数，直接做新增处理.");
    } else {
        var data2 = await allEnvs(USERID, 2);
        if (data2.length > 0) {
            console.log("重复的美团用户CK ，更新操作");
            c.Id = data2[0].Id;
            c.Weight = data2[0].Weight;
            c.UserRemark = data2[0].UserRemark;
            c.Remark = data2[0].Remark;
        }
    }
    if (ADD_MEITUANCOOKIE_USE_SCORE > 0) {
        var user = (await getUserInfo()) || {};
        user.MaxEnvCount -= ADD_MEITUANCOOKIE_USE_SCORE;
        if (ADD_MEITUANCOOKIE_USE_SCORE > 0 && user.MaxEnvCount < 0) {
            await sendNotify(`该操作需要${ADD_MEITUANCOOKIE_USE_SCORE}积分
您当前积分剩余${user.MaxEnvCount + ADD_MEITUANCOOKIE_USE_SCORE}`);
            return;
        }
        console.log(`扣除用户积分：${ADD_MEITUANCOOKIE_USE_SCORE}，剩余积分：${user.MaxEnvCount}`)
        await updateUserInfo(user);
    }
    console.log('开始提交快手美团到量子数据库');
    var data = await addEnvs([c]);
    console.log('提交结果：' + JSON.stringify(data));
    await sendNotify(
        '美团提交成功！\n扣除积分：' +
        ADD_MEITUANCOOKIE_USE_SCORE +
        '\n用户ID：' + (USERID || '')
    );
})();