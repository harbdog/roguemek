/**
 * Class used to store Hex information and its display object
 */
(function() {
"use strict";

function Hex(hexX, hexY, elevation, terrains, images) {
	this.coords = new Coords(hexX, hexY);
	this.elevation = elevation;
	this.images = images;
	
	this.terrains = [];
	if(terrains != null && terrains.length > 0) {
		for(var i=0; i<terrains.length; i++){
			var terrainData = terrains[i];
			var thisTerrain = new Terrain(terrainData.type, terrainData.level, 
					terrainData.exits, terrainData.terrainFactor);
			
			this.terrains[i] = thisTerrain;
		}
	}
}
var h = Hex.prototype;

h.containsTerrain = function(type) {
	if(this.terrains != null && this.terrains.length > 0){
		for(var i=0; i<this.terrains.length; i++){
			var thisTerrain = this.terrains[i];
			if(thisTerrain.type == type) {
				return true;
			}
		}
	}
	
	return false;
}
h.getTerrain = function(type) {
	if(this.terrains != null && this.terrains.length > 0){
		for(var i=0; i<this.terrains.length; i++){
			var thisTerrain = this.terrains[i];
			if(thisTerrain.type == type) {
				return thisTerrain;
			}
		}
	}
	
	return null;
}
h.setHexDisplay = function(hexDisplay) {
	this.hexDisplay = hexDisplay;
}
h.getHexDisplay = function() {
	return this.hexDisplay;
}
h.isXOdd = function() {
	return isXOdd(this.xCoords());
}
h.getHexLocation = function() {
	return this.coords;
}
h.xCoords = function() {
	return this.coords.x;
}
h.yCoords = function() {
	return this.coords.y;
}
h.getElevation = function() {
	return this.elevation;
}
h.getImages = function() {
	return this.images;
}
h.toString = function() {
	return "[Hex@"+this.xCoords()+","+this.yCoords()+" +"+this.elevation+"; "+this.terrains+"]";
}

window.Hex = Hex;
}());