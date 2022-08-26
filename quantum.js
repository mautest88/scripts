
const got = require('got');

//------------- 量子助手系统环境变量部分 -------------
let serverAddres = process.env.serverAddres || 'http://localhost:5088'; //服务地址
let CommunicationType = process.env.CommunicationType; //通讯类型
let CommunicationId = process.env.CommunicationId; //通讯工具ID

let CommunicationUserId = process.env.CommunicationUserId; //用户通讯id，qq/wx
let CommunicationUserName = process.env.CommunicationUserName; //用户昵称


let TextToPicture = process.env.TextToPicture; // 是否文字转图片
let user_id = process.env.user_id; //用户id
let group_id = process.env.group_id; //群组ID
let ManagerQQ = process.env.ManagerQQ; //管理员QQ
let EnableConc = process.env.EnableConc == "True"; //是否开启并发
let IsSystem = process.env.IsSystem == "true"; //是否系统执行。

const api = got.extend({
    prefixUrl: serverAddres,
    retry: { limit: 0 },
});
console.log("脚本库更新时间：2022年6月10日");

/**
 * 
 * 获取所有的青龙面板
 * 
 * */
async function getQLPanels() {

    const body = await api({
        url: 'api/QLPanel',
        headers: {
            Accept: 'text/plain',
        },
    }).json();
    return body.Data;
}

/**
 * 获取青龙容器中的环境变量
 * @param {any} ql 青龙ID
 * @param {any} searchValue 搜索关键字
 */
async function getQLEnvs(ql, searchValue) {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        method: 'get',
        searchParams: {
            searchValue: searchValue,
            t: Date.now(),
        },
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body.Data.data;
}

/**
 * 删除青龙中的环境变量
 * @param {any} ql 青龙id
 * @param {any} ids 环境变量id 数组
 */
async function deleteQLEnvs(ql, ids) {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        method: 'delete',
        body: JSON.stringify(ids),
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body.Data.data;
}

/**
 * 添加青龙环境变量
 * @param {any} ql
 * @param {any} envs
 */
async function addQLEnvs(ql, envs) {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        method: 'delete',
        body: JSON.stringify(envs),
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body.Data.data;
}


// 获取青龙面板信息
module.exports.getQLPanels = getQLPanels;

module.exports.getCookies = async () => {
    var envs = await getEnvs("JD_COOKIE", "pt_key", 2, null);
    console.log(`用户id：${user_id}`);
    var cookies = [];
    var envCookies = [];
    if (process.env.JD_COOKIE) {
        envCookies = process.env.JD_COOKIE.split("&");
    }
    if (envCookies.length == 0) {
        console.log("系统未提供环境变量。");
        return [];
    }
    envs = envs.filter((n => envCookies.indexOf(n.Value) > -1));

    for (var i = 0; i < envs.length; i++) {
        var env = envs[i];
        var cookie = env.Value;
        if (!cookie.match(/pt_pin=(.+?);/) || !cookie.match(/pt_key=(.+?);/)) {
            console.log(cookie + "-----不规范，已跳过。");
            continue;
        }
        var pt_key = cookie.match(/pt_key=([^; ]+)(?=;?)/)[1]
        var pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
        var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
        if (reg.test(pt_pin)) {
            pt_pin = encodeURI(pt_pin);
            env.Value = `pt_key=${$.pt_key};pt_pin=${$.pt_pin};`
        }
        if (!env.Enable) {
            var m1 = `账号：${env.UserRemark || pt_pin}已经过期了，请重新获取提交吧！`;
            console.log(m1)
            await sendNotify(m1);
        } else {
            cookies.push(env)
        }
    }
    return cookies;
}

/**
 * 获取青龙容器中的环境变量
 * @param {any} qlPanel
 */
module.exports.getQLEnvs = getQLEnvs;


// 同步环境变量
module.exports.syncEnv = async () => {
    const body = await api({
        url: 'api/env/sync',
        method: "get",
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json"
        },
    }).json();
    return body.Data;
};

/**
 * 删除青龙环境变量
 * @param {any} ql
 * @param {any} ids
 */
module.exports.deleteQLEnvs = async (ql, ids) => {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        body: JSON.stringify(ids),
        method: 'delete',
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body.Data;
};

/**
 * 直接添加环境变量到青龙容器
 * @param {any} ql
 * @param {any} envs
 */

module.exports.addQLEnvs = async (ql, envs) => {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        body: JSON.stringify(envs),
        method: 'post'
    }).json();
    return body.Data;
};


/**
 * 添加环境变量（数组）
 * @param {any} env
 */
