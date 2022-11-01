/**
 * 
 * 用户提交快手CK
 * ADD_KSCOOKIE_USE_SCORE 添加快手CK需要多少积分。（设置为0 或者 不设置时则表示不需要积分。）
 * 
 * */

//用户提交新CK是否通知管理员，默认通知，如果不想通知，添加量子环境变量：ADD_COOKIE_NOTIFY 值 false
let ADD_COOKIE_NOTIFY = true;
if (process.env.ADD_COOKIE_NOTIFY) {
	ADD_COOKIE_NOTIFY = process.env.ADD_COOKIE_NOTIFY == 'true';
}

//用户更新CK是否通知管理员 量子环境变量：UPDATE_COOKIE_NOTIFY:true
let UPDATE_COOKIE_NOTIFY = true;
if (process.env.UPDATE_COOKIE_NOTIFY) {
	UPDATE_COOKIE_NOTIFY = process.env.UPDATE_COOKIE_NOTIFY == 'true';
}

let ADD_KSCOOKIE_USE_SCORE = (process.env.ADD_KSCOOKIE_USE_SCORE || 0) * 1;
const { sendNotify, allEnvs, addEnvs, getUserInfo, updateUserInfo } = require('./quantum');

const { ks_query } = require('./ks_base');

let user_id = process.env.user_id; //用户id
let command = process.env.command;

!(async () => {
	var user = (await getUserInfo()) || {};
	command = command + ';';
	var v = command.match(/kuaishou.api_st=([^; ]+)(?=;?)/)[1] + ';@';
	console.log(v);
	var data2 = await allEnvs(v, 2);
	if (data2.length > 0) {
		await sendNotify('提交失败，重复的CK！');
		return;
	}
	command = `kuaishou.api_st=${v}`;
	console.log('开始查询快手CK信息');
	var body = await ks_query(command);
	console.log('CK查询返回结果：' + JSON.stringify(body));
	if (body.result == 1 && body.data.userData) {
		var c = {
			Name: 'ksjsbCookie',
			Enable: true,
			Value: command,
			UserRemark: body.data.userData.nickname,
			UserId: user_id,
			EnvType: 2
		};
		user.MaxEnvCount -= ADD_KSCOOKIE_USE_SCORE;
		if (ADD_KSCOOKIE_USE_SCORE > 0 && user.MaxEnvCount < 0) {
			await sendNotify(`该操作需要${ADD_KSCOOKIE_USE_SCORE}积分
您当前积分剩余${user.MaxEnvCount + ADD_KSCOOKIE_USE_SCORE}`);
			return;
		}
		if (ADD_KSCOOKIE_USE_SCORE > 0) {
			await updateUserInfo(user);
		}
		console.log('开始提交快手CK到量子数据库');
		var data = await addEnvs([c]);
		console.log('提交结果：' + JSON.stringify(data));
		await sendNotify(
			'提交成功！\n扣除积分：' +
			ADD_KSCOOKIE_USE_SCORE +
			'\n剩余积分：' +
			user.MaxEnvCount +
			'\n' +
			'金币：' +
			body.data.totalCoin +
			'\n' +
			'现金：' +
			body.data.totalCash +
			'\n' +
			'昵称：' +
			body.data.userData.nickname
		);
	} else {
		await sendNotify('提交失败！');
	}
})().catch((e) => {console.log("脚本异常：" + e);});
