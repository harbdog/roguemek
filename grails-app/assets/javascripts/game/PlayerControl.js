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
	
	this.background = null;
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
	
	this.background = new createjs.Shape();
	this.addChild(this.background);
	
	this.control = new createjs.Shape();
	this.addChild(this.control);
	
	if(PlayerControl.TYPE_BACKWARD == this.type) {
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_FORWARD == this.type) {
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_LEFT == this.type) {
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_RIGHT == this.type) {
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("1", "16px UbuntuMono");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
		
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_CENTER == this.type) {
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("AP 1", "16px UbuntuMono");
		this.addChild(this.label);
	}
	else if(PlayerControl.TYPE_JUMP == this.type) {
		// show label on top of the control for the AP cost
		this.label = new createjs.Text("JP 1", "16px UbuntuMono");
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = this.label.getMeasuredHeight();
		
		this.addChild(this.label);
	}
	
	this.drawButtonAsActive(false);
	
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	// create hit area (it never needs to be added to display)
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000000").drawRect(0, 0, this.width, this.height).endStroke();
	this.hitArea = hit;
	
	this.update();
}

c.setHighlighted = function(highlight) {
	if(highlight) {
		this.alpha = 1.0;
	}
	else {
		this.alpha = 0.5;
	}
}

c.setPoints = function(points) {
	if(points < 0) points = "-";
	this.label.text = points;
}

c.drawButtonAsActive = function(active) {
	this.active = active;
	
	var color = Settings.get(Settings.UI_BG_COLOR);
	var borderColor = Settings.get(Settings.UI_PLAYER_COLOR);
	
	if(active) {
		color = borderColor;
		borderColor = Settings.get(Settings.UI_FG_COLOR);
	}
	
	var gList = [this.background, this.control];
	
	if(PlayerControl.TYPE_BACKWARD == this.type) {
		for(var i=0; i<gList.length; i++) {
			var g = gList[i].graphics;
			g.clear();
			
			if(i == 0) {
				// background is fill color only
				g = g.beginFill(color);
			}
			else {
				// outline is stroke color only
				g = g.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor);
			}
			g.moveTo(0, 0).lineTo(this.width/4, 0)
				.lineTo(this.width/4, this.height/4)
				.lineTo(3*this.width/4, this.height/4)
				.lineTo(3*this.width/4, 0)
				.lineTo(this.width, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width/2, 7*this.height/8)
				.lineTo(0, this.height/2)
				.lineTo(0, 0).endFill();
		}
	}
	else if(PlayerControl.TYPE_FORWARD == this.type) {
		for(var i=0; i<gList.length; i++) {
			var g = gList[i].graphics;
			g.clear();
			
			if(i == 0) {
				// background is fill color only
				g = g.beginFill(color);
			}
			else {
				// outline is stroke color only
				g = g.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor);
			}
			g.moveTo(0, this.height/2).lineTo(this.width/2, this.height/8)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width, this.height)
				.lineTo(3*this.width/4, this.height)
				.lineTo(3*this.width/4, 3*this.height/4)
				.lineTo(this.width/4, 3*this.height/4)
				.lineTo(this.width/4, this.height)
				.lineTo(0, this.height)
				.lineTo(0, this.height/2).endFill();
		}	
	}
	else if(PlayerControl.TYPE_LEFT == this.type) {
		for(var i=0; i<gList.length; i++) {
			var g = gList[i].graphics;
			g.clear();
			
			if(i == 0) {
				// background is fill color only
				g = g.beginFill(color);
			}
			else {
				// outline is stroke color only
				g = g.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor);
			}
			g.moveTo(1*this.width/8, this.height/2).lineTo(this.width/2, 0)
				.lineTo(this.width, 0)
				.lineTo(this.width, this.height/4)
				.lineTo(3*this.width/4, this.height/4)
				.lineTo(3*this.width/4, this.height)
				.lineTo(this.width/2, this.height)
				.lineTo(1*this.width/8, this.height/2).endFill();
		}
	}
	else if(PlayerControl.TYPE_RIGHT == this.type) {
		for(var i=0; i<gList.length; i++) {
			var g = gList[i].graphics;
			g.clear();
			
			if(i == 0) {
				// background is fill color only
				g = g.beginFill(color);
			}
			else {
				// outline is stroke color only
				g = g.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor);
			}
			g.moveTo(0, 0).lineTo(this.width/2, 0)
				.lineTo(7*this.width/8, this.height/2)
				.lineTo(this.width/2, this.height)
				.lineTo(this.width/4, this.height)
				.lineTo(this.width/4, this.height/4)
				.lineTo(0, this.height/4)
				.lineTo(0, 0).endFill();
		}
	}
	else if(PlayerControl.TYPE_CENTER == this.type) {
		this.drawCenterAsFireButton(this.drawAsFire, active);
	}
	else if(PlayerControl.TYPE_JUMP == this.type) {
		for(var i=0; i<gList.length; i++) {
			var g = gList[i].graphics;
			g.clear();
			
			if(i == 0) {
				// background is fill color only
				g = g.beginFill(color);
			}
			else {
				// outline is stroke color only
				g = g.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor);
			}
			g.moveTo(0, this.height/2).lineTo(this.width/2, 0)
				.lineTo(this.width, this.height/2)
				.lineTo(this.width, this.height)
				.lineTo(3*this.width/4, 3*this.height/5)
				.lineTo(this.width/2, 4*this.height/5)
				.lineTo(this.width/4, 3*this.height/5)
				.lineTo(0, this.height)
				.lineTo(0, this.height/2).endFill();
		}
	}
}

