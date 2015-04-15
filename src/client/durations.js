(function(){
  "use strict";

    var duration = {
    	aMatchDurations : null,
        oMargin : null,
      	iWidth : null,
      	iHeight : null,
      	x : null,
      	y : null,
      	xAxis : null,
      	yAxis : null,
      	svg : null,

    	init : function(){
    		var that = this;
    		$.get("http://localhost:5433/matchduration", function(data) {
                that.aMatchDurations = JSON.parse(data); 
                that.createSVG();
                that.createScalesAndAxes();
                that.createChart();
            });
    	},

    	createChart : function(){
      		var that = this;
            var xPos = 0;
            this.tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-10, 0])
                .html(function(d) { 
                    if(d3.select(d3.event.srcElement).classed("max")){
                        return "<strong>Maximum Duration:</strong> <span style='color:red'>" + (parseInt(d.max/60) + " Minutes, " + parseInt(d.max%60) + " Seconds") + "</span>";
                    } else if (d3.select(d3.event.srcElement).classed("avg")){
                        return "<strong>Average Duration:</strong> <span style='color:red'>" + (parseInt(d.avg/60) + " Minutes, " + parseInt(d.avg%60) + " Seconds") + "</span>";
                    } else if (d3.select(d3.event.srcElement).classed("min")){
                        return "<strong>Minimum Duration:</strong> <span style='color:red'>" + (parseInt(d.min/60) + " Minutes, " + parseInt(d.min%60) + " Seconds") + "</span>";
                    }
                });
    
            this.field = this.svg.append("g")
                .classed("field", true)
                .attr("transform", "translate(" + this.oMargin.left + "," + this.oMargin.top + ")");

            this.field.call(this.tip);

            var oDuration = this.field.selectAll(".bar")
                .data(this.aMatchDurations)
                .enter();
            oDuration.append("rect")
                    .attr("class", function(d){
                        return "bar max "+d.region;
                    })
                    .attr("x", function(d) { 
                        return that.x(d.region); 
                    })
                    .attr("width", this.x.rangeBand())
                    .attr("y", function(d) { return that.y(d.max); })
                    .attr("height", function(d) { return that.iHeight - that.y(d.max); })
                    .on("mouseover", this.tip.show)
                    .on("mouseout", this.tip.hide);
            oDuration.append("rect")
                    .attr("class", function(d){
                        return "bar avg "+d.region;
                    })
                    .attr("x", function(d) { 
                        return that.x(d.region); 
                    })
                    .attr("width", this.x.rangeBand())
                    .attr("y", function(d) { return that.y(d.avg); })
                    .attr("height", function(d) { return that.iHeight - that.y(d.avg); })
                    .on("mouseover", this.tip.show)
                    .on("mouseout", this.tip.hide);
            oDuration.append("rect")
                    .attr("class", function(d){
                        return "bar min "+d.region;
                    })
                    .attr("x", function(d) { 
                        return that.x(d.region); 
                    })
                    .attr("width", this.x.rangeBand())
                    .attr("y", function(d) { return that.y(d.min); })
                    .attr("height", function(d) { return that.iHeight - that.y(d.min); })
                    .on("mouseover", this.tip.show)
                    .on("mouseout", this.tip.hide);

            this.field.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + this.iHeight + ")")
                .call(this.xAxis)

            this.field.append("g")
                .attr("class", "y axis")
                .call(this.yAxis)
                .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Matchduration in Seconds");
    	},

        createScalesAndAxes : function(){
            var that = this;
            this.x = d3.scale.ordinal()
                .domain(this.aMatchDurations.map(function(d) { return d.region; }))
                .rangeRoundBands([0, this.iWidth], .1);
            this.y = d3.scale.linear()
                .range([this.iHeight, 0])
                .domain([0, d3.max(this.aMatchDurations, function(d) { return d.max; })]);
            this.xAxis = d3.svg.axis()
                .scale(this.x)
                .orient("bottom");
            this.yAxis = d3.svg.axis()
                .scale(this.y)
                .orient("left")
        },

      	createSVG : function(){
            this.oMargin = {top: 20, right: 20, bottom: 30, left: 40};
            this.iWidth = 1200 - this.oMargin.left - this.oMargin.right;
            this.iHeight = 500 - this.oMargin.top - this.oMargin.bottom;
          	this.svg = d3.select(".svg_anchor").append("svg")
        		.attr("width", this.iWidth + this.oMargin.left + this.oMargin.right)
        		.attr("height", this.iHeight + this.oMargin.top + this.oMargin.bottom);
       	},
    }

    duration.init();
})();