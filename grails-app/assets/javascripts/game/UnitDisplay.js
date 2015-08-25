/**
 * Class for displaying each Unit
 */
(function() {
"use strict";

function UnitDisplay(id, imageArr, imageStr, rgb) {
	this.Container_constructor();
	
	this.id = id;
	this.imageStr = imageStr;
	this.rgb = rgb;
	
	if(imageArr != null) {
		// render the Image from the byte array
		var base64 = _arrayBufferToBase64(imageArr);
		  
		var img = new Image();
		img.src = "data:image/gif;base64," + base64;
		  
		this.image = img;
	}
	
	this.indicator = null;
}
var c = createjs.extend(UnitDisplay, createjs.Container);

c.setUnit = function(unit) {
	this.unit = unit;
}
c.getUnit = function() {
	return this.unit;
}

c.getImageString = function() {
	return this.imageStr;
}

c.getImage = function() {
	return this.image;
}

//http://stackoverflow.com/a/9458996/128597
function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

c.update = function() {
	this.uncache();
	
	this.x = this.getUpdatedDisplayX(this.unit.coords);
	this.y = this.getUpdatedDisplayY(this.unit.coords);
	this.rotation = this.getUpdatedDisplayRotation(this.unit.heading);
	
	// TODO: figure out proper location of shadow when rotation is set
	//this.unitImage.shadow = new createjs.Shadow("#000000", -5, -5, 5);
	
	// create hit area (it never needs to be added to display)
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000000").drawCircle(0, 0, hexWidth/3).endStroke();
	this.hitArea = hit;
	
	this.updateUnitIndicator();
}

c.drawImage = function(image, scale) {
	// load the unit image as a Bitmap
	this.unitImage = new createjs.Bitmap(image);
	// make the unit image just a bit smaller since it currently is same size as the hex
	this.unitImage.scaleX = scale;
	this.unitImage.scaleY = scale;
	// adjust the rotation around its own center (which also adjusts its x/y reference point)
	this.unitImage.regX = image.width/2;
	this.unitImage.regY = image.height/2;
	
	this.addChild(this.unitImage);
}

c.getUpdatedDisplayX = function(coords) {
	return coords.x * (3 * hexWidth / 4) + (hexWidth / 2);
}
c.getUpdatedDisplayY = function(coords) {
	
	var displayY = 0;
	if(coords.isXOdd()){
		displayY = (hexHeight / 2) + (coords.y * hexHeight) + (hexHeight / 2);
	}
	else{
		displayY = coords.y * hexHeight + (hexHeight / 2);
	}
	
	if(useIsometric) {
		// shift the Y value up (negative) to match the displayed elevation for isometric view
		// by finding the Hex object and use its elevation to offset
		if(hexMap != null) {
			var thisHexRow = hexMap[coords.y];
			if(thisHexRow != null) {
				var thisHex = thisHexRow[coords.x];
				if(thisHex != null) {
					displayY -= (elevationHeight * thisHex.getElevation());
				}
			}
		}
	}
	
	return displayY;
}
c.getUpdatedDisplayRotation = function(heading) {
	return HEADING_ANGLE[heading];
}
c.setOtherTurnVisible = function(visible) {
	if(visible) {
		if(this.forwardControl == null) {
			this.otherTurn = new createjs.Container();
			
			var otherImg = queue.getResult("other_turn");
			var otherTurnImg = new createjs.Bitmap(otherImg);
			this.otherTurn.x = (hexWidth/2) - (otherImg.width/2);
			this.otherTurn.y = -(otherImg.height/2);
			this.otherTurn.alpha = 0;
			
			this.otherTurn.addChild(otherTurnImg);
		}
		
		this.addChild(this.otherTurn);
		
		createjs.Tween.get(this.otherTurn).to({alpha: 0.75}, 250);
	}
	else if(this.otherTurn != null) {
		createjs.Tween.get(this.otherTurn).to({alpha: 0}, 250);
		this.removeChild(this.otherTurn);
	}
}
c.animateUpdateDisplay = function(coords, heading, callFunction) {
	var newX = this.getUpdatedDisplayX(coords);
	var newY = this.getUpdatedDisplayY(coords);
	var actualRot = this.getUpdatedDisplayRotation(heading);
	
	var newRot = actualRot;
	if(this.rotation == HEADING_ANGLE[HEADING_N] && newRot == HEADING_ANGLE[HEADING_NW]) {
		// fixes the issue where it tries to rotate the long way to go from N to NW (0->300)
		newRot = -60;
	}
	else if(this.rotation == HEADING_ANGLE[HEADING_NW] && newRot == HEADING_ANGLE[HEADING_N]) {
		// fixes the issue where it tries to rotate the long way to go from NW to N (300->0)
		newRot = 360;
	}
	
	createjs.Tween.get(this)
		.to({x: newX, y: newY, rotation: newRot}, 250)
		.call(function() {
			// put the actual angle in after animated so it doesn't rotate the long way at a different angle
			this.rotation = actualRot;
			update = true;
			
			if(callFunction) {
				callFunction();
			}
		})
		.addEventListener("change", function() {
			update = true;
		});
}

c.setUnitIndicatorVisible = function(visible) {
	this.uncache();
	if(this.indicator != null) {
		this.indicator.visible = visible;
	}
	
	this.doCache();
}

c.updateUnitIndicator = function() {
	this.uncache();
	
	if(this.indicator != null) {
		createjs.Tween.removeTweens(this.indicator);
		this.removeChild(this.indicator);
	}
	
	if(isTurnUnit(this.unit)) {
		this.showTurnDisplay();
		
		// do not cache the object when using the animated turn indicator
	}
	else {
		this.indicator = new createjs.Shape();
		
		// TODO: allow customization of the unit indicator color
		var color = null;
		if(isPlayerUnit(this.unit)) {
			color = "#3399FF";
			this.indicator.graphics.setStrokeStyle(3, "round").beginStroke(color).drawCircle(0, 0, hexWidth/3-2).endStroke();
		}
		else{
			color = "#FF0000"
			this.indicator.graphics.setStrokeStyle(3, "round").beginStroke(color).drawPolyStar(0, 0, hexWidth/3, 4, 0.5, -90).endStroke();
		}
		
		// give the indicator a glow
		var glowColor = shadeColor(color, 0.75);
		this.indicator.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		
		this.addChildAt(this.indicator, 0);
		
		this.doCache();
	}
}

c.showTurnDisplay = function(show) {
	
	this.indicator = new createjs.Shape();
	
	var color = null;
	if(isPlayerUnit(this.unit)) {
		color = "#3399FF";
		this.indicator.graphics.setStrokeStyle(2, "round").beginStroke(color).drawCircle(0, 0 ,hexWidth/10).endStroke();
	}
	else {
		color = "#FF0000"
		this.indicator.graphics.setStrokeStyle(2, "round").beginStroke(color).drawPolyStar(0, 0, hexWidth/8, 4, 0.5, -90).endStroke();
	}
	
	// give the indicator a glow
	var glowColor = shadeColor(color, 0.75);
	this.indicator.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
	
	this.addChildAt(this.indicator, 0);
	
	createjs.Tween.get(this.indicator, { loop: true})
		.to({alpha: 0.75, scaleX: 2.5, scaleY: 2.5}, 750)
		.to({alpha: 0.25, scaleX: 3.5, scaleY: 3.5}, 500)
		.addEventListener("change", function() {
			update = true;
		});
}

c.doCache = function() {
	this.cache(-hexWidth/2,-hexHeight/2, hexWidth,hexHeight);
}

c.toString = function() {
	return "[UnitDisplay@"+this.x+","+this.y+": "+this.unit+"]";
}

window.UnitDisplay = createjs.promote(UnitDisplay, "Container");
}());