/**
 * Class for displaying mech armor remaining/total values
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 200;
var DEFAULT_HEIGHT = 25;
var BORDER_WIDTH = 3;

function WeaponDisplay(index, weapon) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.index = index;
	this.weapon = weapon;
	
	this.background = null;
	this.nameLabel = null;
	this.toHitLabel = null;
}
var c = createjs.extend(WeaponDisplay, createjs.Container);

WeaponDisplay.MAX_NUMBER_LABEL_WIDTH = new createjs.Text("99", "16px Consolas", "#FFFFFF").getMeasuredWidth();

c.init = function() {
	// TODO: allow custom UI colors
	
	// add weapon number label
	var numLabel = new createjs.Text((this.index+1).toString(), "16px Consolas", "#000000");
	numLabel.x = (WeaponDisplay.MAX_NUMBER_LABEL_WIDTH - numLabel.getMeasuredWidth())/2;
	numLabel.y = BORDER_WIDTH;
	this.addChild(numLabel);
	
	// add weapon number label background
	var numBackground = new createjs.Shape();
	numBackground.graphics.beginFill("#FFFFFF")
			.drawRect(0, BORDER_WIDTH, WeaponDisplay.MAX_NUMBER_LABEL_WIDTH,  this.height - BORDER_WIDTH);
	numBackground.x = 0;
	numBackground.y = 0;
	this.addChildAt(numBackground, 0);
	
	// add weapon location label
	var locationStr = getLocationText(this.weapon.location);
	var locationLabel = new createjs.Text(locationStr, "14px Consolas", "#FFFFFF");
	locationLabel.x = 5 + numLabel.x + numLabel.getMeasuredWidth();
	locationLabel.y = 5;
	this.addChild(locationLabel);
	
	// add weapon type image
	var image = WeaponDisplay.getWeaponTypeImage(this.weapon);
	var typeImage = new createjs.Bitmap(image);
	typeImage.x = 5 + locationLabel.x + locationLabel.getMeasuredWidth();
	typeImage.y = 5;
	this.addChild(typeImage);
	
	// add weapon name label (and ammo, if applicable)
	var weaponStr = this.weapon.shortName;
	if(this.weapon.ammo) {
		// TODO: get actual ammo count
		weaponStr += "[1000]";
	}
	
	this.nameLabel = new createjs.Text(weaponStr, "14px Consolas", "#FFFFFF");
	this.nameLabel.x = typeImage.x + image.width;
	this.nameLabel.y = 5;
	this.addChild(this.nameLabel);
	
	// add weapon % to hit label to the far right
	this.toHitLabel = new createjs.Text("100%", "14px Consolas", "#FFFFFF");
	this.toHitLabel.x = this.width - this.toHitLabel.getMeasuredWidth() - 5;
	this.toHitLabel.y = 5;	
	this.addChild(this.toHitLabel);
	
	
	// finally, add the background shape
	this.background = new createjs.Shape();
	this.addChildAt(this.background, 0);
	
	this.update();
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	/*this.background.graphics.setStrokeStyle(BORDER_WIDTH/2, "square").beginStroke("#C0C0C0")
			.drawRect(BORDER_WIDTH, BORDER_WIDTH, this.width-BORDER_WIDTH*2, this.height-BORDER_WIDTH*2).endStroke();*/
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

WeaponDisplay.getWeaponTypeImage = function(weapon) {
	if(weapon == null) return null;
	
	var weaponType = weapon.weaponType;
	if("Ballistic" == weapon.weaponType) {
		return queue.getResult("ballistic");
	}
	else if("Energy" == weaponType) {
		return queue.getResult("laser");
	}
	else if("Missile" == weaponType) {
		return queue.getResult("missile");
	}
	
	return null;
}

window.WeaponDisplay = createjs.promote(WeaponDisplay, "Container");
}());