/**
 * Class for displaying each Unit in a displayed list
 */
(function() {
"use strict";

function ListUnitDisplay(unitDisplay) {
	this.Container_constructor();
	
	this.unitDisplay = unitDisplay;
	this.unit = unitDisplay.getUnit();
	this.image = unitDisplay.getImage();
	
	this.background = null;
	this.scale = 0.5;
}
var c = createjs.extend(ListUnitDisplay, createjs.Container);

c.init = function() {
	this.uncache();
	
	// create background shape with color
	this.background = new createjs.Shape();
	this.addChild(this.background);
	
	// load the unit image as a Bitmap
	var unitImg = new createjs.Bitmap(this.image);
	unitImg.scaleX = this.scale;
	unitImg.scaleY = this.scale;
	this.addChild(unitImg);
	
	this.setSelected(isTurnUnit(this.unit));
	
	// TODO: cache the object
	//this.cache(0,0, 0,0);
}

c.setSelected = function(selected) {
	this.uncache();
	this.background.graphics.clear();
	
	// TODO: allow customization of the player unit indicator color
	if(selected) {
		this.background.graphics.setStrokeStyle(3, "round").beginStroke("#C0C0C0").beginFill("#3399FF").drawRect(0, 0,
				this.image.width * this.scale, this.image.height * this.scale);
	}
	else{
		this.background.graphics.setStrokeStyle(3, "round").beginStroke("#C0C0C0").beginFill("#404040").drawRect(0, 0,
				this.image.width * this.scale, this.image.height * this.scale);
	}
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