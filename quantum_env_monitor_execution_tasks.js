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
 * 1. 请先使用管理员QQ发送 “初始化数据管理标题”给机器人或者通过脚本线报执行，该操作只需要执行一次
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
    qinglong, getCustomData, getEnvs, addEnvs, sendNotify, sleep, addCustomData
} = require('./quantum');
const {
    syncEnvs
} = require('./quantum_syncEnv');

var command = process.env.command;
var customType = "quantum_env_monitor_execution_tasks"

/**
 * 等待100次（50分钟）后强制执行任务。
 * */
const enforceCount = 200;
var awaitCount = 0;

/**
 * 
 * 线报执行记录
 * 
 * */
var recordCustomType = "quantum_env_monitor_execution_tasks_records"
var ManagerQQ = process.env.ManagerQQ
var CommunicationUserId = process.env.CommunicationUserId; //用户通讯id，qq/wx

var isManager = (ManagerQQ == CommunicationUserId);
var runTask = null;

!(async () => {
    console.log("接收线报信息：" + command);
    var tasks = await GetTasks();
    if (!tasks || tasks.length == 0) {
        console.log("未配置监控环境变量执行青龙任务！")
        return;
    }

    var t = Math.round(Math.random() * 3000) + Math.round(Math.random() * 3000) + Math.round(Math.random() * 3000);
    console.log("随机延迟" + t + "毫秒");
    await sleep(t);

    var envs = [];
    var scriptName = "";
    console.log(`获取到【${tasks.length}】个环境变量触发任务，开始匹配信息。`)




    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (!task.Data1 || !task.Data2 || !task.Data3) {
            console.log("存在不完整的任务信息，请通过数据管理检查相关配置，脚本名，环境变量，任务名不可缺少。");
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
        var tmsg = `线报：【${command}】
没有配置可执行任务，请通过数据管理配置。`
        console.log(tmsg);
        await sendNotify(tmsg, true);
        return;
    }

    console.log("开始检查环境变量是否重复。")

    var sameCount = 0;

    var envKeyValue = [];
    for (var i = 0; i < envs.length; i++) {
        envKeyValue.push({
            Name: envs[i].Name,
            Value: envs[i].Value,
        })
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
        var tmsg = `线报：【${command}】
任务：【${scriptName}】，变量重复。`
        console.log(tmsg);
        await sendNotify(tmsg, true);
        return;
    }

    var keyValueString = JSON.stringify(envKeyValue);
    console.log("开始检查历史执行记录。");

    var records =await getCustomData(recordCustomType, null, null, {
        Data4: keyValueString
    });

    console.log("keyValueString：" + keyValueString +"，records："+JSON.stringify(records))

    if (records.length > 0) {
        var tmsg = `线报：【${command}】
任务：【${scriptName}】跑过了，任务执行时间：【${records[0].CreateTime}】。`
        console.log(tmsg);
        await sendNotify(tmsg, true);
        return;
    }
    console.log("从青龙中获取脚本任务。")
    var tt = await isRunning(scriptName);

    if (tt.notifyMessage && tt.notifyMessage.length > 0) {
        await sendNotify(tt.notifyMessage, true);
        return;
    }
    await addCustomData([{
        Type: recordCustomType,
        Data1: runTask.Data1,
        Data2: runTask.Data2,
        Data3: runTask.Data3,
        Data4: keyValueString,
        Data5: command,
    }])
    if (tt.Running) {
        await sendNotify(`【${scriptName}】正在执行中，任务加入执行队列！`,true);
        await WaitTask(scriptName, envs);
    } else {
        await RunTask(tt.runTasks, envs, tt.qlName);
    }
})();

/**
 * 获取启用的任务
 * */
async function GetTasks() {
    return await getCustomData(customType, null, null, {
        Data4: "启用"
    });
}

async function isRunning(scriptName) {
    var QLTasks = await qinglong.getTask(scriptName);
    console.log(`在【${QLTasks.Data[0].QLTasks.length}】个青龙中找到脚本任务：【${scriptName}】`);
    var running = false;
    var runTasks = [];
    var qlName = "";
    var notifyMessage = null;
    if (QLTasks.Data.length == 0) {
        notifyMessage = `青龙面板中未找到脚本：【${scriptName}】`
        console.log(notifyMessage);
    } else {
        QLTasks = QLTasks.Data[0].QLTasks;
        for (var i = 0; i < QLTasks.length; i++) {
            qlName += QLTasks[i].QLName + "，";
            if (QLTasks[i].status == 0) {
                if (awaitCount > enforceCount) {
                    console.log(`【${QLTasks[i].QLName}】还在执行任务，等久了强制执行脚本：【${scriptName}】！`)
                }
                else {

                    console.log(`【${QLTasks[i].QLName}】正在执行脚本：【${scriptName}】！`)
                    running = true;
                    break;
                }
            }
            runTasks.push({
                "QLId": QLTasks[i].QLId,
                "TaskIds": [
                    QLTasks[i]._id
                ]
            })
        }
    }
    return {
        Running: running,
        runTasks: runTasks,
        qlName: qlName,
        notifyMessage: notifyMessage
    };
}

/**
 * 等待青龙任务
 * @param {any} scriptName 脚本名
 * @param {any} envs 环境变量
 */
async function WaitTask(scriptName, envs) {
    console.log("等待30秒，让原来的任务执行完成吧！");
    awaitCount++;
    await sleep(30 * 1000);
    var tt = await isRunning(scriptName);
    if (tt.Running) {
        await WaitTask(scriptName, envs);
    } else {
        await RunTask(tt.runTasks, envs, tt.qlName);
    }
}

/**
 * 执行青龙脚本
 * @param {any} runTasks 执行任务队形
 * @param {any} envs 环境变量
 * @param {any} qlName 青龙
 */
async function RunTask(runTasks, envs, qlName) {
    var msg = `从以下青龙中执行监控任务：【${runTask.Data1}】
${(qlName.substring(0, qlName.length - 1))}`;
    if (runTasks.length > 0) {
        console.log("同步环境变量到量子中。");
        await addEnvs(envs);
        console.log("青龙量子环境变量双向同步");
        await syncEnvs(false)
        console.log(msg);
        await qinglong.runTask(runTasks);
    }
    await sendNotify(msg, true);
}