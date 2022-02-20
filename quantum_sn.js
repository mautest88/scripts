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
        var sns = [];
        for (var i = 0; i < sn_count; i++) {
            sns.push({
                Type: "quantum_sn",
                Data1: "QTSN" + uuid(22, 16),
                Data2: sn_score,
                Data3: "0"
            });
        }
        result = await addCustomData(sns);
        if (result.Code == 200) {
            var tt = `创建${sn_count}个卡密，每个${sn_score}积分`;
            for (var i = 0; i < result.Data.length; i++) {
                tt += "\n" + result.Data[i].Data1;
            }
            await sendNotify(tt);


        } else {
            await sendNotify("创建卡密失败：" + result.Message);
        }
    } else if (sn_count) {
        await sendNotify("请回复每个卡密多少积分：")
    } else {
        await sendNotify("请回复生成卡密个数：")
    }
})();
