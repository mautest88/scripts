/**
 * 
 * 定时转换wskey
 * 转换依赖脚本 jd_base.js , 如需修改转换服务请自行修改。
 * 建议每12小时转换一次。
 * 表达式
 * 0 12 0/12 * * ?
 * 
 * */

const { sendNotify, getCustomData, updateCustomData } = require('./quantum');
const { convertWskey, addOrUpdateJDCookie } = require('./jd_base');

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
        var data = datas[i];
        var wskey = `pin=${data.Data5};wskey=${data.Data4};`
        var convertResult = await convertWskey(wskey);
        if (!convertResult.success) {
            failedCount += 1;
            console.log(`wskey：【${wskey}】，转换失败。`)
            continue
        }
        if (convertResult.data.indexOf("pt_key=app_open") < 0) {
            var msg = `wskey失效了，账户昵称：【${data.Data6}】，pin：【${data.Data5}】`
            console.log(msg);
            await sendNotify(msg, false, data.Data1);
            console.log("开始禁用失效wskey。")
            data.Data7 = "否";
            overdueCount += 1;
            await updateCustomData(data);
            continue;
        } else {
            successCount += 1;
            console.log("开始处理提交JDCOOKIE：" + convertResult.data)
            await addOrUpdateJDCookie(convertResult.data, data.Data1, data.Data6);
        }
    }
    await sendNotify(`wskey转换完成，有效：${successCount}，失效：${overdueCount}，转换失败：${failedCount}。`, true)
})();

/**
 * 获取有效的wskey信息
 * */
async function getWskey() {
    var datas = await getCustomData(customDataType, null, null, {
        Data7: "是"
    });
    return datas;
}