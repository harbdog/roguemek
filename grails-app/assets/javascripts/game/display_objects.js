/**
 * display_objects.js - Definitions for displayable object classes and their methods
 */

/**
 * Class for string an x, y point on the display
 */
function Point(x, y) {
	this.initialize(x, y);
}
Point.prototype.initialize = function(x, y) {
	this.x = x;
	this.y = y;
}
Point.prototype.toString = function() {
	return "Point@["+this.x+","+this.y+"]";
}
