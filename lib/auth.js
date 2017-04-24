var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var request = require('request');
var $fh = require('fh-mbaas-api');
var jwt = require('jsonwebtoken');
var USER_DB = "studioUsers";

function authRoute() {
    var app = express();
    app.use(cors());
    app.use(bodyParser());

    app.set('views', __base + '/public');

    app.get('/', function authRoute(req, res) {
        var host = req.get('host');
        if (req.query && req.query.code) {
            var url = "https://slack.com/api/oauth.access";
            var form = {
                client_id: process.env.fhbot_client_id,
                client_secret: process.env.fhbot_client_secret,
                code: req.query.code,
                redirect_uri: "https://" + host + "/auth"
            }

            request.post({ url: url, form: form }, function(err, httpResponse, body) {
                console.log(httpResponse.statusCode, body);
                if (httpResponse.statusCode === 200) {
                    var slackResponse = JSON.parse(body);
                    if (!slackResponse.ok) {
                        return res.render('index.jade', {});
                        return res.send(body);
                    }
                    var options = {
                        "act": "save",
                        "key": slackResponse.team_id,
                        "value": body
                    };
                    $fh.cache(options, function(err, cacheRes) {
                        if (err) return console.error(err.toString());

                        // cacheRes is the original cached object
                        console.log(cacheRes.toString());
                        // res.send(body);
                        return res.render('index.jade', { installed: true });
                    });

                } else {
                    //something weird has gone on!
                    return res.render('index.jade', {});
                }

            });

        } else {
            return res.render('index.jade', {});
        }
    });

    app.get('/cache', function cacheRoute(req, res) {
        var options = {
            "act": "load",
            "key": "SLACKBOT"
        };
        $fh.cache(options, function(err, cacheRes) {
            if (err) return console.error(err.toString());

            // cacheRes is the original cached object
            console.log(cacheRes.toString());
            res.send(cacheRes);
        });
    });

    app.post('/login', function studioLogin(req, res) {
        var params = req.body;
        console.log("in the login route", params);
        if (typeof params === "undefined" || !params.userName || !params.userPassword || !params.studiourl || !params.client) {
            console.log("params missing");
            res.status(400);
            return res.send({
                error: "Invalid Parameters. You need to specify a username, password, and valid studio url."
            });
        }
        var fhparams = {
            u: params.userName,
            p: params.userPassword,
            domain: params.studiourl
        };
        jwt.verify(params.client, process.env.JWT_SALT, function(err, userID) {
            if (err) {
                res.status(400);
                return res.send({
                    error: err
                });
            }
            tryLogin(fhparams, function(loginResponse) {
                if (loginResponse.result === "ok") {
                    loginResponse.root = params.studiourl;
                    loginResponse.email = params.userName;

                    var options = {
                        "act": "list",
                        "type": USER_DB,
                        "eq": {
                            "userID": userID
                        }
                    };
                    $fh.db(options, function(err, data) {
                        var user;
                        if (err) {
                            res.status(503);
                            return res.send({
                                error: err
                            });
                        } else {
                            if (data.count === 0) {
                                user = {
                                    userID: userID,
                                    targets: [
                                        loginResponse
                                    ]
                                }
                                addUser(user, function userAdded(err, user) {
                                    res.send({ body: user });
                                });
                            } else {
                                user = data.list[0];
                                // var update = true;
                                // for (var i = 0; i < user.fields.targets.length; i++) {
                                //     var target = user.fields.targets[i];
                                //     if (target.root === params.studiourl) {
                                //         console.log("target aquired!");
                                //         target = loginResponse;
                                //         update = false;
                                //     }
                                // }
                                // if (update) {
                                //     user.fields.targets.push(loginResponse);
                                // }
                                user.fields.targets = [loginResponse];
                                updateUser(user.guid, user.fields, function userAdded(err, user) {
                                    res.send({ body: user });
                                });
                            }
                        }
                    });
                } else {
                    //user not logged in, return error
                    res.status(503)
                    res.send({ error: "Failed to login, reason " + loginResponse.reason });
                }
            });
        });
    });

    function addUser(user, cb) {
        var options = {
            "act": "create",
            "type": USER_DB,
            "fields": user
        };
        $fh.db(options, function(err, data) {
            if (err) {
                return (err, null);
            } else {
                return cb(null, data)
            }
        });
    }

    function updateUser(guid, user, cb) {
        var options = {
            "act": "update",
            "type": USER_DB,
            "guid": guid,
            "fields": user
        };
        $fh.db(options, function(err, data) {
            if (err) {
                return (err, null);
            } else {
                return cb(null, data)
            }
        });
    }

    function tryLogin(params, cb) {
        request.post({
            url: params.domain + '/box/srv/1.1/act/sys/auth/login',
            body: JSON.stringify(params)
        }, function(err, res, body) {
            if (!body) {
                return cb({ result: 'fail', reason: 'no-connection' });
            }
            return cb(JSON.parse(body));
        });
    }

    return app;
}

module.exports = authRoute;