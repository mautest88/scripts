require('./env.js');
const got = require('got');
let prefixUrl = process.env.serverAddres || 'http://localhost:5088';
const api = got.extend({
    prefixUrl: prefixUrl,
    retry: { limit: 0 },
});
const {
    sendNotify
} = require('./quantum');

let user_id = process.env.user_id; //用户id
!(async () => {
    if (!user_id) {
        return;
    }
    if (process.env.CommunicationType == "3") {
        await sendNotify("您当前是wxpusher 用户，无法使用绑定服务了。");
        return;
    }
    var data = await CreateQrcode();
    if (data.Code == 200) {
        await sendNotify("请在2分钟使用微信扫码，完成关注。[CQ:image,file=" + data.Data + ",type=show,id=40000,cache=0]");
    } else {
        await sendNotify(data.Message);
    }

})().catch((e) => {
    console.log(e);
});

async function CreateQrcode() {
    const body = await api({
        url: 'api/wxpusher/CreateQrcode/' + user_id,
        method: 'get',
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body;
};