/**
 * 
 * 环境变量执行青龙任务数据同步
 * 
 * */

const got = require('got');
const api = got.extend({
    retry: { limit: 0 },
});
const {
    getCustomData, addCustomData, sendNotify
} = require('./quantum');

const type = "quantum_env_monitor_execution_tasks";
!(async () => {
    var config = {
        method: 'get',
        url: 'http://114.215.146.116:8018/quantum_env_monitor_execution_tasks.json',
    };
    const body = JSON.parse((await api(config)).body);
    console.log(`从服务器获取${body.length}个监听配置.`);
    var ldata = await getCustomData(type)
    console.log(`本地获取${body.length}个监听配置.`);
    var ndata = [];
    var n = "";
    for (var i = 0; i < body.length; i++) {
        if (ldata.filter(n => n.Data2 == body[i].Data2 || n.Data3 == body[i].Data3).length > 0) {
            console.log(`任务名：${body[i].Data1}，脚本名：${body[i].Data2}，环境变量：${body[i].Data3}已存在！`);
            continue;
        }
        ndata.push(body[i])
        n += body[i].Data1+"，"
    }
    if (n.length > 1) {
        n = n.substring(0, n.length - 1);
        n =`【${n}】`
    }
    if (ndata.length > 0) {
        await addCustomData(ndata);
    }
    await sendNotify(`本次更新到监听任务${ndata.length}个
${n}请通过量子助手数据管理查看调整。
本通知来源脚本：quantum_env_monitor_sync.js。`, true);
})().catch((e) => {console.log("脚本异常：" + e);});