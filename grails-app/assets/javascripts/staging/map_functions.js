/**
 * map_functions.js - Methods that handles map updates in staging
 */
 
"use strict";

var mapSelectDialog;
var mapPreviewDialog;

/**
 * Initializes map related UI components
 */
function initMapUI() {
    // Initialize map selection dialog
	mapSelectDialog = $("#mapSelectDiv").dialog({
		title: "Select Map",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "blind",
			duration: 350
		},
		hide: {
			effect: "blind",
			duration: 250
		},
		buttons: {
			"Select": ajaxUpdateMapSelection,
			Cancel: function() {
				mapSelectDialog.dialog("close");
			}
		}
    });
	
	// Initialize map preview dialog
	mapPreviewDialog = $("#mapPreviewDiv").dialog({
		title: "Preview Map",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "blind",
			duration: 350
		},
		hide: {
			effect: "blind",
			duration: 250
		},
		buttons: {
			Close: function() {
				mapPreviewDialog.dialog("close");
			}
		}
    });
    
    // add buttons and their actions
    $("#map-button").button({
    	icons: {
    		primary: "ui-icon-carat-1-e",
    		secondary: "ui-icon-carat-1-w"
    	}
    }).click(loadMapSelect);
    
    $("#map-selected").button({
    	icons: {
    		secondary: "ui-icon-image"
    	}
    }).click(previewMapSelect);
}

/**
 * Called when a game participant clicks to view the map preview
 */
function previewMapSelect() {
	if(selectedMapId == null) return;
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	var data = {mapId: selectedMapId}
	
	mapPreviewDialog.load("previewMap", data, function() {
		dialogLoading.dialog("close");
		
		var idealDialogWidth = 500;
		
		var windowWidth = $(window).width();
		
		// make sure the width of the dialog in the window isn't too small to show everything
        var dialogWidth = idealDialogWidth;
		if(windowWidth < idealDialogWidth) {
			dialogWidth = windowWidth;
		}
		
		mapPreviewDialog.dialog("option", "position", {my: "center", at: "center", of: window});
		mapPreviewDialog.dialog("option", "width", dialogWidth);
		//mapPreviewDialog.dialog("option", "height", windowHeight);
		mapPreviewDialog.dialog("open");
    });
}

/**
 * Called when the game owner clicks to change the map
 */
function loadMapSelect() {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		mapSelectDialog.load("mapSelect", function() {
			dialogLoading.dialog("close");
			showMapSelect();
	    });
	},250);
}

/**
 * Prepares the map selections screen for being shown
 */
function showMapSelect() {
	
	if(selectedMapId == null) {
		// TODO: select RANDOM
	}
	else {
		$("input[type='radio'][name='map-radio'][value='"+selectedMapId+"']").prop("checked", true);
	}
	
	var idealDialogWidth = 800;
	
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	var dialogWidth = 3*windowWidth/4;
	if(dialogWidth < idealDialogWidth) {
		// make sure the width of the dialog in the window isn't too small to show everything
		if(windowWidth < idealDialogWidth) {
			dialogWidth = windowWidth;
		}
		else {
			dialogWidth = idealDialogWidth;
		}
	}
	
	mapSelectDialog.dialog("option", "position", {my: "top", at: "top", of: window});
	mapSelectDialog.dialog("option", "width", dialogWidth);
	//mapSelectDialog.dialog("option", "height", windowHeight);
	mapSelectDialog.dialog("open");
	
	setupAjaxMapSelect();
	
	if(selectedMapId) {
		// have the selected map show its preview after opening the dialog
		ajaxUpdateMapPreview(selectedMapId);
	}
}

/**
 * load the given map id into the map preview div using ajax
 */
function ajaxUpdateMapPreview(mapId) {
	var selection = $("#map-selection-preview");
	
	$.ajax({
        type: 'GET',
        url: 'previewMap',
        data: {mapId: mapId},
        success: function(data) {
        	// hide, load, then slide in the new unit preview
            $(selection).hide({
            	effect: 'fade',
            	duration: 250,
            	complete: function() {
            		$(this).html(data).effect({
            			effect: 'fade',
            			duration: 350
            		});
            	}
            })
        }
    });
}

/**
 * setup ajax paging and sorting for the map select
 */
function setupAjaxMapSelect() {
	// Disable the Select button until a selection is made
	// http://stackoverflow.com/a/3646440/854696
	var selectButton = $("div.ui-dialog-buttonpane button:contains('Select')").button("disable");
	
	$('input:radio[name="map-radio"]').change(function() {
		// show the select button since a selection has been made
		selectButton.button("enable");
		
		var mapId = $(this).val();
        
		ajaxUpdateMapPreview(mapId);
	});
	
	// enable ajax paging and sorting
	$("#map-selection").find(".pagination a, th.sortable a").on({
		click: function(event) {
	        event.preventDefault();
	        selectButton.button("disable");
	        
	        var url = $(this).attr('href');
	        
	        var selection = $("#map-selection");
	        $(selection).html($("#spinner").html());
	
	        $.ajax({
	            type: 'GET',
	            url: url,
	            success: function(data) {
	                $(selection).fadeOut('fast', function() {$(this).html(data).fadeIn({complete: setupAjaxMapSelect});});
	            }
	        });
		}
    });
	
	// allow clicking on a row to select the radio button for that entry
	$("#map-selection").find("tr").on({
		click: function(event) {
			if(event.target.type !== 'radio') {
				$(":radio", this).trigger("click");
			}
		}
	});
}

/**
 * Sends request to the server to change the map
 */
function ajaxUpdateMapSelection() {
	selectedMapId = $("input[type='radio'][name='map-radio']:checked").val();
	
	var selectedMapName = $($("input[type='radio'][name='map-radio']:checked").prop("labels")).text();
	var inputMap = {mapId: selectedMapId};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	
	mapSelectDialog.dialog("close");
	dialogLoading.dialog("open");
	
	$.getJSON("mapUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// updateStagingData will handle updating the name on the button element
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}
