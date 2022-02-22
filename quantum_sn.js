// 生成卡密

const {
    sendNotify, uuid, addCustomData
} = require('./quantum');


//一个序列号多少个积分
let sn_score = process.env.sn_score;

//一次生成多少个序列号
let sn_count = process.env.sn_count;


!(async () => {
    /**
     *
     * 自定义数据 type: quantum_sn
     * Data1 序列号
     * Data2 积分
     * Data3 是否使用
     *
     **/
    if (sn_score && sn_count) {
        if (sn_count * 1 < 1) {
            await sendNotify("卡密积分必须大于0")
            return;
        }
        var sns = [];
        for (var i = 0; i < sn_count; i++) {
            var sss = "QTSN" + uuid(22, 16)
            sns.push({
                Type: "quantum_sn",
                Data1: sss,
                Data2: sn_score,
                Data3: "0"
            });
            console.log(sss);
        }
        result = await addCustomData(sns);
        if (result.Code == 200) {
            var tt = `[CQ:face,id=66]创建${sn_count}个卡密，每个${sn_score}积分`;
            for (var i = 0; i < result.Data.length; i++) {
                tt += "\n" + result.Data[i].Data1;
                if (i % 30 == 0) {
                    await sendNotify(tt);
                    tt = "";
                }
            }
            await sendNotify(tt);
        } else {
            await sendNotify("创建卡密失败：" + result.Message);
        }
    } else if (sn_count) {
        if (sn_count * 1 < 1) {
            await sendNotify("卡密个数必须大于0")
            return;
        }
        await sendNotify("请回复每个卡密多少积分：")
    } else {
        await sendNotify("请回复生成卡密个数：")
    }
})();
