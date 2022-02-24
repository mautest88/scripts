// 京粉返利
/*
 * 支持环境变量
 * 
 * JFID  京粉 联盟id（必填）
 * JFPTPIN 京粉转码ck的 pt_pin 部分 （必填）
 * REBATE_QQGROUP 转链后转发QQ群（支持多个，或者用&符号隔开）
 * REBATE_WXGROUP 转链后转发微信群（支持多个，或者用&符号隔开）
 * 
 */

const got = require('got');
const {
    sendNotify, getEnvs
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

let jd_rebat = process.env.jd_rebat;
let JFID = process.env.JFID;

let JFPTPIN = process.env.JFPTPIN;
let QQGROUP = process.env.REBATE_QQGROUP;
let WXGROUP = process.env.REBATE_WXGROUP;

if (!JFID) {
    console.log("没有填写JFID环境变量");
    return;
}

if (!JFPTPIN) {
    console.log("没有填写JFPTPIN环境变量");
    return;
}

!(async () => {
    var jdcookie = await getEnvs("JD_COOKIE", JFPTPIN)
    if (jdcookie.length === 0) {
        console.log(`没有找到${JFPTPIN}的ck`);
        return;
    }
    jdcookie = jdcookie[0];
    if (!jdcookie || !jdcookie.Enable) {
        console.log(`${JFPTPIN}的ck似乎无效了`);
        await sendNotify("返利CK失效", true);
        return;
    }
    while (jd_rebat.indexOf("[CQ:image") > -1) {
        var e = jd_rebat.indexOf("]")
        jd_rebat = jd_rebat.substr(e + 1, jd_rebat.length - e)
    }
    jd_rebat = jd_rebat.split("?")[0];
    console.log("返利商品信息：" + jd_rebat);
    var b = JSON.stringify({
        funName: "getSuperClickUrl",
        param: {
            materialInfo: jd_rebat
        },
        unionId: JFID
    });
    try {
        await api({
            url: `https://api.m.jd.com/api?functionId=ConvertSuperLink&appid=u&body=${b}&loginType=2`,
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                Cookie: jdcookie.Value
            },
            method: 'get',
        }).then(async response => {
            var body = JSON.parse(response.body);
            if (body.code === 200) {
                console.log(body.data.formatContext);
                if (QQGROUP) {
                    console.log("转链转发QQ群：" + QQGROUP);
                    for (var i = 0; i < QQGROUP.split("&").length; i++) {
                        await sendNotify(body.data.formatContext, false, "NULL", QQGROUP.split("&")[i], 1)
                    }
                } else {
                    console.log("未指定转发QQ群");
                }
                if (WXGROUP) {
                    console.log("转链转发微信群：" + WXGROUP);
                    for (var i = 0; i < WXGROUP.split("&").length; i++) {
                        await sendNotify(body.data.formatContext, false, "NULL", WXGROUP.split("&")[i], 4)
                    }
                } else {
                    console.log("未指定转发微信群");
                }
            } else {
                console.log(response.body);
            }
        });
    } catch (e) {
        console.log("请求京东接口异常");
        console.log(JSON.stringify(e));
    }

})();