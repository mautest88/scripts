/**
 * 用户提交京东wskey
 * 
 * wskey将存放在 自定义数据表中，
 * 请通过数据管理查看信息
 * */
const { sendNotify, addOrUpdateCustomDataTitle, addCustomData, getCustomData, updateCustomData } = require('./quantum');

const { convertWskey, GetJDUserInfoUnion, addOrUpdateJDCookie } = require('./jd_base');

/**
 * customDataType 该值请勿随意更改
 * */
const customDataType = "wskey_record";

let user_id = process.env.user_id; //用户id
let command = process.env.command;

let CommunicationUserId = process.env.CommunicationUserId; //通讯工具id qq。wx
let CommunicationUserName = process.env.CommunicationUserName; //通讯工具昵称

let key = '';
let pin = '';


!(async () => {
    let wskeys = command.split("&");
    addCustomDataTile();
    for (var i = 0; i < wskeys.length; i++) {
        var wskey = wskeys[i];
        if (!wskey) {
            continue;
        }
        if (wskey.indexOf("pin") < 0) {
            console.log(` 提交的信息【${wskey}】缺少pin信息。`)
            continue;
        }
        wskey = wskey.replace(/[\r\n]/g, "");
        try {
            key = wskey.match(/wskey=([^; ]+)(?=;?)/)[1]
            pin = wskey.match(/pin=([^; ]+)(?=;?)/)[1]
        }
        catch (e) {
            console.log("wskey：【 " + wskey + "】格式不对，已跳过");
            continue;
        }
        var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
        if (reg.test(pin)) {
            pin = encodeURI(pin);
        }
        wskey = `wskey=${key};pin=${pin};`
        console.log("开始将wskey转换成app_open格式：" + wskey)
        var convertResult = await convertWskey(wskey);

        if (!convertResult.success || convertResult.data.indexOf("pt_key=app_open") < 0) {
            console.log("wskey转换失败了，给韭菜发送通知。");
            await sendNotify(`wskey提交失败：【${wskey}】`);
            continue;
        }
        var cookie = convertResult.data;
        console.log("开始获取京东账户基本信息");
        var userInfo = await GetJDUserInfoUnion(cookie)
        console.log("获取京东账户基本信息结果：" + JSON.stringify(userInfo));
        if (!userInfo || !userInfo.data || userInfo.retcode != "0") {
            sendNotify(`wskey似乎失效了：【${wskey}】`);
            continue;
        }
        var msg = `提交成功辣！
账号昵称：${userInfo.data.userInfo.baseInfo.nickname}
用户等级：${userInfo.data.userInfo.baseInfo.levelName}
剩余京豆：${userInfo.data.assetInfo.beanNum}
剩余红包：${userInfo.data.assetInfo.redBalance}`;
        await sendNotify(msg);
        await addOrUpdateWskey(key, pin, userInfo.data.userInfo.baseInfo.nickname)
        console.log("开始处理提交JDCOOKIE：" + convertResult.data)
        await addOrUpdateJDCookie(convertResult.data, user_id, userInfo.data.userInfo.baseInfo.nickname);
    }
})();

/**
 * 添加或更新wskey 到自定义数据表中
 * @param {any} wskey key
 * @param {any} pin pin
 * @param {any} nickname 京东账号昵称
 */
async function addOrUpdateWskey(wskey, pin, nickname) {
    console.log("开始提交wskey到自定义数据中");
    var customDatas = await getCustomData(customDataType, null, null, { Data5: pin })
    var customData = {
        Type: customDataType,
        Data1: user_id,
        Data2: CommunicationUserName,
        Data3: CommunicationUserId,
        Data4: wskey,
        Data5: pin,
        Data6: nickname,
        Data7: "是"
    }
    if (customDatas && customDatas.length > 0) {
        console.log("更新wskey信息到自定义数据中");
        customData.Id = customDatas[0].Id;
        await updateCustomData(customData);
    }
    else {
        var result = await addCustomData([customData]);
        console.log("新增wskey信息到自定义数据中，提交结果" + JSON.stringify(result));
    }
}

/**
 * 添加或者更新自定义数据标题
 * */
function addCustomDataTile() {
    addOrUpdateCustomDataTitle({
        Type: customDataType,
        TypeName: "京东wskey",
        Title1: "用户ID",
        Title2: "用户昵称",
        Title3: "QQ/WX",
        Title4: "wskey",
        Title5: "pin",
        Title6: "账号名称",
        Title7: "是否有效"
    })
}