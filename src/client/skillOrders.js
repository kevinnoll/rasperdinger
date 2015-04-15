(function(){
  "use strict";

    var skillOrder = {
    	aChamps : null,

    	init : function(){
    		var that = this;
    		$.get("http://localhost:5433/champions", function(winrates) {
                that.aChamps = JSON.parse(winrates);  
                that.createGrid();
            });
    	},

    	createGrid : function(){
    		var divSel = d3.select(".svg_anchor").selectAll(".not_existent")
    			.data(this.aChamps)
    			.enter()
				.append("div")
    			.attr("class",function(d){
    				return "flip floated_img img "+d.name;
    			})
    			.style("height", "48px")
    			.style("width", "48px")

    		divSel.append("img")
    			.attr("src", function(d){
    				return "http://ddragon.leagueoflegends.com/cdn/5.7.2/img/champion/"+d.name+".png";
    			})
    			.attr("alt", function(d){
    				return d.name;
    			})
    			.style("max-width", "100%")
    			.style("max-height", "100%")
    			.on("click", function(d){

			        d3.selectAll(".floated_img").classed("css3grayscale1",true);
			        d3.select(".floated_img."+d.name).classed("css3grayscale1", false);
			        d3.select("#container").selectAll("*").remove();
			        d3.select("#sequence").selectAll("*").remove();
			        d3.select("#legend").selectAll("*").remove();
			        SequenceDiagram.create(d);
			        return false;
    			});

    		this.aChamps = null;
    	}
    }

    skillOrder.init()
})();