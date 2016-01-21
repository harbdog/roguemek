//= require jquery
//= require jquery-ui.min.js
//= require jquery.form.js
//= require spectrum-1.7.1.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initStaging(); 
});

var dialogLoading;
var mapSelectDialog;
var unitSelectDialog;
var camoSelectDialog;
var camoSelectUserID;

/**
 * Prepares staging page on load
 */
function initStaging() {
	// setup code to render custom icons on a dropdown menu
	$.widget( "custom.iconselectmenu", $.ui.selectmenu, {
	      _renderItem: function( ul, item ) {
	        var li = $( "<li>", { text: item.label } );
	 
	        if ( item.disabled ) {
	          li.addClass( "ui-state-disabled" );
	        }
	 
	        $( "<span>", {
	          style: item.element.attr( "data-style" ),
	          "class": "ui-icon " + item.element.attr( "data-class" )
	        })
	          .appendTo( li );
	 
	        return li.appendTo( ul );
	      }
	    });
	
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
	
	// Initialize unit selection dialog
	unitSelectDialog = $("#unitSelectDiv").dialog({
		title: "Select Unit",
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
			"Select": ajaxAddUnit,
			Cancel: function() {
				unitSelectDialog.dialog("close");
			}
		}
    });
	
	// Initialize camo selection dialog
	camoSelectDialog = $("#camoSelectDiv").dialog({
		title: "Select Camo",
    	autoOpen: false,
    	modal: true,
    	// not using show/hide effects since it causes the css spinning preview to start over when finished, making it look jittery
		close: function() {
			var origColor = $("button#color-revert").val();
			var inputColor = $("#color-input").val();
			if(origColor != inputColor) {
				// apply selected camo to all player units on server
				ajaxApplyUnitCamoSelection(camoSelectUserID);
			}
			
			camoSelectUserID = null;
		},
		buttons: {
			"OK": function() {
				camoSelectDialog.dialog("close");
			}
		}
    });
    
    // Initialize loading dialog
    dialogLoading = $("#loadingDiv").dialog({
    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
    	title: "Loading...",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		}
    });
    
    // add buttons and their actions
    $("#map-button").button({
    	icons: {
    		primary: "ui-icon-carat-1-e",
    		secondary: "ui-icon-carat-1-w"
    	}
    }).click(loadMapSelect);
    
    $("button.disabled").button();
    
    
    // setup editable player teams
    if(playersEditable) {
    	// setup draggable/droppable elements
	    var teams = $(".team");
	    var players = $(".player");
	    
	    players.draggable({
	    	revert: "invalid",
	    	containment: "document",
	    	helper: "clone",
	    	cursor: "move",
	    	scroll: true,
	    	cancel: ".ui-widget"
	    });
	    
	    teams.droppable({
	    	accept: ".player",
	    	hoverClass: "ui-state-active",
	    	tolerance: "pointer",
	    	drop: function(event, ui) {
	    		transferPlayer(ui.draggable, $(this));
	    	}
	    });
    }
    
    // setup editable users/units
    if(unitsEditable) {
    	// setup camo button
    	$("button.player-camo").button({
    		icons: {
    			primary: "ui-icon-blank"
    		},
    		text: false
    	}).click(loadCamoSelect);
    	//.css("background", "red");
    	
    	// setup starting location menu
    	$( "select.location" ).iconselectmenu({change: updateLocation})
    			.iconselectmenu("menuWidget")
    			.addClass("ui-menu-icons");
    	
    	// setup user join button
    	$("button.user-join").button({
    		icons: {
    			secondary: "ui-icon-arrowreturnthick-1-n"
	    	}
    	}).click(addUser);
    	
    	// setup user delete button
	    $("button.user-delete").button({
	    	icons: {
    			primary: "ui-icon-closethick"
	    	},
	        text: false
	    }).click(deleteUser);
    	
    	// setup unit add/delete buttons
	    $("button.unit-add").button({
	    	icons: {
	    		primary: "ui-icon-plusthick"
	    	}
	    }).click(loadUnitSelect);
	    
	    $("button.unit-delete").button({
	    	icons: {
    			primary: "ui-icon-closethick"
	    	},
	        text: false
	    }).click(deleteUnit);
    }
    else {
    	// hide the user add/delete buttons
    	$("button.user-delete").hide();
    	$("button.user-add").hide();
    	
    	// hide the unit add/delete buttons
    	$("button.unit-delete").hide();
    	$("button.unit-add").hide();
    }
    
    // begin polling for updates
    poll();
}

