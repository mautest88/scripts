/**
 * 
 * 量子订阅
 * 只支持无需指令参数 或者参数和指令同时发送给机器人的
 * 
 **/
const {
    sendNotify, uuid, addCustomData
} = require('./quantum');
// 开始订阅
let subscribe = process.env.subscribe;
// 订阅类型
let subscribe_type = process.env.subscribe_type;
// 触发时间
let subscribe_time = process.env.subscribe_time;
// 指令参数
let subscribe_params = process.env.subscribe_params;


!(async () => {

    var subscribes = [{
        Command: "查询"
    }, {
        Command: "天气",
        Param: true,
        ParamTip: '请回复您要订阅天气的城市：'
    }, {
        Command: "每日英语"
    }, {
        Command: "情话"
    }, {
        Command: "网易云热评"
    }, {
        Command: "清理购物车"
    }, {
        Command: "买家秀"
    }, {
        Command: "一言"
    }, {
        Command: "骚话"
    }, {
        Command: "活动领取"
    }, {
        Command: "月度查询"
    }, {
        Command: "舔狗日记"
    }]




    /**
     *
     * 订阅自定义数据
     * Type: subscribe
     * Data1: user_id
     * Data2: 触发指令
     * Data3: 订阅参数
     * Data4: 触发时间
     * 
     **/



})().catch((e) => {console.log("脚本异常：" + e);});
