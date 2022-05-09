const got = require('got');
const api = got.extend({
    retry: { limit: 0 },
});
module.exports.ks_query = async (ck) => {
    console.log("快手CK：" + ck);
    return await api({
        url: 'https://nebula.kuaishou.com/rest/n/nebula/activity/earn/overview/basicInfo',
        headers: {
            Cookie: 'client_key=2ac2a76d;' + ck,
            "User-Agent": "Mozilla/5.0 (Linux; Android 11; M2012K10C Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.226 KsWebView/1.8.90.404 (rel;r) Mobile Safari/537.36 Yoda/2.7.3-rc7 StatusHT/30 CV/null ksNebula/10.1.10.2811 OS_PRO_BIT/64 MAX_PHY_MEM/7544 AZPREFIX/zw ICFO/0 TitleHT/50 NetType/WIFI ISLP/0 ISDM/0 ISLB/0 ISLD/0 locale/zh-cn evaSupported/false CT/0",
        },
        method: 'get',
    }).json();
}