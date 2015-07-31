/**
 * Class for displaying each Projectile
 */
(function() {
	
function Projectile(x, y) {
	this.Shape_constructor();
	
	this.x = x;
	this.y = y;
}
var s = createjs.extend(Projectile, createjs.Shape);

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
	
	this.cache(cacheX, cacheY, cacheW, cacheH);
};

window.Projectile = createjs.promote(Projectile, "Shape");
}());