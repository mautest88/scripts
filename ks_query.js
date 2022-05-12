/**
 * 该脚本作者来源量子用户：灰色头像@，QQ：97393412
 * 快手极速版 金币，现金查询
 * 用户变量：ksjsbCookie
 * 值是:CK
 * */
const {
    sendNotify, getEnvs, deleteEnvByIds
} = require('./quantum');
const { ks_query
} = require("./ks_base")
let user_id = process.env.user_id; //用户id
!(async () => {
    console.log("user_id:" + user_id);
    var cks = await getEnvs("ksjsbCookie", "kuaishou.api_st", 2, user_id)
    if (cks.length == 0) {
        console.log("没有提交过快手极速版CK，结束任务。");
        return;
    }
    await sendNotify(`您一共绑定了${cks.length}个快手极速版`);
    for (var i = 0; i < cks.length; i++) {
        var ck = cks[i];
        var body = await ks_query(ck.Value);
        if (body.result == 1 && body.data.userData) {
            await sendNotify("金币：" + body.data.totalCoin + "\n" + "现金：" + body.data.totalCash + "\n" + "昵称：" + body.data.userData.nickname)
        } else {
            console.log(ck + "已失效");
            await sendNotify(`快手账号：${ck.UserRemark}已失效，重新获取提交。`)
        }
    }
})();