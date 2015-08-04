/**
 * Generates a laser beam with some effects
 */
(function() {
	
function Laser(config) {
	this.Shape_constructor();
	
	this.conf = {
		glowWidth: 3,
		laserWidth: 3,
		laserColor: "#990000",
		glow: true,
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
};

s.show = function(startX, startY, endX, endY){
	this.uncache();
	
	this.drawLaser(startX, startY, endX, endY);
	this.doCache(startX, startY, endX, endY);
	
	if(this.conf.glow) {
		this.shadow = new createjs.Shadow(this.conf.glowColor, 0, 0, 10);
	}
};

s.hide = function(){
	this.visible = false;
};

s.drawLaser = function(x1, y1, x2, y2){
	if(this.conf.glow) {
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
	
	this.cache(cacheX, cacheY, cacheW, cacheH);
};

window.Laser = createjs.promote(Laser, "Shape");
}());
