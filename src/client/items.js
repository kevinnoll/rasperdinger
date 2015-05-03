(function(){
  "use strict";

    var items = {
        width : 940,
        height : 600,
        layoutGravity : -0.01,
        damper : 0.1,
        nodes : [],
        vis : null,
        force : null,
        circles : null,
        radiusScale : null,
        center : null,
        tip : null,
        fillColor : null,

        init : function(){
            var that = this;
            d3.json("../src/server/data/finalitempicks.json", function( data ) { 
            //$.get("http://localhost:5433/finalitempicks", function( data ) {
                var json = data;  
                that.createChart(json);
                that.create();
            });
        },

        createChart : function(data){

            this.tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset(function(d){
                    return [-10, 0]
                })
                .html(function(d) {
                    var content = "<strong><span style='color:white'>" + d.name + "</span></strong><br/>";
                    content += "<strong>Bought:</strong> <span style='color:red'>" + d3.format("3.3%")(d.percentage) + "</span><br/>";
                    content += "<img src='http://ddragon.leagueoflegends.com/cdn/5.7.2/img/item/"+d.id+".png' alt='"+d.name+"' style='max-width:100%; max-height:100%'>"
                    return content;
                });
            var that = this;

            this.center = {x: this.width / 2, y: this.height / 2};
            this.fillColor = d3.scale.ordinal()
                .domain(["low", "medium", "high"])
                .range(["#d84b2a", "#beccae", "#7aa25c"]);

            var maxAmount = d3.max(data, function(d) { 
                return d.percentage * 100; } 
            );
            this.radiusScale = d3.scale.pow().exponent(0.5).domain([0, maxAmount]).range([2, 85]);
            data.forEach(function(d){
                var node = {
                    id: d.item,
                    radius: that.radiusScale(d.percentage * 100),
                    percentage: d.percentage,
                    amount: d.items,
                    name: d.name,
                    group: function(){
                        if(d.percentage>=0.1){
                            return "high";
                        } else if(d.percentage <0.1 && d.percentage >= 0.04){
                            return "medium";
                        } else{
                            return "low";
                        }
                    }(),
                    x: Math.random() * 900,
                    y: Math.random() * 800
                };
                that.nodes.push(node);
            });

            this.nodes.sort(function(a, b) {return b.value- a.value; });

            this.vis = d3.select(".svg_anchor").append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height)
                    .attr("id", "svg_vis");

            this.circles = this.vis.selectAll("circle")
                         .data(this.nodes, function(d) { return d.id ;});

            this.circles.enter().append("circle")
                .attr("r", 0)
                .classed("bubble",true)
                .attr("fill", function(d) { 
                    return that.fillColor(d.group) ;
                })
                .attr("stroke-width", 2)
                .attr("stroke", function(d) {return d3.rgb(that.fillColor(d.group)).darker();})
                .attr("id", function(d) { return  "bubble_" + d.id; })
                .on("mouseover", this.tip.show )
                .on("mouseout", this.tip.hide );

            this.circles.transition()
                .duration(2000)
                .attr("r", function(d) { return d.radius; });
                    that.circles.call(that.tip);

        },

        create : function(){
            this.force = d3.layout.force()
            .nodes(this.nodes)
            .size([this.width, this.height]);
            this.display();
        },

        display : function() {
            var that = this;
            this.force.gravity(this.layoutGravity)
            .charge(this.charge)
            .friction(0.9)
            .on("tick", function(e) {
                that.circles.each(that.move(e.alpha))
                   .attr("cx", function(d) {return d.x;})
                   .attr("cy", function(d) {return d.y;});
            });
            this.force.start();
        },

        charge : function(d) {
            return -Math.pow(d.radius, 2.0) / 8;
        },

        move : function(alpha) {
            var that = this;
            return function(d) {
                d.x = d.x + (that.center.x - d.x) * (that.damper + 0.02) * alpha;
                d.y = d.y + (that.center.y - d.y) * (that.damper + 0.02) * alpha;
            };
        }
    }

    items.init()
})();
