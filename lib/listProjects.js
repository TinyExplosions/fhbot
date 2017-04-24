var $fh = require('fh-mbaas-api');
var dbActions = require('./dbActions.js');
var request = require('request');
var fhHost = require('fh-instance-url');
var jwt = require('jsonwebtoken');
var https = require('https');

var colors = {
    red: "danger",
    red_anime: "danger",
    yellow: "warning",
    yellow_anime: "warning",
    blue: "good",
    blue_anime: "good",
    grey: "#ababab",
    grey_anime: "#ababab",
    disabled: "#ababab",
    disabled_anime: "#ababab",
    aborted: "#ababab",
    aborted_anime: "#ababab",
    nobuilt: "#ababab",
    nobuilt_anime: "#ababab"
}

var appTypes = {
    client_advanced_hybrid: {
        icon: ":iphone:",
        // icon: ":cordova:",
        name: "Cordova"
    },
    client_native_ios: {
        icon: ":iphone:",
        name: "Native iOS App"
    },
    webapp_advanced: {
        icon: ":globe_with_meridians:",
        // icon: ":js:",
        name: "Advanced Web App"
    },
    cloud_nodejs: {
        icon: ":cloud:",
        name: "Node.js Cloud App"
    },
    client_hybrid: {
        icon: ":iphone:",
        // icon: ":html5:",
        name: "Cordova Light"
    },
    webapp_basic: {
        icon: ":globe_with_meridians:",
        name: "Basic Web App"
    },
    client_native_android: {
        icon: ":iphone:",
        // icon: ":android:",
        name: "Native Android App"
    },
    client_native_windowsphone8: {
        icon: ":iphone:",
        // icon: ":windows:",
        name: "WP8 App"
    },
    client_native_windowsuniversal: {
        icon: ":iphone:",
        // icon: ":windows:",
        name: "WP8 App"
    }
};


function listProjects(req, res) {
    var userKey = req.body.team_id + req.body.user_id;
    var slackUrl = req.body.response_url;
    dbActions.findUser(userKey, function findUserToDelete(dbResult) {
        if (!dbResult) {
            return notLoggedIn(userKey, res);
        }
        res.send('getting list...');
        // console.log(JSON.stringify(dbResult));
        var target = dbResult.user.targets[0];
        var host = target.root;
        var body = {
            username: decodeURIComponent(target.email)
        };
        var opts = {
            uri: host + '/box/api/projects',
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                accept: 'application/json',
                cookie: 'feedhenry=' + target.login + ';',
                'content-type': 'application/json',
                'content-length': body.length
            },
            proxy: null,
            followRedirect: true
        }
        console.log("trying for projects", target.login);

        request.get(opts, function(e, r, body) {
            console.log("have projects...");
            var response = JSON.parse(body);
            var attachments = [];
            for (var i = 0; i < response.length; i++) {
                var project = response[i];
                var fields = [];

                var attachment = {
                    fallback: "Apps in the project " + project.title,
                    pretext: ":file_folder:  " + project.title + " - " +
                        project.authorEmail + " (<" + host +
                        "/#projects/" + project.guid + "|View>)",
                    color: "#efefef",
                    "mrkdwn_in": [
                        "text"
                    ]
                };

                for (var j = 0; j < project.apps.length; j++) {
                    var app = project.apps[j];
                    domain = app.domain;
                    if (!appTypes[app.type]) {
                        console.log("CAN'T FIND" + app.type);
                    }
                    var testing = ":file_folder:";
                    if (!appTypes[app.type]) {
                        appTypes[app.type] = {
                            icon: ":iphone:",
                            name: app.type
                        }
                    }
                    fields.push({
                        title: appTypes[app.type].icon + " " + appTypes[app.type].name,
                        value: "<" + host + "/#projects/" +
                            project.guid + "/apps/" + app.guid + "/details|" +
                            app.title + ">",
                        short: true
                    });
                };
                attachment.fields = fields;

                attachments.push(attachment)
            }
            console.log("post to slackbot");
            var payload = {
                text: "*Current projects on " + host + "*\n ",
                attachments: attachments,
                "mrkdwn_in": [
                    "text"
                ]
            };
            var options = {
                uri: slackUrl,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
                method: 'POST',
                body: JSON.stringify(payload)
            };

            request(options, function(error, response, body) {
                // don't care what happens
                console.log("Hmmm", body);
            });

        });
    });
}

function notLoggedIn(userKey, res) {
    fhHost(process.env.FH_INSTANCE, function hostCheck(err, host) {
        if (err) {
            host = "#";
        }
        var token = jwt.sign(userKey, process.env.JWT_SALT);
        console.log("sending the response");
        var message = "*<" + host + "?client=" + token + "#login|You need to authorise your account.>*\n" +
            "You don't seem to have any studio targetted, and I need to do that " +
            "in order to work with your projects. Please authorise <" + host + "?client=" + token + "#login|here>, then come " +
            "back and try again!";
        res.send({
            "text": message
        });
    });

}


module.exports = {
    listProjects: listProjects
};