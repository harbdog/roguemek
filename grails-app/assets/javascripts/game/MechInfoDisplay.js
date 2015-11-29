/**
 * Class for displaying basic mech information
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 300;
var DEFAULT_HEIGHT = 50;
var BORDER_WIDTH = 3;

function MechInfoDisplay(unit) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.unit = unit;
	
	this.background = null;
	
	this.statusContainers = null;
}
var c = createjs.extend(MechInfoDisplay, createjs.Container);

// declare static mech statuses
MechInfoDisplay.STATUS_DESTROYED = "DESTROYED";
MechInfoDisplay.STATUS_PRONE = "PRONE";
MechInfoDisplay.STATUS_SHUTDOWN = "SHUTDOWN";
MechInfoDisplay.STATUS_JUMPING = "JUMPING";

c.init = function() {
	this.background = new createjs.Shape();
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.addChild(this.background);
	
	// TODO: allow custom UI colors
	
	// create static unit labels for mech name/chassis, and pilot
	var staticUnitLabel = new createjs.Text(this.unit.name +" " + this.unit.chassisVariant, "14px UbuntuMono");
	staticUnitLabel.x = 5;
	staticUnitLabel.y = 0;
	this.unitLabel = staticUnitLabel;
	this.addChild(staticUnitLabel);
	
	var staticPilotLabel = new createjs.Text(this.unit.callsign, "12px UbuntuMono");
	staticPilotLabel.x = 5;
	staticPilotLabel.y = staticUnitLabel.y + staticUnitLabel.getMeasuredHeight() * 2;
	this.pilotLabel = staticPilotLabel;
	this.addChild(staticPilotLabel);
	
	this.statusContainers = [];
	
	var unitId = this.unit.id;
	this.on("click", function() {
		// show a loading dialog while waiting to get the info display from the server
		dialogLoading.dialog("open");
		
		// introduce a small delay so the animation doesn't look weird if the response is very fast
		setTimeout(function(){
			dialogDisplay.load("battleMech/battleInfo/"+unitId, function() {
				dialogLoading.dialog("close");
				dialogDisplay.dialog("open");
				
		    	// move the header to the title area of the dialog
		    	$(".unit-header").appendTo("#unit-title");
		    });
		},250);
	});
	
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000000").drawRect(0, 0, this.width, this.height).endStroke();
	this.hitArea = hit;
	
	this.update();
}

c.update = function() {
	this.uncache();
	this.background.graphics.clear();
	
	// apply any potentially updated settings
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	this.unitLabel.color = Settings.get(Settings.UI_FG_COLOR);
	this.pilotLabel.color = Settings.get(Settings.UI_FG_COLOR);
	
	this.background.graphics.beginFill(Settings.get(Settings.UI_BG_COLOR))
			.drawRect(0, 0, this.width, this.height)
			.setStrokeStyle(BORDER_WIDTH/2, "round").beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.moveTo(0, this.height).lineTo(this.width, this.height).endStroke();
	
	this.resetStatusInfo();
	if(this.unit.isDestroyed()) {
		this.addStatusInfo(MechInfoDisplay.STATUS_DESTROYED);
	}
	else {
		// determine any statuses that still need to appear
		if(this.unit.jumping) {
			this.addStatusInfo(MechInfoDisplay.STATUS_JUMPING);
		}
		if(this.unit.prone) {
			this.addStatusInfo(MechInfoDisplay.STATUS_PRONE);
		}
		if(this.unit.shutdown) {
			this.addStatusInfo(MechInfoDisplay.STATUS_SHUTDOWN);
		}
		
		if(this.unit.effects != null) {
			var me = this;
			$.each(this.unit.effects, function(index, effect) {
				me.addStatusInfo(effect);
			});
		}
	}
	
	this.doCache();
}

/**
 * Add status info and icon to the status list and show on the display
 */
c.addStatusInfo = function(statusInfoType) {
	// declare icon width and height for all status icons
	var numStatuses = this.statusContainers.length;
	
	var statusIconType = null;
	if(MechInfoDisplay.STATUS_DESTROYED == statusInfoType) {
		statusIconType = StatusIcon.STATUS_DESTROYED;
	}
	else if(MechInfoDisplay.STATUS_PRONE == statusInfoType) {
		statusIconType = StatusIcon.STATUS_DOWN;
	}
	else if(MechInfoDisplay.STATUS_SHUTDOWN == statusInfoType) {
		statusIconType = StatusIcon.STATUS_DOWN;
	}
	else if(MechInfoDisplay.STATUS_JUMPING == statusInfoType) {
		statusIconType = StatusIcon.STATUS_JUMPING;
	}
	else {
		statusIconType = StatusIcon.STATUS_DOWN;
	}
	
	var statusInfoContainer = new createjs.Container();
	
	var statusLabel = new createjs.Text(statusInfoType, "12px UbuntuMono", Settings.get(Settings.UI_FG_COLOR));	// TODO: i18n of the statusInfoType display string
	statusLabel.x = 0;
	statusLabel.y = 0;
	statusInfoContainer.addChild(statusLabel);
	
	var statusIcon = new StatusIcon(statusIconType);
	statusIcon.init();
	statusIcon.x = 5 + statusLabel.getMeasuredWidth();
	statusIcon.y = 0;
	statusInfoContainer.addChild(statusIcon);
	
	// use generated size of icon and label to determine container position
	statusInfoContainer.x = this.width - statusIcon.width - statusIcon.x;
	statusInfoContainer.y = numStatuses * statusIcon.height;
	
	this.addChild(statusInfoContainer);
	this.statusContainers.push(statusInfoContainer);
}

/**
 * Remove and clear any status info and icons currently shown on the display
 */
c.resetStatusInfo = function() {
	for(var n=0; n<this.statusContainers.length; n++) {
		var thisStatus = this.statusContainers[n];
		this.removeChild(thisStatus);
		delete this.statusContainers[n];
	}
	
	this.statusContainers = [];
}

c.doCache = function() {
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_PERFORMANCE){
		// caching only at the lowest gfx setting
		this.cache(0,0, this.width,this.height);
	}
}

window.MechInfoDisplay = createjs.promote(MechInfoDisplay, "Container");
}());