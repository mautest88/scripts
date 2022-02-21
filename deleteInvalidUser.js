/**
 * 
 * 删除所有无效用户信息 (无用户环境变量的用户)
 * 
 * */

const {
    sendNotify, getUser, getEnvs, deleteUser
} = require('./quantum');

!(async () => {

    console.log("获取所有用户信息");
    var users = await getUser();
    users = users.Data;
    console.log(`获取用户数量${users.length}个。`);

    console.log("获取所有用户环境变量");
    var envs = await getEnvs("", "", 2);
    console.log(`获取用户数量${envs.length}个。`);

    for (var i = 0; i < envs.length; i++) {
        users = users.filter((y) => y.Id != envs[i].UserId);
    }
    console.log(`待清理用户数量${users.length}个。`);

    var ids = [];
    for (var u = 0; u < users.length; u++) {
        ids.push(users[u].Id);
    }  
    if (ids.length > 0) {
        var t = await deleteUser(ids);
        await sendNotify("清理过期用户" + ids.length + "个");
    } else {
        await sendNotify("没有可清理的用户。")
    }
})();
