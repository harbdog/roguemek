/**
 * Class for displaying mech armor remaining/total values
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 300;
var DEFAULT_HEIGHT = 50;
var BORDER_WIDTH = 3;

function MechHeatDisplay() {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.background = null;
	this.staticHeatBar = null;
	this.heatMask = null;
	this.heatLabel = null;
}
var c = createjs.extend(MechHeatDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = 0.75;
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	// draw static heat bar with dynamic mask
	this.staticHeatBar = new createjs.Shape();
	this.staticHeatBar.alpha = 1.0;
	this.staticHeatBar.graphics.beginLinearGradientFill(["#3399FF","#FF0000"], [0, 1], 0, 0, 3*this.width/4, this.height)
			.moveTo(0, 4*this.height/5)
			.quadraticCurveTo(5*this.width/8, 7*this.height/8, this.width, 0)
			.lineTo(this.width, this.height)
			.lineTo(0, this.height);
	
	this.heatMask = new createjs.Shape();
	this.heatMask.graphics.drawRect(0, 0, this.width, this.height);
	this.staticHeatBar.mask = this.heatMask;
	
	this.addChild(this.staticHeatBar);
	
	// draw static and dynamic heat labels
	var staticHeatLabel = new createjs.Text("Heat", "11px Consolas", "#FFFFFF");
	staticHeatLabel.x = 5;
	staticHeatLabel.y = 0;
	this.addChild(staticHeatLabel);
	
	this.heatLabel = new createjs.Text("-", "16px Consolas", "#FFFFFF");
	this.heatLabel.x = 5 + staticHeatLabel.getMeasuredWidth()/2 - this.heatLabel.getMeasuredWidth()/2;
	this.heatLabel.y = 5/2 + staticHeatLabel.getMeasuredHeight();
	this.addChild(this.heatLabel);
	
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

c.setDisplayedHeat = function(heat) {
	this.uncache();
	
	this.heatLabel.text = heat;
	this.staticHeatBar.alpha = 0.5 + 0.5 * heat/30;
	this.heatMask.graphics.clear();
	this.heatMask.graphics.drawRect(0, 0, this.width * (heat / 30), this.height);
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.MechHeatDisplay = createjs.promote(MechHeatDisplay, "Container");
}());