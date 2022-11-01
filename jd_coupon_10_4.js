/**
 * 
 * 10-4优惠券
 * 环境变量：coupon_10_4_pin， 参与抢券的ck pt_pin，多个用 & 分割
 * 
 * */
const {
    getEnvs
} = require('./quantum');

const moment = require('moment');
const got = require('got');

var apiUrl = "https://api.m.jd.com/client.action?functionId=newBabelAwardCollection&client=wh5&body=%7B%22activityId%22%3A%22vN4YuYXS1mPse7yeVPRq4TNvCMR%22%2C%22scene%22%3A%221%22%2C%22args%22%3A%22key%3D440A3074D8054F656466EE989DEF40E4DE6342B45A4AB5D48889C7B31DD4E52ED6EB7F5C0174376325C72F3C5D85C6AA_bingo%2CroleId%3DB1781EF2C2537FB0E4A5B23AC99529A4_bingo%2CstrengthenKey%3D19F512DCD8EE34ABE9C4FB4A92C2F42AA1447D26BB4D8F8F1ADD929FC07559FC_bingo%22%7D";

const api = got.extend({
    retry: { limit: 0 },
});
let coupon_10_4_pin = process.env.coupon_10_4_pin;
!(async () => {
    console.log("当前时间：" + moment().format("YYYY-MM-DD HH:mm:ss.fff"));
    if (!coupon_10_4_pin) {
        console.log("未提供 coupon_10_4_pin 环境变量。");
        return;
    }
    var envs = await getEnvs("JD_COOKIE", null, 2);
    var coupon_10_4_pins = coupon_10_4_pin.split("&");
    for (var i = 0; i < coupon_10_4_pins.length; i++) {
        var pin = coupon_10_4_pins[i];
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