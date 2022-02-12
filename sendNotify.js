
const {
    sendNotify2
} = require('./quantum');

async function sendNotify(
    text,
    desp,
    params = {},
) {
    await sendNotify2(desp);
}



module.exports = {
    sendNotify
};