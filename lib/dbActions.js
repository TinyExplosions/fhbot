var $fh = require('fh-mbaas-api');


function findUser(userKey, cb) {
    console.log("finduser");
    var options = {
        "act": "list",
        "type": process.env.USER_DB,
        "eq": {
            "userID": userKey
        }
    };
    $fh.db(options, function(err, data) {
        if (err) {
            return cb(null);
        } else {
            if (data.count === 0) {
                return cb(null);
            } else {
                var user = data.list[0].fields;
                return cb({
                    guid: data.list[0].guid,
                    user: user
                });
            }
        }
    });
}

function deleteUser(guid, cb) {
    var options = {
        "act": "delete",
        "type": process.env.USER_DB,
        "guid": guid
    };
    $fh.db(options, function(err, data) {
        if (err) {
            return cb(null);
        } else {
            if (data.count === 0) {
                return cb(null);
            } else {
                var user = data.fields;
                return cb({
                    guid: data.guid,
                    user: user
                });
            }
        }
    });
}



module.exports = {
    findUser: findUser,
    deleteUser: deleteUser
};