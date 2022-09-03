/**
 * 
 * 定时转换wskey
 * 转换依赖脚本 jd_base.js , 如需修改转换服务请自行修改。
 * 建议每12小时转换一次。
 * 表达式，请自行调整时间，否则同一时间转换太多会黑IP
 * 
 * 0 12 0/12 * * ?
 * 
 * 支持 量子变量 WskeyConvertService  wskey 转换服务，不指定默认使用小菜鸡的服务。
 * 自建服务教程：https://blog.csdn.net/h394047464/article/details/126680864?spm=1001.2014.3001.5502
 * 
 * */

const { sendNotify, getCustomData, updateCustomData, sleep } = require('./quantum');
const { convertWskey, addOrUpdateJDCookie } = require('./jd_base');
const {
    syncEnvs
} = require('./quantum_syncEnv');

/**
 * customDataType 该值请勿随意更改
 * */
const customDataType = "wskey_record";
var successCount = 0;
var overdueCount = 0;
var failedCount = 0;
!(async () => {
    var datas = await getWskey();
    var m1 = `开始转换，有效wskey：${datas.length}个。`
    console.log(m1)
    await sendNotify(m1, true)
    for (var i = 0; i < datas.length; i++) {
        // 3秒转一个，防止过快转换失败了
        await sleep(3000);
        var data = datas[i];
        var wskey = `pin=${data.Data5};wskey=${data.Data4};`
        var convertResult = await convertWskey(wskey);
        if (!convertResult.success) {
            failedCount += 1;
            console.log(`wskey：【${wskey}】，转换失败。`)
            continue;
        }
        if (convertResult.data.indexOf("pt_key=app_open") < 0) {
            var msg = `wskey失效了，账户昵称：【${data.Data6}】，pin：【${data.Data5}】`
            console.log(msg);
            await sendNotify(msg, false, data.Data1);
            console.log("开始禁用失效wskey。")
            data.Data7 = "否";
            overdueCount += 1;
            try {
                await updateCustomData(data);
            } catch {
                console.log("禁用wskey出现了异常。")
            }
        } else {
            successCount += 1;
            console.log("开始处理提交JDCOOKIE：" + convertResult.data)
            await addOrUpdateJDCookie(convertResult.data, data.Data1, data.Data6);
        }
    }
    await sendNotify(`wskey转换完成，成功：${successCount}，失效：${overdueCount}，转换失败：${failedCount}。`, true)
    console.log("开始同步环境变量到青龙。")
    await syncEnvs(true);
})().catch((e) => {
    console.log("执行脚本出现异常了。");
    console.log(e);
});

/**
 * 获取有效的wskey信息
 * */
async function getWskey() {
    var datas = await getCustomData(customDataType, null, null, {
        Data7: "是"
    });
    return datas;
}