/**
 * Class for displaying the list of target weapons
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 200;
var BORDER_WIDTH = 3;

var IDEAL_WEAPON_ROWS = 5;
var MAX_WEAPON_COLS = 2;

function WeaponsListDisplay(unit) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = 0;
	
	this.unit = unit;
	this.weapons = [];
	
	this.background = null;
}
var c = createjs.extend(WeaponsListDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	var weaponsArray = this.weapons;
	
	// add each weapon text to the container
	var index = 0;
	$.each(this.unit.weapons, function(id, weapon) {
		if(!weapon.isMeleeWeapon()) {
			var weaponText = new createjs.Text("---", "12px UbuntuMono", "#FFFFFF");
			weaponText.id = weapon.id;
			
			weaponsArray.push(weaponText);
		}
		
		index ++;
	});
	
	this.update();
}

c.update = function() {
	this.removeAllChildren();
	this.uncache();
	this.background.graphics.clear();
	
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	var totalWeapons = this.weapons.length;
	
	if(totalWeapons > 0) {
		// determine positions based on number of weapons
		var weaponColumns = 1;
		var weaponRows = IDEAL_WEAPON_ROWS;
		
		if(totalWeapons > IDEAL_WEAPON_ROWS) {
			weaponColumns = MAX_WEAPON_COLS;
			weaponRows = Math.ceil(totalWeapons / weaponColumns);
		}
		
		this.height = 0;
		for(var index=0; index<totalWeapons; index++) {
			var weaponText = this.weapons[index];
			var weapon = this.unit.weapons[weaponText.id];
						
			var locationStr = getLocationText(weapon.location);
			weaponText.text = locationStr+":"+weapon.shortName;
			
			// update text for when the weapon is destroyed
			if(!weapon.isActive()) {
				// TODO: draw a red strikethrough instead for inactive weapons
				weaponText.color = "#A0A0A0";
			}
			
			weaponText.x = 5+ Math.floor(index/weaponRows) * this.width/2;
			weaponText.y = (index % weaponRows) * weaponText.getMeasuredHeight()*2;
			
			this.addChild(weaponText);
			
			// update container height as each element is added
			if(weaponText.y + weaponText.getMeasuredHeight()*2 > this.height) {
				this.height = weaponText.y + weaponText.getMeasuredHeight()*2;
			}
		}
	}
	
	this.background.graphics.beginFill("#404040")
			.drawRect(0, 0, this.width, this.height)
			.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke("#C0C0C0")
			.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
	
	this.addChildAt(this.background, 0);
	
	//this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.WeaponsListDisplay = createjs.promote(WeaponsListDisplay, "Container");
}());