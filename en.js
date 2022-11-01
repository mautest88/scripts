// 每日英语

const got = require('got');
const api = got.extend({
    retry: { limit: 0 },
});
const {
    sendNotify
} = require('./quantum');


!(async () => {
    await api({
        url: 'https://api.vvhan.com/api/en',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
        method: 'get',
    }).then(async response => {
        var body = JSON.parse(response.body)
        var message = body.data.zh + "\n" + body.data.en;
        await sendNotify(message)
    });
})().catch((e) => {console.log("脚本异常：" + e);});