function loadCamoSelect() {
	
	var $this = $(this);
	var userId = $this.prop("id");
	
	var inputMap = {
		userId: userId
	};
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		camoSelectDialog.load("camoSelect", inputMap, function() {
			dialogLoading.dialog("close");
			showCamoSelect();
	    });
	},250);
}

function showCamoSelect() {
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	camoSelectUserID = $(".camo-selection").prop("id");
	
	camoSelectDialog.dialog("option", "position", {my: "center", at: "center", of: window});
	camoSelectDialog.dialog("option", "width", windowWidth/2);
	camoSelectDialog.dialog("option", "height", windowHeight/2);
	
	$("#color-input").spectrum({
		preferredFormat: "rgb",
		showInitial: true,
		clickoutFiresChange: false,
		show: function() {
			$(this).data('changed', false);
			$(this).data('origColor', tinycolor($("#color-input").val()));
		},
		change: function(color) {
			$(this).data('changed', true);
		},
		hide: function(color) {
			if($(this).data('changed')) {
				// changed
				ajaxUpdateCamoColorSelection(camoSelectUserID, tinycolor($("#color-input").val()));
			} else {
				// cancelled
			}
		}
	});
	
	$("button#color-revert").click(function() {
		var origColor = $("button#color-revert").val();
		var inputColor = $("#color-input").val();
		if(origColor != inputColor) {
			$("#color-input").spectrum("set", origColor);
			ajaxUpdateCamoColorSelection(camoSelectUserID, tinycolor(origColor));
		}
	});
	
	camoSelectDialog.dialog("open");
}

