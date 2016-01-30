//= require jquery.min.js
//= require jquery-ui.min.js
//= require jquery.form.js
//= require atmosphere-meteor-jquery
//= require spectrum-1.7.1.js
//= require_self

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	initStaging();
	
	initAtmosphere();
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
    
    // setup any dynamic UI pieces present at init
    setupDynamicUI();
    
    // begin polling for updates
    poll();
}

/**
 * Sets up any parts of the UI that may be added or removed with ajax
 */
function setupDynamicUI() {
	
	// setup editable player teams
    if(playersEditable) {
    	// setup draggable/droppable elements
	    var teams = $(".team");
	    var players = $(".player");
	    
	    players.each(function() {
	    	if($(this).draggable("instance") != null) return
	    	
	    	$(this).draggable({
		    	revert: "invalid",
		    	containment: "document",
		    	helper: "clone",
		    	cursor: "move",
		    	scroll: true,
		    	cancel: ".ui-widget"
		    });
	    });
	    
	    teams.each(function(){
	    	if($(this).droppable("instance") != null) return
	    	
	    	$(this).droppable({
		    	accept: ".player",
		    	hoverClass: "ui-state-active",
		    	tolerance: "pointer",
		    	drop: function(event, ui) {
		    		transferPlayer(ui.draggable, $(this));
		    	}
		    });
	    });
    }
    
    // setup editable users/units
    if(unitsEditable) {
    	// setup camo button
    	$("button.player-camo").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			primary: "ui-icon-pencil"
        		},
        		text: false
        	}).click(loadCamoSelect);
    	});
    	
    	$("span.player-camo").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			primary: "ui-icon-blank"
        		},
        		text: false
        	});
    	});
    	
    	// setup starting location menu
    	$("select.location").each(function() {
    		if($(this).iconselectmenu("instance") != null) return
    		
    		$(this).iconselectmenu({change: updateLocation})
				.iconselectmenu("menuWidget")
				.addClass("ui-menu-icons");
    	});
    	
    	// setup user join button
    	$("button.user-join").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
        		icons: {
        			secondary: "ui-icon-arrowreturnthick-1-n"
    	    	}
        	}).click(addUser);
    	});
    	
    	// setup user delete button
    	$("button.user-delete").each(function() {
    		if($(this).button("instance") != null) return
    		
    		$(this).button({
    	    	icons: {
    				primary: "ui-icon-closethick"
    	    	},
    	        text: false
    	    }).click(deleteUser);
    	});
    	
    	// setup unit add/delete buttons
	    $("button.unit-add").each(function() {
	    	if($(this).button("instance") != null) return
    		
    		$(this).button({
		    	icons: {
		    		primary: "ui-icon-plusthick"
		    	}
		    }).click(loadUnitSelect);
	    });
	    
	    $("button.unit-delete").each(function() {
	    	if($(this).button("instance") != null) return
    		
    		$(this).button({
		    	icons: {
	    			primary: "ui-icon-closethick"
		    	},
		        text: false
		    }).click(deleteUnit);
	    });
    }
    else {
    	// hide the user add/delete buttons
    	$("button.user-delete").hide();
    	$("button.user-add").hide();
    	
    	// hide the unit add/delete buttons
    	$("button.unit-delete").hide();
    	$("button.unit-add").hide();
    }
}

