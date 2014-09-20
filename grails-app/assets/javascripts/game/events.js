/**
 * Handles all events for the game
 */

function tick(event) {
	stage.update(event);
	
	if(hexImagesReady && unitImagesReady){
		queue.loadManifest(manifest);
		hexImagesReady = false;
		unitImagesReady = false;
	}
}

function handleProgress(event) {
	progress.graphics.clear();
    
    // Draw the outline again.
    progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
    
    // Draw the progress bar
    progress.graphics.beginFill("#ff0000").drawRect(0,0,100*event.progress,20);
}

function handleComplete(event) {
	$('#spinner').fadeOut();
	stage.removeChild(progress);
	
	// Initialize the hex map display objects
	initHexMapDisplay();
	
	// Initialize the units display objects
	initUnitsDisplay();
}

//TESTING (since this will later be handled with server interaction)
function handleKeyboard(event) {
	var pressedForward = false;
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
            break;
        // up arrow 
        case 38:
        	pressedForward = true;
            break;
    }
    
    $.each(units, function(index, thisDisplayUnit) {
    	// testing rotation updates
    	if(pressedLeft){
    		rotate(false);
    	}
    	else if(pressedRight){
    		rotate(true);
    	}
    	else if(pressedForward){
			//testing move forward updates
			move();
    	}
	});
}