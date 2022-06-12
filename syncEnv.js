const {
    addEnvs, sendNotify, allEnvs, getQLPanels, getQLEnvs, syncEnv
} = require('./quantum');
const {
    syncEnvs
} = require('./quantum_syncEnv');

let notifyMessage = "";
let isSystem = process.env.IsSystem == "true";

!(async () => {
    if (!isSystem) {
        await sendNotify("开始同步环境变量了，可能要点时间，骚等一下。", true)
    }
    await syncEnvs(!isSystem);
   
})()