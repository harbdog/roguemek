/**
 * Class for displaying the targeting bracket
 */
(function() {
"use strict";

var BORDER_WIDTH = 5;

var IDEAL_WEAPON_ROWS = 5;
var MAX_WEAPON_COLS = 2;

function TargetBracket() {
	this.Container_constructor();
		
	this.weaponIndices = [];
	
	this.background = null;
}
var c = createjs.extend(TargetBracket, createjs.Container);

TargetBracket.MAX_NUMBER_LABEL_WIDTH = new createjs.Text("99", "11px UbuntuMono", "#FFFFFF").getMeasuredWidth();

c.init = function() {
	this.background = new createjs.Shape();
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	this.update();
}

c.update = function() {
	this.removeAllChildren();
	this.background.graphics.clear();
	
	var scale = 0.8 * hexScale;
	
	this.background.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke("#FF0000")
			.moveTo(0, 0).lineTo(hexWidth/6, 0)
			.moveTo(0, 0).lineTo(0, hexHeight/6)
			
			.moveTo(hexWidth, 0).lineTo(hexWidth-hexWidth/6, 0)
			.moveTo(hexWidth, 0).lineTo(hexWidth, hexHeight/6)
			
			.moveTo(0, hexHeight).lineTo(hexWidth/6, hexHeight)
			.moveTo(0, hexHeight).lineTo(0, hexHeight-hexHeight/6)
			
			.moveTo(hexWidth, hexHeight).lineTo(hexWidth-hexWidth/6, hexHeight)
			.moveTo(hexWidth, hexHeight).lineTo(hexWidth, hexHeight-hexHeight/6);
	this.background.scaleX = scale;
	this.background.scaleY = scale;
	this.background.x = ((1-scale) * hexWidth)/2;
	this.background.y = ((1-scale) * hexHeight)/2;
	this.addChild(this.background);
	
	var totalWeapons = this.weaponIndices.length;
	if(totalWeapons > 0) {
		this.weaponIndices.sort(function(a, b){return a-b});
		
		// determine positions based on number of weapons
		var weaponColumns = 1;
		var weaponRows = IDEAL_WEAPON_ROWS;
		
		if(totalWeapons > IDEAL_WEAPON_ROWS) {
			weaponColumns = MAX_WEAPON_COLS;
			weaponRows = Math.ceil(totalWeapons / weaponColumns);
		}
		
		var row = 0;
		for(var i=0; i<totalWeapons; i++) {
			var weaponIndex = this.weaponIndices[i];
			if(weaponIndex != null){
				var weaponIndexDisplay = new createjs.Text(weaponIndex, "11px UbuntuMono", "#FFFFFF");
				var measuredWidth = weaponIndexDisplay.getMeasuredWidth();
				var measuredHeight = weaponIndexDisplay.getMeasuredHeight()*2;
				
				var column = (i < IDEAL_WEAPON_ROWS) ? 0 : 1;
				if(column == 0) {
					weaponIndexDisplay.x = -measuredWidth - (TargetBracket.MAX_NUMBER_LABEL_WIDTH - measuredWidth)/2;
				}
				else {
					weaponIndexDisplay.x = hexWidth + (TargetBracket.MAX_NUMBER_LABEL_WIDTH - measuredWidth)/2;
				}
				
				if(i == IDEAL_WEAPON_ROWS && row == IDEAL_WEAPON_ROWS) {
					// reset the row counter only when the first column reaches the ideal number of rows
					row = 0;
				}
				
				weaponIndexDisplay.y = -BORDER_WIDTH/2 + (row * measuredHeight);
				
				// create a background for the index label
				var weaponIndexBackground = new createjs.Shape();
				weaponIndexBackground.graphics.beginFill("#FF0000")
						.drawRect(0, 0, TargetBracket.MAX_NUMBER_LABEL_WIDTH, measuredHeight);
				
				weaponIndexBackground.x = weaponIndexDisplay.x - (TargetBracket.MAX_NUMBER_LABEL_WIDTH - measuredWidth)/2;
				weaponIndexBackground.y = weaponIndexDisplay.y;
				
				
				this.addChild(weaponIndexBackground);
				this.addChild(weaponIndexDisplay);
				
				row ++;
			}
		}
	}
}

c.setSelectedWeaponIndices = function(weaponIndices) {
	this.weaponIndices = weaponIndices;
}

c.doCache = function() {
	this.cache(0,0, this.width,this.height);
}

window.TargetBracket = createjs.promote(TargetBracket, "Container");
}());