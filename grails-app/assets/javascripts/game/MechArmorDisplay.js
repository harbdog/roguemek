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
	var section = new createjs.Container();
	section.x = startIndex * this.SECTION_WIDTH;
	
	var label = new createjs.Text(text, "11px Consolas", "#FFFFFF");
	label.x = (text.length * this.SECTION_WIDTH - label.getMeasuredWidth())/2;
	label.y = this.height - label.getMeasuredHeight()*2;
	section.addChild(label);
	
	var barHeight = label.y - 4;
	
	// The first bar is full height for external armor
	var barOutline = new createjs.Shape();
	barOutline.graphics.setStrokeStyle(2, "square").beginStroke("#FFFFFF")
			.drawRect(this.SECTION_WIDTH-this.BAR_WIDTH, 1+BORDER_WIDTH, 
					this.BAR_WIDTH, barHeight);
	section.addChild(barOutline);
	
	// second bar is 1/2 height for internal armor
	var barOutline2 = new createjs.Shape();
	barOutline2.graphics.setStrokeStyle(2, "square").beginStroke("#FFFFFF")
			.drawRect(1*this.SECTION_WIDTH+BORDER_WIDTH, 1+BORDER_WIDTH+barHeight/2, 
					this.BAR_WIDTH, barHeight/2);
	section.addChild(barOutline2);
	
	// third bar, if there is one, is full height for rear armor
	if(text.length > 2) {
		var barOutline3 = new createjs.Shape();
		barOutline3.graphics.setStrokeStyle(2, "square").beginStroke("#FFFFFF")
				.drawRect(2*this.SECTION_WIDTH-BORDER_WIDTH, 1+BORDER_WIDTH, 
						this.BAR_WIDTH, barHeight);
		section.addChild(barOutline3);
	}
	
	return section;
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