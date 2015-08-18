/**
 * Class for displaying each Unit in a displayed list
 */
(function() {
"use strict";

var BORDER_WIDTH = 3;

function ListUnitDisplay(unitDisplay) {
	this.Container_constructor();
	
	this.unitDisplay = unitDisplay;
	this.unit = unitDisplay.getUnit();
	this.image = unitDisplay.getImage();
	
	this.background = null;
	this.scale = 0.5;
	this.BORDER_WIDTH = BORDER_WIDTH;
}
var c = createjs.extend(ListUnitDisplay, createjs.Container);

c.init = function() {
	this.scaleX = this.scale;
	this.scaleY = this.scale;
	
	// create background shape with color
	this.background = new createjs.Shape();
	this.background.alpha = 0.75;
	this.addChild(this.background);
	
	// load the unit image as a Bitmap
	var unitImg = new createjs.Bitmap(this.image);
	this.addChild(unitImg);
	
	this.setSelected(isTurnUnit(this.unit));
}

c.setSelected = function(selected) {
	this.uncache();
	this.background.graphics.clear();
	
	// TODO: allow customization of the player unit indicator color
	if(selected) {
		/*this.background.graphics.setStrokeStyle(BORDER_WIDTH, "round").beginStroke("#C0C0C0").beginFill("#404040")
				.drawRect(0, 0, this.image.width, this.image.height);*/
		this.background.graphics.setStrokeStyle(BORDER_WIDTH, "round").beginStroke("#C0C0C0").beginFill("#404040")
				.moveTo(this.image.width, this.image.height)
				.lineTo(0, this.image.height)
				.lineTo(0, 0)
				.lineTo(this.image.width, 0)
				.endStroke();
	}
	else{
		this.background.graphics.setStrokeStyle(BORDER_WIDTH, "round").beginStroke("#C0C0C0")
				.drawRect(0, 0, this.image.width, this.image.height);
	}
	
	// cache the object
	this.doCache();
}

c.getDisplayWidth = function() {
	return this.image.width * this.scale;
}

c.getDisplayHeight = function() {
	return this.image.height * this.scale;
}

c.doCache = function() {
	this.cache(-BORDER_WIDTH, -BORDER_WIDTH, 
			BORDER_WIDTH + this.image.width, BORDER_WIDTH + this.image.height);
}

c.toString = function() {
	return "[ListUnitDisplay@"+this.x+","+this.y+"]";
}

window.ListUnitDisplay = createjs.promote(ListUnitDisplay, "Container");
}());