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
	var color = "#404040";
	var borderColor = "#3399FF";
	
	if(PlayerControl.TYPE_BACKWARD == this.type) {
		this.control = new createjs.Shape();
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_FORWARD == this.type) {
		this.control = new createjs.Shape();
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_LEFT == this.type) {
		this.control = new createjs.Shape();
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_RIGHT == this.type) {
		this.control = new createjs.Shape();
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_CENTER == this.type) {
		this.control = new createjs.Shape();
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("AP 1", "16px UbuntuMono", "#FFFFFF");
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_JUMP == this.type) {
		this.control = new createjs.Shape();
		this.addChild(this.control);
		
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("JP 1", "16px UbuntuMono", "#FFFFFF");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = this.label.getMeasuredHeight();
		
		this.addChild(this.label);
	}
	
	this.drawButtonAsActive(false);
	
	this.control.alpha = 0.75;
	
	// create hit area (it never needs to be added to display)
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000000").drawRect(0, 0, this.width, this.height).endStroke();
	this.hitArea = hit;
	
	this.update();
}

c.setPoints = function(points) {
	if(points < 0) points = "-";
	this.label.text = points;
}

c.drawButtonAsActive = function(active) {
	// TODO: allow custom UI colors
	var color = "#404040";
	var borderColor = "#3399FF";
	
	if(active) {
		color = borderColor;
		borderColor = "#FFFFFF";
	}
	
	this.control.graphics.clear();
	
	if(PlayerControl.TYPE_BACKWARD == this.type) {
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor).beginFill(color)
				.moveTo(0, 0).lineTo(this.width/4, 0)
				.lineTo(this.width/4, this.height/4)
				.lineTo(3*this.width/4, this.height/4)
				.lineTo(3*this.width/4, 0)
				.lineTo(this.width, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width/2, 7*this.height/8)
				.lineTo(0, this.height/2)
				.lineTo(0, 0).endFill();
	}
	else if(PlayerControl.TYPE_FORWARD == this.type) {
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor).beginFill(color)
				.moveTo(0, this.height/2).lineTo(this.width/2, this.height/8)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width, this.height)
				.lineTo(3*this.width/4, this.height)
				.lineTo(3*this.width/4, 3*this.height/4)
				.lineTo(this.width/4, 3*this.height/4)
				.lineTo(this.width/4, this.height)
				.lineTo(0, this.height)
				.lineTo(0, this.height/2).endFill();
	}
	else if(PlayerControl.TYPE_LEFT == this.type) {
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor).beginFill(color)
				.moveTo(1*this.width/8, this.height/2).lineTo(this.width/2, 0)
				.lineTo(this.width, 0)
				.lineTo(this.width, this.height/4)
				.lineTo(3*this.width/4, this.height/4)
				.lineTo(3*this.width/4, this.height)
				.lineTo(this.width/2, this.height)
				.lineTo(1*this.width/8, this.height/2).endFill();
	}
	else if(PlayerControl.TYPE_RIGHT == this.type) {
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor).beginFill(color)
				.moveTo(0, 0).lineTo(this.width/2, 0)
				.lineTo(7*this.width/8, this.height/2)
				.lineTo(this.width/2, this.height)
				.lineTo(this.width/4, this.height)
				.lineTo(this.width/4, this.height/4)
				.lineTo(0, this.height/4)
				.lineTo(0, 0).endFill();
	}
	else if(PlayerControl.TYPE_CENTER == this.type) {
		this.drawCenterAsFireButton(this.drawAsFire, active);
	}
	else if(PlayerControl.TYPE_JUMP == this.type) {
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor).beginFill(color)
				.moveTo(0, this.height/2).lineTo(this.width/2, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width, this.height)
				.lineTo(3*this.width/4, 3*this.height/5)
				.lineTo(this.width/2, 4*this.height/5)
				.lineTo(this.width/4, 3*this.height/5)
				.lineTo(0, this.height)
				.lineTo(0, this.height/2).endFill();
	}
}

c.drawCenterAsFireButton = function(drawAsFire, active) {
	if(this.type != PlayerControl.TYPE_CENTER) return;
	if(drawAsFire == null) drawAsFire = false;
	this.drawAsFire = drawAsFire;
	
	// TODO: allow custom UI colors
	var color = "#404040";
	var borderColor = this.drawAsFire ? "#FF0000" : "#3399FF";
	
	if(active) {
		color = borderColor;
		borderColor = "#FFFFFF";
	}
	
	if(drawAsFire){
		this.control.graphics.clear();
		this.control.graphics.beginFill(color)
				.drawRect(0, 0, this.width, this.height).endFill();
		
		this.control.graphics.setStrokeStyle(BORDER_WIDTH*2, "square").beginStroke(borderColor)
				.moveTo(0, 0).lineTo(this.width/6, 0)
				.moveTo(0, 0).lineTo(0, this.height/6)
				
				.moveTo(this.width, 0).lineTo(this.width-this.width/6, 0)
				.moveTo(this.width, 0).lineTo(this.width, this.height/6)
				
				.moveTo(0, this.height).lineTo(this.width/6, this.height)
				.moveTo(0, this.height).lineTo(0, this.height-this.height/6)
				
				.moveTo(this.width, this.height).lineTo(this.width-this.width/6, this.height)
				.moveTo(this.width, this.height).lineTo(this.width, this.height-this.height/6);
		
		// show label on top of the control for the AP cost
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
	}
	else{
		this.control.graphics.clear();
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor).beginFill(color)
				.drawCircle(this.width/2, this.height/2, 2*this.width/5).endFill();
		
		// show label on top of the control for the AP cost
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
	}
}

c.update = function() {
	// TODO: anything to update?
}

c.toString = function() {
	return "[Control@"+this.x+","+this.y+": "+this.type+"]";
}

window.PlayerControl = createjs.promote(PlayerControl, "Container");
}());