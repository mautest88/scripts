require('./env.js');
const {
    addEnvs, sendNotify, allEnvs, getQLPanels, getQLEnvs, syncEnv
} = require('./quantum');

let notifyMessage = "";
let isSystem = process.env.IsSystem == "true";


!(async () => {
    if (!isSystem) {
        await sendNotify("开始同步环境变量了，可能要点时间，骚等一下。", true)
    }
    console.log("开始同步环境变量。")
    var allQuantumEnvs = await allEnvs();
    var commonEnvs = allQuantumEnvs.filter((n => n.EnvType == 1));
    var userEnvs = allQuantumEnvs.filter((n => n.EnvType == 2));
    var qlPanels = (await getQLPanels()).filter((n) => n.Enable);


    var m = `环境变量：${allQuantumEnvs.length}个
公共变量：${commonEnvs.length}个
用户变量：${userEnvs.length}个
量子变量：${allQuantumEnvs.filter((n => n.EnvType == 3)).length}个
青龙容器：${qlPanels.length}个`;

    console.log(m);
    notifyMessage = m;

    if (qlPanels.length == 0) {
        console.log("没青龙容器,不同步.");
        return;
    }
    //新增或者更新的CK
    var newCKs = [];

    for (var i = 0; i < qlPanels.length; i++) {
        var ql = qlPanels[i];
        if (ql.Weight <= 0) {
            console.log(`青龙容器:${ql.Name}权重小于1跳过同步`);
            continue;
        }
        var qlEnvs = await getQLEnvs(ql);
        console.log(`青龙容器:${ql.Name},获取环境变量:${qlEnvs.length}个`);
        var ids = [];
        for (var x = 0; x < qlEnvs.length; x++) {
            var qlenv = qlEnvs[x];
            if (qlenv == undefined) {
                continue;
            }
            if (qlenv.name == "JD_COOKIE" && qlenv.status == 0) {
                var pt_pin = qlenv.value.match(/pt_pin=([^; ]+)(?=;?)/)[1]
                try {
                    var qEnv = userEnvs.filter((n) => n.Value.indexOf(pt_pin) > -1)[0];
                    //如果青龙中的环境变量更新时间更晚,则使用青龙的环境变量.
                    if (qEnv && qEnv.Value != qlenv.value && Date.parse(qlenv.timestamp) > Date.parse(qEnv.UpdateTime)) {
                        qEnv.Value = qlenv.value;
                        qEnv.Enable = true;
                        console.log(`容器：${ql.Name}中，pt_pin：${pt_pin} CK更新时间${qlenv.timestamp}，将青龙中的环境变量更新到量子。`);
                        newCKs.push(qEnv);
                    }
                    //如果在量子中没有找到对应的环境变量则新增
                    else if (!qEnv || !qEnv.Id) {
                        console.log("青龙容器中有新的CK:" + qlenv.value);
                        //已经新增的变量同步更新对应关联的容器
                        var newCK = newCKs.filter((b) => b.Value == qlenv.value)[0];
                        if (newCK) {
                            newCK.QLPanelEnvs.push({
                                QLPanelId: ql.Id,
                                Mode: 2
                            });
                        } else {
                            newCKs.push({
                                Value: qlenv.value,
                                Name: qlenv.name,
                                Enable: true,
                                UserRemark: qlenv.remarks,
                                Remark: qlenv.remarks,
                                EnvType: 2,
                                Weight: 0,
                                QLPanelEnvs: [{
                                    QLPanelId: ql.Id,
                                    Mode: 2
                                }]
                            });
                        }
                    }
                } catch (e) {
                    console.log("Error：" + console.log(qlenv));
                }
            }
        }
        //console.log(`开始删除青龙容器：${ql.Name}中的所有环境变量。`);
        //await deleteQLEnvs(ql, ids);
        qlPanels[i].Envs = [];
        qlPanels[i].EnvCount = 0;
    }

    console.log("CK处理完成")
    if (newCKs && newCKs.length > 0) {
        console.log("将新增或更新的CK同步到量子助手：" + newCKs.length);
        notifyMessage += "\r从青龙更新变量：" + newCKs.length + "个";
        await addEnvs(newCKs);
    }
    let message = await syncEnv();
    if (message) {
        for (var i = 0; i < message.length; i++) {
            console.log(message[i]);
            notifyMessage += "\r" + message[i]
        }
    }
    if (!isSystem) {
        sendNotify(notifyMessage, true)
    }
})()