module.exports.addEnvs = async (env) => {
    const body = await api({
        url: 'api/env',
        method: 'post',
        body: JSON.stringify(env),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
};

/**
 * 禁用环境变量值，数组
 * @param {any} envs
 */
module.exports.disableEnvs = async (envs) => {
    if (envs && envs.length > 0) {
        const body = await api({
            url: 'api/env/DisableEnvs',
            method: 'put',
            body: JSON.stringify(envs),
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            },
        }).json();
        return body;
    }
}


/**
 * 获取环境变量信息，包含和青龙的关系数据
 * @param {any} key
 * @param {any} envType
 * @param {any} enable
 * @param {any} qlPanelId
 * @param {any} userId
 */
module.exports.allEnvs = async (key, envType, enable, qlPanelId, userId) => {
    const body = await api({
        url: 'api/env',
        method: 'get',
        searchParams: {
            key: key,
            envType: envType,
            enable: enable,
            qlPanelId: qlPanelId,
            UserId: userId,
            PageIndex: 1,
            PageSize: 999999999
        },
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data.Data;
};

async function getEnvs(name, key, envType, userId) {
    const body = await api({
        url: 'api/env/Query',
        method: 'get',
        searchParams: {
            key: key,
            name: name,
            envType: envType,
            userId: userId,
            t: Date.now(),
            PageIndex: 1,
            PageSize: 999999999
        },
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data;
};

/**
 * 获取自定义数据
 * @param {any} type 数据类型，必填
 * @param {any} startTime 数据创建时间 开始
 * @param {any} endTime 数据创建时间 截至
 * @param {any} dataQuery Data筛选字段
 */
async function getCustomData(type, startTime, endTime, dataQuery) {
    if (!type) {
        console.log("未指定type。");
        return;
    }
    if (!dataQuery) {
        dataQuery = {};
    }
    dataQuery.createTimeStart = startTime;
    dataQuery.createTimeEnd = endTime;
    const body = await api({
        url: 'api/CustomData/' + type,
        method: 'get',
        searchParams: dataQuery,
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data.Data;
};


async function deleteCustomData(ids) {
    const body = await api({
        url: `api/CustomData`,
        method: 'delete',
        body: JSON.stringify(ids),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}

async function updateCustomData(data) {
    const body = await api({
        url: `api/CustomData`,
        method: 'put',
        body: JSON.stringify(data),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}

/**
 * 添加自定义数据
 * @param {[{}]} data 数组
 */
async function addCustomData(data) {
    const body = await api({
        url: `api/CustomData`,
        method: 'post',
        body: JSON.stringify(data),
        headers: {
            Accept: '*/*',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data;
}


async function deleteEnvByIds(ids) {
    const body = await api({
        url: `api/env/deletes`,
        method: 'delete',
        body: JSON.stringify(ids),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}



/**
 * 发送通知消息
 * @param {*} content 发送消息内容 可以是 文本，
 * 或者 {msg:"",MessageType:1}  MessageType=1 即文本，2 为图片，如果是图片地址必须是完整的http 地址。 
 * 或者是[{msg:"",MessageType:1},{msg:"",MessageType:2}] 数组时，会根据通讯工具选择是否合并消息发送或者分开发送。 
 * @param {*} isManager 是否发送给管理员
 * @param {*} userId 指定发送给某人 （不@时传入字符串 NULL）
 * @param {*} groupId 发送到群 
 * @param {*} communicationType 
 * @returns 
 */
async function sendNotify(content, isManager, userId, groupId, communicationType) {
    var uuid = user_id;
    if (isManager && !ManagerQQ) {
        console.log(`消息内容：
${content}
指定发送给管理员，但似乎没有配置管理员QQ？`);
        return;
    }
    if (isManager) {
        uuid = ManagerQQ;
    }

    if (communicationType) {
        CommunicationType = communicationType;
    } else {
        CommunicationType = process.env.CommunicationType
    }
    if (groupId) {
        group_id = groupId;
    } else if (groupId == "NULL") {
        group_id = null;
    } else {
        group_id = process.env.group_id
    }
    if (serverAddres && uuid) {
        if (userId) {
            uuid = userId;
        } else if (userId == "NULL") {
            uuid = null
        }
        var body = {
            message: `${content}`,
            title: "小助手通知",
            CommunicationType: CommunicationType,
            CommunicationId: CommunicationId,
            TextToPicture: TextToPicture,
            user_id: uuid,
            group_id: isManager ? "" : group_id
        };

        var bodys = [];
        if (content instanceof Array) {
            if (CommunicationType == 1) {
                var msg = ""
                for (var i = 0; i < content.length; i++) {
                    if (content[i].MessageType == 1) {
                        msg += content[i].msg + "\r";
                    } else if (content[i].MessageType == 2) {
                        msg += `[CQ:image,file=${content[i].msg},type=show,id=40000,cache=0]` + "\r";
                    }
                }
                body.message = msg;
                body.MessageType = 1;
                bodys.push(body);
            }
            if (CommunicationType == 2) {
                for (var i = 0; i < content.length; i++) {
                    var b = JSON.parse(JSON.stringify(body));
                    b.message = content[i].msg;
                    b.MessageType = content[i].MessageType;
                }
            }
        } else if (Object.prototype.toString.call(content) === '[object Object]') {
            body.message = content.msg;
            body.MessageType = content.MessageType || 1
            bodys.push(body);
        } else {
            body.message = content;
            body.MessageType = 1;
            bodys.push(body);
        }

        for (var i = 0; i < bodys.length; i++) {
            var b = JSON.stringify(bodys[i]);
            const body = await api({
                url: `api/Notifiy`,
                method: 'post',
                body: b,
                headers: {
                    Accept: 'text/plain',
                    "Content-Type": "application/json-patch+json"
                },
            }).json();

            if (body.Data) {
                console.log('发送通知消息成功🎉！');
            }
            else {
                console.log(`发送通知消息异常\n${JSON.stringify(body)}`,);
            }
        }
    }
}

/**
 * 获取环境变量
 * @param {any} name 环境变量名称，全匹配 允许空
 * @param {any} key 环境变量值，模糊匹配 允许空
 * @param {any} envType 环境变量类型 允许空
 * @param {any} userId 用户id 允许空
 */
module.exports.getEnvs = getEnvs;

/**
 * 发送通知消息
 * @param {any} content 发送消息内容
 * @param {any} isManager 是否发送给管理员
 * @param {any} userId 指定接受消息的用户ID
 */
module.exports.sendNotify = sendNotify;

/**
 * 发送通知消息
 * @param {any} content 发送消息内容
 * @param {any} isManager 是否发送给管理员
 * @param {any} userId 指定接受消息的用户ID
 */
module.exports.sendNotify2 = sendNotify;

/**
 * 通过账号id集合删除环境变量
 * */
module.exports.deleteEnvByIds = deleteEnvByIds;

/**
 * 获取自定义数据
 * @param {any} type 数据类型(必填)
 * @param {any} startTime 开始时间
 * @param {any} endTime 结束时间
 */
module.exports.getCustomData = getCustomData;

/**
 * 删除自定义数据
 *
 * @param {any} ids 数据id 集合
 */
module.exports.deleteCustomData = deleteCustomData;


/**
 * 修改自定义数据
 * @param {any} data 
 */
module.exports.updateCustomData = updateCustomData;

/**
 * 添加自定义数据
 * @param {any} data 数组
 */
module.exports.addCustomData = addCustomData;


/**
 * 获取用户信息
 * */
module.exports.getUserInfo = async () => {
    const body = await api({
        url: 'api/User/' + user_id,
        method: 'get',
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data;
}

/**
 * 更新用户信息
 * @param {any} user
 */
module.exports.updateUserInfo = async (user) => {
    const body = await api({
        url: 'api/User',
        method: 'put',
        body: JSON.stringify(user),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}

/**
 * 查询所有的用户信息
 * */
module.exports.getUser = async () => {
    const body = await api({
        url: 'api/User',
        method: 'get',
        searchParams: {
            PageIndex: 1,
            PageSize: 999999999
        },
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data;
}


/**
 * 删除用户信息
 * @param {any} ids
 */
module.exports.deleteUser = async (ids) => {
    const body = await api({
        url: `api/User`,
        method: 'delete',
        body: JSON.stringify(ids),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}

/**
 * 获取自定义数据标题信息
 * @param {any} type
 */
module.exports.getCustomDataTitle = async (type) => {
    const body = await api({
        url: 'api/CustomDataTitle/' + type,
        method: 'get',
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data;
};

/**
 * 添加自定义数据标题
 * @param {any} data 集合
 */
module.exports.addOrUpdateCustomDataTitle = async (data) => {
    const body = await api({
        url: `api/CustomDataTitle`,
        method: 'post',
        body: JSON.stringify(data),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
};

/**
 * 线程等待
 * @param {any} ms 毫秒
 */
module.exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取一个随机字符串
 * @param {any} len 字符串长度
 * @param {any} radix 
 * @param {any} append 在随机字符串中追加自定义字符
 */
module.exports.uuid = function (len, radix, append) {
    var chars = ('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' + append).split('');
    var uuid = [],
        i;
    radix = radix || chars.length;
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    return uuid.join('');
};

/**
 * 设置群全员禁言
 * @param {any} groups 群号，多个用&隔开
 * @param {boolean} enable 是否禁言
 * @param {any} 通知消息
 */
module.exports.set_group_whole_ban = async (groups, enable, notify) => {
    const body = await api({
        url: `api/GroupManagement/set_group_whole_ban/${groups}/${enable}?notify=${notify}`,
        method: 'get',
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}

/**
 * 
 * 青龙相关封装接口
 * 
 * */
module.exports.qinglong = {

    /**
     * 查找所有青龙指定任务信息
     * @param {any} taskName 任务名称
     */
    getTask: async function (taskName) {
        const body = await api({
            url: `api/QLTask?Key=${taskName}&PageIndex=1&PageSize=999`,
            method: 'get',
            headers: {
                "Content-Type": "application/json-patch+json"
            },
        }).json();
        return body.Data;
    },
    /**
     * 运行青龙任务
     * @param {any} data 运行的任务信息，参数形式请参照方法内
     */
    runTask: async function (data) {
        const body = await api({
            url: `api/QLTask/run`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).json();
        return body.Data;
    },
    /**
     * 搜索青龙中的环境变量
     * @param {any} name
     */
    getEnvs: getQLEnvs,
    deleteEnvs: deleteQLEnvs,
    addEnvs: addQLEnvs
}