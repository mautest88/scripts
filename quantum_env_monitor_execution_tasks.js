/**
 * 
 * 监控环境变量执行青龙任务
 * 
 * 工作原理
 * 1. 监听到export xxx="xxxx" 信息获取到环境变量
 * 2. 将环境变量同步到青龙
 * 3. 执行脚本
 * 
 * 使用说明
 * 1. 请先使用管理员QQ发送 “初始化数据管理标题”给机器人或者通过脚本指令执行，该操作只需要执行一次
 * 2. 打开数据管理，筛选到“环境变量任务触发”
 * 3. 添加需要触发的环境变量
 * 
 *          任务名填写该任务的名称 如“入会开卡领取
 *          青龙脚本名：“jd_OpenCard_Force.js”
 *          环境变量填写：“VENDER_ID” 如果有多个环境变量请用&隔开 如 “jd_cjhy_activityId&jd_cjhy_activityUrl”
 *          状态：“启用”，如果是其他状态则不执行。
 *          
 * 4. 在青龙配置文件中删除类似 export jd_cjhy_activityId="" 的环境变量
 * 
 * 
 * */

const {
    qinglong, getCustomData, getEnvs, addEnvs, sendNotify
} = require('./quantum');
const {
    syncEnvs
} = require('./quantum_syncEnv');

var command = process.env.command;
var customType = "quantum_env_monitor_execution_tasks"
var ManagerQQ = process.env.ManagerQQ
var CommunicationUserId = process.env.CommunicationUserId; //用户通讯id，qq/wx

var isManager = (ManagerQQ == CommunicationUserId);

!(async () => {
    console.log("接收指令信息：" + command);
    var tasks = await GetTasks();
    if (!tasks || tasks.length == 0) {
        console.log("未配置监控环境变量执行青龙任务！")
        return;
    }

    var envs = [];
    var scriptName = "";
    var runTask = null;
    console.log(`获取到【${tasks.length}】个环境变量触发任务，开始匹配信息。`)
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (!task.Data1 || !task.Data2 || !task.Data3) {
            console.log("存在不完整的任务信息，请通过数据管理检查相关配置。");
            continue;
        }
        var sf = false;
        for (var x = 0; x < task.Data3.split("&").length; x++) {
            var envName = task.Data3.split("&")[x];
            var reg = `var pattern =/export ${envName}="(.+?)"/`;
            eval(reg);
            if (pattern.test(command)) {
                sf = true;
                var value = command.match(pattern)[1];
                console.log(`获取到环境变量：【${envName}】，值：【${value}】`)
                envs.push({
                    Name: envName,
                    Value: value,
                    EnvType: 1,
                    Enable: true,
                })
            }
        }
        if (sf) {
            runTask = task;
            scriptName = task.Data2;
            console.log(`匹配到任务：【${task.Data1}】，执行脚本：【${task.Data2}】`)
            break;
        }
    }
    if (!scriptName || envs.length == 0) {
        var tmsg = `指令信息：${command}
没有找到任何任务。`
        console.log(tmsg);
        if (isManager) {
            await sendNotify(tmsg, true);
        }
        return;
    }

    console.log("开始检查环境变量是否重复。")

    var sameCount = 0;
    for (var i = 0; i < envs.length; i++) {
        var env = await getEnvs(envs[i].Name, null, 1);
        if (env && env.length > 0) {
            if (env[0].Value == envs[i].Value) {
                console.log(`变量名：【${envs[i].Name}】，值：【${envs[i].Value}】`);
                sameCount++;
            }
            envs[i].Id = env[0].Id;
        }
    }

    if (sameCount == envs.length) {
        var tmsg = `指令信息：【${command}】
任务名：【${scriptName}】，环境变量重复，跳过执行。`
        console.log(tmsg);
        if (isManager) {
            await sendNotify(tmsg, true);
        }
        return;
    }
    console.log("同步环境变量到量子中。");

    await addEnvs(envs);

    console.log("青龙量子环境变量双向同步");
    await syncEnvs(false)

    console.log("从青龙中获取脚本任务。")
    var QLTasks = await qinglong.getTask(scriptName);

    if (QLTasks.Data.length == 0) {
        var tmsg = `未在青龙面板中找到脚本名【${scriptName}】`
        console.log(tmsg);
        if (isManager) {
            await sendNotify(tmsg, true);
        }
        return;
    }
    QLTasks = QLTasks.Data[0].QLTasks;
    console.log(`在【${tasks.length}】个青龙中找到脚本任务：【${scriptName}】`);
    var runTasks = [];
    var qlName = ""
    for (var i = 0; i < QLTasks.length; i++) {
        qlName += QLTasks[i].QLName + "，";
        runTasks.push({
            "QLId": QLTasks[i].QLId,
            "TaskIds": [
                QLTasks[i]._id
            ]
        })
    }
    var msg = `没有青龙面板中包含脚本【${scriptName}】。`;
    if (runTasks.length > 0) {
        msg = `从以下青龙中执行监控任务：【${runTask.Data1}】
${qlName}`;
        console.log(msg);
        await qinglong.runTask(runTasks);
    }
    await sendNotify(msg, true);
})();

/**
 * 获取启用的任务
 * */
async function GetTasks() {
    return await getCustomData(customType, null, null, {
        Data4: "启用"
    });
}