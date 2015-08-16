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
	// create background shape with color
	this.background = new createjs.Shape();
	this.background.alpha = 0.75;
	this.addChild(this.background);
	
	// load the unit image as a Bitmap
	var unitImg = new createjs.Bitmap(this.image);
	unitImg.scaleX = this.scale;
	unitImg.scaleY = this.scale;
	this.addChild(unitImg);
	
	this.setSelected(isTurnUnit(this.unit));
}

c.setSelected = function(selected) {
	this.uncache();
	this.background.graphics.clear();
	
	var borderWidth = 3;
	
	// TODO: allow customization of the player unit indicator color
	if(selected) {
		this.background.graphics.setStrokeStyle(borderWidth, "round").beginStroke("#C0C0C0").beginFill("#3399FF")
				.drawRect(0, 0, this.image.width * this.scale, this.image.height * this.scale);
	}
	else{
		this.background.graphics.setStrokeStyle(borderWidth, "round").beginStroke("#C0C0C0").beginFill("#404040")
				.drawRect(0, 0, this.image.width * this.scale, this.image.height * this.scale);
	}
	
	// cache the object
	this.cache(-borderWidth,-borderWidth, 
			borderWidth + this.image.width * this.scale,borderWidth + this.image.height * this.scale);
}

c.toString = function() {
	return "[ListUnitDisplay@"+this.x+","+this.y+"]";
}

window.ListUnitDisplay = createjs.promote(ListUnitDisplay, "Container");
}());