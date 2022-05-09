/**
 * 
 * 用户提交快手CK
 * 
 * */
const {
    sendNotify, allEnvs, addEnvs
} = require('./quantum');

const { ks_query
} = require("./ks_base")

let user_id = process.env.user_id; //用户id
let command = process.env.command;

!(async () => {

    command = command + ";";
    var v = command.match(/kuaishou.api_st=([^; ]+)(?=;?)/)[1]
    console.log(v);
    var data2 = await allEnvs(v, 2);
    if (data2.length > 0) {
        await sendNotify("提交失败，重复的CK！")
        return;
    }
    command = `kuaishou.api_st=${v}`;
    console.log("开始查询快手CK信息");
    var body = await ks_query(command);
    console.log("CK查询返回结果：" + JSON.stringify(body));
    if (body.result == 1 && body.data.userData) {
        var c = {
            Name: "ksjsbCookie",
            Enable: true,
            Value: command,
            UserRemark: body.data.userData.nickname,
            UserId: user_id,
            EnvType: 2
        }
        var data = await addEnvs([c]);
        console.log("开始提交快手CK到量子数据库");
        console.log("提交结果：" + JSON.stringify(data));
        await sendNotify("提交成功！\r金币：" + body.data.totalCoin + "\n" + "现金：" + body.data.totalCash + "\n" + "昵称：" + body.data.userData.nickname)
    } else {
        await sendNotify("提交失败！")
    }
})();