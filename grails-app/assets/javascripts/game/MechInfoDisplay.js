/**
 * Class for displaying basic mech information
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 300;
var DEFAULT_HEIGHT = 50;
var BORDER_WIDTH = 3;

function MechInfoDisplay(unit) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.unit = unit;
	
	this.background = null;
}
var c = createjs.extend(MechInfoDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = 0.75;
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	// create static unit labels for mech name/chassis, and pilot
	var staticUnitLabel = new createjs.Text(this.unit.name +" " + this.unit.chassisVariant, "14px Consolas", "#FFFFFF");
	staticUnitLabel.x = 5;
	staticUnitLabel.y = 0;
	this.addChild(staticUnitLabel);
	
	var staticPilotLabel = new createjs.Text(this.unit.callsign, "12px Consolas", "#FFFFFF");
	staticPilotLabel.x = 5;
	staticPilotLabel.y = staticUnitLabel.y + staticUnitLabel.getMeasuredHeight() * 2;
	this.addChild(staticPilotLabel);
	
	this.update();
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	this.background.graphics.beginFill("#404040")
			.drawRect(0, 0, this.width, this.height)
			.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke("#C0C0C0")
			.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.MechInfoDisplay = createjs.promote(MechInfoDisplay, "Container");
}());