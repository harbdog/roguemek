/**
 * Generates a laser beam with some effects
 */
(function() {
"use strict";

function Laser(config) {
	this.Shape_constructor();
	
	this.conf = {
		laserDuration: 500,
		glowWidth: 3,
		laserWidth: 3,
		laserColor: "#990000",
		glowColor: "#FF0000"
	};
	this.setup(config);
}
var s = createjs.extend(Laser, createjs.Shape);

s.setup = function(config) {
	this.g = this.graphics;
	
	//copying configuration
	for(var opt in config){
		this.conf[opt] = config[opt];
	}
	
	// determine direction for the laser beam sweep randomly using a direction matrix
	var directions = [
	    [0, 1], [1, 0], [1, 1],
	    [0, -1], [-1, 0], [-1, -1],
	    [1, -1], [-1, 1]
	];
	
	var directionArray = directions[getDieRollTotal(1, directions.length) - 1];
	this.directionX = directionArray[0];
	this.directionY = directionArray[1];
};

s.getDuration = function() {
	return this.conf.laserDuration;
}

s.show = function(startX, startY, endX, endY){
	
	this.startX = startX;
	this.startY = startY;
	this.endX = endX;
	this.endY = endY;
	this.on("tick", this.update);
	
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_QUALITY){
		// shadows only at the highest gfx setting
		this.shadow = new createjs.Shadow(this.conf.glowColor, 0, 0, 10);
	}
};

s.update = function(event) {
	//this.uncache();
	
	// use the delta and path projection to determine new X and Y end values for the laser sweep
	var motion = (event.delta / this.getDuration()) * (hexWidth/6);
	
	this.endX += (motion * this.directionX);
	this.endY += (motion * this.directionY);
	
	this.drawLaser(this.startX, this.startY, this.endX, this.endY);
	
	//this.doCache(this.startX, this.startY, this.endX, this.endY);
}

s.hide = function(){
	this.visible = false;
};

s.drawLaser = function(x1, y1, x2, y2){
	this.g.clear();
	
	if(Settings.get(Settings.GFX_CACHING) > Settings.GFX_PERFORMANCE){
		// do not show the laser glow only on the performance level
		this.g.setStrokeStyle(this.conf.glowWidth, "round").beginStroke(this.conf.glowColor).moveTo(x1, y1).lineTo(x2, y2).endStroke();
	}
	
	this.g.setStrokeStyle(this.conf.laserWidth, "round").beginStroke(this.conf.laserColor).moveTo(x1, y1).lineTo(x2, y2).endStroke();
};

s.doCache = function(startX, startY, endX, endY) {
	var cacheX = startX;
	var cacheY = startY;
	var cacheW = endX - startX;
	var cacheH = endY - startY;
	if(startX > endX) {
		cacheX = endX;
		cacheW = startX - endX;
	}
	if(startY > endY) {
		cacheY = endY;
		cacheH = startY - endY;
	}
	
	if(Settings.get(Settings.GFX_CACHING) < Settings.GFX_QUALITY){
		// no caching at the highest gfx setting
		this.cache(cacheX, cacheY, cacheW, cacheH);
	}
};

window.Laser = createjs.promote(Laser, "Shape");
}());
