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
    		var flip = d3.select(".svg_anchor").selectAll(".not_existent")
    			.data(this.aChamps)
    			.enter()
				.append("div")
    			.attr("class",function(d){
    				return "flip floated_img img "+d.name;
    			})
    			.style("height", "48px")
    			.style("width", "48px")
    		
    		var card = flip.append("div")
    				.classed("card", true);

    		card.append("div")
    					.classed("face front", true)
		    			.append("img")
		    			.attr("src", function(d){
		    				return "http://ddragon.leagueoflegends.com/cdn/5.7.2/img/champion/"+d.name+".png";
		    			})
		    			.attr("alt", function(d){
		    				return d.name;
		    			})
		    			.style("max-width", "100%")
		    			.style("max-height", "100%")
		    			.on("click", function(d){
		    				$(this).find('.card').addClass('flipped').mouseleave(function(){
					            $(this).removeClass('flipped');
					        });

					        d3.selectAll(".floated_img").classed("css3grayscale1",true);
					        d3.select(".floated_img."+d.name).classed("css3grayscale1", false);
					        d3.select("#container").selectAll("*").remove();
					        d3.select("#sequence").selectAll("*").remove();
					        SequenceDiagram.create(d);
					        return false;
		    			});

		    card.append("div")
		    	.classed("face back", true);

    		this.aChamps = null;
    	}
    }

    skillOrder.init()
})();