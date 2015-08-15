/**
 * Class for displaying each Unit in a displayed list
 */
(function() {

function ListUnitDisplay(image) {
	this.Container_constructor();
	
	this.image = image;
}
var c = createjs.extend(ListUnitDisplay, createjs.Container);

c.update = function() {
	this.uncache();
	
	var scale = 0.5;
	
	// create background shape with color
	var background = new createjs.Shape();
	background.graphics.beginStroke("#C0C0C0").beginFill("#404040").drawRect(0, 0,
			this.image.width * scale, this.image.height * scale);
	this.addChild(background);
	
	// load the unit image as a Bitmap
	var unitImg = new createjs.Bitmap(this.image);
	unitImg.scaleX = scale;
	unitImg.scaleY = scale;
	this.addChild(unitImg);
	
	
	// TODO: cache the object
	//this.cache(0,0, 0,0);
}

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
}

c.toString = function() {
	return "[ListUnitDisplay@"+this.x+","+this.y+"]";
}

window.ListUnitDisplay = createjs.promote(ListUnitDisplay, "Container");
}());