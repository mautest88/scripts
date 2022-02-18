// 骚话

const got = require('got');
const {
    sendNotify
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

let city = process.env.weather;
if (city && city.split(" ").length == 2) {
    !(async () => {
        var len = 20;
        await api({
            url: 'https://api.vvhan.com/api/weather?city=' + city.split(" ")[1],
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            },
            method: 'get',
        }).then(async response => {
            console.log(response.body)
            var body = JSON.parse(response.body)

            if (body.success) {
                var message = `${body.info.date}
${city.split(" ")[1]} ${body.info.type}
${body.info.high} ${body.info.low}
${body.info.fengxiang} ${body.info.fengli}
${body.info.tip}`
                await sendNotify(message)
                console.log(message)
            } else {
                sendNotify(city.split(" ")[1] + " 天气查询失败。")
            }
        });
    })();
} else {
    sendNotify("天气查询指令：天气 北京。")
}