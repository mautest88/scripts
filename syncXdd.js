var fs = require('fs');
var SqliteDB = require('./sqlite.js').SqliteDB;

const {
    addEnvs
} = require('./quantum');


var file = process.env.XDD_DB || '../../db/xdd.db';
if (!file) {
    console.log("没有配置 XDD_DB 环境变量.");
    return;
}

(async () => {
    try {
        var res = await isFileExisted();
        console.log(res);
        var sqliteDB = new SqliteDB(file);
        var querySql = `select PtKey,PtPin,QQ,Priority,Nickname from jd_cookies WHERE PtKey<>'' and Available='true'`;
        sqliteDB.queryData(querySql, dataDeal);
        sqliteDB.close();
    } catch (error) {
        console.log(error);
    }
})();


function isFileExisted() {
    return new Promise(function (resolve, reject) {
        fs.access(file, (err) => {
            if (err) {
                console.log(`访问${file}文件失败,文件不存在.`);
                reject(err.message);
            } else {
                resolve('existed');
            }
        })
    })
}

async function dataDeal(objects) {

    console.log("从xdd数据库中获取有效CK共" + objects.length + "条.");
    var envs = [];
    for (var i = 0; i < objects.length; ++i) {

        var ck = objects[i];
        var c = `pt_pin=${ck.PtPin};pt_key=${ck.PtKey};`
        console.log(c);
        envs.push({
            Name: "JD_COOKIE",
            Enable: true,
            Value: c,
            Remark: ck.Remark,
            UserRemark: ck.nickname,
            Weight: ck.Priority,
            UserId: ck.QQ,
            EnvType: 2
        })
    }
    console.log("开始同步到量子环境变量");
    var data = await addEnvs(envs);
    if (data.Code != 200) {
        console.log("同步CK异常")
        return;
    }
    console.log("XDD数据库同步完成拉!");
}