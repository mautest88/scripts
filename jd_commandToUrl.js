/**
 * 
 * 口令转换链接
 * 
 **/
const got = require('got');
const {
    sendNotify
} = require('./quantum');
let jd_command = process.env.jd_command;
const api = got.extend({
    retry: { limit: 0 },
});
!(async () => {
    try {
        var nm = {
            url: 'https://api.jds.codes/jd/jCommand',
            method: 'POST',
            dataType: 'json',
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ code: jd_command })
        }
        await api(nm).then(async response => {
            var body = JSON.parse(response.body);
            if (body.code == 200) {
                await sendNotify(body.data.jumpUrl)
            } else {
                await sendNotify("转链失败了！");
            }
        });
    }
    catch (e) {
        console.log("请求错误！", JSON.stringify(e));
    }
})();
