/**
 * Generates a laser beam with some effects
 */
function Laser(config) {
	this.conf = {
		glowWidth: 3,
		laserWidth: 3,
		laserColor: "#990000",
		glow: true,
		glowColor: "#FF0000"
	};
	this.initialize(config);
}
Laser.prototype = new createjs.Shape();
Laser.prototype.Shape_initialize = Laser.prototype.initialize;
Laser.prototype.initialize = function(config) {
	this.Shape_initialize();
	
	this.g = this.graphics;
	
	//copying configuration
	for(var opt in config){
		this.conf[opt] = config[opt];
	}
}
Laser.prototype.show = function(startX, startY, endX, endY){
	this.uncache();
	if(this.conf.glow) {
		this.shadow = new createjs.Shadow(this.conf.glowColor, 0, 0, 10);
	}
	this.drawLaser(startX, startY, endX, endY);
	this.doCache(startX, startY, endX, endY);
}
Laser.prototype.hide = function(){
	this.visible = false;
}
Laser.prototype.drawLaser = function(x1, y1, x2, y2){
	if(this.conf.glow) {
		this.g.setStrokeStyle(this.conf.glowWidth, "round").beginStroke(this.conf.glowColor).moveTo(x1, y1).lineTo(x2, y2).endStroke();
	}
	
	this.g.setStrokeStyle(this.conf.laserWidth, "round").beginStroke(this.conf.laserColor).moveTo(x1, y1).lineTo(x2, y2).endStroke();
}
Laser.prototype.doCache = function(startX, startY, endX, endY) {
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
}