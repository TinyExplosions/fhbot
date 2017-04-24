var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var request = require('request');
var target = require('./target');
var $fh = require('fh-mbaas-api');
var dbActions = require('./dbActions');
var list = require('./listProjects');
var commonResponses = require('./commonResponses');

function fhBotRoute() {
    var app = new express.Router();
    app.use(cors());
    app.use(bodyParser());

    // GET REST endpoint - query params may or may not be populated
    app.post('/', function authRoute(req, res) {
        console.log("POSTING TO THE BOT!", req.body);
        // check if token is valid
        if (req.body.token !== process.env.fhbot_verification_token) {
            res.status(502)
            res.send("no token");
        } else {
            // need to use team_id and user_id combined as a key to get user details
            var options = {
                "act": "load",
                "key": req.body.team_id
            };
            $fh.cache(options, function(err, slackDetails) {
                if (err) {
                    res.status(500);
                    return res.send("error");
                }

                req.slackDetails = JSON.parse(slackDetails);
                var text = req.body.text.toUpperCase();
                switch (true) {
                    case (text.indexOf("TARGET") != -1):
                        console.log("in target");
                        target.target(req, res);
                        break;
                    case (text.indexOf("LIST") != -1):
                        console.log("in list");
                        list.listProjects(req, res);
                        break;
                    case (text.indexOf("HELP") != -1):
                        console.log("in help");
                        res.send(commonResponses.helpText());
                        break;
                    case (text.indexOf("LOGOUT") != -1):
                        console.log("in logout");
                        logoutUser(req, res);
                        break;
                    default:
                        console.log("in default");
                        res.send(commonResponses.helpText());
                }
            });
        }
    });

    function logoutUser(req, res) {
        var userKey = req.body.team_id + req.body.user_id;
        dbActions.findUser(userKey, function findUserToDelete(user) {
            if(user) {
                dbActions.deleteUser(user.guid, function deleteUser(removedUser) {
                  res.send({text: "You have been logged out of *"+user.user.targets[0].root+"*"});
                });
            } else {
              res.send({text: "You have been logged out."});
            }
        });
    };


    return app;
}

module.exports = fhBotRoute;