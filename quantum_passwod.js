// 生成卡密

const {
    sendNotify, addOrUpdateCustomDataTitle, addCustomData, uuid
} = require('./quantum');

var custom_data_type = "quantum_password"

!(async () => {
    var sns = [];
    var nnn = uuid(18,null,"!@#$%^&*()-=_+,.;':");
    sns.push({
        Type: custom_data_type,
        Data1: process.env.command.replace("随机密码", ""),
        Data2: nnn,
        Data3: process.env.command,
        Data4: process.env.CommunicationUserId,
        Data5: process.env.CommunicationUserName,
    });
   
    console.log("生成密码：" + nnn);
    await addCustomData(sns);
    await sendNotify(nnn);
})();
