/**
 * Class for displaying each Hex
 */
(function() {
"use strict";

var lightgray = "#C0C0C0";
var gray = "#808080";
var darkgray = "#404040";

function HexDisplay(hex) {
	this.Container_constructor();
	
	this.hex = hex;
	this.coords = new Coords(hex.xCoords(), hex.yCoords());
	
	this.isometricChildren = null;
	this.levelChild = null;
}
var c = createjs.extend(HexDisplay, createjs.Container);

c.getHex = function() {
	return this.hex;
}

c.update = function() {
	this.uncache();
	this.cleanChildren();
	
	var xOffset = this.xCoords() * (3 * hexWidth / 4);
	var yOffset = this.yCoords() * hexHeight;
	
	if(this.isXOdd()){
		yOffset = (hexHeight / 2) + (this.yCoords() * hexHeight);
	}
	
	this.x = xOffset;
	this.y = yOffset;
	
	// draw additional hex related features as needed
	this.drawIsometric();
	this.drawLevel();
	
	// cache the object based on settings since caching makes text blurry, but not caching is a big performance hit
	if(Settings.get(Settings.GFX_CACHING) < Settings.GFX_QUALITY){
		// no caching at the highest gfx setting
		this.doCache();
	}
}

c.doCache = function() {
	if(useIsometric && this.getHex() != null) {
		if(this.getHex().getElevation() >= 0) {
			this.cache(0, 0, hexWidth, hexHeight + (elevationHeight * this.getHex().getElevation()));
		}
		else {
			this.cache(0, (elevationHeight * this.getHex().getElevation()), hexWidth, hexHeight - (elevationHeight * this.getHex().getElevation()));
		}
	}
	else {
		this.cache(0, 0, hexWidth, hexHeight);
	}
}

c.cleanChildren = function() {
	if(this.isometricChildren != null) {
		for(var i=0; i<this.isometricChildren.length; i++){
			if(this.isometricChildren[i] != null) {
				this.removeChild(this.isometricChildren[i]);
			}
		}
		this.isometricChildren = null;
	}
	
	if(this.levelChild != null) {
		this.removeChild(this.levelChild);
		this.levelChild = null;
	}
}

c.drawLevel = function() {
	if(showLevels 
			&& this.getHex() != null
			&& hexScale >= 0.9) {
		
		// draw elevation level
		if(this.getHex().getElevation() != 0) {
			var levelObj = new createjs.Text("LEVEL "+this.getHex().getElevation(), "11px UbuntuMono", "black");
			
			levelObj.x = (hexWidth - levelObj.getMeasuredWidth()) / 2;
			levelObj.y = hexHeight - levelObj.getMeasuredHeight()-5;
			
			this.levelChild = this.addChild(levelObj);
			return;
		}
		
		// OR draw water depth level
		var chkWaterTerrain = this.getHex().getTerrain(Terrain.WATER);
		if(chkWaterTerrain != null && chkWaterTerrain.getLevel() > 0) {
			var levelObj = new createjs.Text("DEPTH "+chkWaterTerrain.getLevel(), "11px UbuntuMono", "black");
			
			levelObj.x = (hexWidth - levelObj.getMeasuredWidth()) / 2;
			levelObj.y = hexHeight - levelObj.getMeasuredHeight()-5;
			
			this.levelChild = this.addChild(levelObj);
			return;
		}
	}
}

c.drawIsometric = function() {
	if(useIsometric 
			&& this.getHex() != null 
			&& this.getHex().getElevation() != 0) {
		
		// keep track of the isometric child display object indices so they can be easily removed/toggled
		this.isometricChildren = [];
		
		// might need to know adjacent hexes to display appropriately
		var adjacents = this.coords.getAdjacentCoords();
		
		// move the hex image up or down based on elevation
		var elev = this.getHex().getElevation();
		this.y -= (elevationHeight * elev);
		
		if(elev > 0) {
			// draw the polygons that make up the isometric elevation
			
			// HEADING_SW
			var p1 = new createjs.Shape();
			p1.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(darkgray)
					.moveTo(0, (hexHeight/2))
					.lineTo(0, (hexHeight/2) + (elevationHeight * elev))
					.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo((hexWidth/4), hexHeight)
					.lineTo(0, (hexHeight/2)).endStroke();
			this.isometricChildren[0] = this.addChild(p1);
			
			// HEADING_S
			var p2 = new createjs.Shape();
			p2.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(gray)
					.moveTo((hexWidth/4), hexHeight)
					.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo((3*hexWidth/4), hexHeight)
					.lineTo((hexWidth/4), hexHeight).endStroke();
			
			this.isometricChildren[1] = this.addChild(p2);
			
			// HEADING_SE
			var p3 = new createjs.Shape();
			p3.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(lightgray)
					.moveTo((3*hexWidth/4), hexHeight)
					.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo(hexWidth, (hexHeight/2) + (elevationHeight * elev))
					.lineTo(hexWidth, (hexHeight/2))
					.lineTo((3*hexWidth/4), hexHeight).endStroke();
			
			this.isometricChildren[2] = this.addChild(p3);
		}
		
		if(elev < 0) {
			// draw the polygons that make up the isometric elevation
			
			// HEADING_NW
			if(adjacents[HEADING_NW] != null) {
				var coordsNW = adjacents[HEADING_NW];
				var hexNW = getHex(coordsNW);
				
				var elevDiff = elev;
				if(hexNW.getElevation() < 0) {
					elevDiff = elev - hexNW.getElevation();
				}
				
				if(elevDiff < 0) {
					var p1 = new createjs.Shape();
					p1.graphics.setStrokeStyle(1)
							.beginStroke(darkgray).beginFill(lightgray)
							.moveTo(0, (hexHeight/2))
							.lineTo(0, (hexHeight/2) + (elevationHeight * elevDiff))
							.lineTo((hexWidth/4), (elevationHeight * elevDiff))
							.lineTo((hexWidth/4), 0)
							.lineTo(0, (hexHeight/2)).endStroke();
					this.isometricChildren[0] = this.addChild(p1);
				}
			}
			
			// HEADING_N
			if(adjacents[HEADING_N] != null) {
				var coordsN = adjacents[HEADING_N];
				var hexN = getHex(coordsN);
				
				var elevDiff = elev;
				if(hexN.getElevation() < 0) {
					elevDiff = elev - hexN.getElevation();
				}
				
				if(elevDiff < 0) {
					var p2 = new createjs.Shape();
					p2.graphics.setStrokeStyle(1)
							.beginStroke(darkgray).beginFill(gray)
							.moveTo((hexWidth/4), 0)
							.lineTo((hexWidth/4), (elevationHeight * elevDiff))
							.lineTo((3*hexWidth/4), (elevationHeight * elevDiff))
							.lineTo((3*hexWidth/4), 0)
							.lineTo((hexWidth/4), 0).endStroke();
					
					this.isometricChildren[1] = this.addChild(p2);
				}
			}
			
			//HEADING_NE
			if(adjacents[HEADING_NE] != null) {
				var coordsNE = adjacents[HEADING_NE];
				var hexNE = getHex(coordsNE);
				
				var elevDiff = elev;
				if(hexNE.getElevation() < 0) {
					elevDiff = elev - hexNE.getElevation();
				}
				
				if(elevDiff < 0) {
					var p3 = new createjs.Shape();
					p3.graphics.setStrokeStyle(1)
							.beginStroke(darkgray).beginFill(darkgray)
							.moveTo((3*hexWidth/4), 0)
							.lineTo((3*hexWidth/4), (elevationHeight * elevDiff))
							.lineTo(hexWidth, (hexHeight/2) + (elevationHeight * elevDiff))
							.lineTo(hexWidth, (hexHeight/2))
							.lineTo((3*hexWidth/4), 0).endStroke();
					
					this.isometricChildren[2] = this.addChild(p3);
				}
			}
		}
	}
}
c.elevation = function() {
	return this.hex.elevation;
}
c.isXOdd = function() {
	return isXOdd(this.coords.x);
}
c.getHexLocation = function() {
	return this.coords;
}
c.xCoords = function() {
	return this.coords.x;
}
c.yCoords = function() {
	return this.coords.y;
}
c.toString = function() {
	return "[HexDisplay@"+this.x+", "+this.y+": "+this.hex+"]";
}

window.HexDisplay = createjs.promote(HexDisplay, "Container");
}());