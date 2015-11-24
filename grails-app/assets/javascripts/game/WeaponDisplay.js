/**
 * Class for displaying an individual weapon for selection
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 200;
var DEFAULT_HEIGHT = 25;
var BORDER_WIDTH = 3;

function WeaponDisplay(hotkey, weapon) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.hotkey = hotkey;
	this.weapon = weapon;
	this.selected = false;
	
	this.background = null;
	this.numLabel = null;
	this.locationLabel = null;
	this.nameLabel = null;
	this.toHitLabel = null;
}
var c = createjs.extend(WeaponDisplay, createjs.Container);

WeaponDisplay.MAX_NUMBER_LABEL_WIDTH = new createjs.Text("99", "16px UbuntuMono", "#FFF").getMeasuredWidth();

c.init = function() {
	
	// add weapon number label
	this.numLabel = new createjs.Text(this.hotkey, "16px UbuntuMono", Settings.get(Settings.UI_BG_COLOR));
	this.numLabel.x = (WeaponDisplay.MAX_NUMBER_LABEL_WIDTH - this.numLabel.getMeasuredWidth())/2;
	this.numLabel.y = BORDER_WIDTH*2;
	this.addChild(this.numLabel);
	
	// add weapon number label background
	var numBackground = new createjs.Shape();
	numBackground.graphics.beginFill(Settings.get(Settings.UI_FG_COLOR))
			.drawRect(0, BORDER_WIDTH, WeaponDisplay.MAX_NUMBER_LABEL_WIDTH,  this.height - BORDER_WIDTH);
	numBackground.x = 0;
	numBackground.y = 0;
	this.addChildAt(numBackground, 0);
	
	// add weapon location label
	var locationStr = getLocationText(this.weapon.location);
	this.locationLabel = new createjs.Text(locationStr, "14px UbuntuMono", Settings.get(Settings.UI_FG_COLOR));
	this.locationLabel.x = 5 + this.numLabel.x + this.numLabel.getMeasuredWidth() + BORDER_WIDTH;
	this.locationLabel.y = 5;
	this.addChild(this.locationLabel);
	
	// add weapon type image
	var image = WeaponDisplay.getWeaponTypeImage(this.weapon);
	var typeImage = new createjs.Bitmap(image);
	typeImage.x = 5 + this.locationLabel.x + this.locationLabel.getMeasuredWidth();
	typeImage.y = 5;
	this.addChild(typeImage);
	
	// add weapon name label (and ammo, if applicable)
	var weaponStr = this.weapon.shortName;
	if(this.weapon.ammo) {
		// the update method will get the actual ammo count
		weaponStr += "[----]";
	}
	this.nameLabel = new createjs.Text(weaponStr, "14px UbuntuMono", Settings.get(Settings.UI_FG_COLOR));
	this.nameLabel.x = 5+ typeImage.x + image.width;
	this.nameLabel.y = 5;
	this.addChild(this.nameLabel);
	
	// the update method will show actual calculated TO-HIT 
	var toHitAsPercent = "  --";
	// add weapon % to hit label to the far right
	this.toHitLabel = new createjs.Text(toHitAsPercent, "14px UbuntuMono", Settings.get(Settings.UI_FG_COLOR));
	this.toHitLabel.x = this.width - this.toHitLabel.getMeasuredWidth() - 5;
	this.toHitLabel.y = 5;	
	this.addChild(this.toHitLabel);
	
	// add the background shape
	this.background = new createjs.Shape();
	this.addChildAt(this.background, 0);
	
	// create hit area (it never needs to be added to display)
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000000").drawRect(0, 0, this.width, this.height).endStroke();
	this.hitArea = hit;
	
	// add listener
	this.on("click", handleWeaponClick);
	this.mouseChildren = false;
	
	this.update();
}

c.update = function() {
	this.uncache();
	
	this.drawSelected();
	
	var weaponActive = this.weapon.isActive();
	
	// update weapon name and ammo
	var weaponInfo = this.weapon.shortName;
	if(this.weapon.ammo) {
		// show total remaining ammo
		var ammoRemaining = 0;
		$.each(this.weapon.ammo, function(key, ammoObj) {
			ammoRemaining += ammoObj.ammoRemaining;
		});
		weaponInfo += "["+ammoRemaining+"]";
		
		if(ammoRemaining <= 0) {
			// disable when when out of ammo
			weaponActive = false;
		}
	}
	this.nameLabel.text = weaponInfo
	
	if(!weaponActive) {
		this.numLabel.color = "#A0A0A0";
		this.locationLabel.color = "#A0A0A0";
		this.nameLabel.color = "#A0A0A0";
	}
	
	// update to Hit percent
	var toHitAsPercent = "  --";
	if(this.weapon.toHit != null) {
		toHitAsPercent = this.weapon.toHit+"%";
	}
	this.toHitLabel.text = toHitAsPercent;
	this.toHitLabel.x = this.width - this.toHitLabel.getMeasuredWidth() - 5;
	
	//this.doCache();
}

c.drawSelected = function() {
	this.background.graphics.clear();
	
	if(this.weapon.cooldown > 0){
		// update background as cooldown
		var cooldownAsPercent = this.weapon.cooldown/this.weapon.cycle;
		this.background.graphics.beginFill("#3399FF")
				.drawRect(WeaponDisplay.MAX_NUMBER_LABEL_WIDTH, BORDER_WIDTH, 
					cooldownAsPercent * (this.width-WeaponDisplay.MAX_NUMBER_LABEL_WIDTH), this.height-BORDER_WIDTH*2).endStroke();
	}
	else if(this.selected) {
		// update background as selected to fire
		this.background.graphics.beginFill("#FF0000")
				.drawRect(WeaponDisplay.MAX_NUMBER_LABEL_WIDTH, BORDER_WIDTH, 
					this.width-WeaponDisplay.MAX_NUMBER_LABEL_WIDTH, this.height-BORDER_WIDTH*2).endStroke();
	}
}

c.isSelected = function() {
	return this.selected;
}
c.setSelected = function(selected) {
	this.uncache();
	
	this.selected = selected;
	this.drawSelected();
	
	//this.doCache();
}


c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

c.toString = function() {
	return "[WeaponDisplay@"+this.x+","+this.y+": "+this.weapon+"]";
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
	else if("Physical" == weapon.weaponType) {
		return queue.getResult("melee");
	}
	
	return null;
}

window.WeaponDisplay = createjs.promote(WeaponDisplay, "Container");
}());