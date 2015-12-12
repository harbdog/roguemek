/**
 * Class for displaying each Ejection Pod
 */
(function() {
"use strict";

function EjectionPod(srcPoint) {
	this.Bitmap_constructor();
	
	this.x = srcPoint.x;
	this.y = srcPoint.y;
	
	this.setup();
}
var s = createjs.extend(EjectionPod, createjs.Bitmap);

s.setup = function() {
	this.image = queue.getResult("ejection-pod");
	this.y -= this.image.height;
}

s.hide = function(){
	this.visible = false;
};

window.EjectionPod = createjs.promote(EjectionPod, "Bitmap");
}());
