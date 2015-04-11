(function(){
  "use strict";

    var rito = {
        oMargin : null,
      	iWidth : null,
      	iHeight : null,
      	x : null,
      	y : null,
        oZoom : null,
      	xAxis : null,
      	yAxis : null,
      	svg : null,
      	field : null,
      	data : null,
        tip : null,
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
            this.createCharts();
        },

        createCharts : function(){
            this.createRadioButtons();
            this.createWinrateChart();
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
              .attr('iWidth', 20)
              .attr('iHeight', 20)
              .attr("xlink:href",championImageUrl);
          });*/
        },

        createRadioButtons : function(){
            var shapeData = [{id:0,name:"Winrates"},{id:1,name:"Banrates"}];

            var radioButtons = d3.select(".radioButtons");
            var labelEnter = radioButtons.selectAll(".radioButton")
                .data(shapeData)
                .enter()
                .append("span");

            labelEnter.append("input")
                .attr({
                    type: "radio",
                    class: "shape",
                    name: "mode",
                    value: function(d, i) {
                        return i;
                    }
                })
                .property("checked", function(d, i) { 
                    return d.id===0; 
                })
                .on("click", function(d){
                    debugger;
                });
        },

      	createScalesAndAxes : function(){
            var that = this;
            this.x = d3.scale.ordinal()
                .domain(this.aChampionData.map(function(d) { return d.name; }))
                .rangeRoundBands([0, 4000], .1);
            this.y = d3.scale.linear()
                .range([this.iHeight, 0])
                //alternative:d3.max(this.aChampionData, function(d) { return d.percentage; })
                .domain([0, 0.65]);
    	    this.xAxis = d3.svg.axis()
      			.scale(this.x)
                .orient("bottom");
      		this.yAxis = d3.svg.axis()
      			.scale(this.y)
                .orient("left")
                .ticks(10, "%");
            this.oZoom = d3.behavior.zoom()
                .scaleExtent([1, 1])
                .on('zoom', $.proxy(this.draw,this));

            //this.oZoom.x(this.x);
      	},

      	createWinrateChart : function(){
      		var that = this;
            var xPos = 0;
            this.tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-10, 0])
                .html(function(d) { 
                    return "<strong>Winrate:</strong> <span style='color:red'>" + d3.format("3.3%")(d.percentage) + "</span>";
                });

            $.get("http://localhost:5433", function( data ) {
                //that.aChamionData = JSON.parse(data); 
                that.aChampionData = _DATA_;
                that.createScalesAndAxes();
        
                that.field = that.svg.append("g")
                    .classed(".field", true)
                    .attr("transform", "translate(" + that.oMargin.left + "," + that.oMargin.top + ")")
                    .call(that.oZoom);

                that.field.call(that.tip);

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
                    .attr("height", function(d) { return that.iHeight - that.y(d.percentage); })
                    .on("mouseover", that.tip.show)
                    .on("mouseout", that.tip.hide);

                that.field.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + that.iHeight + ")")
                    .call(that.xAxis)
                        .selectAll("text")
                        .attr("y", -5)
                        .attr("transform", "rotate(-90)");

                that.field.append("rect")
                        .attr("class", "axisBackground")
                        .attr("x", -that.oMargin.left)
                        .attr("y", 0)
                        .attr("height", that.iHeight + that.oMargin.top + that.oMargin.bottom)
                        .attr("width", that.oMargin.left)

                that.field.append("g")
                    .attr("class", "y axis")
                    .call(that.yAxis)
                    .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", ".71em")
                        .style("text-anchor", "end")
                        .text("Frequency");
            });  		
      	},

      	createSVG : function(){
            this.oMargin = {top: 20, right: 20, bottom: 30, left: 40};
            this.iWidth = 1200 - this.oMargin.left - this.oMargin.right;
            this.iHeight = 500 - this.oMargin.top - this.oMargin.bottom;
          	this.svg = d3.select(".svg_anchor").append("svg")
        		.attr("width", this.iWidth + this.oMargin.left + this.oMargin.right)
        		.attr("height", this.iHeight + this.oMargin.top + this.oMargin.bottom);
       	},

        draw : function(){
            this.tip.hide()
            console.log("zooming");

            var pan = this.oZoom.translate()[0];
            pan = Math.min(pan, 0);
            pan = Math.max(pan, this.iWidth-4000);
            this.oZoom.translate([pan,0]);

            d3.select(".x.axis").attr("transform", "translate(" + pan +","+(this.iHeight)+")")
            d3.selectAll(".bar").attr("transform", "translate(" + pan +",0)scale(" + d3.event.scale + ",1)");

           
        }

    }

      rito.init()

})();