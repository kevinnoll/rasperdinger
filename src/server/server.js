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
	"skillorder": "getMostPopularSkillorder",
	"allskillorders": "getAllSkillorders",
	"skillordersforchamp": "getSkillordersForChamp",
	"champions": "getChampions"
};

var log = new Logger(customConfig) // custom config parameters will be used, defaults will be used for the other parameters
var rest = require("./rest.js"); 
var that = this;

http.createServer(function(req, res) {
	if(req.method == 'GET') {
		var splittedPath = req.url.substr(1).split("/");
		var firstSubpath = splittedPath[0];
		log.info("GET request received: "+firstSubpath);
		if(functionMapping.hasOwnProperty(firstSubpath)){
			log.info("gonna call a function...: "+functionMapping[firstSubpath]); 
			if(splittedPath.length>1){
				rest[functionMapping[firstSubpath]](res, req, http, log, splittedPath[1]);			
			} else {
				rest[functionMapping[firstSubpath]](res, req, http, log);
			}
			//rest.getWinRates(res, req, http, log);
		} else {
			console.log("no such firstSubpath");			
		}
	}
}).listen(port,host);
log.info("##### Connected to " + port + "   " + host + " #####");

var collector = require("./collector.js")
//collector.init(http, log);