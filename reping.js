// 骚话

const got = require('got');
const {
    sendNotify
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    var len = 20;
    await api({
        url: 'https://api.vvhan.com/api/reping',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
        method: 'get',
    }).then(async response => {
        var body = JSON.parse(response.body)
        console.log(body);
        var message = `${body.data.content} --- ${body.data.auther}
[CQ:image,file=${body.data.picUrl.replace("\\", "")},type=show,id=40004]`
        console.log(message)
        await sendNotify(message)
    });
})();
