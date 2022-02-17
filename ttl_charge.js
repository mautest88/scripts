
//太太乐自动兑换
const got = require('got');
const {
    allEnvs
} = require('./quantum');

//https://www.ttljf.com/ttl_site/chargeApi.do?giftId=话费id&method=charge&mobile=手机号&userId=ID变量&loginToken=token

//联通2 61 联通 5 62 电信10 633 移动 30  631
const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {

    var ids = [{
        Key: "移动30",
        Id: 631,
    }, {
        Key: "电信10",
        Id: 633,
    }, {
        Key: "联通5",
        Id: 62,
    }, {
        Key: "联通2",
        Id: 61,
    }]

    var t = await allEnvs("ttlhd", 3, true);
    if (t.length > 0) {
        for (var c = 0; c < 5; c++) {
            console.log(`开始第${c + 1}次兑换`);
            for (var x = 0; x < t.length; x++) {
                var r = JSON.parse(t[x].UserRemark)
                for (var i = 0; i < ids.length; i++) {
                    const body = await api({
                        url: `https://www.ttljf.com/ttl_site/chargeApi.do?giftId=${ids[i].Id}&method=charge&mobile=${r.mobile}&userId=${r.userId}&loginToken=${t[x].Value}`,
                        method: 'get',
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Connection": "keep-alive",
                            "Accept": "*/*",
                            "Accept-Language": "en-CN;q=1, zh-Hans-CN;q=0.9",
                            "Accept-Encoding": "gzip, deflate",
                            "User-Agent": "otole/1.4.8 (iPhone; iOS 13.5; Scale/2.00)",
                            "Host": "www.ttljf.com"
                        },
                    }).json();
                    console.log(`手机号：${r.mobile}，${ids[i].Key}兑换结果：${body.message}`)
                }
            }
        }
    }
})();
