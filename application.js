global.__base = __dirname + '/';

var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');
var bodyParser = require('body-parser');
var semiStatic = require('semi-static');
var fs = require('fs');
var jwt = require('jsonwebtoken');
process.env.USER_DB = "studioUsers";
var Logger = require('fh-logger-helper');


// list the endpoints which you want to make securable here
var securableEndpoints;
securableEndpoints = ['/hello'];

var app = express();

// Enable CORS for all requests
app.use(cors());
app.use(bodyParser());

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

app.set('public', './public'); // specify the views directory
app.set("view engine", "jade");

// allow serving of static files from the public directory
app.use(express.static(__dirname + '/public'));
// semi static allows us to use ejs templates for the test page
app.get('/*', semiStatic({
    folderPath: __dirname + '/public',
    root: '/',
    context: function(req, done) {
        console.log("checking for a clientID", req.queryfhbot);
        if (req.query.client) {
            console.log("we have one!>")
            jwt.verify(req.query.client, process.env.JWT_SALT, function(err, decoded) {
                if (err) {
                    return done(null, {});
                } else {
                    return done(null, { client: req.query.client, loginPage: true });
                }
            });
        } else {
            done(null, {});
        }
    }
}));

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());



app.use('/hello', require('./lib/hello.js')());
app.use('/auth', require('./lib/auth.js')());
app.use('/fhbot', require('./lib/fhbot.js')());


// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.listen(port, host, function() {
    console.log("App started at: " + new Date() + " on port: " + port);
});