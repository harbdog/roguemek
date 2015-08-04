/**
 * Class for displaying each Hex
 */
(function() {

var lightgray = "#D3D3D3";
var gray = "#A9A9A9";
var darkgray = "#808080";

var elevationHeight = 15;

function HexDisplay(hexX, hexY, images) {
	this.Container_constructor();
	
	this.coords = new Coords(hexX, hexY);
	this.images = images;
}
var c = createjs.extend(HexDisplay, createjs.Container);

c.setHex = function(hex) {
	this.hex = hex;
}
c.getHex = function() {
	return this.hex;
}

c.hide = function() {
	this.visible = false;
};

c.drawIsometric = function() {
	if(this.getHex() != null && this.getHex().elevation > 0) {
		
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
				.lineTo((hexWidth/4), hexHeight).endStroke();
		this.addChild(p1);
		
		var p2 = new createjs.Shape();
		p2.graphics.setStrokeStyle(1)
				.beginStroke("black").beginFill(gray)
				.moveTo((hexWidth/4), hexHeight)
				.lineTo((hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo((3*hexWidth/4), hexHeight).endStroke();
		
		this.addChild(p2);
		
		var p3 = new createjs.Shape();
		p3.graphics.setStrokeStyle(1)
				.beginStroke("black").beginFill(lightgray)
				.moveTo((3*hexWidth/4), hexHeight)
				.lineTo((3*hexWidth/4), hexHeight + (elevationHeight * elev))
				.lineTo(hexWidth, (hexHeight/2) + (elevationHeight * elev))
				.lineTo(hexWidth, (hexHeight/2)).endStroke();
		
		this.addChild(p3);
	}
}

c.isXOdd = function() {
	return isXOdd(this.coords.x);
}
c.getImages = function() {
	return this.images;
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
	return "[HexDisplay@"+this.x+", "+this.y+" +"+elevationStr+" :"+this.images+"]";
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
};

window.HexDisplay = createjs.promote(HexDisplay, "Container");
}());