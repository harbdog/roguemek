/**
 * Class for displaying each Hex
 */
(function() {

var lightgray = "#D3D3D3";
var gray = "#A9A9A9";
var darkgray = "#808080";

var elevationHeight = 15;

function HexDisplay(hex) {
	this.Container_constructor();
	
	this.hex = hex;
	this.coords = new Coords(hex.xCoords(), hex.yCoords());
	this.isometricChildren = null;
}
var c = createjs.extend(HexDisplay, createjs.Container);

c.getHex = function() {
	return this.hex;
}

c.update = function() {
	this.uncache();
	if(this.isometricChildren != null) {
		for(var i=0; i<this.isometricChildren.length; i++){
			this.removeChild(this.isometricChildren[i]);
		}
		this.isometricChildren = null;
	}
	
	var xOffset = this.xCoords() * (3 * hexWidth / 4);
	var yOffset = this.yCoords() * hexHeight;
	
	if(this.isXOdd()){
		yOffset = (hexHeight / 2) + (this.yCoords() * hexHeight);
	}
	
	this.x = xOffset;
	this.y = yOffset;
	
	// TODO: create toggle option to easily enable/disable isometric mode
	this.drawIsometric();
	
	// TODO: cache the object
	//this.cache(0,0, 0,0);
}

c.drawIsometric = function() {
	if(useIsometric 
			&& this.getHex() != null 
			&& this.getHex().elevation > 0) {
		
		// keep track of the isometric child display object indices so they can be easily removed
		this.isometricChildren = [];
		
		// move the hex image up or down based on elevation
		var elev = this.getHex().elevation;
		this.y -= (elevationHeight * elev);
		
		// draw the polygons that make up the isometric elevation
		var p1 = new createjs.Shape();
		p1.graphics.setStrokeStyle(1)
				.beginStroke("black").beginFill(darkgray)
				.moveTo(0, (hexHeight/2))
				.lineTo(0, (hexHeight/2) + (elevationHeight * elev))
				.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo((hexWidth/4), hexHeight)
				.lineTo(0, (hexHeight/2)).endStroke();
		this.isometricChildren[0] = this.addChild(p1);
		
		var p2 = new createjs.Shape();
		p2.graphics.setStrokeStyle(1)
				.beginStroke("black").beginFill(gray)
				.moveTo((hexWidth/4), hexHeight)
				.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo((3*hexWidth/4), hexHeight)
				.lineTo((hexWidth/4), hexHeight).endStroke();
		
		this.isometricChildren[1] = this.addChild(p2);
		
		var p3 = new createjs.Shape();
		p3.graphics.setStrokeStyle(1)
				.beginStroke("black").beginFill(lightgray)
				.moveTo((3*hexWidth/4), hexHeight)
				.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo(hexWidth, (hexHeight/2) + (elevationHeight * elev))
				.lineTo(hexWidth, (hexHeight/2))
				.lineTo((3*hexWidth/4), hexHeight).endStroke();
		
		this.isometricChildren[2] = this.addChild(p3);
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
	var elevationStr = "";
	if(this.getHex() != null) {
		elevationStr = this.getHex().elevation;
	}
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