/**
 * Class for displaying mech weapons
 */
(function() {
"use strict";

var MAX_WEAPON_ROWS = 5;
var BORDER_WIDTH = 3;

function MechWeaponsDisplay(unit) {
	this.Container_constructor();
	
	// this display will dynamically update its own width and height when updated
	this.width = 0;
	this.height = 0;
	
	this.unit = unit;
	this.weapons = [];
	
	this.background = null;
	this.alphaStrike = null;
}
var c = createjs.extend(MechWeaponsDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	var weaponsArray = this.weapons;
	
	// create each individual weapon display
	var index = 0;
	$.each(this.unit.weapons, function(weaponId, weapon) {
		var hotkey = (index+1).toString();
		if(weapon.isPunch()) {
			hotkey = "P";
		}
		else if(weapon.isKick()) {
			hotkey = "K";
		}
		else if(weapon.isCharge()) {
			hotkey = "C";
		}
		else if(weapon.isDFA()) {
			hotkey = "V";
		}
		
		var weaponDisplay = new WeaponDisplay(hotkey, weapon);
		weaponDisplay.init();
		
		weaponsArray.push(weaponDisplay);
		index ++;
	});
	
	if(index > 0) {
		// create the alpha strike display
		var hotkey = "\\";
		this.alphaStrike = new AlphaStrikeDisplay(hotkey);
		this.alphaStrike.init();
		this.alphaStrike.alpha = 0;
	}
	
	this.update();
}

c.update = function() {
	this.removeAllChildren();
	this.uncache();
	this.background.graphics.clear();
	
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	// determine positions based on number of weapons
	var totalWeapons = this.weapons.length;
	
	if(totalWeapons > 0) {
		var weaponColumns = 1;
		var weaponRows = MAX_WEAPON_ROWS;
		
		var firstWeaponDisplay = this.weapons[0];
		var firstTargetDisplayWidth = 0;
		if(targetDisplayBounds != null > 0) {
			var targetDisplayBoundsKeys = Object.keys(targetDisplayBounds);
			if(targetDisplayBoundsKeys.length > 0) {
				firstTargetDisplayWidth = targetDisplayBounds[Object.keys(targetDisplayBounds)[0]].width;
			}
		}
		
		if(totalWeapons > MAX_WEAPON_ROWS) {
			// only allow >1 columns if the canvas width can fit it with the rest of the UI
			var maxWeaponColumns = 
				Math.floor((canvas.width*(1/overlay.scaleX) - unitDisplayBounds.x - unitDisplayBounds.width - firstTargetDisplayWidth) 
								/ firstWeaponDisplay.width);
			
			weaponColumns = Math.ceil(totalWeapons / MAX_WEAPON_ROWS);
			if(weaponColumns > maxWeaponColumns) {
				weaponColumns = maxWeaponColumns
				weaponRows = Math.ceil(totalWeapons / weaponColumns);
			}
		}
		
		// add each weapon display to the container
		this.width = 0;
		this.height = 0;
		for(var index=0; index<totalWeapons; index++) {
			var weaponDisplay = this.weapons[index];
			weaponDisplay.update();
			
			weaponDisplay.x = Math.floor(index/weaponRows) * weaponDisplay.width;
			weaponDisplay.y = (index % weaponRows) * weaponDisplay.height;
			
			this.addChild(weaponDisplay);
			
			// update container width/height as each element is added
			if(weaponDisplay.x + weaponDisplay.width + BORDER_WIDTH/2 > this.width) {
				this.width = weaponDisplay.x + weaponDisplay.width + BORDER_WIDTH/2;
			}
			if(weaponDisplay.y + weaponDisplay.height > this.height) {
				this.height = weaponDisplay.y + weaponDisplay.height;
			}
		}
		
		// add alpha strike button that spans the entire width across the top
		if(this.alphaStrike && totalWeapons > 0) {
			this.alphaStrike.width = this.width;
			this.alphaStrike.update();
			
			this.alphaStrike.x = 0;
			this.alphaStrike.y = -this.alphaStrike.height;
			
			this.addChild(this.alphaStrike);
		}
		
		this.background.graphics.beginFill(Settings.get(Settings.UI_BG_COLOR))
				.drawRect(0, 0, this.width, this.height)
				.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke(Settings.get(Settings.UI_FG_COLOR))
				.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
		this.addChildAt(this.background, 0);
	}
	
	this.doCache();
}

c.setSelectedWeapons = function(weaponsArray) {
	this.uncache();
	
	$.each(this.weapons, function(index, unitWeaponDisplay) {
		var selected = (weaponsArray != null && $.inArray(unitWeaponDisplay.weapon, weaponsArray) != -1);
		unitWeaponDisplay.setSelected(selected);
	});
	
	// determine if all weapons are selected or not
	if(this.alphaStrike) {
		var turnTargetUnit = getUnitTarget(turnUnit);
		
		if(turnTargetUnit == null || isTeamUnit(turnTargetUnit)) {
			if(this.alphaStrike.alpha > 0) {
				createjs.Tween.get(this.alphaStrike).to({alpha:0}, 250);
			}
		}
		else {
			if(this.alphaStrike.alpha < 1) {
				createjs.Tween.get(this.alphaStrike).to({alpha:1}, 250);
			}
			
			var numWeapons = getNumAvailableWeapons(turnUnit);
			var numSelectedWeapons = getNumSelectedWeapons();
			
			var allWeaponsSelected = (numWeapons == numSelectedWeapons);
			
			this.alphaStrike.setSelected(allWeaponsSelected);
		}
	}
	
	this.doCache();
}

c.doCache = function() {
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_PERFORMANCE){
		// caching only at the lowest gfx setting
		this.cache(0,0, this.width,this.height);
	}
}

window.MechWeaponsDisplay = createjs.promote(MechWeaponsDisplay, "Container");
}());