function loadCamoSelect() {
	
	var $this = $(this);
	var userId = $this.attr("data-userid");
	
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
	
	camoSelectUserID = $(".camo-selection").attr("data-userid");
	
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
				// the polling will update the user and units
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

function updateLocation(event, data) {
	var $this = $(this);
	var userId = $this.attr("data-userid");
	
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

function ajaxStageUser(userId) {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");

	var inputMap = {
		userId: userId
	};
	
	var $tempDiv = $("<div>", {class: "player"});
	
	var playerDiv = $("div.player[data-userid='"+userId+"']");
	
	var $this = null;
	if(playerDiv != null) {
		$this = $("div.player[data-userid='"+userId+"']").parents('div').eq(0);
	}
	
	if($this == null || $this.length == 0) {
		// create a new temporary team div for the player until teams are introduced to the game
		$this = $("<div>", {class: "team"});
		$("div#teams").append($this);
		
		var tempTeamHeader = $("<h2>");
		tempTeamHeader.text("Team Temp");
		$this.prepend(tempTeamHeader);
	}
	
	$tempDiv.load("stageUser", inputMap, function() {
		
		if(playerDiv != null) {
			playerDiv.remove();
		}
		
		// move the unit content to the player area
		$tempDiv.children().appendTo($this);
		$tempDiv.remove();
		
		// TODO: implement actual Teams
		setupDynamicUI();
		
		var effectOptions = {color: "#3399FF"};
		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
		
		dialogLoading.dialog("close");
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
				// TODO: update on the page when polling works for users without at least one unit
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
	var userId = $this.attr("data-userid");
	
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
	var unitId = $this.attr("data-unitid");
	
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

function ajaxStageUnit(unitId, userId) {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
	dialogLoading.dialog("open");

	var inputMap = {
		userId: userId,
		unitId: unitId
	};
	
	var $tempDiv = $("<div>", {class: "player-unit"});
	
	$tempDiv.load("stageUnit", inputMap, function() {
		// move the unit content to the player area
		var playerDiv = $("div.player[data-userid='"+userId+"']");
		$tempDiv.children().appendTo(playerDiv);
		$tempDiv.remove();
		
		// may need to move the "add unit" button back down to the bottom
		$("button.unit-add[data-userid='"+userId+"']").appendTo(playerDiv);
		
		setupDynamicUI();
		
		var effectOptions = {color: "#3399FF"};
		$("div.player-unit[data-unitid='"+unitId+"']").effect("highlight", effectOptions, 2000);
		
		dialogLoading.dialog("close");
    });
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
				// the polling will add the unit
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
var keepPolling = true;
function poll() {
	if(!keepPolling) return;
	
    $.getJSON("poll", null)
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
		
		// TODO: if the failure occurs because of 404, need to stop polling, show message and link to user to go somewhere else
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
		if(thisUpdate != null) {
			
			var data = thisUpdate;
			
			if(thisUpdate.message != null) {
				var t = new Date(thisUpdate.time);
				
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
		}
	});
}

/**
 * Handle all staging updates resulting from server actions
 * @param data
 */
function updateStagingData(data) {
	var effectOptions = {color: "#3399FF"};
	var userId = data.user;
	
	if(data.map != null) {
		var mapName = data.map;
		// since only the game owner can select using #map-button, others will get updates on the span #map-selection
		$("#map-selection").text(mapName)
				.effect("highlight", effectOptions, 2000);
		
		// show highlight effect if button showing
		$("#map-button").effect("highlight", effectOptions, 2000);
	}
	else if(data.location != null && userId != null) {
		var location = data.location;
		
		// update if it is a select menu
		$("div[data-userid='"+userId+"'] select.location").val(location).iconselectmenu("refresh")
				.iconselectmenu("widget").effect("highlight", effectOptions, 2000);
		
		// update if it is a label
		$("div[data-userid='"+userId+"'] label.location").text(location)
				.effect("highlight", effectOptions, 2000);
	}
	else if(data.rgbCamo != null && userId != null) {
		// update the units on the page without forcing reload
		ajaxStageUser(userId);
	}
	else if(data.unitAdded != null) {
		var unitId = data.unitAdded;
		
		// add the unit on the page without forcing reload
		ajaxStageUnit(unitId, userId);
	}
	else if(data.unitRemoved != null) {
		var unitId = data.unitRemoved;
		$("div[data-unitid='"+unitId+"']").closest("div.player-unit").fadeOut();
	}
	else if(data.userAdded != null) {
		var userId = data.userAdded;
		
		ajaxStageUser(userId);
	}
	else if(data.userRemoved != null) {
		var userId = data.userRemoved;
		$("div.player[data-userid='"+userId+"']").fadeOut();
	}
	else if(data.gameState != null) {
		if(data.gameState == 'A') {
			console.log("The game is now active");
		}
		
		// TODO: update the game state on the page without forcing reload
		location.reload();
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

/**
 * initialize the atmosphere polling
 */
function initAtmosphere() {
	Jabber.socket = $.atmosphere;
	
	$('#chat-subscribe').on('click', function () {
		var atmosphereRequest = {
			type: 'chat',
			url: '../atmosphere/chat/12345'
		};
		Jabber.subscribe(atmosphereRequest);
		$(this).attr('disabled', 'disabled');
		$('#chat-input').focus();
	});

	$('#chat-input').keypress(function (event) {
		if (event.which === 13) {
			event.preventDefault();
			var data = {
				type: 'chat',
				message: $(this).val()
			};
			Jabber.chatSubscription.push(JSON.stringify(data));
			$(this).val('');
		}
	});
}

/*
The Jabber variable holds all JavaScript code required for communicating with the server.
It basically wraps the functions in atmosphere.js and jquery.atmosphere.js.
*/
var Jabber = {
	socket: null,
	chatSubscription: null,
	notificationSubscription: null,
	publicSubscription: null,
	transport: null,

	subscribe: function (options) {
		var defaults = {
			type: '',
			contentType: "application/json",
			shared: false,
			transport: 'websocket',
			//transport: 'long-polling',
			fallbackTransport: 'long-polling',
			trackMessageLength: true
		},
		atmosphereRequest = $.extend({}, defaults, options);
		atmosphereRequest.onOpen = function (response) {
			console.log('atmosphereOpen transport: ' + response.transport);
		};
		atmosphereRequest.onReconnect = function (request, response) {
			console.log("atmosphereReconnect");
		};
		atmosphereRequest.onMessage = function (response) {
			//console.log('onMessage: ' + response.responseBody);
			Jabber.onMessage(response);
		};
		atmosphereRequest.onError = function (response) {
			console.log('atmosphereError: ' + response);
		};
		atmosphereRequest.onTransportFailure = function (errorMsg, request) {
			console.log('atmosphereTransportFailure: ' + errorMsg);
		};
		atmosphereRequest.onClose = function (response) {
			console.log('atmosphereClose: ' + response);
		};
		switch (options.type) {
			case 'chat':
				Jabber.chatSubscription = Jabber.socket.subscribe(atmosphereRequest);
				break;
			case 'notification':
				Jabber.notificationSubscription = Jabber.socket.subscribe(atmosphereRequest);
				break;
			case 'public':
				Jabber.publicSubscription = Jabber.socket.subscribe(atmosphereRequest);
				break;
			default:
				return false;
		}
	},

	unsubscribe: function () {
		Jabber.socket.unsubscribe();
		$('#chat-window').html('');
		$('#notification').html('');
		$('#public-update').html('');
		$('button').each(function () {
			$(this).removeAttr('disabled');
		})
	},

	onMessage: function (response) {
		var data = response.responseBody;
		if ((message == '')) {
			return;
		}
		console.log(data);
		var message = JSON.parse(data);
		var type = message.type;
		if (type == 'chat') {
			var $chat = $('#chat-window');
			$chat.append('message: ' + message.message + '<br/>');
			$chat.scrollTop($chat.height());
		}
		if (type == 'notification') {
			$('#notification').html(message.message);
		}
		if (type == 'public') {
			$('#public-update').html(message.message);
			if (message.message == 'Finished.') {
				$('#public-trigger').removeAttr('disabled');
			}
		}
	}
};