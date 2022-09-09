/**
 * 
 * 生成一个随机密码
 * 如果带 -1 则不保存数据库
 * 如 随机密码-1
 * 
 * */

const {
    sendNotify, addOrUpdateCustomDataTitle, addCustomData, uuid
} = require('./quantum');

var custom_data_type = "quantum_password"

!(async () => {
    var sns = [];
    var nnn = uuid(18, null, "!@#$%^&*()-=_+,.;':");
    sns.push({
        Type: custom_data_type,
        Data1: process.env.command.replace("随机密码", ""),
        Data2: nnn,
        Data3: process.env.command,
        Data4: process.env.CommunicationUserId,
        Data5: process.env.CommunicationUserName,
    });

    console.log("生成密码：" + nnn);
    if (process.env.command.indexOf("-1") < 0) {
        await addCustomData(sns);
    } else {
        await sendNotify("该密码不会被保存，请妥善保管。")
    }
    await sendNotify(nnn);
})();
