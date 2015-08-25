/**
 * Class for displaying player touch controls
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 75;
var DEFAULT_HEIGHT = 50;
var BORDER_WIDTH = 2;

function PlayerControl(type) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	this.type = type;
	
	this.control = null;
	this.label = null;
}
var c = createjs.extend(PlayerControl, createjs.Container);

// static variables
PlayerControl.TYPE_FORWARD = "FORWARD";
PlayerControl.TYPE_BACKWARD = "BACKWARD";
PlayerControl.TYPE_LEFT = "LEFT";
PlayerControl.TYPE_RIGHT = "RIGHT";
PlayerControl.TYPE_CENTER = "CENTER";
PlayerControl.TYPE_JUMP = "JUMP";

c.init = function() {
	
	// TODO: allow custom UI colors
	var color = "#3399FF";
	
	if(PlayerControl.TYPE_BACKWARD == this.type) {
		this.control = new createjs.Shape();
		this.control.graphics.beginFill(color)
				.moveTo(0, 0).lineTo(this.width/4, 0)
				.lineTo(this.width/4, this.height/4)
				.lineTo(3*this.width/4, this.height/4)
				.lineTo(3*this.width/4, 0)
				.lineTo(this.width, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width/2, 7*this.height/8)
				.lineTo(0, this.height/2)
				.lineTo(0, 0).endFill();
		
		// give the control a glow
		var glowColor = shadeColor(color, 0.75);
		this.control.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px Consolas", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_FORWARD == this.type) {
		this.control = new createjs.Shape();
		this.control.graphics.beginFill(color)
				.moveTo(0, this.height/2).lineTo(this.width/2, this.height/8)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width, this.height)
				.lineTo(3*this.width/4, this.height)
				.lineTo(3*this.width/4, 3*this.height/4)
				.lineTo(this.width/4, 3*this.height/4)
				.lineTo(this.width/4, this.height)
				.lineTo(0, this.height)
				.lineTo(0, this.height/2).endFill();
				
		// give the control a glow
		var glowColor = shadeColor(color, 0.75);
		this.control.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px Consolas", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_LEFT == this.type) {
		this.control = new createjs.Shape();
		this.control.graphics.beginFill(color)
				.moveTo(1*this.width/8, this.height/2).lineTo(this.width/2, 0)
				.lineTo(this.width, 0)
				.lineTo(this.width, this.height/4)
				.lineTo(3*this.width/4, this.height/4)
				.lineTo(3*this.width/4, this.height)
				.lineTo(this.width/2, this.height)
				.lineTo(1*this.width/8, this.height/2).endFill();
		
		// give the control a glow
		var glowColor = shadeColor(color, 0.75);
		this.control.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px Consolas", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_RIGHT == this.type) {
		this.control = new createjs.Shape();
		this.control.graphics.beginFill(color)
				.moveTo(0, 0).lineTo(this.width/2, 0)
				.lineTo(7*this.width/8, this.height/2)
				.lineTo(this.width/2, this.height)
				.lineTo(this.width/4, this.height)
				.lineTo(this.width/4, this.height/4)
				.lineTo(0, this.height/4)
				.lineTo(0, 0).endFill();
		
		// give the control a glow
		var glowColor = shadeColor(color, 0.75);
		this.control.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px Consolas", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_CENTER == this.type) {
		this.width = 3*hexWidth/4;
		this.height = 3*hexHeight/4;
		
		this.control = new createjs.Shape();
		this.control.graphics.beginFill(color)
				.moveTo(0, this.height/2).lineTo(this.width/4, 0)
				.lineTo(3*this.width/4, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(3*this.width/4, this.height)
				.lineTo(this.width/4, this.height)
				.lineTo(0, this.height/2).endFill();
		
		// give the control a glow
		var glowColor = shadeColor(color, 0.75);
		this.control.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1 AP", "16px Consolas", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_JUMP == this.type) {
		this.control = new createjs.Shape();
		this.control.graphics.beginFill(color)
				.drawPolyStar(this.width/2, this.height/2, this.width/3, 4, 0.6, -90)
				.moveTo(0, this.height/2).lineTo(this.width/2, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width, this.height)
				.lineTo(this.width/2, this.height/4)
				.lineTo(0, this.height)
				.lineTo(0, this.height/2).endFill();
				
		// give the control a glow
		var glowColor = shadeColor(color, 0.75);
		this.control.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1 JP", "16px Consolas", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = this.label.getMeasuredHeight();
		
		this.addChild(this.label);
	}
	
	this.update();
}

c.update = function() {
	// TODO: anything to update?
}

window.PlayerControl = createjs.promote(PlayerControl, "Container");
}());