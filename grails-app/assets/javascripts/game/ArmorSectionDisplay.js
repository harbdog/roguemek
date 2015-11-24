/**
 * Class for displaying an armor section's remaining/total values
 */
(function() {
"use strict";

var BORDER_WIDTH = 1;

function ArmorSectionDisplay(parent, width, height, barWidth, text, startIndex) {
	this.Container_constructor();
	this.parent = parent;
	
	this.width = width;
	this.height = height;
	this.barWidth = barWidth;
	this.barHeight = height - 4;
	
	this.outlines = [];
	this.bars = [];
	this.barBounds = [];
	
	this.init(text, startIndex);
}
var c = createjs.extend(ArmorSectionDisplay, createjs.Container);

c.init = function(text, startIndex) {
	// allow custom UI colors
	var label = new createjs.Text(text, "11px UbuntuMono");
	label.x = (text.length * this.width - label.getMeasuredWidth())/2;
	label.y = this.height - label.getMeasuredHeight()*2;
	this.label = label;
	this.addChild(label);
	
	this.barHeight = label.y - 4;
	
	// The first bar is full height for external armor
	var barOutline = new createjs.Shape();
	var bounds = new createjs.Rectangle(
			this.width-this.barWidth, 1+BORDER_WIDTH, 
			this.barWidth, this.barHeight);
	this.outlines[0] = barOutline;
	this.addChild(barOutline);
	
	var bar = new createjs.Shape();
	this.bars[0] = bar;
	this.barBounds[0] = bounds;
	this.addChildAt(bar, 0);
	
	// second bar is 1/2 height for internal armor
	var barOutline2 = new createjs.Shape();
	var bounds2 =  new createjs.Rectangle(
			1*this.width+BORDER_WIDTH, 1+BORDER_WIDTH+this.barHeight/2, 
			this.barWidth, this.barHeight/2);
	this.outlines[1] = barOutline2;
	this.addChild(barOutline2);
	
	var bar2 = new createjs.Shape();
	this.bars[1] = bar2;
	this.barBounds[1] = bounds2;
	this.addChildAt(bar2, 1);
	
	this.setDisplayedPercent(0, 100, false);
	this.setDisplayedPercent(1, 100, false);
	
	// third bar, if there is one, is full height for rear armor
	if(text.length > 2) {
		var barOutline3 = new createjs.Shape();
		var bounds3 =  new createjs.Rectangle(
				2*this.width-BORDER_WIDTH, 1+BORDER_WIDTH, 
				this.barWidth, this.barHeight);
		this.outlines[2] = barOutline3;
		this.addChild(barOutline3);
		
		var bar3 = new createjs.Shape();
		this.bars[2] = bar3;
		this.barBounds[2] = bounds3;
		this.addChildAt(bar3, 2);
		
		this.setDisplayedPercent(2, 100);
	}
	
	this.update();
}

c.update = function() {
	this.label.color = Settings.get(Settings.UI_FG_COLOR);
	
	for(var i=0; i<this.outlines.length; i++) {
		var barOutline = this.outlines[i];
		var bounds = this.barBounds[i];
		
		barOutline.graphics.clear();
		barOutline.graphics.setStrokeStyle(BORDER_WIDTH, "square").beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
	}
}

c.setDisplayedPercent = function(index, percent, doAnimate) {
	if(index < 0 || index > 2) return;
	
	if(percent < 0) {
		percent = 0;
	}
	else if(percent > 100) {
		percent = 100;
	}
	
	// blend color as percent goes down
	var barColor = blendColors("#FF0000", "#3399FF", percent/100);
	
	var bar = this.bars[index];
	var barBounds = this.barBounds[index];
	bar.graphics.clear();
	bar.graphics.beginFill(barColor)
			.drawRect(barBounds.x, barBounds.y+barBounds.height,
					barBounds.width, -barBounds.height*(percent/100));
	
	createjs.Tween.removeTweens(bar);
	if(doAnimate && percent > 0 && percent < 100) {
		createjs.Tween.get(bar)
				.to({alpha: 0.25}, 250)
				.to({alpha: 1.0}, 250)
				.to({alpha: 0.25}, 250)
				.to({alpha: 1.0}, 250)
				.to({alpha: 0.25}, 250)
				.to({alpha: 1.0}, 250)
				.call(callDoCache, null, this.parent)
				.addEventListener("change", function() {
					update = true;
				});
	}
}

window.ArmorSectionDisplay = createjs.promote(ArmorSectionDisplay, "Container");
}());