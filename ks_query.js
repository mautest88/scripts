/**
 * 该脚本作者来源量子用户：灰色头像@，QQ：97393412
 * 快手极速版 金币，现金查询
 * 用户变量：KSJSB
 * 值是:CK
 * 
 * */
const got = require('got');
const {
    sendNotify, getEnvs
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

let user_id = process.env.user_id; //用户id

!(async () => {
    console.log("user_id:" + user_id);
    var cks = await getEnvs("KSJSB", "kuaishou.api_st", 2, user_id)
    if (cks.length == 0) {
        console.log("没有绑定过快手信息结束任务。");
        return;
    }
    await sendNotify(`您一共绑定了${cks.length}个快手极速版`);
    for (var i = 0; i < cks.length; i++) {
        var ck = cks[i];
        var name = ck.UserRemark || ck.Value.match(/kuaishou.api_st=([^; ]+)(?=;?)/)[0];
        console.log(name);
        await api({
            url: 'https://nebula.kuaishou.com/rest/n/nebula/activity/earn/overview/basicInfo',
            headers: {
                Cookie: 'client_key=2ac2a76d;' + name,
                "User-Agent": "jdapp;iPhone;10.0.2;14.1;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            },
            method: 'get',
        }).then(async response => {
            var body = JSON.parse(response.body)
            await sendNotify("金币：" + body.data.totalCoin + "\n" + "现金：" + body.data.totalCash + "\n" + "用户昵称：" + body.data.userData.nickname)
        });
    }
})();