/**
 * Class for displaying mech armor remaining/total values
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 300;
var DEFAULT_HEIGHT = 75;
var BORDER_WIDTH = 1;

function MechArmorDisplay() {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.background = null;
}
var c = createjs.extend(MechArmorDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = 0.75;
	this.addChild(this.background);
	
	this.SECTION_WIDTH = this.width / 22;
	this.BAR_WIDTH = this.SECTION_WIDTH - 4;
	
	// TODO: allow custom UI colors
	
	// Head
	this.HD = this.createSection("HD", 0);
	this.addChild(this.HD);
	
	// Left Torso/Rear
	this.LTR = this.createSection("LTR", 3);
	this.addChild(this.LTR);
	
	// Center Torso/Rear
	this.CTR = this.createSection("CTR", 6);
	this.addChild(this.CTR);
	
	// Right Torso/Rear
	this.RTR = this.createSection("RTR", 9);
	this.addChild(this.RTR);
	
	// Left Arm
	this.LA = this.createSection("LA", 13);
	this.addChild(this.LA);
	
	// Right Arm
	this.RA = this.createSection("RA", 15);
	this.addChild(this.RA);
	
	// Left Leg
	this.LL = this.createSection("LL", 18);
	this.addChild(this.LL);
	
	// Right Leg
	this.RL = this.createSection("RL", 20);
	this.addChild(this.RL);
	
	this.update();
}

c.createSection = function(text, startIndex) {
	var section = new ArmorSectionDisplay(this.SECTION_WIDTH, DEFAULT_HEIGHT, 
			this.BAR_WIDTH, text, startIndex);
	
	section.x = startIndex * this.SECTION_WIDTH;
	return section;
}

c.setSectionPercent = function(section, index, percent) {
	if(section == null) return;
	this.uncache();
	
	section.setDisplayedPercent(index, percent);
	
	// do NOT cache here because it will cause the bar flashing animations to not work
	//this.doCache();
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	this.background.graphics.setStrokeStyle(BORDER_WIDTH, "round").beginStroke("#C0C0C0").beginFill("#404040")
			.drawRect(0, 0, this.width, this.height);
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.MechArmorDisplay = createjs.promote(MechArmorDisplay, "Container");
}());