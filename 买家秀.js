// 一言

const got = require('got'); // http 请求封装库。

const {
    sendNotify
} = require('./quantum'); // 引用quantum.js 已经封装的方法。需要用到哪些引用即可。

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    // --------------------逻辑代码开始--------------------

    await api({
        url: 'https://api.vvhan.com/api/tao?type=json', // 请求接口地址。
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
        method: 'get',  // 通常有get，post，put，delete 请求。
    }).then(async response => {
        //  请求接口后数据处理部分，
        console.log(response.body);
        // 将body 转换成 JSON 对象
        var t = JSON.parse(response.body);

        if (t) {
            await sendNotify([{ msg: t.title, MessageType: 1 }, { msg: t.pic, MessageType: 2 }])
        }
    });
    // --------------------逻辑代码结束--------------------
})();