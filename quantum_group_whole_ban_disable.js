/**
 * 设置群组全员禁言(取消)
 * 需要机器人是管理员
 * 设置量子变量 WHOLE_BAN_GROUPS，值为群号，多个群号用&隔开
 *  
 * 取消禁言后发送消息：group_whole_ban_enable_msg
 * */

const {
    set_group_whole_ban
} = require('./quantum');

!(async () => {
    var groups = process.env.WHOLE_BAN_GROUPS;
    console.log("开始执行QQ群组全员禁言(取消禁言)：" + groups)
    if (!groups) {
        console.log("未设置环境变量：WHOLE_BAN_GROUPS，结束了。")
        return;
    } else {
        var group_whole_ban_enable_msg = process.env.group_whole_ban_enable_msg || "";
        console.log("取消全员禁言后发送群消息：" + group_whole_ban_enable_msg);
        await set_group_whole_ban(groups, false, group_whole_ban_enable_msg);
    }
})().catch((e) => {console.log("脚本异常：" + e);});