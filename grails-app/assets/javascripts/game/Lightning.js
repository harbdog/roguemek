/*************************************************************
 * This script is based on a script originally from Arturs Sosins aka ar2rsawseen
 * http://webcodingeasy.com/JS-classes/Javascript-lightning-effect
 *
 * Lightning draws a randomly generated lightning with glow effect on html page
 * from x and y coordinates, to other x and y coordinates.
 *
**************************************************************/
(function() {
"use strict";

function Lightning(config) {
	this.Shape_constructor();
	
	this.conf = {
		detail: 1,
		displace: 125,
		glowWidth: 3,
		boltWidth: 3,
		boltColor: "#0066CC",
		glow: true,
		glowColor: "#4D94DB",
		glowAlpha: 0.1
	};
	this.setup(config);
}
var s = createjs.extend(Lightning, createjs.Shape);

s.setup = function(config) {
	this.g = this.graphics;
	
	//copying configuration
	for(var opt in config){
		this.conf[opt] = config[opt];
	}
};

s.show = function(startX, startY, endX, endY){
	this.uncache();
	this.drawLightning(startX, startY, endX, endY, this.conf.displace);
	this.doCache(startX, startY, endX, endY, this.conf.displace);
	
	if(this.conf.glow) {
		this.shadow = new createjs.Shadow(this.conf.glowColor, 0, 0, 10);
	}
};

s.hide = function(){
	this.visible = false;
};

s.drawLightning = function(x1, y1, x2, y2, displace){
	if(displace < this.conf.detail)
	{	
		if(this.conf.glow)
		{
			//glow around lightning
			//ctx.lineCap = "round";
			//ctx.strokeStyle = "#fff";
			//ctx.globalAlpha = conf.glowAlpha;
			//ctx.lineWidth = conf.glowWidth;
			//ctx.lineJoin = "round";
			//ctx.shadowBlur = 10;
			//ctx.shadowColor = conf.glowColor;
			//ctx.beginPath();
			//ctx.moveTo(x1,y1);
			//ctx.lineTo(x2,y2);
			//ctx.stroke();
			this.g.setStrokeStyle(this.conf.glowWidth, "round").beginStroke(this.conf.glowColor).moveTo(x1, y1).lineTo(x2, y2).endStroke();
		}

		//draw bolt
		//ctx.strokeStyle = conf.boltColor;
		//ctx.globalAlpha = 1;
		//ctx.lineWidth = conf.boltWidth;
		//ctx.beginPath();
		//ctx.moveTo(x1,y1);
		//ctx.lineTo(x2,y2);
		//ctx.stroke();
		this.g.setStrokeStyle(this.conf.boltWidth, "round").beginStroke(this.conf.boltColor).moveTo(x1, y1).lineTo(x2, y2).endStroke();
	}
	else{
		var midx = (x2+x1)/2;
		var midy = (y2+y1)/2;
		midx = midx + (Math.random() - 0.5)*displace;
		midy = midy + (Math.random() - 0.5)*displace;
		this.drawLightning(x1, y1, midx, midy, displace/2);
		this.drawLightning(x2, y2, midx, midy, displace/2);
	}
};

s.doCache = function(startX, startY, endX, endY, displace) {
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
	
	this.cache(cacheX - displace, cacheY - displace, cacheW + displace, cacheH + displace);
};

window.Lightning = createjs.promote(Lightning, "Shape");
}());
