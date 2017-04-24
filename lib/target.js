var dbActions = require('./dbActions.js'),
    commonResponses = require('./commonResponses');

function getTarget(req, res) {
    var userKey = req.body.team_id + req.body.user_id;
    dbActions.findUser(userKey, function findUserToDelete(dbResult) {
        if (!dbResult) {
            return commonResponses.notLoggedIn(userKey, function notLoggedIn(err, message) {
                res.send(message);
            });
        }
        var user = dbResult.user;
        var target = user.targets[0];
        res.send({ text: "You're currently logged into the *" + target.root + "* domain" });
    });
}

function target(req, res) {
    var command = req.body.text.toUpperCase().trim();
    if(command === "TARGET") {
      return getTarget(req, res);
    }

}
module.exports = {
    target: target
};