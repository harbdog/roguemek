/**
 * Class for displaying a mech's heat, heat generation, and heat dissipation
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 300;
var DEFAULT_HEIGHT = 50;
var BORDER_WIDTH = 3;

var MAX_HEAT = 40;

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
	this.heatResultLine = null;
}
var c = createjs.extend(MechHeatDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.addChild(this.background);
	
	// draw heat result line
	this.heatResultLine = new createjs.Shape();
	this.heatResultLine.alpha = 0.75
	this.addChild(this.heatResultLine);
	
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
	this.staticHeatLabel = new createjs.Text("Heat", "11px UbuntuMono");
	this.staticHeatLabel.x = 5;
	this.staticHeatLabel.y = 0;
	this.addChild(this.staticHeatLabel);
	
	this.heatLabel = new createjs.Text("-", "16px UbuntuMono");
	//this.heatLabel.x = this.staticHeatLabel.x + this.staticHeatLabel.getMeasuredWidth()/2 - this.heatLabel.getMeasuredWidth()/2;
	this.heatLabel.y = this.staticHeatLabel.x/2 + this.staticHeatLabel.getMeasuredHeight();
	this.addChild(this.heatLabel);
	
	// draw static and dynamic heat gen/diss labels
	this.staticGenDissLabel = new createjs.Text("GEN/DISS", "10px UbuntuMono");
	this.staticGenDissLabel.x = this.staticHeatLabel.x*2 + this.width/3 - this.staticGenDissLabel.getMeasuredWidth()/2;
	this.staticGenDissLabel.y = 0;
	this.addChild(this.staticGenDissLabel);
	
	this.heatGenDissLabel = new createjs.Text("+ / -", "10px UbuntuMono");
	//this.heatGenDissLabel.x = this.staticGenDissLabel.x + this.staticGenDissLabel.getMeasuredWidth()/2 -this.heatGenDissLabel.getMeasuredWidth()/2 ;
	this.heatGenDissLabel.y = this.staticGenDissLabel.y + this.staticGenDissLabel.getMeasuredHeight()*1.5;
	this.addChild(this.heatGenDissLabel);
	
	this.update();
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	// apply any potentially updated settings
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.staticHeatLabel.color = Settings.get(Settings.UI_FG_COLOR);
	this.heatLabel.color = Settings.get(Settings.UI_FG_COLOR);
	this.staticGenDissLabel.color = Settings.get(Settings.UI_FG_COLOR);
	this.heatGenDissLabel.color = Settings.get(Settings.UI_FG_COLOR);
	
	this.background.graphics.beginFill(Settings.get(Settings.UI_BG_COLOR))
			.drawRect(0, 0, this.width, this.height)
			.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
	
	this.doCache();
}

c.setDisplayedHeat = function(heat, heatGen, heatDiss) {
	if(heat == null) return;
	
	this.uncache();
	
	if(heatGen == null) heatGen = "0.0";
	if(heatDiss == null) heatDiss = "0.0";
	
	// update the heat label
	this.heatLabel.text = heat;
	this.heatLabel.x = this.staticHeatLabel.x + this.staticHeatLabel.getMeasuredWidth()/2 - this.heatLabel.getMeasuredWidth()/2;
	if(this.heatLabel.x < this.staticHeatLabel.x) {
		this.heatLabel.x = this.staticHeatLabel.x;
	}
	
	// update the heat gen/diss label
	this.heatGenDissLabel.text = "+"+heatGen+"/"+"-"+heatDiss;
	this.heatGenDissLabel.x = this.staticGenDissLabel.x + this.staticGenDissLabel.getMeasuredWidth()/2 -this.heatGenDissLabel.getMeasuredWidth()/2 ;
	
	// update the heat bar and its mask
	this.staticHeatBar.alpha = 0.75 + 0.25 * heat/40;
	
	this.heatMask.graphics.clear();
	this.heatMask.graphics.drawRect(0, 0, this.width * (heat / 40), this.height);
	
	// draw the end of turn heat gen/diss result line
	var heatResultColor = "#FFFFFF";
	if(heatGen < heatDiss) {
		heatResultColor = "#3399FF";
	}
	else if(heatGen > heatDiss) {
		heatResultColor = "#FF0000";
	}
	
	var heatResult = (heat +heatGen -heatDiss);
	if(heatResult < 0) {
		heatResult = 0;
	}
	else if(heatResult > MAX_HEAT) {
		heatResult = MAX_HEAT;
	}
	
	this.heatResultLine.graphics.clear();
	this.heatResultLine.graphics.beginFill(heatResultColor)
			.drawRect(0, 0, this.width * (heatResult / MAX_HEAT), this.height);
	
	this.doCache();
}

c.doCache = function() {
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_CACHING_PERFORMANCE){
		// caching only at the lowest gfx setting
		this.cache(0,0, this.width,this.height);
	}
}

window.MechHeatDisplay = createjs.promote(MechHeatDisplay, "Container");
}());