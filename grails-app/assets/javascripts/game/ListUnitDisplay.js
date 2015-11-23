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
	this.foreground = null;
	this.armorBar = null;
	this.scale = 0.5;
}
var c = createjs.extend(ListUnitDisplay, createjs.Container);

c.init = function() {
	this.scaleX = this.scale;
	this.scaleY = this.scale;
	
	// create background shape with color
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.addChild(this.background);
	
	// create foreground shape for the outline
	this.foreground = new createjs.Shape();
	this.addChild(this.foreground);
	
	// load the unit image as a Bitmap
	var unitImg = new createjs.Bitmap(this.image);
	this.addChild(unitImg);
	
	// create armor bar with total percent of armor/internals remaining
	this.armorBar = new createjs.Shape();
	this.armorBar.x = 0;
	this.armorBar.y = 0;
	this.addChild(this.armorBar);
	
	this.setSelected(isTurnUnit(this.unit));
	this.updateArmorBar(false);
}

c.updateArmorBar = function(doAnimate) {
	if(this.unit == null || this.unit.initialArmor == null) return;
	
	this.uncache();
	this.armorBar.graphics.clear();
	
	var currentArmor = 0;
	var totalArmor = 0;
	
	for(var index=0; index<this.unit.initialArmor.length; index++){
		var initialArmor = this.unit.initialArmor[index];
		var thisArmor = this.unit.armor[index];
		
		currentArmor += thisArmor;
		totalArmor += initialArmor;
	}
	
	for(var index=0; index<this.unit.initialInternals.length; index++){
		var initialInternal = this.unit.initialInternals[index];
		var thisInternal = this.unit.internals[index];
		
		currentArmor += thisInternal;
		totalArmor += initialInternal;
	}
	
	var borderColor = "#C0C0C0";
	if(this.unit.isDestroyed()) {
		// unit is destroyed, show 0% and red outline
		currentArmor = 0;
		borderColor = "#FF0000";
	}
	
	var percentArmor = (currentArmor/totalArmor);
	
	// blend color as percent goes down
	var barColor = blendColors("#FF0000", "#3399FF", percentArmor);
	this.armorBar.graphics.beginFill(barColor)
			.drawRect(this.image.width/8, 10*this.image.height/12, percentArmor * (6*this.image.width/8), this.image.height/8)
			.endFill()
			.setStrokeStyle(2, "round").beginStroke(borderColor)
			.drawRect(this.image.width/8, 10*this.image.height/12, 6*this.image.width/8, this.image.height/8)
			.endStroke();
	
	createjs.Tween.removeTweens(this);
	if(doAnimate && percentArmor > 0 && percentArmor < 1) {
		createjs.Tween.get(this)
				.to({alpha: 0.5}, 250)
				.to({alpha: 1.0}, 250)
				.to({alpha: 0.5}, 250)
				.to({alpha: 1.0}, 250)
				.to({alpha: 0.5}, 250)
				.to({alpha: 1.0}, 250)
				.call(callDoCache, null, this)
				.addEventListener("change", function() {
					update = true;
				});
	}
}

c.setSelected = function(selected, isOtherUnit) {
	this.uncache();
	this.foreground.graphics.clear();
	this.background.graphics.clear();
	
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	// TODO: allow customization of the player/enemy unit indicator color
	if(selected && isOtherUnit){
		this.background.graphics.beginFill("#404040")
				.drawRect(0, 0, this.image.width, this.image.height)
				.endFill();
		this.foreground.graphics.setStrokeStyle(BORDER_WIDTH*3, "square").beginStroke("#FF0000")
				.moveTo(0, this.image.height)
				.lineTo(0, 0)
				.lineTo(this.image.width, 0)
				.endStroke();
	}
	else if(selected) {
		this.background.graphics.beginFill("#404040")
				.drawRect(0, 0, this.image.width, this.image.height)
				.endFill();
		this.foreground.graphics.setStrokeStyle(BORDER_WIDTH*3, "square").beginStroke("#3399FF")
				.moveTo(0, this.image.height)
				.lineTo(0, 0)
				.lineTo(this.image.width, 0)
				.endStroke();
	}
	else{
		this.background.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke("#C0C0C0")
				.drawRect(0, 0, this.image.width, this.image.height);
	}
	
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