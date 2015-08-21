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
	this.staticHeatLabel = null;
	this.heatLabel = null;
	this.staticGenDissLabel = null;
	this.heatGenDissLabel = null;
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
	this.staticHeatLabel = new createjs.Text("Heat", "11px Consolas", "#FFFFFF");
	this.staticHeatLabel.x = 5;
	this.staticHeatLabel.y = 0;
	this.addChild(this.staticHeatLabel);
	
	this.heatLabel = new createjs.Text("-", "16px Consolas", "#FFFFFF");
	//this.heatLabel.x = this.staticHeatLabel.x + this.staticHeatLabel.getMeasuredWidth()/2 - this.heatLabel.getMeasuredWidth()/2;
	this.heatLabel.y = this.staticHeatLabel.x/2 + this.staticHeatLabel.getMeasuredHeight();
	this.addChild(this.heatLabel);
	
	// draw static and dynamic heat gen/diss labels
	this.staticGenDissLabel = new createjs.Text("GEN/DISS", "10px Consolas", "#FFFFFF");
	this.staticGenDissLabel.x = this.staticHeatLabel.x*2 + this.width/3 - this.staticGenDissLabel.getMeasuredWidth()/2;
	this.staticGenDissLabel.y = 0;
	this.addChild(this.staticGenDissLabel);
	
	this.heatGenDissLabel = new createjs.Text("+ / -", "10px Consolas", "#FFFFFF");
	//this.heatGenDissLabel.x = this.staticGenDissLabel.x + this.staticGenDissLabel.getMeasuredWidth()/2 -this.heatGenDissLabel.getMeasuredWidth()/2 ;
	this.heatGenDissLabel.y = this.staticGenDissLabel.y + this.staticGenDissLabel.getMeasuredHeight()*1.5;
	this.addChild(this.heatGenDissLabel);
	
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

c.setDisplayedHeat = function(heat, heatGen, heatDiss) {
	if(heat == null) return;
	
	if(heatGen == null) heatGen = "0.0";
	if(heatDiss == null) heatDiss = "0.0";
	
	this.uncache();
	
	this.heatLabel.text = heat;
	this.heatLabel.x = this.staticHeatLabel.x + this.staticHeatLabel.getMeasuredWidth()/2 - this.heatLabel.getMeasuredWidth()/2;
	if(this.heatLabel.x < this.staticHeatLabel.x) {
		this.heatLabel.x = this.staticHeatLabel.x;
	}
	
	this.heatGenDissLabel.text = "+"+heatGen+"/"+"-"+heatDiss;
	this.heatGenDissLabel.x = this.staticGenDissLabel.x + this.staticGenDissLabel.getMeasuredWidth()/2 -this.heatGenDissLabel.getMeasuredWidth()/2 ;
	
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