require('./env.js');
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
