/**
 * 
 * 初始化自定义数据标题
 * 该标题用于展示数据管理
 * Type 不能重复，不能为空。
 * 自定义数据共计15个自定义数据字段标题 为 Title1..Title15，数据字段 Data1 ...  Data15
 * 
 * */
const {
    addOrUpdateCustomDataTitle, sendNotify
} = require('./quantum');

!(async () => {
    var quantum_bill = {
        Type: "quantum_bill",
        TypeName: "记账本",
        Title1: "事项",
        Title2: "金额",
        Title3: "QQ/微信",
        Title4: "昵称",
        Title5: "类型"
    };
    await addOrUpdateCustomDataTitle(quantum_bill)
    console.log("初始化量子记账本基础信息。");

    await addOrUpdateCustomDataTitle({
        Type: "quantum_sn",
        TypeName: "积分卡密",
        Title1: "卡密",
        Title2: "积分",
        Title3: "是否使用",
        Title4: "QQ/微信",
        Title5: "昵称",
        Title6: "批次号",
    })
    console.log("初始化量子积分卡密基础信息。");
    await addOrUpdateCustomDataTitle({
        Type: "quantum_password",
        TypeName: "随机密码",
        Title1: "说明",
        Title2: "密码",
        Title3: "备注",
        Title4: "QQ/WX",
        Title5: "昵称"
    })
    console.log("初始化量子随机密码基础信息。");

    await addOrUpdateCustomDataTitle({
        Type: "quantum_env_monitor_execution_tasks",
        TypeName: "环境变量任务触发",
        Title1: "任务名称",
        Title2: "青龙脚本名",
        Title3: "变量名（多个&隔开）",
        Title4: "状态（启用/禁用）",
        Title5: "备注"
    })
    console.log("初始化量子环境变量监听任务执行基础信息。");



    await sendNotify("初始化量子自定义数据标题标题信息完成\r该通知来源脚本：quantum_custom_data_title_init.js")
})();
