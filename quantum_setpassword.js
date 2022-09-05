/**
 * 
 * 重设Web登录密码
 * 
 * */

const got = require('got');
const {
    sendNotify
} = require('./quantum');

const api = got.extend({
    prefixUrl: process.env.serverAddres,
    retry: { limit: 0 },
});

let user_id = process.env.user_id;
let password = process.env.password

!(async () => {
    if (!password) {
        await sendNotify("请回复您要设置的密码，长度8至16个字符：");
        return;
    }
    var body = await api({
        url: 'api/User/setPassword',
        method: 'post',
        body: JSON.stringify({
            UserId: user_id,
            Password: password
        }),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    console.log(body);
    if (!body.Data) {
        await sendNotify("设置密码出错了，请联系管理员吧！");
    } else {
        await sendNotify("密码设置成功！");
    }
})().catch((e) => {
    console.log("设置Web登录密码出现异常：");
    console.log(e)
})
