/**
 * Class for displaying mech armor remaining/total values
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 300;
var DEFAULT_HEIGHT = 75;
var BORDER_WIDTH = 3;

function MechArmorDisplay() {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.background = null;
	
	this.sections = [];
}
var c = createjs.extend(MechArmorDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.addChild(this.background);
	
	this.SECTION_WIDTH = this.width / 22;
	this.BAR_WIDTH = this.SECTION_WIDTH - 4;
	
	// TODO: allow custom UI colors
	
	// Head
	this.HD = this.createSection("HD", 0);
	this.addChild(this.HD);
	this.sections.push(this.HD);
	
	// Left Torso/Rear
	this.LTR = this.createSection("LTR", 3);
	this.addChild(this.LTR);
	this.sections.push(this.LTR);
	
	// Center Torso/Rear
	this.CTR = this.createSection("CTR", 6);
	this.addChild(this.CTR);
	this.sections.push(this.CTR);
	
	// Right Torso/Rear
	this.RTR = this.createSection("RTR", 9);
	this.addChild(this.RTR);
	this.sections.push(this.RTR);
	
	// Left Arm
	this.LA = this.createSection("LA", 13);
	this.addChild(this.LA);
	this.sections.push(this.LA);
	
	// Right Arm
	this.RA = this.createSection("RA", 15);
	this.addChild(this.RA);
	this.sections.push(this.RA);
	
	// Left Leg
	this.LL = this.createSection("LL", 18);
	this.addChild(this.LL);
	this.sections.push(this.LL);
	
	// Right Leg
	this.RL = this.createSection("RL", 20);
	this.addChild(this.RL);
	this.sections.push(this.RL);
	
	this.update();
}

c.createSection = function(text, startIndex) {
	var section = new ArmorSectionDisplay(
			this,
			this.SECTION_WIDTH, this.height, 
			this.BAR_WIDTH, text, startIndex);
	
	section.x = startIndex * this.SECTION_WIDTH;
	return section;
}

c.setSectionPercent = function(section, index, percent, doAnimate) {
	if(section == null) return;
	this.uncache();
	
	var doCache = true;
	if(doAnimate) {
		doCache = false;
	}
	section.setDisplayedPercent(index, percent, doAnimate);
	
	if(doCache) {
		//this.doCache();
	}
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	this.background.graphics.beginFill(Settings.get(Settings.UI_BG_COLOR))
			.drawRect(0, 0, this.width, this.height)
			.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
	
	$.each(this.sections, function(index, section) {
		section.update();
	});
	
	//this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.MechArmorDisplay = createjs.promote(MechArmorDisplay, "Container");
}());