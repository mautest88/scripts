var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var DB = DB || {};

DB.SqliteDB = function (file) {
    DB.db = new sqlite3.Database(file);

    DB.exist = fs.existsSync(file);
    if (!DB.exist) {
        console.log(file + "文件不存在!");
        fs.openSync(file, 'w');
    };
};

DB.printErrorInfo = function (err) {
    console.log("Error Message:" + err.message + " ErrorNumber:" + errno);
};

DB.SqliteDB.prototype.queryData = function (sql, callback) {
    DB.db.all(sql, function (err, rows) {
        if (null != err) {
            DB.printErrorInfo(err);
            return;
        }
        if (callback) {
            callback(rows);
        }
    });
};

DB.SqliteDB.prototype.close = function () {
    DB.db.close();
};

exports.SqliteDB = DB.SqliteDB;