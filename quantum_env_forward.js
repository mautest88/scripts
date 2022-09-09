/**
 * 消息转发 
 * 
 * */
const {
    sendNotify
} = require('./quantum');

!(async () => {
    await sendNotify(process.env.command, false, null, "QQ群号", 1);
})();