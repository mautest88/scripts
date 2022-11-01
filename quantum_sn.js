// 生成卡密

const {
    sendNotify, uuid, addCustomData, addOrUpdateCustomDataTitle
} = require('./quantum');


//一个序列号多少个积分
let sn_score = process.env.sn_score;

//一次生成多少个序列号
let sn_count = process.env.sn_count;

var custom_data_type = "quantum_sn"

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
        var nnn = uuid(12);
        for (var i = 0; i < sn_count; i++) {
            var sss = "QTSN" + uuid(22, 16)
            sns.push({
                Type: custom_data_type,
                Data1: sss,
                Data2: sn_score,
                Data3: "否",
                Data6: nnn
            });
            console.log(sss);
        }

        //await addOrUpdateCustomDataTitle({
        //    Type: custom_data_type,
        //    TypeName: "积分卡密",
        //    Title1: "卡密",
        //    Title2: "积分",
        //    Title3: "是否使用",
        //    Title4: "QQ/微信",
        //    Title5: "昵称",
        //    Title6: "批次号",
        //})
        result = await addCustomData(sns);
        var tt = `[CQ:face,id=66]创建${sn_count}个卡密，每个${sn_score}积分\n卡密批次：` + nnn;
        for (var i = 0; i < result.length; i++) {
            tt += "\n" + result[i].Data1;
            if (i + 1 % 30 == 0) {
                await sendNotify(tt);
                tt = "";
            }
        }
        await sendNotify(tt);
    } else if (sn_count) {
        if (sn_count * 1 < 1) {
            await sendNotify("卡密个数必须大于0")
            return;
        }
        await sendNotify("请回复每个卡密多少积分：")
    } else {
        await sendNotify("请回复生成卡密个数：")
    }
})().catch((e) => {console.log("脚本异常：" + e);});
