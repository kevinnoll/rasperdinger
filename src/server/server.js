var http = require("http");
var Logger = require('basic-logger');
var port = 5433;
var host = 'localhost';

var customConfig = {
    showMillis: true,
    showTimestamp: true
};

var log = new Logger(customConfig) // custom config parameters will be used, defaults will be used for the other parameters
var rest = require("./rest.js"); 

http.createServer(function(req, res) {
	if(req.method == 'GET') {
		log.info("GET request received");
		//list_records(req,res);
		rest.getWinRates(res, req, http, log);
	}
}).listen(port,host);
log.info("##### Connected to " + port + "   " + host + " #####");

var collector = require("./collector.js")
collector.init(http, log);