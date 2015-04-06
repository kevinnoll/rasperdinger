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
					}
				});
				selectIDQuery.on('end', function(result) {
					if(result.rowCount===0){
						that.log.info("currently no match ids to check")	
						client.end();				
					}
				})
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

		var callback = function(response) {
		  var str = '';
		  
		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		    var oData = JSON.parse(str);
			that.persistMatchToDB(client, oData);
		  });
		}
		var req = https.request(options, callback);
		req.end();

		req.on('error', function(e) {
  			this.log.error(e);
		});
	},

	persistMatchToDB : function(client, oData){
		var that = this;

		var oMatch = this.createMatchObject(oData);
		var oTeams = this.createTeamObject(oData);
		var oParticipants = this.createParticipantObject(oData);
		that.log.info("start match insertion...");

		client.query('INSERT INTO \"Match\" (id, region, \"matchDuration\", "\matchCreation\") VALUES ($1, $2, $3, $4)', [oMatch.id, oMatch.region, oMatch.matchDuration, oMatch.matchCreation], function(err, result) {
			if(err) {
				that.log.error("aint no shit going here on insert :" +[oMatch.id]+", "+err);
				return that.rollbackDB(client);
			} else {
				that.persistTeams(that, oTeams, oParticipants, oMatch.id, client);
			}
		});
	},
	
	persistTeams:function(that, oTeams, oParticipants, matchId, client){
		var teamCount = 0;
		for(var key in oTeams){
			var oTeam = oTeams[key];
			client.query('INSERT INTO \"Team\" (id, \"teamId\", winner, \"firstBlood\", \"firstBaron\", \"firstDragon\", \"towerKills\", \"baronKills\", \"dragonKills\", ban1, ban2, ban3, match) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
			[oTeam.id, oTeam.teamId, oTeam.winner, oTeam.firstBlood, oTeam.firstBaron, oTeam.firstDragon, oTeam.towerKills, oTeam.baronKills, oTeam.dragonKills, oTeam.ban1, oTeam.ban2, oTeam.ban3, oTeam.match], function(err, result) {
				var current = this.values[0];
				if(err) {
					that.log.error("[TEAM] aint no shit going here on insert team :" +[current]+", "+err);
					return that.rollbackDB(client);
				} else {
					teamCount++;
					if(teamCount>=2){
						that.persistParticipants(that, oParticipants, matchId,  client);			
					}
				}
			});
		}
	},
	
	persistParticipants: function(that, oParticipants, matchId, client) {
		var participantCount = 0;
		for(var key in oParticipants){
			var oP = oParticipants[key];
			client.query('INSERT INTO \"Participant\" (id, \"participantId\", \"spell1Id\", \"spell2Id\", \"championId\", \"highestTier\", \"lane\", \"winner\", \"champLevel\", item0, item1, item2, item3, item4, item5, item6, kills, \"doubleKills\", \"tripleKills\", \"quadraKills\", \"pentaKills\", \"largestKillingSpree\", deaths, assists, \"totalHeal\", \"firstBloodKill\", \"firstBloodAssist\", \"minionsKilled\", \"goldEarned\", \"wardsPlaced\", \"wardsKilled\", \"totalTimeCrowdControlDealt\", \"totalDamageDealt\", \"totalDamageDealtToChampions\", team, skillorder) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)',
			[oP.id, oP.participantId, oP.spell1Id, oP.spell2Id, oP.championId, oP.highestTier, oP.lane, oP.winner, oP.champLevel, oP.item0, oP.item1, oP.item2, oP.item3, oP.item4, oP.item5, oP.item6, oP.kills, oP.doubleKills, oP.tripleKills, oP.quadraKills, oP.pentaKills, oP.largestKillingSpree, oP.deaths, oP.assists, oP.totalHeal, oP.firstBloodKill, oP.firstBloodAssist, oP.minionsKilled, oP.goldEarned, oP.wardsPlaced, oP.wardsKilled, oP.totalTimeCrowdControlDealt, oP.totalDamageDealt, oP.totalDamageDealtToChampions, oP.team, oP.skillorder], function(err, result) {
				var current = this.values[0];
				if(err) {
					that.log.error("[PARTICIPANT] aint no shit going here on insert team :" +[current]+", "+err);
					return that.rollbackDB(client);
				} else {
					participantCount++;
					if(participantCount>=10){
						that.updateMatchChecked(that, matchId, client);				
					}
				}
			});
		}
	},
	
	updateMatchChecked: function(that, matchId, client){
		client.query('UPDATE \"MatchSelection\" SET checked = true WHERE id = $1', [matchId], function(err, result) {
			var current = this.values[0];
			if(err) {
				that.log.error("[MATCH_UPDATE] aint no shit going here on update match :" +[current]+", "+err);
				return that.rollbackDB(client);
			} else {
				that.log.info("...done");
				that.commitDB(client, that);
			}
		});
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
			oParticipants[node.participantId].highestTier = node.highestAchievedSeasonTier;
			oParticipants[node.participantId].lane = node.timeline.lane;
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
		    that.log.info("...key collection done");
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
					var selectIDQuery = client.query('SELECT COUNT(id) AS idcount FROM \"MatchSelection\" WHERE id = $1', [aInnerIds[keyId]]);
					var counter = 0;
					selectIDQuery.on('row', function(row) {
						var current = this.values[0];
						if(row.idcount === "0"){
							client.query('INSERT INTO \"MatchSelection\" (id, checked) VALUES ($1, false)', [current], function(err, result) {
								if(err) {
									that.log.error("aint no shit going here on insert :" +[current]+", "+err);
									return that.rollbackDB(client);
								}
							});
						} else {
							that.log.debug("match id already exists: "+ current);
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
			client.end();
		});
	},

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