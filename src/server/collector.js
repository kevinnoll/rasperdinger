module.exports = {
	log : null,
	pg : null,
	client : null,
	http : null,

	init : function(http, log){
		this.http = http;
		this.log = log;
		this.connectToDB();
		this.collectSouls();
	},

	collectSouls : function(){
		var that = this;
		var now = new Date(); 
		var yesterday = new Date(now.getTime() - 86400000); //subtract one day
		var yesterdayMinusOneHour = new Date(yesterday.getTime() - 360000); //subtract one hour
		var startTime = new Date(yesterdayMinusOneHour.getTime());
		startTime.setHours(yesterdayMinusOneHour.getHours(), (5*Math.floor(yesterdayMinusOneHour.getMinutes()/5)), 0, 0);
		this.collectKeys(startTime.getTime() / 1000);

		setInterval(function(){
			startTime.setTime(startTime.getTime() + 300000)
			that.collectKeys(startTime.getTime() / 1000);
		},300000); // 300000 for every 5 minutes
		
		setInterval(function(){
			that.initDataCollection();
		},3000); // 3000 for every 3 seconds

	},

	initDataCollection : function(){
		var that = this;
		var conString = "pg://thresh:thresh@localhost:5432/threshDB";
		var pg = require("pg");
		var client = new pg.Client(conString);
		//that.connectToDB();
		// SOLUTION A: vorher alle keys auslesen und vorhandene aus den neuen rausfiltern
		// SOLUTION B: jeden neuen Key zunaechst ueberpruefen
		client.connect(function(err) {
			if(err) {
				return that.log.error('could not connect to postgres', err);
			}
			client.query('BEGIN', function(err, result) {
				if(err) {
					that.log.error("BEGIN not working...");
					return that.rollbackDB(client);
				}
				var selectIDQuery = client.query('SELECT id FROM \"MatchSelection\" WHERE checked = false LIMIT 1');
				selectIDQuery.on('row', function(row) {
					if(row.id){
						that.collectMatch(client, row.id);
					} else {
						that.log.error("collected id not existing")
					}
				});
				selectIDQuery.on('error', function() {
					that.log.error(current + " cannot be inserted");
					return that.rollbackDB(client);
				});
			});
		});
	},

	collectMatch : function(client, matchId){
		var https = require('https');

		var that = this;
		var options = {
			method: 'GET',
			hostname: 'euw.api.pvp.net',
			path: '/api/lol/euw/v2.2/match/' + matchId + '?includeTimeline=true&api_key=08d1d2cc-79c5-4dc2-9aa1-50b000cfcd20'
		};
		this.log.info(options.hostname+options.path);

		var callback = function(response) {
		  var str = '';
		  
		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		    var oData = JSON.parse(str);
			that.log.info("matchdata completed");
			that.persistMatchToDB(client, oData);
		  });
		}
		var req = https.request(options, callback);
		req.end();

		req.on('error', function(e) {
  			this.log.error(e);
		});
		this.log.info("request sent");
	},

	persistMatchToDB : function(client, oData){
		var that = this;

		var oMatch = this.createMatchObject(oData);
		var oTeams = this.createTeamObject(oData);
		var oParticipants = this.createParticipantObject(oData);



		/*for(var keyId in aInnerIds) {
			that.log.info(keyId+"="+aInnerIds[keyId]);
			var selectIDQuery = client.query('SELECT COUNT(id) AS idcount FROM \"MatchSelection\" WHERE id = $1', [aInnerIds[keyId]]);
			var counter = 0;
			selectIDQuery.on('row', function(row) {
				var current = this.values[0];
				if(row.idcount === "0"){
					client.query('INSERT INTO \"MatchSelection\" (id, checked) VALUES ($1, false)', [current], function(err, result) {
						if(err) {
							that.log.error("aint no shit going here on insert :" +[current]+", "+err);
							return that.rollbackDB(client);
						} else {
							that.log.info("match id inserted: "+ current);
						}
					});
				} else {
					that.log.info("match id already exists: "+ current);
				}
				
				counter++;
				if(counter>=aInnerIds.length){
					that.commitDB(client, that);
				} 
			});
			selectIDQuery.on('error', function() {
				that.log.error(current + " cannot be inserted");
				return that.rollbackDB(client);
			});
		}*/
	},

	createMatchObject : function(oData){
		var oMatch = {};
		oMatch.id = oData.matchId;
		oMatch.region = oData.region;
		oMatch.matchCreation = oData.matchCreation;
		oMatch.matchDuration = oData.matchDuration;
		return oMatch;
	},

	createTeamObject : function(oData){
		var oTeams = {};
		for(var key in oData.teams){
			var node = oData.teams[key];
			oTeams[node.teamId] = {};
			oTeams[node.teamId].id = parseInt(oData.matchId + "" + node.teamId);
			oTeams[node.teamId].teamId = node.teamId;
			oTeams[node.teamId].winner = node.winner;
			oTeams[node.teamId].firstBlood = node.firstBlood;
			oTeams[node.teamId].firstDragon = node.firstDragon;
			oTeams[node.teamId].firstBaron = node.firstBaron;
			oTeams[node.teamId].towerKills = node.towerKills;
			oTeams[node.teamId].baronKills = node.baronKills;
			oTeams[node.teamId].dragonKills = node.dragonKills;
			oTeams[node.teamId].ban1 = (node.bans[0]) ? node.bans[0].championId : 0; 
			oTeams[node.teamId].ban2 = (node.bans[1]) ? node.bans[1].championId : 0; 
			oTeams[node.teamId].ban3 = (node.bans[2]) ? node.bans[2].championId : 0; 
			oTeams[node.teamId].match = oData.matchId;
		}
		return oTeams;
	},

	createParticipantObject : function(oData){
		var oParticipants = {};
		for(var key in oData.participants){
			var node = oData.participants[key];
			oParticipants[node.participantId] = {};
			oParticipants[node.participantId].id = parseInt(oData.matchId + "" + node.participantId);
			oParticipants[node.participantId].participantId = node.participantId;
			oParticipants[node.participantId].spell1Id = node.spell1Id;
			oParticipants[node.participantId].spell2Id = node.spell1Id;
			oParticipants[node.participantId].championId = node.championId;
			oParticipants[node.participantId].highestTier = node.highestTier;
			oParticipants[node.participantId].lane = node.lane;
			oParticipants[node.participantId].winner = node.stats.winner;
			oParticipants[node.participantId].champLevel = node.stats.champLevel;
			oParticipants[node.participantId].item0 = node.stats.item0;
			oParticipants[node.participantId].item1 = node.stats.item1;
			oParticipants[node.participantId].item2 = node.stats.item2;
			oParticipants[node.participantId].item3 = node.stats.item3;
			oParticipants[node.participantId].item4 = node.stats.item4;
			oParticipants[node.participantId].item5 = node.stats.item5;
			oParticipants[node.participantId].item6 = node.stats.item6;
			oParticipants[node.participantId].kills = node.stats.kills;
			oParticipants[node.participantId].doubleKills = node.stats.doubleKills;
			oParticipants[node.participantId].tripleKills = node.stats.tripleKills;
			oParticipants[node.participantId].quadraKills = node.stats.quadraKills;
			oParticipants[node.participantId].pentaKills = node.stats.pentaKills;
			oParticipants[node.participantId].largestKillingSpree = node.stats.largestKillingSpree;
			oParticipants[node.participantId].deaths = node.stats.deaths;
			oParticipants[node.participantId].assists = node.stats.assists;
			oParticipants[node.participantId].totalHeal = node.stats.totalHeal;
			oParticipants[node.participantId].totalDamageDealt = node.stats.totalDamageDealt
			oParticipants[node.participantId].totalDamageDealtToChampions = node.stats.totalDamageDealtToChampions;
			oParticipants[node.participantId].firstBloodKill = node.stats.firstBloodKill;
			oParticipants[node.participantId].firstBloodAssist = node.stats.firstBloodAssist;
			oParticipants[node.participantId].minionsKilled = node.stats.minionsKilled;
			oParticipants[node.participantId].goldEarned = node.stats.goldEarned;
			oParticipants[node.participantId].wardsPlaced = node.stats.wardsPlaced;
			oParticipants[node.participantId].wardsKilled = node.stats.wardsKilled;
			oParticipants[node.participantId].totalTimeCrowdControlDealt = node.stats.totalTimeCrowdControlDealt;

			//TEAM
			oParticipants[node.participantId].team = parseInt(oData.matchId + "" + node.teamId);

			//SKILLORDER
			var aSkillOrder = [];
			for(var i = 0; i < oData.timeline.frames.length; i++){
				var events = oData.timeline.frames[i].events;
				if(events){
					for(var eventKey in events){
						if(events[eventKey].eventType === "SKILL_LEVEL_UP" && events[eventKey].participantId === node.participantId){
							aSkillOrder.push(events[eventKey].skillSlot);
						}
					}
				}
			}
			oParticipants[node.participantId].skillorder = aSkillOrder.toString();
		}
		this.log.info(oParticipants);
		return oParticipants;
	},

	collectKeys : function(timeToCollect){
		this.log.info("collecting keys...");
		var https = require('https');

		var that = this;
		var options = {
			method: 'GET',
			hostname: 'euw.api.pvp.net',
			path: '/api/lol/euw/v4.1/game/ids?beginDate=' + timeToCollect + '&api_key=08d1d2cc-79c5-4dc2-9aa1-50b000cfcd20'
		};
		this.log.info(options.hostname +options.path);

		var callback = function(response) {
		  var str = '';
		  
		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		    var aResponse = JSON.parse(str);
		    that.persistIdsToDB(aResponse);
		    that.log.info(aResponse);
		  });
		}
		var req = https.request(options, callback);
		req.end();

		req.on('error', function(e) {
  			this.log.error(e);
		});
	},

	persistIdsToDB : function(aIds){
		var that = this;
		var conString = "pg://thresh:thresh@localhost:5432/threshDB";
		var pg = require("pg");
		var client = new pg.Client(conString);
		//that.connectToDB();
		// SOLUTION A: vorher alle keys auslesen und vorhandene aus den neuen rausfiltern
		// SOLUTION B: jeden neuen Key zunaechst ueberpruefen
		client.connect(function(err) {
			var aInnerIds = aIds;
			if(err) {
				return that.log.error('could not connect to postgres', err);
			}
			client.query('BEGIN', function(err, result) {
				if(err) {
					that.log.error("BEGIN not working...");
					return that.rollbackDB(client);
				}
				for(var keyId in aInnerIds) {
					that.log.info(keyId+"="+aInnerIds[keyId]);
					var selectIDQuery = client.query('SELECT COUNT(id) AS idcount FROM \"MatchSelection\" WHERE id = $1', [aInnerIds[keyId]]);
					var counter = 0;
					selectIDQuery.on('row', function(row) {
						var current = this.values[0];
						if(row.idcount === "0"){
							client.query('INSERT INTO \"MatchSelection\" (id, checked) VALUES ($1, false)', [current], function(err, result) {
								if(err) {
									that.log.error("aint no shit going here on insert :" +[current]+", "+err);
									return that.rollbackDB(client);
								} else {
									that.log.info("match id inserted: "+ current);
								}
							});
						} else {
							that.log.info("match id already exists: "+ current);
						}
						
						counter++;
						if(counter>=aInnerIds.length){
							that.commitDB(client, that);
						} 
					});
					selectIDQuery.on('error', function() {
						that.log.error(current + " cannot be inserted");
						return that.rollbackDB(client);
					});
				}
			});
		});
	},
	
	commitDB: function(client, that){
		client.query('COMMIT', function(){
			that.log.info("connection is committed");
			client.end.bind(client);
		});
	},

	/*collectMatches : function(){
		var https = require('https');

		var that = this;
		var options = {
			method: 'GET',
			hostname: 'global.api.pvp.net',
			path: '/api/lol/euw/v2.2/match/1778838158?api_key=08d1d2cc-79c5-4dc2-9aa1-50b000cfcd20'
		};

		var callback = function(response) {
		  var str = '';
		  
		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		    that.log.info(str);
		    that.log.info("data completed");
		  });
		}
		var req = https.request(options, callback)
		req.end();

		req.on('error', function(e) {
  			this.log.error(e);
		});
		this.log.info("request sent");
	},*/

	connectToDB : function(){
		var conString = "pg://thresh:thresh@localhost:5432/threshDB";
		this.pg = require("pg")
		this.client = new this.pg.Client(conString);
		this.client.connect();
		this.log.info("Connected to DB")
	},
	
	rollbackDB : function(client) {
		client.query('ROLLBACK', function() {
			client.end();
		});
	}
}