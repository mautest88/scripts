/**
 * 
 * qBittorrent 添加 磁力任务脚本
 * 
 * 未实现通过账号密码登录，请关闭身份认证或添加白名单。
 * 
 * 请通过设置>Web UI>勾选     对本地主机上的客户端跳过身份验证   和   对 IP 子网白名单中的客户端跳过身份验证 ， 填入量子的IP 地址。
 * 如果不这样，你需要添加qb账号密码环境变量，以便机器人自动登录授权。
 * 
 * qbusername (账号)
 * qbpassword (密码)
 * 
 * 
 * 必要环境变量 qBittorrentURL  如 http://192.168.10.91:8080
 * 
 * 
 * 
 * */

const got = require('got');
var FormData = require('form-data');
const {
    sendNotify
} = require('./quantum');

const {
    qblogin
} = require('./qBittorrentBase');

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    var qBittorrentURL = process.env.qBittorrentURL
    if (!qBittorrentURL) {
        await sendNotify("未设置qBittorrent服务地址，请添加量子变量 ：qBittorrentURL。")
        return;
    }
    if (qBittorrentURL.startsWith("http") == -1) {
        qBittorrentURL = "http://" + qBittorrentURL;
    }
    qBittorrentURL = qBittorrentURL.trimEnd("/");


    var cookie = await qblogin(qBittorrentURL);
    if (cookie) {
        console.log("认证返回cookie：" + cookie)
    }

    var data = new FormData();
    data.append('urls', process.env.command);
    data.append('autoTMM', 'true');
    data.append('paused', 'false');
    data.append('contentLayout', 'Original');
    console.log("磁力信息：" + process.env.command);
    var config = {
        method: 'post',
        url: qBittorrentURL + '/api/v2/torrents/add',
        headers: {
            Cookie: cookie
        },
        body: data
    };
    await api(config).then(async response => {
        console.log(response.body);
        await sendNotify("磁力任务添加结果：" + response.body)
    }).catch(async function (error) {
        await sendNotify(`添加磁力任务失败了：
${error.name}
${error.code}`)
        console.log(error)
    });
})().catch((e) => {console.log("脚本异常：" + e);});