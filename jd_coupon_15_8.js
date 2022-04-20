/**
 * 
 * 15-8优惠券
 * 环境变量：coupon_15_8_pin， 参与抢券的ck pt_pin，多个用 & 分割
 * 
 **/
const {
    getEnvs
} = require('./quantum');

const moment = require('moment');
const got = require('got');

var apiUrl = "https://api.m.jd.com/client.action?functionId=newBabelAwardCollection&client=wh5&body=%7B%22activityId%22%3A%223H885vA4sQj6ctYzzPVix4iiYN2P%22%2C%22scene%22%3A%221%22%2C%22args%22%3A%22key%3D79F6166D6F9BB11C9ED9696C6E30D9C1D392C277F9B79AB559E9868E1EE0910308189D1B2C9883FC5560EDA0CD002985_bingo%2CroleId%3DC6DCE94E14C0BEE454EA964509F4B26C_bingo%2CstrengthenKey%3D19F512DCD8EE34ABE9C4FB4A92C2F42A3E4F1D227F16BC3264497B20B54D33F5_bingo%22%7D";
const api = got.extend({
    retry: { limit: 0 },
});
let coupon_15_8_pin = process.env.coupon_15_8_pin;
!(async () => {
    console.log("当前时间：" + moment().format("YYYY-MM-DD HH:mm:ss.fff"));
    if (!coupon_15_8_pin) {
        console.log("未提供 coupon_15_8_pin 环境变量。");
        return;
    }
    var envs = await getEnvs("JD_COOKIE", null, 2);
    var coupon_15_8_pins = coupon_15_8_pin.split("&");
    for (var i = 0; i < coupon_15_8_pins.length; i++) {
        var pin = coupon_15_8_pins[i];
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
})();
