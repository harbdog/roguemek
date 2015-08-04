/**
 * Generates a missile with some effects
 */
(function() {
	
function Missile(x, y, angle, config) {
	this.Container_constructor();
	
	this.conf = {
		missileLength: 10,
		missileWidth: 2,
		missileColor: "#333333",
		burnerRadius: 2.5,
		burnerColor: "#FF9900",
		burnerGlowSize: 20,
		burnerGlowColor: "#FF3300"
	};
	this.setup(x, y, angle, config);
}
var c = createjs.extend(Missile, createjs.Container);

c.setup = function(x, y, angle, config) {
	this.x = x;
	this.y = y;
	this.angle = angle;
	
	//copying configuration
	for(var opt in config){
		this.conf[opt] = config[opt];
	}
	
	// TODO: update needs to be run on tick to give LRMs a curved flight path
	//this.on("tick", this.update);
	this.update();
};

c.update = function() {
	this.uncache();
	
	// draw the missile body as a small line
	var ordinance = new createjs.Shape();
	var ordDestination = getMovementDestination(0, 0, this.conf.missileLength, this.angle);
	ordinance.graphics.setStrokeStyle(this.conf.missileWidth, "round").beginStroke(this.conf.missileColor).moveTo(0, 0).lineTo(ordDestination.x, ordDestination.y).endStroke();
	this.addChild(ordinance);
	
	// draw the afterburner with a glow (shadow)
	var burner = new createjs.Shape();
	var burnLength = -1*(this.conf.burnerRadius);
	var burnDestination = getMovementDestination(0, 0, burnLength, this.angle);
	burner.shadow = new createjs.Shadow(this.conf.burnerGlowColor, burnDestination.x, burnDestination.y, this.conf.burnerLength);
	burner.graphics.beginStroke(this.conf.burnerColor).beginFill(this.conf.burnerColor).drawCircle(0, 0, this.conf.burnerRadius).endStroke();
	this.addChild(burner);
	
	this.doCache(burnDestination.x, burnDestination.y, ordDestination.x, ordDestination.y);
};

c.doCache = function(startX, startY, endX, endY) {
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

window.Missile = createjs.promote(Missile, "Container");
}());
