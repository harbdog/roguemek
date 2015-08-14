/**
 * Class for displaying each Unit
 */
(function() {

function UnitDisplay(id, imageArr, imageStr, rgb) {
	this.Container_constructor();
	
	this.id = id;
	this.imageStr = imageStr;
	this.rgb = rgb;
	
	if(imageArr != null) {
		// render the Image from the byte array
		var base64 = _arrayBufferToBase64(imageArr);
		  
		var img = new Image();
		img.src = "data:image/gif;base64," + base64;
		  
		this.image = img;
	}
}
var c = createjs.extend(UnitDisplay, createjs.Container);

c.setUnit = function(unit) {
	this.unit = unit;
}

c.getImageString = function() {
	return this.imageStr;
}

c.getImage = function() {
	return this.image;
}

//http://stackoverflow.com/a/9458996/128597
function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

c.update = function() {
	this.uncache();
	
	this.x = this.getUpdatedDisplayX(this.unit.coords);
	this.y = this.getUpdatedDisplayY(this.unit.coords);
	this.rotation = this.getUpdatedDisplayRotation(this.unit.heading);
	
	this.showUnitIndicator();
	
	// TODO: cache the object
	//this.cache(0,0, 0,0);
}

c.getUpdatedDisplayX = function(coords) {
	return coords.x * (3 * hexWidth / 4) + (hexWidth / 2);
}
c.getUpdatedDisplayY = function(coords) {
	
	var displayY = 0;
	if(coords.isXOdd()){
		displayY = (hexHeight / 2) + (coords.y * hexHeight) + (hexHeight / 2);
	}
	else{
		displayY = coords.y * hexHeight + (hexHeight / 2);
	}
	
	if(useIsometric) {
		// shift the Y value up (negative) to match the displayed elevation for isometric view
		// by finding the Hex object and use its elevation to offset
		if(hexMap != null) {
			var thisHexRow = hexMap[coords.y];
			if(thisHexRow != null) {
				var thisHex = thisHexRow[coords.x];
				if(thisHex != null) {
					displayY -= (elevationHeight * thisHex.getElevation());
				}
			}
		}
	}
	
	return displayY;
}
c.getUpdatedDisplayRotation = function(heading) {
	return HEADING_ANGLE[heading];
}
c.setOtherTurnVisible = function(visible) {
	if(visible) {
		if(this.forwardControl == null) {
			this.otherTurn = new createjs.Container();
			
			var otherImg = queue.getResult("other_turn");
			var otherTurnImg = new createjs.Bitmap(otherImg);
			this.otherTurn.x = (hexWidth/2) - (otherImg.width/2);
			this.otherTurn.y = -(otherImg.height/2);
			this.otherTurn.alpha = 0;
			
			this.otherTurn.addChild(otherTurnImg);
		}
		
		this.addChild(this.otherTurn);
		
		createjs.Tween.get(this.otherTurn).to({alpha: 0.75}, 250);
	}
	else if(this.otherTurn != null) {
		createjs.Tween.get(this.otherTurn).to({alpha: 0}, 250);
		this.removeChild(this.otherTurn);
	}
}
c.setControlsVisible = function(visible) {
	/*this.showRotateControlCW(visible);
	this.showRotateControlCCW(visible);
	this.showForwardControl(visible);
	this.showBackwardControl(visible);*/
}
c.animateUpdateDisplay = function(coords, heading) {
	var newX = this.getUpdatedDisplayX(coords);
	var newY = this.getUpdatedDisplayY(coords);
	var actualRot = this.getUpdatedDisplayRotation(heading);
	
	var newRot = actualRot;
	if(this.rotation == HEADING_ANGLE[HEADING_N] && newRot == HEADING_ANGLE[HEADING_NW]) {
		// fixes the issue where it tries to rotate the long way to go from N to NW (0->300)
		newRot = -60;
	}
	else if(this.rotation == HEADING_ANGLE[HEADING_NW] && newRot == HEADING_ANGLE[HEADING_N]) {
		// fixes the issue where it tries to rotate the long way to go from NW to N (300->0)
		newRot = 360;
	}
	
	createjs.Tween.get(this)
		.to({x: newX, y: newY, rotation: newRot}, 250)
		.call(function() {
			// put the actual angle in after animated so it doesn't rotate the long way at a different angle
			this.rotation = actualRot;
			update = true;
		})
		.addEventListener("change", function() {
			update = true;
		});
}
c.showRotateControlCW = function(visible) {
	if(visible) {
		if(this.rotateControlCW == null) {
			this.rotateControlCW = new createjs.Container();
			
			var rotateImg = queue.getResult(ACTION_ROTATE_CW);
			var rotateControlImg = new createjs.Bitmap(rotateImg);
			this.rotateControlCW.x = hexWidth - rotateImg.width + 5;
			this.rotateControlCW.y = rotateImg.height/2;
			this.rotateControlCW.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.rotateControlCW.hitArea = controlHit;
			this.rotateControlCW.on("click", function(evt){
				handleControls(ACTION_ROTATE_CW);
			});
			
			this.rotateControlCW.addChild(rotateControlImg);
		}
		
		this.addChild(this.rotateControlCW);
		
		createjs.Tween.get(this.rotateControlCW).to({alpha: 0.75}, 500);
	}
	else if(this.rotateControlCW != null) {
		createjs.Tween.get(this.rotateControlCW).to({alpha: 0}, 250);
		this.removeChild(this.rotateControlCW);
	}
}
c.showRotateControlCCW = function(visible) {
	if(visible) {
		if(this.rotateControlCCW == null) {
			this.rotateControlCCW = new createjs.Container();
			
			var rotateImg = queue.getResult(ACTION_ROTATE_CCW);
			var rotateControlImg = new createjs.Bitmap(rotateImg);
			this.rotateControlCCW.x = -5;
			this.rotateControlCCW.y = rotateImg.height/2;
			this.rotateControlCCW.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.rotateControlCCW.hitArea = controlHit;
			this.rotateControlCCW.on("click", function(evt){
				handleControls(ACTION_ROTATE_CCW);
			});
			
			this.rotateControlCCW.addChild(rotateControlImg);
		}
		
		this.addChild(this.rotateControlCCW);
		
		createjs.Tween.get(this.rotateControlCCW).to({alpha: 0.75}, 500);
	}
	else if(this.rotateControlCCW != null) {
		createjs.Tween.get(this.rotateControlCCW).to({alpha: 0}, 250);
		this.removeChild(this.rotateControlCCW);
	}
}
c.showForwardControl = function(visible) {
	if(visible) {
		if(this.forwardControl == null) {
			this.forwardControl = new createjs.Container();
			
			var forwardImg = queue.getResult(ACTION_FORWARD);
			var forwardControlImg = new createjs.Bitmap(forwardImg);
			this.forwardControl.x = (hexWidth/2) - (forwardImg.width/2);
			this.forwardControl.y = -(forwardImg.height/2);
			this.forwardControl.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.forwardControl.hitArea = controlHit;
			this.forwardControl.on("click", function(evt){
				handleControls(ACTION_FORWARD);
			});
			
			this.forwardControl.addChild(forwardControlImg);
		}
		
		this.addChild(this.forwardControl);
		
		createjs.Tween.get(this.forwardControl).to({alpha: 0.75}, 500);
	}
	else if(this.forwardControl != null) {
		createjs.Tween.get(this.forwardControl).to({alpha: 0}, 250);
		this.removeChild(this.forwardControl);
	}
}
c.showBackwardControl = function(visible) {
	if(visible) {
		if(this.backwardControl == null) {
			this.backwardControl = new createjs.Container();
			
			var backwardImg = queue.getResult(ACTION_BACKWARD);
			var backwardControlImg = new createjs.Bitmap(backwardImg);
			this.backwardControl.x =(hexWidth/2) - (backwardImg.width/2);
			this.backwardControl.y = hexHeight - (backwardImg.height/2);
			this.backwardControl.alpha = 0;
			
			// create hit box for the control
			var controlHit = new createjs.Shape();
			controlHit.graphics.beginFill("#000000").drawRect(0, 0, 20, 20);
			this.backwardControl.hitArea = controlHit;
			this.backwardControl.on("click", function(evt){
				handleControls(ACTION_BACKWARD);
			});
			
			this.backwardControl.addChild(backwardControlImg);
		}
		
		this.addChild(this.backwardControl);
		
		createjs.Tween.get(this.backwardControl).to({alpha: 0.75}, 500);
	}
	else if(this.backwardControl != null) {
		createjs.Tween.get(this.backwardControl).to({alpha: 0}, 250);
		this.removeChild(this.backwardControl);
	}
}

c.showUnitIndicator = function() {
	var indicator = new createjs.Shape();
	
	// TODO: allow customization of the player unit indicator color
	if(isPlayerUnit(this.unit)) {
		indicator.graphics.setStrokeStyle(3, "round").beginStroke("#3399FF").drawCircle(0, 0, hexWidth/3-2).endStroke();
	}
	else{
		//indicator.graphics.setStrokeStyle(3, "round").beginStroke("#FF3737").drawCircle(0, 0, hexWidth/3-2).endStroke();
		indicator.graphics.setStrokeStyle(3, "round").beginStroke("#FF3737").drawPolyStar(0, 0, hexWidth/3, 4, 0.6, -90).endStroke();
	}
	
	this.addChildAt(indicator, 0);
}

c.showTurnDisplay = function(show) {
	if(this.getChildAt(0) != null) {
		// TODO store these Shape objects or their index in a better way
		createjs.Tween.removeTweens(this.getChildAt(0));
		this.removeChildAt(0);
	}
	
	if(show) {
		var turnDisplay = new createjs.Shape();
		
		if(isPlayerUnit(this.unit)) {
			turnDisplay.graphics.setStrokeStyle(2, "round").beginStroke("#3399FF").drawCircle(0, 0 ,hexWidth/10).endStroke();
		}
		else {
			turnDisplay.graphics.setStrokeStyle(2, "round").beginStroke("#FF3737").drawPolyStar(0, 0, hexWidth/10, 4, 0.6, -90).endStroke();
		}
		
		this.addChildAt(turnDisplay, 0);
		
		createjs.Tween.get(turnDisplay, { loop: true})
			.to({alpha: 0.75, scaleX: 2.5, scaleY: 2.5}, 750)
			.to({alpha: 0.25, scaleX: 4.0, scaleY: 4.0}, 750)
			.addEventListener("change", function() {
				update = true;
			});
	}
	else{
		this.showUnitIndicator();
	}
}

c.doCache = function(startX, startY, endX, endY) {
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
	
	this.cache(cacheX, cacheY, cacheW, cacheH);
}

c.toString = function() {
	return "[UnitDisplay@"+this.x+","+this.y+":"+this.imageStr+"]";
}

window.UnitDisplay = createjs.promote(UnitDisplay, "Container");
}());