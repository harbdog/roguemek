/**
 * Class for displaying each Status Icon
 */
(function() {
"use strict";

function StatusIcon(iconType) {
	this.Shape_constructor();
	
	this.type = iconType;
	
	this.x = 0;
	this.y = 0;
	this.width = 12;
	this.height = 10;
}
var s = createjs.extend(StatusIcon, createjs.Shape);

//declaring some static icon types
StatusIcon.STATUS_DESTROYED = "STATUS_DESTROYED";
StatusIcon.STATUS_DOWN = "STATUS_DOWN";
StatusIcon.STATUS_JUMPING = "STATUS_JUMPING";

s.init = function() {
	var iW = this.width;
	var iH = this.height;
	
	if(StatusIcon.STATUS_DESTROYED == this.type) {
		// allow customization of the status icon color
		var color = "#FF0000";
		var outlineColor = "#FFFFFF";
		
		this.graphics.setStrokeStyle(1, "square").beginStroke(outlineColor).beginFill(color)
				.drawRect(iW/3, 0, iW/3, 3*iW/5)
				.endStroke()
				.beginStroke(outlineColor).beginFill(color)
				.drawRect(iW/3, 4*iW/5, iW/3, iW/5)
				.endStroke();
	}
	else if(StatusIcon.STATUS_DOWN == this.type) {
		var color = "#FF0000";
		var outlineColor = "#FFFFFF";
		
		this.graphics.setStrokeStyle(1, "square").beginStroke(outlineColor).beginFill(color)
				.moveTo(iW/2, iH)
				.lineTo(0, iH/2)
				.lineTo(1*iW/3, iH/2)
				.lineTo(iW/2, 0)
				.lineTo(2*iW/3, iH/2)
				.lineTo(iW, iH/2)
				.lineTo(iW/2, iH)
				.endStroke();
	}
	else if(StatusIcon.STATUS_JUMPING == this.type) {
		var color = "#3399FF";
		var outlineColor = "#FFFFFF";
		
		this.graphics.setStrokeStyle(1, "square").beginStroke(outlineColor).beginFill(color)
				.moveTo(0, iH/2).lineTo(iW/2, 0)
				.lineTo(iW, iH/2)
				.lineTo(iW, iH)
				.lineTo(3*iW/4, 3*iH/5)
				.lineTo(iW/2, 4*iH/5)
				.lineTo(iW/4, 3*iH/5)
				.lineTo(0, iH)
				.lineTo(0, iH/2).endFill();
	}
}

s.hide = function() {
	this.visible = false;
};

s.doCache = function() {
	if(Settings.get(Settings.GFX_CACHING) < Settings.GFX_CACHING_QUALITY){
		// no caching only at the highest gfx setting
		this.cache(0, 0, this.width, this.height);
	}
};

window.StatusIcon = createjs.promote(StatusIcon, "Shape");
}());
