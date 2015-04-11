(function(){
  "use strict";

  var rito = {
    margin : null,
  	width : null,
  	height : null,
  	x : null,
  	y : null,
  	xAxis : null,
  	yAxis : null,
  	svg : null,
  	field : null,
  	data : null,
  	mChampionNames : null,
  	mChampionImageUrls : null,
    aWinRates : null,
    aChampionData : null,

  	init : function(){
  		this.loadData();
  		this.create();
  	},

    create : function(){
      this.createSVG();
      this.createPlayers();
    },

    loadData : function(){
      this.loadWinRates();
    },

    loadWinRates : function(){
      var that = this;
      this.aWinRates = [];
      /*$.get("http://localhost:5433", function( data ) {
      //$.get("http://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion/" + value.championId + "?champData=info&api_key=08d1d2cc-79c5-4dc2-9aa1-50b000cfcd20", function( data ) {
        that.mChampionNames[value.participantId] = data.key;
        var championImageUrl = "http://ddragon.leagueoflegends.com/cdn/5.6.1/img/champion/" + data.key + ".png";
        that.mChampionImageUrls[value.participantId] = championImageUrl;
        d3.select(".player_" + value.participantId)
          .append("svg:image")
          .attr('x',-10)
          .attr('y',-10)
          .attr('width', 20)
          .attr('height', 20)
          .attr("xlink:href",championImageUrl);
      });*/
    },

  	createScalesAndAxes : function(){
      this.x = d3.scale.ordinal()
        .rangeRoundBands([0, this.width], .1)
        .domain(this.aChampionData.map(function(d) { return d.name; }))
      this.y = d3.scale.linear()
        .range([this.height, 0])
        .domain([0, d3.max(this.aChampionData, function(d) { return d.percentage; })]);
  		this.xAxis = d3.svg.axis()
  			.scale(this.x)
        .orient("bottom");
  		this.yAxis = d3.svg.axis()
  			.scale(this.y)
        .orient("left")
        .ticks(10, "%");
  	},

  	createPlayers : function(){
  		var that = this;
      var xPos = 0;
      $.get("http://localhost:5433", function( data ) {
        //that.aChamionData = JSON.parse(data); 
        that.aChampionData = _DATA_;
        that.createScalesAndAxes();

        that.field.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + that.height + ")")
          .call(that.xAxis)
            .selectAll("text")
            .attr("y", -5)
            .attr("transform", "rotate(-90)");

        that.field.append("g")
          .attr("class", "y axis")
          .call(that.yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Frequency");

        var oChampionWinrates = that.field.selectAll(".bar")
          .data(that.aChampionData)
          .enter()
          .append("rect")
          .attr("class", function(d){
            return "bar winrate_"+d.name;
           })
          .attr("x", function(d) { return that.x(d.name); })
          .attr("width", that.x.rangeBand())
          .attr("y", function(d) { return that.y(d.percentage); })
          .attr("height", function(d) { return that.height - that.y(d.percentage); });
      });  		
  	},

  	createSVG : function(){
      this.margin = {top: 20, right: 20, bottom: 30, left: 40};
      this.width = 1200 - this.margin.left - this.margin.right;
      this.height = 500 - this.margin.top - this.margin.bottom;
  		this.svg = d3.select("body").append("svg")
    		.attr("width", this.width + this.margin.left + this.margin.right)
    		.attr("height", this.height + this.margin.top + this.margin.bottom);
      this.field = this.svg.append("g")
        .classed(".field", true)
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  	}

  }

  rito.init()

})();