/**
 * Generates a floating, moving message
 */
(function() {
"use strict";

var FLOAT_MESSAGE_DELAY = 300;	// delay time (ms) between consecutive floating messages

function FloatMessage(message, config) {
	this.Container_constructor();
	this.message = message;
	// TODO: allow customization of colors in floating messages
	this.conf = {
		glow: false,
		glowSize: 3,
		glowColor: "#333333",
		messageTextFont: "Bold 18px UbuntuMono"
	};
	this.setup(message, config);
}
var c = createjs.extend(FloatMessage, createjs.Container);

c.setup = function(message, config) {
	//copying configuration
	for(var opt in config){
		this.conf[opt] = config[opt];
	}
	
	// ready to draw
	if(this.conf.glow) {
		this.shadow = new createjs.Shadow(this.conf.glowColor, 0, 0, this.conf.glowSize);
	}
	this.drawFloatMessage(message);
};

c.drawFloatMessage = function(message){
	this.uncache();
	
	// create the message text
	var messageText = new createjs.Text(message, this.conf.messageTextFont, Settings.get(Settings.UI_ENEMY_COLOR));
	messageText.x = 5;
	messageText.y = 0;
	
	// make the box background the right size for the message text
	var textBounds = messageText.getBounds().clone();
	var boxBounds = new createjs.Rectangle(0, 0, textBounds.width + 10, textBounds.height + 10);
		
	var messageBox = new createjs.Shape();
	messageBox.alpha = Settings.get(Settings.UI_OPACITY);
	messageBox.graphics.beginStroke(Settings.get(Settings.UI_BG_COLOR)).beginFill(Settings.get(Settings.UI_BG_COLOR))
			.rect(boxBounds.x, boxBounds.y, boxBounds.width, boxBounds.height).endStroke();
	
	this.addChild(messageBox);
	this.addChild(messageText);
	
	this.width = boxBounds.width;
	this.height = boxBounds.height;
	this.cache(boxBounds.x, boxBounds.y, boxBounds.width, boxBounds.height);
};

c.toString = function() {
	return "[FloatMessage@"+this.x+","+this.y+":"+this.message+"]";
}

window.FloatMessage = createjs.promote(FloatMessage, "Container");
}());