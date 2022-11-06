/**
 * 京东基础方法脚本
 * */

const got = require('got');
if (!process.env.NO_CK_NOTIFY) {
    process.env.NO_CK_NOTIFY = "您没有提交CK。请按照教程获取CK发送给机器人。";
}

const { disableEnvs, sendNotify, addEnvs, allEnvs
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});


/**
 * 检查京东ck登录状态
 * @param {any} jdCookie
 */
module.exports.islogin = islogin;

async function islogin(jdCookie) {
    try {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                "Cookie": jdCookie,
                "referer": "https://h5.m.jd.com/",
                "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            },
            method: 'get',
        }
        const body = await api(options).json();
        return (body.islogin == "1");
    } catch (e) {
        console.log(" https://plogin.m.jd.com/cgi-bin/ml/islogin 验证登录状态请求异常。");
    }
}

/**
 * 将wskey 转换成 app_open
 * wskey 转换服务可以替换成其他的，兼容标准的服务
 * 或者根据自己服务调整此处代码即可
 * @param {any} wskey
 */
module.exports.convertWskey = async (wskey) => {
    var convertServiceUrl = "http://114.215.146.116:8015/api/open/ConvertWskey";
    if (process.env.WskeyConvertService) {
        convertServiceUrl = process.env.WskeyConvertService;
        console.log("使用自定义的Wskey转换服务！");
    }

    console.log("Wskey 转换服务地址：" + convertServiceUrl);
    try {
        const options = {
            url: convertServiceUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'post',
            body: JSON.stringify([wskey])
        }
        const body = await api(options).json();
        console.log("wskey 转换结果：" + JSON.stringify(body));
        if (body.success) {
            return {
                success: true,
                data: body.data[0]
            }
        } else {
            console.log("wskey 转换失败，可能是黑IP了");
        }
    }
    catch (e) {
        console.log("wskey转换 app_open出现了异常！");
    }
    return {
        success: false
    };
}

/**
 * 获取账号基本信息
 * @param {any} jdCookie
 */
module.exports.GetJDUserInfoUnion = async (jdCookie) => {
    const options = {
        url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
        headers: {
            Host: "me-api.jd.com",
            Accept: "*/*",
            Connection: "keep-alive",
            Cookie: jdCookie,
            "User-Agent": "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            "Accept-Language": "zh-cn",
            "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
            "Accept-Encoding": "gzip, deflate, br"
        }
    }
    const body = await api(options).json();
    return body;
}


/**
 * 添加或者更新jdCookie pt_key 格式
 * @param {any} jdCookie 京东ck
 * @param {any} user_id 用户id
 * @param {any} nickname 京东账号昵称
 */
module.exports.addOrUpdateJDCookie = async (jdCookie, user_id, nickname) => {
    var pt_key = jdCookie.match(/pt_key=([^; ]+)(?=;?)/)[1]
    var pt_pin = jdCookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
    if (!pt_key || !pt_pin) {
        return;
    }
    var c = {
        Name: "JD_COOKIE",
        Enable: true,
        Value: `pt_key=${pt_key};pt_pin=${pt_pin};`,
        UserRemark: nickname,
        UserId: user_id,
        EnvType: 2
    }
    var data2 = await allEnvs(pt_pin, 2);
    if (data2.length > 0) {
        console.log("pt_pin存在，尝试更新JD_COOKIE");
        c.Id = data2[0].Id;
        c.Weight = data2[0].Weight;
        c.UserRemark = nickname;
        c.QLPanelEnvs = data2[0].QLPanelEnvs;
        c.Remark = data2[0].Remark;

        if (process.env.UPDATE_COOKIE_NOTIFY) {
            await sendNotify(`Cookie更新通知
用户ID：${process.env.CommunicationUserId}
用户昵称：${process.env.CommunicationUserName || ""}
京东昵称：${nickname}`, true)
        }
    } else {
        console.log("全新韭菜上线拉！");
        c.Id = null;
        if (process.env.ADD_COOKIE_NOTIFY) {
            await sendNotify(`Cookie新增通知
用户ID：${process.env.CommunicationUserId}
用户昵称：${process.env.CommunicationUserName || ""}
京东昵称：${nickname}`, true)
        }
    }
    var data = await addEnvs([c]);
    console.log("环境变量提交结果：" + JSON.stringify(data));
}

/**
 * 京东口令
 * @param {any} command
 */
module.exports.jCommand = async (command) => {
    var result = null;
    try {
        var options = {
            'method': 'POST',
            'url': 'http://119.3.233.105:8080/JDSign/jCommand',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: JSON.stringify({
                code: command
            })
        };
        var response = await api(options);
        console.log(`${command}
解析结果：${response.body}`);
        return JSON.parse(response.body);
    } catch (e) {
        console.log("转链失败：" + JSON.stringify(e));
    }
    return result;
}


/**
 * 自定义卡密天数
 * key 能不重复
 * name 为提示标题
 * value 为天数
 * */

module.exports.sntypes = [{
    "name": "1天",
    "value": 1,
    "key": "1"
}, {
    "name": "7天",
    "value": 7,
    "key": "2"
}, {
    "name": "1月",
    "value": 30,
    "key": "3"
}, {
    "name": "1年",
    "value": 365,
    "key": "4"
}, {
    "name": "永久",
    "value": 99 * 365,
    "key": "5"
}];