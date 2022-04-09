/**
 *
 * 跳车脚本
 * 可用指令：删除账号 或者 删除账号 xxxxx
 *
 **/
require('./env.js');
const {
    sendNotify, getEnvs, deleteEnvByIds
} = require('./quantum');

let CommunicationUserId = process.env.CommunicationUserId;
let user_id = process.env.user_id; //用户id
let command = process.env.command;
!(async () => {
    if (!user_id) {
        return;
    }
    var p = "";
    if (command.split(" ").length == 2) {
        p = command.split(" ")[1];
    }
    var cks = await getEnvs("JD_COOKIE", p, 2, user_id)
    console.log("CK个数：" + cks.length);
    await sendNotify("删除账号成功！\n感谢使用，有缘再见！")
    if (cks.length == 0) {
        return;
    } else {
        var ids = [];
        console.log("删除CK信息：");
        cks.forEach((item) => {
            console.log(item.Value);
            ids.push(item.Id);
        });
        await deleteEnvByIds(ids)
        await sendNotify("有人删除账号跑路了，用户：" + CommunicationUserId, true);
    }
})().catch((e) => {
    console.log(e);
});