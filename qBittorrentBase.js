const got = require('got');
var FormData = require('form-data');

const api = got.extend({
    retry: { limit: 0 },
});


module.exports.qblogin = async (qBittorrentURL) => {
    qBittorrentURL = qBittorrentURL.trimEnd("/");
    var data = new FormData();
    if (!process.env.qbusername || !process.env.qbpassword) {
        console.log("未配置qb 账号密码，跳过登录，可能出现请求拒绝访问（403）")
        return;
    }
    data.append('username', process.env.qbusername);
    data.append('password', process.env.qbpassword);
    var config = {
        method: 'post',
        url: qBittorrentURL + '/api/v2/auth/login',
        body: data
    };
    var cookie = "";
    await api(config).then(async response => {
        cookie = response.headers["set-cookie"][0];
        var SID = cookie.match(/SID=([^; ]+)(?=;?)/)[1]
        cookie = `SID=${SID}`;
        console.log("认证授权Cookie：" + cookie)
    }).catch(async function (error) {
        console.log("qb登录认证出现异常")
        console.log(error)
    });
    return cookie;
}