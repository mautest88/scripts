//更新太太乐token 
const got = require('got');
const {
    addEnvs, sendNotify, allEnvs
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    var t = await allEnvs("ttlhd", 3, true);
    if (t.length > 0) {
        for (var i = 0; i < t.length; i++) {
            var r = JSON.parse(t[i].UserRemark)
            const body = await api({
                url: 'https://www.ttljf.com/ttl_site/user.do',
                method: 'post',
                body: `username=${r.mobile}&password=${r.password}&device_brand=apple&device_model=iPhone11,8&device_uuid=&device_version=13.5&mthd=login&platform=ios&sign=`,
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
            if (body.code == '0000') {
                console.log(`更新-------${r.mobile}-------成功`);
                console.log(body.user.loginToken);
                t[i].Value = body.user.loginToken;
            } else {
                sendNotify(`太太乐账号${r.mobile}登录失败！`);
            }
        }
        console.log("更新环境变量到量子");
        await addEnvs(t);
    }
})();
