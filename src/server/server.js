var http = require("http");
var Logger = require('basic-logger');
var port = 5433;
var host = 'localhost';

var customConfig = {
    showMillis: true,
    showTimestamp: true
};

var functionMapping = {
	"winrates": "getWinRates",
	"banrates": "getBanRates",
	"popularityreal": "getPopularityReal",
	"popularityunreal": "getPopularityUnreal",
	"matchduration": "getMatchDuration",
	"finalitempicks": "getFinalItemPicks",
	"finalitempicks": "getFinalItemPicks",
	"skillorder": "getMostPopularSkillorder"
	
};

var log = new Logger(customConfig) // custom config parameters will be used, defaults will be used for the other parameters
var rest = require("./rest.js"); 
var that = this;

http.createServer(function(req, res) {
	if(req.method == 'GET') {
		var subpath = req.url.replace('/','');
		log.info("GET request received: "+subpath);
		if(functionMapping.hasOwnProperty(subpath)){
			log.info("gonna call a function...: "+functionMapping[subpath]); 
			rest[functionMapping[subpath]](res, req, http, log);
			//rest.getWinRates(res, req, http, log);
		} else {
			console.log("no such subpath");			
		}
	}
}).listen(port,host);
log.info("##### Connected to " + port + "   " + host + " #####");

var collector = require("./collector.js")
//collector.init(http, log);