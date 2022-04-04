// enen

const {
    getEnvs
} = require('./quantum');

const got = require('got');


const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    var jdCookies = await getEnvs("JD_COOKIE", null, 2);
    for (var i = 0; i < jdCookies.length; i++) {
        const nm = {
            url: `https://api.m.jd.com?functionId=helpCoinDozer&appid=station-soa-h5&client=H5&clientVersion=1.0.0&t=1636015855103&body={"actId":"49f40d2f40b3470e8d6c39aa4866c7ff","channel":"coin_dozer","antiToken":"","referer":"-1","frontendInitStatus":"s","packetId":"${packetId}"}&_ste=1&_stk=appid,body,client,clientVersion,functionId,t&h5st=20211104165055104;9806356985655163;10005;tk01wd1ed1d5f30nBDriGzaeVZZ9vuiX+cBzRLExSEzpfTriRD0nxU6BbRIOcSQvnfh74uInjSeb6i+VHpnHrBJdVwzs;017f330f7a84896d31a8d6017a1504dc16be8001273aaea9a04a8d04aad033d9`,
            headers: {
                "Cookie": cookie,
                "Origin": "https://pushgold.jd.com",
            },
            method: "get"
        }
        api(nm).then(async response => { });
    }
})();