function ajaxUpdateCamoColorSelection(userId, rgbTinyColor) {
	var inputMap = {
			userId: userId, 
			rgbCamo: rgbTinyColor.toRgb()
	};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	$.getJSON("camoUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				if(data.image != null) {
					// update the preview unit image
					var base64 = _arrayBufferToBase64(data.image);
					
					$("img.unit-preview").attr("src", "data:image/gif;base64," + base64);
				}
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function ajaxApplyUnitCamoSelection(userId) {
	var inputMap = {
			userId: userId, 
	};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	$.getJSON("camoApply", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// TODO: update the elements on the page without forcing reload
				location.reload();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function updateLocation(event, data) {
	var $this = $(this);
	var userId = $this.prop("id");
	
	var locationValue = data.item.value;
	
	var inputMap = {
		userId: userId,
		location: locationValue
	};
	
	$.getJSON("locationUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				console.log("updated location: "+locationValue)
			}
		});
}

function addUser() {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	$.getJSON("addUser", null)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// TODO: update the elements on the page without forcing reload
				location.reload();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function deleteUser() {
	// ask user to confirm deletion
	var $this = $(this);
	var userId = $this.prop("id");
	
	$("<div style='font-size:0.8em;'>Are you sure you want to remove this player from battle?</div>").dialog({	// TODO: i18n for deletion message
		title: "Remove Player",
		resizable: false,
		modal: true,
		buttons: {
			"Remove": function() {
				$(this).dialog("close");
				ajaxDeleteUser(userId, $this);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		position: {my: "left top", at: "left bottom", of: $this}
	});
}

function ajaxDeleteUser(userId, $this) {
	dialogLoading.dialog("option", "position", {my: "left top", at: "left bottom", of: $this});
	dialogLoading.dialog("open");

	var inputMap = {userId: userId};
	
	$.getJSON("removeUser", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				$this.closest("div.player").fadeOut();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function deleteUnit() {
	// ask user to confirm deletion
	var $this = $(this);
	var unitId = $this.prop("id");
	
	$("<div style='font-size:0.8em;'>Are you sure you want to remove this unit from battle?</div>").dialog({	// TODO: i18n for deletion message
		title: "Remove Unit",
		resizable: false,
		modal: true,
		buttons: {
			"Remove": function() {
				$(this).dialog("close");
				ajaxDeleteUnit(unitId, $this);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		position: {my: "left top", at: "left bottom", of: $this}
	});
}

function ajaxDeleteUnit(unitId, $this) {
	dialogLoading.dialog("option", "position", {my: "left top", at: "left bottom", of: $this});
	dialogLoading.dialog("open");

	var inputMap = {unitId: unitId};
	
	$.getJSON("removeUnit", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				$this.closest("div.player-unit").fadeOut();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function loadUnitSelect() {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		unitSelectDialog.load("unitSelect", function() {
			dialogLoading.dialog("close");
			showUnitSelect();
	    });
	},250);
}

function showUnitSelect() {
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	
	unitSelectDialog.dialog("option", "position", {my: "center", at: "center", of: window});
	unitSelectDialog.dialog("option", "width", windowWidth/2);
	unitSelectDialog.dialog("option", "height", windowHeight);
	unitSelectDialog.dialog("open");
}

function ajaxAddUnit() {
	// add selected unit to the battle
	var selectedUnitId = $("input[type='radio'][name='unit-radio']:checked").val();
	var selectedUnitName = $($("input[type='radio'][name='unit-radio']:checked").prop("labels")).text();
	var inputMap = {unitId: selectedUnitId};
	
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	
	unitSelectDialog.dialog("close");
	dialogLoading.dialog("open");
	
	$.getJSON("addUnit", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				// TODO: update the elements on the page without forcing reload
				location.reload();
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function transferPlayer($playerDiv, $teamDiv) {
	$playerDiv.fadeOut(function() {
		$playerDiv.appendTo($teamDiv).fadeIn();
	})
	
	// TODO: implement teams in the game and update the database data from the drop
}

function loadMapSelect() {
	
	// show a loading dialog while waiting to get the info display from the server
	dialogLoading.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	dialogLoading.dialog("open");
	
	// introduce a small delay so the animation doesn't look weird if the response is very fast
	setTimeout(function(){
		mapSelectDialog.load("mapSelect", function() {
			dialogLoading.dialog("close");
			showMapSelect();
	    });
	},250);
}

function showMapSelect() {
	
	if(selectedMapId == null) {
		// TODO: select RANDOM
	}
	else {
		$("input[type='radio'][name='map-radio'][value='"+selectedMapId+"']").prop("checked", true);
	}
	
	mapSelectDialog.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	mapSelectDialog.dialog("open");
}

function ajaxUpdateMapSelection() {
	selectedMapId = $("input[type='radio'][name='map-radio']:checked").val();
	
	var selectedMapName = $($("input[type='radio'][name='map-radio']:checked").prop("labels")).text();
	var inputMap = {mapId: selectedMapId};
	
	dialogLoading.dialog("option", "position", {my: "left top", at: "left top", of: $("#map-button")});
	
	mapSelectDialog.dialog("close");
	dialogLoading.dialog("open");
	
	$.getJSON("mapUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				$("#map-button").button("option", "label", selectedMapName);
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

/**
 * Long polling to retrieve updates from staging asynchronously
 */
function poll() {
    $.getJSON("poll", null)
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(function(data){
    	
		if(data.terminated) {
			console.log("poll terminated, starting over");
		}
		else if(data.date) {
			// call the method that updates the client based on the polled return data
	    	console.log("polled date: "+data.date);
	        pollUpdate(data.updates);
		}
		
    })
	.always(function() {
		// poll again!
		poll();
	});
}

/**
 * Perform updates based on poll data
 * @param updates
 */
function pollUpdate(updates) {
	if(updates == null) return;
	
	$.each(updates, function(i, thisUpdate) {
		
		// Add the message from the update to the message display area
		var t = new Date(thisUpdate.time);
		var data = thisUpdate;
		
		if(thisUpdate.message != null) {
			if(thisUpdate.message.length > 0) {
				// only show a message if it had something to say
				console.log("MESSAGE: ["+t.toLocaleTimeString()+"] "+thisUpdate.message);
				//addMessageUpdate("["+t.toLocaleTimeString()+"] "+thisUpdate.message);
			}
			if(thisUpdate.data != null) {
				// the data payload from a transmitted message is in its own key "data"
				data = thisUpdate.data;
			}
		}
		
		if(data != null) {
			updateStagingData(data);
		}
	});
}

/**
 * Handle all staging updates resulting from server actions
 * @param data
 */
function updateStagingData(data) {
	console.log(data);
	
	if(data.map != null) {
		var effectOptions = {color: "#3399FF"};
		
		// since only the game owner can select using #map-button, others will get updates on the span #map-selection
		$("#map-selection").text(data.map)
				.effect("highlight", effectOptions, 2000);
	}
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