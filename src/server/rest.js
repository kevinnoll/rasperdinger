module.exports = {
	result : null,
	log : null,
	pg : null,
	http : null,

	getWinRates : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentwinrateunreal');
	}, 
	getBanRates : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentbanrate');
	}, 
	 
	getPopularityUnreal : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentchamppopularityunreal');
	},
	
	getPopularityReal : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentchamppopularityreal');
	},
	
	getMatchDuration : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentmatchduration');
	},
	
	getFinalItemPicks : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentfinalitempicks');
	},
	
	getMostPopularSkillorder : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentmostpopularskillorder');
	},
	
	getAllSkillorders : function(res, req, http, log){
		this.returnSQLResult(res, req, http, log, 'currentallskillorders');
	},
	
	getSkillordersForChamp : function(res, req, http, log, id){
		if(!id){
			log.error("no id specified, channot load skillorders for champ");
		} else {
			this.returnSQLResult(res, req, http, log, 'currentallskillorders', 'WHERE id = '+id+ ' ORDER BY most DESC');		
		}
	},
	
	returnSQLResult : function(res, req, http, log, table, constraint){
		this.log = log;
		this.http = http;
		var that = this;
		this.result = [];
		var conString = "pg://thresh:thresh@localhost:5432/threshDB";
		var pg = require("pg");
		var oClient = new pg.Client(conString);

		oClient.connect(function(err) {
			if(err) {
				return that.log.error('could not connect to postgres', err);
			}
			oClient.query('BEGIN', function(err, result) {
				if(err) {
					that.log.error("BEGIN not working...");
					return that.rollbackDB(oClient);
				}
				var select = 'SELECT * FROM '+table;
				if(constraint){
					select += ' ' +constraint;
				}
				var selectQuery = oClient.query(select);
				selectQuery.on('row', function(row) {
					that.result.push(row);
				});
				selectQuery.on('end', function(result) {
					if(result.rowCount===0){
						that.log.info("no "+table+" received!")	
						oClient.end();				
					} else {
					    res.setHeader("Access-Control-Allow-Origin", "http://localhost:9001");
						res.writeHead(200, {'Content-Type': 'text/plain'});
						res.write(JSON.stringify(that.result) + "\n");
						res.end();
						oClient.end();
					}
				})
				selectQuery.on('error', function(err) {
					that.log.error(err + " cannot receive "+table);
					oClient.query('ROLLBACK', function() {
						oClient.end();
					});
				});
			});
		});
	}
}