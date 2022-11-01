const got = require('got');
const {
    sendNotify
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    await api({
        url: 'https://api.linhun.vip/api/Littlesistervideo?type=json',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
        method: 'get',
    }).then(async response => {
        var body = JSON.parse(response.body);
        console.log(body.video)
        await sendNotify({ msg: body.video, MessageType: 3 })
    });
})().catch((e) => {console.log("脚本异常：" + e);});