/**
 * Class for displaying each Projectile
 */
(function() {
"use strict";

function Projectile(weaponPoint, projectileWidth, projectileLength, projectileAngle) {
	this.Shape_constructor();
	
	this.x = weaponPoint.x;
	this.y = weaponPoint.y;
	
	this.projectilePoint = getMovementDestination(0, 0, projectileLength, projectileAngle);
	this.projectileWidth = projectileWidth;
	
	this.setup();
}
var s = createjs.extend(Projectile, createjs.Shape);

s.setup = function() {
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_QUALITY){
		// shadows only at the highest gfx setting
		this.shadow = new createjs.Shadow("#FFCC00", 0, 0, 10);
	}
	
	this.graphics.setStrokeStyle(this.projectileWidth).beginStroke("#FFD700").moveTo(0, 0).lineTo(this.projectilePoint.x, this.projectilePoint.y).endStroke();
}

s.hide = function(){
	this.visible = false;
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

window.Projectile = createjs.promote(Projectile, "Shape");
}());
