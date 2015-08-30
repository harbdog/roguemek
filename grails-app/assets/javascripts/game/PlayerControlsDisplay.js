/**
 * Class for displaying player touch controls
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 250;
var BORDER_WIDTH = 2;

function PlayerControlsDisplay(unit) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = 0;
	
	this.unit = unit;
	
	this.left = null;
	this.right = null;
	this.forward = null;
	this.backward = null;
	this.center = null;
	this.jump = null;
}
var c = createjs.extend(PlayerControlsDisplay, createjs.Container);

c.init = function() {
	
	// TODO: allow custom UI colors
	
	// create the button that moves the unit backward
	this.backward = new PlayerControl(PlayerControl.TYPE_BACKWARD);
	this.backward.init();
	this.addChild(this.backward);
	// add mouse event listener
	this.backward.on("click", handleControls);
	this.backward.mouseChildren = false;
	
	// create the button that rotates the unit left (counter-clockwise)
	this.left = new PlayerControl(PlayerControl.TYPE_LEFT);
	this.left.init();
	this.addChild(this.left);
	// add mouse event listener
	this.left.on("click", handleControls);
	this.left.mouseChildren = false;
	
	// create the button that rotates the unit right (clockwise)
	this.right = new PlayerControl(PlayerControl.TYPE_RIGHT);
	this.right.init();
	this.addChild(this.right);
	// add mouse event listener
	this.right.on("click", handleControls);
	this.right.mouseChildren = false;
	
	// create the central button that shows AP and ends the turn or fires weapons
	this.center = new PlayerControl(PlayerControl.TYPE_CENTER);
	this.center.init();
	this.addChild(this.center);
	// add mouse event listener
	this.center.on("click", handleControls);
	this.center.mouseChildren = false;
	
	// create the button that moves the unit forward
	this.forward = new PlayerControl(PlayerControl.TYPE_FORWARD);
	this.forward.init();
	this.addChild(this.forward);
	// add mouse event listener
	this.forward.on("click", handleControls);
	this.forward.mouseChildren = false;
	
	// create the button that moves the unit forward
	// TODO: only if the unit has jump jets!
	this.jump = new PlayerControl(PlayerControl.TYPE_JUMP);
	this.jump.init();
	this.addChild(this.jump);
	// add mouse event listener
	this.jump.on("click", handleControls);
	this.jump.mouseChildren = false;
	
	// update the container height based on all of the components that were added
	this.height = this.backward.height + this.left.height + this.center.height + this.forward.height + this.jump.height;
	
	this.update();
	
	this.setActionPoints(this.unit.apRemaining);
	this.setJumpPoints(this.unit.jpRemaining);
}

c.update = function() {
	this.uncache();
	
	// position the backward button at the bottom center
	this.backward.x = (this.width - this.backward.width) / 2;
	this.backward.y = this.height - this.backward.height;
	
	// position the left button at the left above the backward button
	this.left.x = 0;
	this.left.y = -10+ this.backward.y - this.left.height;
	
	// position the right button at the right above the backward button
	this.right.x = this.width - this.right.width;
	this.right.y = -10+ this.backward.y - this.right.height;
	
	// position the center button above the backward button
	this.center.x = (this.width - this.center.width) / 2;
	this.center.y = -10+ this.backward.y - this.center.height;
	
	// position the forward button above the center button
	this.forward.x = (this.width - this.forward.width) / 2;
	this.forward.y = -10+ this.center.y - this.forward.height;
	
	if(this.jump != null) {
		// position the jump button above the forward button
		this.jump.x = (this.width - this.jump.width) / 2;
		this.jump.y = this.forward.y - this.jump.height;
	}
	
	this.doCache();
}

c.setActionPoints = function(ap) {
	this.center.setPoints("AP "+ap);
	
	this.update();
}

c.setJumpPoints = function(jp) {
	if(this.jump != null) {
		this.jump.setPoints("JP "+jp);
	}
	
	this.update();
}

c.drawCenterAsFireButton = function(drawAsFire) {
	if(this.center == null) return;
	
	this.uncache;
	
	this.center.drawCenterAsFireButton(drawAsFire);
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.PlayerControlsDisplay = createjs.promote(PlayerControlsDisplay, "Container");
}());