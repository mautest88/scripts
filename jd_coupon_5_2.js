/**
 * 
 * 5-2优惠券
 * 环境变量：coupon_5_2_pin， 参与抢券的ck pt_pin，多个用 & 分割
 * 
 * */
const {
    getEnvs
} = require('./quantum');

const moment = require('moment');
const got = require('got');

var apiUrl = "https://api.m.jd.com/client.action?functionId=newBabelAwardCollection&client=wh5&body=%7B%22activityId%22%3A%223H885vA4sQj6ctYzzPVix4iiYN2P%22%2C%22scene%22%3A%221%22%2C%22args%22%3A%22key%3D64616D6FB9F745A939AEBE59B5331E98A02F7F3EBE7E2A8C6BC39900A5FB433C383A3885B1901C0036F186675FDB6B40_bingo%2CroleId%3D454CDE7D149EE1DA28FDC5C9AD4D3FF6_bingo%2CstrengthenKey%3D19F512DCD8EE34ABE9C4FB4A92C2F42AD9B1F4308CB2085C9DAE51ED67591679_bingo%22%7D";

const api = got.extend({
    retry: { limit: 0 },
});

let coupon_5_2_pin = process.env.coupon_5_2_pin;
!(async () => {
    console.log("当前时间：" + moment().format("YYYY-MM-DD HH:mm:ss.fff"));
    if (!coupon_5_2_pin) {
        console.log("未提供 coupon_5_2_pin 环境变量。");
        return;
    }
    var envs = await getEnvs("JD_COOKIE", null, 2);
    var coupon_5_2_pins = coupon_5_2_pin.split("&");
    for (var i = 0; i < coupon_5_2_pins.length; i++) {
        var pin = coupon_5_2_pins[i];
        var c = envs.filter((e) => e.Value.indexOf("pt_pin=" + pin) > -1)[0];
        if (c) {
            const nm = {
                url: apiUrl,
                headers: {
                    "Cookie": c.Value,
                },
                method: "get"
            }
            await api(nm).then(async response => {
                console.log(pin + "：" + JSON.parse(response.body).subCodeMsg);
            });
        } else {
            console.log(`未找到pt_pin为：${pin}的JD_COOKIE`);
        }
    }
})().catch((e) => {console.log("脚本异常：" + e);});
