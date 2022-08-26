/*
 * 微信，QQ，公众号，web 相互绑定操作。
 * 如使用用户使用微信给微信机器人发送“绑定”，机器人回复一串绑定码。
 * 用户再使用QQ 将绑定发送给微信机器人，则这个QQ 和 微信的数据合并，并绑定为一个账号
 */
const got = require('got');
const {
    sendNotify
} = require('./quantum');

var user_id = process.env.user_id;

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    try {
        var options = {
            url: process.env.serverAddres+"/api/User/GetBindingCode/" + user_id,
            method: 'get',
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            }
        };
        const body = await api(options).json();
        if (body.Code == 200) {
            await sendNotify("[CQ:face,id=66]请使用其他通讯工具将以下发送代码给机器人\n"+ body.Data);
        } else {
            await sendNotify("[CQ:face,id=67]" + JSON.stringify(body));
        }
    }
    catch (e) {
        console.log(JSON.stringify(e))
    }
})();
