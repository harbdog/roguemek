/**
 * Class for displaying an individual weapon for selection
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 200;
var DEFAULT_HEIGHT = 25;
var BORDER_WIDTH = 3;

function AlphaStrikeDisplay(hotkey) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = DEFAULT_HEIGHT;
	
	this.hotkey = hotkey;
	this.selected = false;
	this.active = true;
	
	this.background = null;
	this.numBackground = null;
	this.numLabel = null;
	this.nameLabel = null;
	this.selectionLabel = null;
}
var c = createjs.extend(AlphaStrikeDisplay, createjs.Container);

AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH = new createjs.Text("99", "16px UbuntuMono", "#FFF").getMeasuredWidth();

c.init = function() {
	
	// add weapon number label
	this.numLabel = new createjs.Text(this.hotkey, "16px UbuntuMono", Settings.get(Settings.UI_BG_COLOR));
	this.numLabel.x = (AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH - this.numLabel.getMeasuredWidth())/2;
	this.numLabel.y = BORDER_WIDTH*2;
	this.addChild(this.numLabel);
	
	// add weapon number label background
	this.numBackground = new createjs.Shape();
	this.numBackground.x = 0;
	this.numBackground.y = 0;
	this.addChildAt(this.numBackground, 0);
	
	// add weapon name label (and ammo, if applicable)
	var weaponStr = "ALPHA STRIKE";		// TODO: i18n for this
	this.nameLabel = new createjs.Text(weaponStr, "14px UbuntuMono", Settings.get(Settings.UI_FG_COLOR));
	this.nameLabel.x = 5 + this.numLabel.x + this.numLabel.getMeasuredWidth() + BORDER_WIDTH;
	this.nameLabel.y = 5;
	this.addChild(this.nameLabel);
	
	// the update method will show actual calculated TO-HIT 
	var selectionText = "   +";
	// add weapon % to hit label to the far right
	this.selectionLabel = new createjs.Text(selectionText, "14px UbuntuMono", Settings.get(Settings.UI_FG_COLOR));
	this.selectionLabel.x = this.width - this.selectionLabel.getMeasuredWidth() - 5;
	this.selectionLabel.y = 5;	
	this.addChild(this.selectionLabel);
	
	// add the background shape
	this.background = new createjs.Shape();
	this.addChildAt(this.background, 0);
	
	// add listener
	this.on("click", handleWeaponClick);
	this.mouseChildren = false;
	
	this.update();
}

c.update = function() {
	this.uncache();
	
	this.background.alpha = Settings.get(Settings.UI_OPACITY);
	
	this.drawSelected();
	
	this.numBackground.graphics.clear();
	this.numBackground.graphics.beginFill(Settings.get(Settings.UI_FG_COLOR))
			.drawRect(0, BORDER_WIDTH, AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH,  this.height - BORDER_WIDTH);
	
	if(this.isActive()) {
		this.numLabel.color = Settings.get(Settings.UI_BG_COLOR);
		this.nameLabel.color = Settings.get(Settings.UI_FG_COLOR);
		this.selectionLabel.color = Settings.get(Settings.UI_FG_COLOR);
	}
	else {
		this.numLabel.color = "#A0A0A0";
		this.nameLabel.color = "#A0A0A0";
		this.selectionLabel.color = "#A0A0A0";
	}
	
	// update selection text
	var selectionText = "   +";
	if(this.selected) {
		selectionText = "   -";
	}
	this.selectionLabel.text = selectionText;
	this.selectionLabel.x = this.width - this.selectionLabel.getMeasuredWidth() - 5;
	
	// create hit area (it never needs to be added to display)
	var hit = new createjs.Shape();
	hit.graphics.beginFill("#000000").drawRect(0, 0, this.width, this.height).endStroke();
	this.hitArea = hit;
	
	this.doCache();
}

c.drawSelected = function() {
	this.background.graphics.clear();
	
	if(this.selected) {
		// update background as selected to fire
		this.background.graphics.beginFill("#FF0000")
				.drawRect(AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH, BORDER_WIDTH, 
					this.width-AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH, this.height).endStroke();
	}
	else {
		this.background.graphics.beginFill(Settings.get(Settings.UI_BG_COLOR))
				.drawRect(AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH, BORDER_WIDTH, 
					this.width-AlphaStrikeDisplay.MAX_NUMBER_LABEL_WIDTH, this.height).endStroke();
	}
	
	var selectionText = "   +";
	if(this.selected) {
		selectionText = "   -";
	}
	this.selectionLabel.text = selectionText;
}

c.isSelected = function() {
	return this.selected;
}
c.setSelected = function(selected) {
	this.uncache();
	
	this.selected = selected;
	this.drawSelected();
	
	this.doCache();
}

c.isActive = function() {
	return this.active;
}

c.setActive = function(active) {
	this.uncache();
	
	this.active = active;
	this.update();
	
	this.doCache();
}

c.doCache = function() {
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_PERFORMANCE){
		// caching only at the lowest gfx setting
		this.cache(0,0, this.width,this.height);
	}
}

c.toString = function() {
	return "[AlphaStrikeDisplay@"+this.x+","+this.y+"]";
}

window.AlphaStrikeDisplay = createjs.promote(AlphaStrikeDisplay, "Container");
}());
