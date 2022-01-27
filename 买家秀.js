// 一言

require('./env.js');
const got = require('got');
const {
    sendNotify
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    await api({
        url: 'https://api.vvhan.com/api/tao?type=json',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
        method: 'get',
    }).then(async response => {
        console.log(response.body);
        var t = JSON.parse(response.body);
        if (t) {
           await sendNotify(`${t.title || "用户没有评价"}
[CQ:image,file=${t.pic},type=show,id=40004]`)
        }
    });
})();
