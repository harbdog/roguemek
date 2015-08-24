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
	this.background.alpha = 0.75;
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	var weaponsArray = this.weapons;
	
	// add each weapon text to the container
	var index = 0;
	$.each(this.unit.weapons, function(id, weapon) {
		var weaponDisplay = new createjs.Text("---", "12px Consolas", "#FFFFFF");
		weaponDisplay.id = weapon.id;
		
		weaponsArray.push(weaponDisplay);
		
		index ++;
	});
	
	this.update();
}

c.update = function() {
	this.removeAllChildren();
	this.uncache();
	this.background.graphics.clear();
	
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
			var weaponDisplay = this.weapons[index];
			var weapon = this.unit.weapons[weaponDisplay.id];
						
			// TODO: update text for when the weapon is destroyed
			var locationStr = getLocationText(weapon.location);
			weaponDisplay.text = locationStr+":"+weapon.shortName;
			
			weaponDisplay.x = 5+ Math.floor(index/weaponRows) * this.width/2;
			weaponDisplay.y = (index % weaponRows) * weaponDisplay.getMeasuredHeight()*2;
			
			this.addChild(weaponDisplay);
			
			// update container height as each element is added
			if(weaponDisplay.y + weaponDisplay.getMeasuredHeight()*2 > this.height) {
				this.height = weaponDisplay.y + weaponDisplay.getMeasuredHeight()*2;
			}
		}
	}
	
	this.background.graphics.beginFill("#404040")
			.drawRect(0, 0, this.width, this.height)
			.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke("#C0C0C0")
			.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
	
	this.addChildAt(this.background, 0);
	
	this.doCache();
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.WeaponsListDisplay = createjs.promote(WeaponsListDisplay, "Container");
}());