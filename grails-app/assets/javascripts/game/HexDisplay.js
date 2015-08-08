/**
 * Class for displaying each Hex
 */
(function() {

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
	
	// TODO: cache the object
	//this.cache(0,0, 0,0);
}

c.cleanChildren = function() {
	if(this.isometricChildren != null) {
		for(var i=0; i<this.isometricChildren.length; i++){
			this.removeChild(this.isometricChildren[i]);
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
			&& this.getHex() != null) {
		
		// draw elevation level
		if(this.getHex().elevation != 0) {
			var levelObj = new createjs.Text("LEVEL "+this.getHex().elevation, "10px Arial", "black");
			
			levelObj.x = (hexWidth - levelObj.getMeasuredWidth()) / 2;
			levelObj.y = hexHeight - levelObj.getMeasuredHeight() - 1;
			
			this.levelChild = this.addChild(levelObj);
			return;
		}
		
		// OR draw water depth level
		var chkWaterTerrain = this.getHex().getTerrain(Terrain.WATER);
		if(chkWaterTerrain != null && chkWaterTerrain.getLevel() > 0) {
			var levelObj = new createjs.Text("DEPTH "+chkWaterTerrain.getLevel(), "10px Arial", "black");
			
			levelObj.x = (hexWidth - levelObj.getMeasuredWidth()) / 2;
			levelObj.y = hexHeight - levelObj.getMeasuredHeight() - 1;
			
			this.levelChild = this.addChild(levelObj);
			return;
		}
	}
}

c.drawIsometric = function() {
	if(useIsometric 
			&& this.getHex() != null 
			&& this.getHex().elevation != 0) {
		
		// keep track of the isometric child display object indices so they can be easily removed/toggled
		this.isometricChildren = [];
		
		// move the hex image up or down based on elevation
		var elev = this.getHex().elevation;
		this.y -= (elevationHeight * elev);
		
		if(this.getHex().elevation > 0) {
			// draw the polygons that make up the isometric elevation
			var p1 = new createjs.Shape();
			p1.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(darkgray)
					.moveTo(0, (hexHeight/2))
					.lineTo(0, (hexHeight/2) + (elevationHeight * elev))
					.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo((hexWidth/4), hexHeight)
					.lineTo(0, (hexHeight/2)).endStroke();
			this.isometricChildren[0] = this.addChild(p1);
			
			var p2 = new createjs.Shape();
			p2.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(gray)
					.moveTo((hexWidth/4), hexHeight)
					.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
					.lineTo((3*hexWidth/4), hexHeight)
					.lineTo((hexWidth/4), hexHeight).endStroke();
			
			this.isometricChildren[1] = this.addChild(p2);
			
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
		
		if(this.getHex().elevation < 0) {
			// draw the polygons that make up the isometric elevation
			var p1 = new createjs.Shape();
			p1.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(lightgray)
					.moveTo(0, (hexHeight/2))
					.lineTo(0, (hexHeight/2) + (elevationHeight * elev))
					.lineTo((hexWidth/4), (elevationHeight * elev))
					.lineTo((hexWidth/4), 0)
					.lineTo(0, (hexHeight/2)).endStroke();
			this.isometricChildren[0] = this.addChild(p1);
			
			var p2 = new createjs.Shape();
			p2.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(gray)
					.moveTo((hexWidth/4), 0)
					.lineTo((hexWidth/4), (elevationHeight * elev))
					.lineTo((3*hexWidth/4), (elevationHeight * elev))
					.lineTo((3*hexWidth/4), 0)
					.lineTo((hexWidth/4), 0).endStroke();
			
			this.isometricChildren[1] = this.addChild(p2);
			
			var p3 = new createjs.Shape();
			p3.graphics.setStrokeStyle(1)
					.beginStroke(darkgray).beginFill(darkgray)
					.moveTo((3*hexWidth/4), 0)
					.lineTo((3*hexWidth/4), (elevationHeight * elev))
					.lineTo(hexWidth, (hexHeight/2) + (elevationHeight * elev))
					.lineTo(hexWidth, (hexHeight/2))
					.lineTo((3*hexWidth/4), 0).endStroke();
			
			this.isometricChildren[2] = this.addChild(p3);
		}
	}
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

c.doCache = function(startX, startY, endX, endY) {
	var cacheX = startX;
	var cacheY = startY;
	var cacheW = endX - startX;
	var cacheH = endY - startY;
	if(startX > endX) {
		cacheX = endX;
		cacheW = startX - endX;
	}
	if(startY > endY) {
		cacheY = endY;
		cacheH = startY - endY;
	}
	
	this.cache(cacheX, cacheY, cacheW, cacheH);
}

window.HexDisplay = createjs.promote(HexDisplay, "Container");
}());