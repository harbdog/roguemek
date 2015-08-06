/**
 * Class for displaying each Terrain
 */
(function() {
	
function Terrain(type, level, exits, terrainFactor) {
	this.type = type;
	this.level = level;
	this.exits = exits;
	this.terrainFactor = terrainFactor;
}

var p = Terrain.prototype

Terrain.LEVEL_NONE = Number.MIN_VALUE;
Terrain.WILDCARD = Number.MAX_VALUE;

// STATIC terrain types (Sourced from MegaMek Terrains.java)
Terrain.WOODS      = 1; //1: light 2: heavy 3: ultra
Terrain.WATER      = 2; //level = depth
Terrain.ROUGH      = 3; //1: normal 2: ultra
Terrain.RUBBLE     = 4; //1: light bldg 2: medium bldg 3: heavy bldg 4: hardened bldg 5: wall 6: ultra
Terrain.JUNGLE     = 5; //1: light 2: heavy 3: ultra
Terrain.SAND       = 6;
Terrain.TUNDRA     = 7;
Terrain.MAGMA      = 8; // 1: crust 2: liquid
Terrain.FIELDS     = 9;
Terrain.INDUSTRIAL = 10; //level indicates height
Terrain.SPACE      = 11;
//unimplemented
//Level 1 Foliage
//Sheer Cliffs

//Terrain modifications
Terrain.PAVEMENT = 12;
Terrain.ROAD     = 13;
Terrain.SWAMP    = 14; //1: normal 2: just became quicksand 3: quicksand
Terrain.MUD      = 15;
Terrain.RAPIDS   = 16; //1: rapids 2: torrent
Terrain.ICE      = 17;
Terrain.SNOW     = 18; // 1: thin 2: deep
Terrain.FIRE     = 19; // 1: normal fire 2: inferno fire
Terrain.SMOKE    = 20; // 1: light smoke 2: heavy smoke 3:light LI smoke 4: Heavy LI smoke
Terrain.GEYSER   = 21; // 1: dormant 2: active 3: magma vent
//unimplemented
//Black Ice
//Bug Storm
//Extreme Depths
//Hazardous Liquid Pools
//Rail
//Dirt Roads, Gravel Roads
//Water Flow

//Building stuff
Terrain.BUILDING       = 22; // 1: light 2: medium 3: heavy 4: hardened 5: wall
Terrain.BLDG_CF        = 23;
Terrain.BLDG_ELEV      = 24;
Terrain.BLDG_BASEMENT_TYPE = 25; // level equals BasemenType, one of the values of the BasementType enum
Terrain.BLDG_CLASS     = 26; //1: hangars 2: fortresses 3: gun emplacements
Terrain.BLDG_ARMOR     = 27;
//leaving this empty will be interpreted as standard
Terrain.BRIDGE         = 28;
Terrain.BRIDGE_CF      = 29;
Terrain.BRIDGE_ELEV    = 30;
Terrain.FUEL_TANK      = 31;
Terrain.FUEL_TANK_CF   = 32;
Terrain.FUEL_TANK_ELEV = 33;
Terrain.FUEL_TANK_MAGN = 34;

// special types
Terrain.IMPASSABLE = 35;
Terrain.ELEVATOR   = 36; // level=elevation it moves to,exits=d6 rolls it moves on
Terrain.FORTIFIED  = 37;
Terrain.SCREEN     = 38;

//fluff
Terrain.FLUFF = 39;
Terrain.ARMS  = 40; // blown off arms for use as clubs, level = number of arms in that hex
Terrain.LEGS  = 41; // blown off legs for use as clubs, level = number of legs in that hex

Terrain.METAL_CONTENT = 42; // Is there metal content that will block magscan sensors?
Terrain.BLDG_BASE_COLLAPSED = 43; //1 means collapsed

p.getType = function() {
	return this.type;
};

p.getLevel = function() {
	return this.level;
}

p.getExits = function() {
	return this.exits;
}

p.getTerrainFactor = function() {
	return this.terrainFactor;
}

p.toString = function() {
	return "[Terrain: type="+this.type+", level="+this.level+"]";
}

window.Terrain = Terrain;
}());
