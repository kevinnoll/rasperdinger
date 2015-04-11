module.exports = {
	result : null,
	log : null,
	pg : null,
	http : null,

	getWinRates : function(res, req, http, log){
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
				var selectIDQuery = oClient.query('SELECT * FROM \"Champion\"');
				selectIDQuery.on('row', function(row) {
					that.result.push(row);
				});
				selectIDQuery.on('end', function(result) {
					if(result.rowCount===0){
						that.log.info("no winrates received!")	
						oClient.end();				
					} else {
					    res.setHeader("Access-Control-Allow-Origin", "http://localhost:9001");
						res.writeHead(200, {'Content-Type': 'text/plain'});
						res.write(JSON.stringify(that.result) + "\n");
						res.end();
						oClient.end();
					}
				})
				selectIDQuery.on('error', function(err) {
					that.log.error(err + " cannot receive winrates");
					oClient.query('ROLLBACK', function() {
						oClient.end();
					});
				});
			});
		});
	}
}