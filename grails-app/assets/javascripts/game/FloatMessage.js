/**
 * Generates a floating, moving message
 */
(function() {
"use strict";

var FLOAT_MESSAGE_DELAY = 300;	// delay time (ms) between consecutive floating messages

function FloatMessage(message, config) {
	this.Container_constructor();
	
	this.conf = {
		glow: false,
		glowSize: 3,
		glowColor: "#333333",
		messageBoxAlpha: 0.7,
		messageBoxColor: "#000000",
		messageTextFont: "Bold 18px Monospace",
		messageTextColor: "#FF0000"
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
	var messageText = new createjs.Text(message, this.conf.messageTextFont, this.conf.messageTextColor);
	
	// make the box background the right size for the message text
	var textBounds = messageText.getBounds().clone();
	var messageBox = new createjs.Shape();
	messageBox.alpha = this.conf.messageBoxAlpha;
	messageBox.graphics.beginStroke(this.conf.messageBoxColor).beginFill(this.conf.messageBoxColor)
			.rect(textBounds.x - 5, textBounds.y, textBounds.width + 10, textBounds.height + 10).endStroke();
	
	this.addChild(messageBox);
	this.addChild(messageText);
	
	this.cache(textBounds.x - 5, textBounds.y, textBounds.width + 10, textBounds.height + 10);
};

window.FloatMessage = createjs.promote(FloatMessage, "Container");
}());