c.drawCenterAsFireButton = function(drawAsFire, active) {
	if(this.type != PlayerControl.TYPE_CENTER) return;
	if(drawAsFire == null) drawAsFire = false;
	this.drawAsFire = drawAsFire;
	
	var color = Settings.get(Settings.UI_BG_COLOR);
	var borderColor = this.drawAsFire ? Settings.get(Settings.UI_ENEMY_COLOR) : Settings.get(Settings.UI_PLAYER_COLOR);
	
	if(active) {
		color = borderColor;
		borderColor = Settings.get(Settings.UI_FG_COLOR);
	}
	
	if(drawAsFire){
		this.control.graphics.clear();
		this.background.graphics.clear();
		
		this.background.graphics.beginFill(color)
				.drawRect(0, 0, this.width, this.height).endFill();
		
		this.control.graphics.setStrokeStyle(BORDER_WIDTH*2, "square").beginStroke(borderColor)
				.moveTo(0, 0).lineTo(this.width/6, 0)
				.moveTo(0, 0).lineTo(0, this.height/6)
				
				.moveTo(this.width, 0).lineTo(this.width-this.width/6, 0)
				.moveTo(this.width, 0).lineTo(this.width, this.height/6)
				
				.moveTo(0, this.height).lineTo(this.width/6, this.height)
				.moveTo(0, this.height).lineTo(0, this.height-this.height/6)
				
				.moveTo(this.width, this.height).lineTo(this.width-this.width/6, this.height)
				.moveTo(this.width, this.height).lineTo(this.width, this.height-this.height/6).endStroke();
		
		// show label on top of the control for the AP cost
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
	}
	else{
		this.control.graphics.clear();
		this.background.graphics.clear();
		
		this.background.graphics.beginFill(color)
				.drawCircle(this.width/2, this.height/2, 2*this.width/5).endFill();
		
		this.control.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(borderColor)
				.drawCircle(this.width/2, this.height/2, 2*this.width/5).endStroke();
		
		// show label on top of the control for the AP cost
		this.label.x = (this.width - this.label.getMeasuredWidth()) / 2;
		this.label.y = (this.height - this.label.getMeasuredHeight()*1.5) / 2;
	}
}

c.update = function() {
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.label.color = Settings.get(Settings.UI_FG_COLOR);
	this.drawButtonAsActive(this.active);
}

c.toString = function() {
	return "[Control@"+this.x+","+this.y+": "+this.type+"]";
}

window.PlayerControl = createjs.promote(PlayerControl, "Container");
}());