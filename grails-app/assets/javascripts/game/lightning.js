/*************************************************************
 * This script is based on a script originally from Arturs Sosins aka ar2rsawseen
 * http://webcodingeasy.com/JS-classes/Javascript-lightning-effect
 *
 * Lightning draws a randomly generated lightning with glow effect on html page
 * from x and y coordinates, to other x and y coordinates.
 *
**************************************************************/
function Lightning(config) {
	this.conf = {
		detail: 1,
		displace: 125,
		glowWidth: 20,
		boltWidth: 3,
		boltColor: "#0066CC",
		glow: true,
		glowColor: "#4D94DB",
		glowAlpha: 0.1
	};
	this.initialize(config);
}
Lightning.prototype = new createjs.Shape();
Lightning.prototype.Shape_initialize = Lightning.prototype.initialize;
Lightning.prototype.initialize = function(config) {
	this.Shape_initialize();
	
	this.g = this.graphics;
	
	//copying configuration
	for(var opt in config){
		conf[opt] = config[opt];
	}
}
Lightning.prototype.show = function(startX, startY, endX, endY){
	this.drawLightning(startX, startY, endX, endY, this.conf.displace);
}
Lightning.prototype.hide = function(){
	this.visible = false;
}
Lightning.prototype.drawLightning = function(x1, y1, x2, y2, displace){
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
			this.shadow = new createjs.Shadow(this.conf.glowColor, 0, 0, 10);
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
}