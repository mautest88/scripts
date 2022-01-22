
///舔狗日记
require('./env.js');
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
        url: 'http://shengapi.cn/api/tgrj.php',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
        method: 'get',
    }).then(async response => {
        var body = response.body
        var message = "";
        for (var i = 0; i < body.split("\n").length; i++) {
            var t = body.split("\n")[i];
            if (t.length < len + 5) {
                message += t + "\n"
            } else {
                for (var x = 0; x < t.length / len; x++) {
                    message += t.substring(x * len, (x + 1) * len) + "\n";
                }
            }
        }
        await sendNotify(message)
        console.log(message)
    });
})();
