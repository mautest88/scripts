require('./env.js');
const got = require('got');
const {
    sendNotify
} = require('./quantum');

var user_id = process.env.user_id;
var ark = process.env.ark;

const api = got.extend({
    retry: { limit: 0 },
});

!(async () => {
    console.log(ark)
    if (ark.split(" ").length != 2) {
        return;
    }
    try {
        var options = {
            url: 'http://localhost:7777/api/ark?id=' + ark.split(" ")[1] + "&user_id=" + user_id,
            method: 'get',
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            },
        };
        console.log(options)
        const body = await api(options).json();

        console.log(body)
        await sendNotify(body.message);
    }
    catch (e) {
        console.log(JSON.stringify(e))
    }
})();