/**
 * Handles all events for the game
 */

function tick(event) {
	stage.update(event);
}

function handleProgress(event) {
	progress.graphics.clear();
    
    // Draw the outline again.
    progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
    
    // Draw the progress bar
    progress.graphics.beginFill("#ff0000").drawRect(0,0,100*event.progress,20);
}

function handleComplete(event) {
	stage.removeChild(progress);
	
	// Initialize the hex map display objects
	initHexMapDisplay();
	
	// Initialize the units display objects
	initUnitsDisplay();
}

function handleHexClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var hex = event.target;
	
	console.log("clicked "+x+","+y+": "+hex);
	
	// TESTING the clicking based movement on adjacent hexes
	if(!playerUnit.coords.equals(hex.coords)){
		var adjacents = playerUnit.coords.getAdjacentCoords();
		
		// see if the clicked hex is one of the adjacents
		for (var toHeading = 0; toHeading < 6; toHeading++) {
			var adj = adjacents[toHeading];
			if(adj != null && adj.equals(hex.coords)) {
				// figure out which way that direction is relative to the unit heading, then turn or move accordingly
				
				if(toHeading == playerUnit.heading) {
					// move forward
					move(true);
				}
				else if(toHeading == ((playerUnit.heading + 3) % 6)) {
					// move backward
					move(false);
				}
				else {
					var cwHeadings = [(playerUnit.heading + 1) % 6, (playerUnit.heading + 2) % 6];
					var ccwHeadings = [(playerUnit.heading - 1) % 6, (playerUnit.heading - 2) % 6];
					
					if(jQuery.inArray( toHeading, cwHeadings ) >= 0){
						// rotate Heading CW
						rotate(true);
					}
					else{
						// rotate Heading CCW
						rotate(false);
					}
				}
				
				break;
			}
		}
	}
}

function handleUnitClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var unit = event.target;
	
	console.log("clicked "+x+","+y+": "+unit); 
}

function handleKeyboard(event) {
	var pressedForward = false;
	var pressedBackward = false;
	var pressedLeft = false;
	var pressedRight = false;
	
    switch (event.keyCode) {
        // left arrow
        case 37:
        	pressedLeft = true;
            break;
        // right arrow
        case 39:
        	pressedRight = true;
            break;
        // down arrow
        case 40:
        	pressedBackward = true;
            break;
        // up arrow 
        case 38:
        	pressedForward = true;
            break;
    }
    
    if(playerActionReady){
		if(pressedLeft){
			rotate(false);
		}
		else if(pressedRight){
			rotate(true);
		}
		else if(pressedForward){
			move(true);
		}
		else if(pressedBackward){
			move(false);
		}
    }
    else{
    	// TODO: tell player to wait until their turn and ready for action
    	console.log("Waiting...")
    }
}