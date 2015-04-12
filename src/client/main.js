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
        aBanrates : null,
        aWinrates : null,

      	init : function(){
      		this.create();
      	},

        create : function(){
            this.createSVG();
            this.createRadioButtons();
            this.createWinrateChart();
        },

        createRadioButtons : function(){
            var that = this;
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
                    label: "dayum",
                    name: "mode",
                    value: function(d, i) {
                        return i;
                    }
                })
                .property("checked", function(d, i) { 
                    return d.id===0; 
                })
                .on("click", function(d){
                    if(d.id===0){
                        that.prepareWinrateChart();
                    } else if(d.id===1){
                        that.prepareBanrateChart();
                    }
                });

            labelEnter.append("label")
                .text(function(d) {return d.name;})
        },

      	createScalesAndAxes : function(){
            var that = this;
            this.x = d3.scale.ordinal()
                .domain(this.aWinrates.map(function(d) { return d.name; }))
                .rangeRoundBands([0, 4000], .1);
            this.y = d3.scale.linear()
                .range([this.iHeight, 0])
                .domain([0, d3.max(this.aWinrates, function(d) { return d.percentage; })]);
                //.domain([0, 0.8]);
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

        switchToWinrateChart : function(){
            var that = this;
            this.x.domain(this.aWinrates.map(function(d) { return d.name; }))
            this.y.domain([0, d3.max(this.aWinrates, function(d) { return d.percentage; })]);
            this.field.select(".y.axis").transition().duration(1000).call(this.yAxis);
            this.field.select(".x.axis").transition().duration(1000).call(this.xAxis).selectAll("text").attr("y", -4).attr("x", 40).style("text-anchor", "start");
            this.tip.html(function(d) { 
                    return "<strong>Winrate:</strong> <span style='color:red'>" + d3.format("3.3%")(d.percentage) + "</span>";
                });
            this.field.selectAll(".bar")
                .data(this.aWinrates)
                .transition().duration(1000)
                .attr("class", function(d){
                    return "bar "+d.name;
                })
                .attr("x", function(d) { return that.x(d.name); })
                .attr("width", this.x.rangeBand())
                .attr("y", function(d) { return that.y(d.percentage); })
                .attr("height", function(d) { return that.iHeight - that.y(d.percentage); });

        },

        prepareWinrateChart : function(){
            if(this.aWinrates){
                this.switchToWinrateChart();
            } else {
                var that = this;
                $.get("http://localhost:5433/winrates", function( data ) {
                    that.aWinrates = JSON.parse(data);  
                    that.switchToWinrateChart();
                });
            }
        },

        prepareBanrateChart : function(){
            if(this.aBanrates){
                this.switchToBanrateChart();
            } else {
                var that = this;
                $.get("http://localhost:5433/banrates", function( data ) {
                    that.aBanrates = JSON.parse(data);  
                    that.switchToBanrateChart();
                });
            }
        },

        switchToBanrateChart : function(){
            var that = this;
            this.x.domain(this.aBanrates.map(function(d) { return d.name; }))
            this.y.domain([0, d3.max(this.aBanrates, function(d) { return d.percentage; })]);
            this.field.select(".y.axis").transition().duration(1000).call(this.yAxis);
            this.field.select(".x.axis").transition().duration(1000).call(this.xAxis).selectAll("text").attr("y", -4).attr("x", 40).style("text-anchor", "start");
            this.tip.html(function(d) { 
                    return "<strong>Banrate:</strong> <span style='color:red'>" + d3.format("3.3%")(d.percentage) + "</span>";
                });
            this.field.selectAll(".bar")
                .data(this.aBanrates)
                .transition().duration(1000)
                .attr("class", function(d){
                    return "bar "+d.name;
                })
                .attr("x", function(d) { return that.x(d.name); })
                .attr("width", this.x.rangeBand())
                .attr("height", function(d) { return that.iHeight - that.y(d.percentage); })
                .attr("y", function(d) { return that.y(d.percentage); });
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

            $.get("http://localhost:5433/winrates", function( data ) {
                that.aWinrates = JSON.parse(data); 
                console.log(that.aWinrates.length)
                that.createScalesAndAxes();
        
                that.svg.call(that.oZoom);

                that.field = that.svg.append("g")
                    .classed(".field", true)
                    .attr("transform", "translate(" + that.oMargin.left + "," + that.oMargin.top + ")");

                that.field.call(that.tip);

                var oChampionWinrates = that.field.selectAll(".bar")
                    .data(that.aWinrates)
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
                        .attr("y", -4)
                        .attr("x", 40)
                        .style("text-anchor", "start")
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

                that.field.selectAll(".x.axis .tick")
                    .append("svg:image")
                    .attr("class", function(d){
                        return "img_"+d;
                    })
                    .attr('x',-10)
                    .attr('y',-30)
                    .attr('height', 20)
                    .attr('width', 20)
                    .attr("xlink:href",function(d){
                        return "http://ddragon.leagueoflegends.com/cdn/5.6.1/img/champion/" + d + ".png";
                    });
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