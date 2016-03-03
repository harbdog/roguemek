/**
 * Class for displaying a scrolling messages and chat area
 */
(function() {
"use strict";

var DEFAULT_HEIGHT = 75;

function MessagingDisplay() {
	this.Container_constructor();
	
	this.width = 1000;
	this.height = DEFAULT_HEIGHT;
	
	this.background = null;
	this.messagingElement = null;
	this.inputElement = null;
	
	this.isChatInput = false;
	this.$chatInput = null;
	
	this.init();
}
var c = createjs.extend(MessagingDisplay, createjs.Container);

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.addChild(this.background);
	
	this.messagingElement = this.makeTextArea("messagingArea");
	this.inputElement = this.makeInputArea("chat-input");
	
	var me = this;
	this.$chatInput = $("#chat-input");
	
	// hide chat input until user wants to chat
	this.$chatInput.hide().on("focus", function(){
		me.isChatInput = true;
	}).on("blur", function() {
		me.isChatInput = false;
	});
	
	this.update()
}

c.showChatInput = function(show) {
	if(show) {
		this.$chatInput.show().focus();
	}
	else {
		this.$chatInput.hide().blur();
	}
}

c.getChatInput = function() {
	return this.$chatInput.val();
}

c.setChatInput = function(string) {
	this.$chatInput.val(string);
}

c.makeTextArea = function(id) {
	// create and populate element
	var e = document.getElementById(id);
	// attach element to stage
	document.body.appendChild(e);
	
	var content = new createjs.DOMElement(e);
	
	return this.addChild(content);
}

c.makeInputArea = function(id) {
	// create and populate element
	var e = document.getElementById(id);
	// attach element to stage
	document.body.appendChild(e);
	
	var content = new createjs.DOMElement(e);
	
	return this.addChild(content);
}

c.update = function() {
	// update messaging area
	this.width = canvas.width*(1/overlay.scaleX) - 75/2;
	this.x = canvas.width*(1/overlay.scaleX) - this.width;
	this.y = 0;
	
	this.background.graphics.clear();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.background.graphics.beginFill(Settings.get(Settings.UI_BG_COLOR))
			.drawRect(0, 0, this.width, this.height);
	
	this.messagingElement.htmlElement.style.width = this.width + "px";
	this.messagingElement.htmlElement.style.height = this.height + "px";
	
	$("#messagingArea").css("color", Settings.get(Settings.UI_FG_COLOR));
	$("#messagingArea").css("border-color", Settings.get(Settings.UI_FG_COLOR));
	$("#chat-users").css("border-color", Settings.get(Settings.UI_FG_COLOR));
	
	// Do NOT cache this object, it causes massive frameloss on slow tablets 
	//this.cache(0,0, this.width,this.height);
	
	// update chat input area
	this.inputElement.htmlElement.style.width = this.width + "px";
	this.inputElement.x = 0;
	this.inputElement.y = this.height;
}

c.addMessage = function(message, time, user, scrollToBottom) {
	var $chat = $('#chat-window');
	
	if(message != null && message.length > 0) { 
		//this.messagingElement.htmlElement.innerHTML += "&#13;&#10;"+message;
		var chatLine = "<div class='chat-line'>";
		if(time != null) {
			chatLine += "<span class='chat-time'>"+"["+new Date(time).toLocaleTimeString()+"]"+"</span>";
		}
		if(user != null) {
			chatLine += "<span class='chat-user'>"+ user +":</span>";
		}
		if(message != null) {
			chatLine += "<span class='chat-message'>"+ message +"</span>";
		}
		chatLine += "</div>";
		
		$chat.append(chatLine);
		
		// TODO: allow customization of colors in chat!
		var effectOptions = {color: shadeColor("#3399FF", -0.5)};
		$(".chat-line").last().effect("highlight", effectOptions, 2000);
	}
	
	if(scrollToBottom) {
		//this.messagingElement.htmlElement.scrollTop = this.messagingElement.htmlElement.scrollHeight;
		$chat.scrollTop($chat[0].scrollHeight);
	}
}

window.MessagingDisplay = createjs.promote(MessagingDisplay, "Container");
}());