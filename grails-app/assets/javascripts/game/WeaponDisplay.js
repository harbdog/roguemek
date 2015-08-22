/**
 * Class for displaying mech armor remaining/total values
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 150;
var DEFAULT_HEIGHT = 25;
var BORDER_WIDTH = 3;

function WeaponDisplay(index, weapon) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.index = index;
	this.weapon = weapon;
	
	this.background = null;
}
var c = createjs.extend(WeaponDisplay, createjs.Container);

// static variables
WeaponDisplay.DEFAULT_WIDTH = DEFAULT_WIDTH;
WeaponDisplay.DEFAULT_HEIGHT = DEFAULT_HEIGHT;

c.init = function() {
	this.background = new createjs.Shape();
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	// TESTING: placeholder text while size/position is being adjusted
	var numLabel = new createjs.Text((this.index+1)+" "+this.weapon.shortName, "14px Consolas", "#FFFFFF");
	numLabel.x = 5;
	numLabel.y = 5;
	this.addChild(numLabel);
	
	this.update();
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	this.background.graphics.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke("#C0C0C0")
			.drawRect(0, 0, this.width, this.height).endStroke();
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.WeaponDisplay = createjs.promote(WeaponDisplay, "Container");
}());