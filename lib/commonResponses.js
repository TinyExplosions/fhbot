var fhHost = require('fh-instance-url'),
    jwt = require('jsonwebtoken'),
    Logger = require('fh-logger-helper');
process.env.FH_INSTANCE = process.env.FH_INSTANCE || 'localdevelopment';

function notLoggedIn(userKey, cb) {
    fhHost(process.env.FH_INSTANCE, function hostCheck(err, host) {
        if (err) {
            Logger.silly("Error returned from fhHost", err);
            host = "#";
        }
        var token = jwt.sign(userKey, process.env.JWT_SALT);
        var message = "*<" + host + "?client=" + token + "#login|You need to authorise your account.>*\n" +
            "You don't seem to have any studio targetted, and I need to do that " +
            "in order to work with your projects. Please authorise <" + host + "?client=" + token + "#login|here>, then come " +
            "back and try again!";
        return cb(null, {
            "text": message
        });
    });
}

function helpText() {
    var helpText = "" +
        "`/fhbot target`... display current target\n" +
        // "`/fhbot target studiourl`... change your target studio\n" +
        "`/fhbot help`... show this message again!\n" +
        "`/fhbot logout`... revoke fhbot's access to the studio";
    return {
        "text": "Showing you your studio deets!",
        "attachments": [{
            "color": "good",
            "title": "Getting Studio Info",
            "text": "`/fhbot list`... list projects in the targetted studio\n",
            "mrkdwn_in": [
                "text"
            ]
        }, {
            "title": "Configuring FHBot",
            "text": helpText,
            "mrkdwn_in": [
                "text"
            ]
        }]
    }
}

module.exports = {
    notLoggedIn: notLoggedIn,
    helpText: helpText
}