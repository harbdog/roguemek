/**
 * user_functions.js - Methods that handle user updates in staging
 */
 
"use strict";

var camoSelectDialog;
var camoSelectUserID;
var camoPatternTree;

/**
 * Initializes user related UI components
 */
function initUserUI() {
    
    // Initialize camo selection dialog
	camoSelectDialog = $("#camoSelectDiv").dialog({
		title: "Select Camo",
    	autoOpen: false,
    	modal: true,
        resizable: false,
    	// not using show/hide effects since it causes the css spinning preview to start over when finished, making it look jittery
		close: function() {
			var origColor = $("button#color-revert").val();
			var inputColor = $("#color-input").val();
            
			// apply selected camo to all player units on server
			ajaxApplyUnitCamoSelection(camoSelectUserID);
			
			camoSelectUserID = null;
            camoPatternTree = null;
		},
		buttons: {
			"OK": function() {
				camoSelectDialog.dialog("close");
			}
		}
    });
    
    // Initialize ready buttons
    // setup ready button
    $("input#user-ready").each(function() {
        $(this).button({
            label: $(this).is(':checked') ? 'Ready' : 'Not Ready',  // TODO: i18n this
            text: true
        })
        .change(function() {
            var isReady = $(this).is(':checked');
            $(this).button("option", "label", isReady ? 'Ready' : 'Not Ready');
        })
        .click(function() {
            var isReady = $(this).is(':checked');
            var inputMap = {ready: isReady};
            
            $.getJSON("readyUser", inputMap)
                .fail(function(jqxhr, textStatus, error) {
                    var err = textStatus + ", " + error;
                    console.log( "Request Failed: " + err );
                })
                .done(function() {
                    // nothing to do here since it will be updated via atmosphere
                });
        });
    });
    
    // Initialize action specific confirmation dialog
    $("#user-leave-dialog").dialog({
    	autoOpen: false,
    	modal: true,
    	show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		},
    	buttons: {
    		Ok: function() {
    			// forward to the leaving link
    			$(this).dialog("close");
    			redirectToDropship();
    		},
	    	Cancel: function() {
	    		$(this).dialog("close");
			}
    	},
		position: {my: "center", at: "center", of: window}
    });
    
    // setup a confirmation dialog for leaving
    $("#leave-link").click(function() {
    	$("#user-leave-dialog").dialog("open");
    });
    
    // setup a confirmation dialog for starting battle
    $("#start-link").click(function() {
		// make sure all "ready" boxes are checked first
		var allReady = true;
		$("input.player-ready").each(function() {
    		if(!$(this).is(':checked')) {
				allReady = false;
			}
		});
		
		if(allReady || devMode) { // only allow development mode to skip the allReady check
			$("<div style='font-size:0.8em;'>Launch into combat?</div>").dialog({	// TODO: i18n for deletion message
				title: "Launch Battle",
				autoOpen: true,
				resizable: false,
				modal: true,
				buttons: {
					"Launch": function() {
						$(this).dialog("close");
						var launchUrl = $("#start-link").attr("data-start-link");
						if(launchUrl != null) {
							window.location.replace(launchUrl);
						}
					},
					Cancel: function() {
						$(this).dialog("close");
					}
				},
				position: {my: "center", at: "center", of: window}
			});
		}
		else {
			// let them know everyone is not ready
			$("<div style='font-size:0.8em;'>Each combatant must be ready before launching the battle</div>").dialog({	// TODO: i18n for message
				title: "Not Ready",
				autoOpen: true,
				resizable: false,
				modal: true,
				buttons: {
					Close: function() {
						$(this).dialog("close");
					}
				},
				position: {my: "center", at: "center", of: window}
			});
		}
    });
}

/**
 * Sets up or updates user UI that may need to change after certain actions
 */
function setupDynamicUserUI() {
    // setup editable player teams
    if(playersEditable) {
    	// setup draggable/droppable elements
	    var teams = $(".team");
	    var players = $(".player .player-name");
	    
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
		    	accept: ".player-name",
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
    	// setup ready button
    	$("input.player-ready").each(function() {
    		if($(this).button("instance") != null) return
    		
    		var checkedIcon = "ui-icon-check";
    		var uncheckedIcon = "ui-icon-clock";
    		
			$(this).button({
        		icons: {
        			primary: ($(this).is(':checked')) ? checkedIcon : uncheckedIcon
        		},
        		text: false
        	})
        	.change(function() {
        		var isReady = $(this).is(':checked');
        		$(this).button("option", {
        			icons: {
            			primary: (isReady) ? checkedIcon : uncheckedIcon
            		}
        		});
    		})
        	.click(function() {
        		var isReady = $(this).is(':checked');
        		var inputMap = {ready: isReady};
        		
        		$.getJSON("readyUser", inputMap)
        			.fail(function(jqxhr, textStatus, error) {
        				var err = textStatus + ", " + error;
        				console.log( "Request Failed: " + err );
        			})
        			.done(function() {
        				// nothing to do here since it will be updated via atmosphere
        			});
        	});
    	});
    	
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
    	
    	// setup user team selection menu
    	$("#team-select").selectmenu({
            change: function( event, data ) {
                // send request to server to change the user's team
                var newTeamNum = data.item.value;
                updateUserTeam(currentUserId, newTeamNum);
                $("#team-select").blur();
            }
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
    }
    else {
    	// hide the user add/delete buttons
    	$("button.user-delete").hide();
    	$("button.user-add").hide();
    }
}

/**
 * Used with the click and drag to move players to another team (only game owner can do this)
 */
function transferPlayer($playerNameDiv, $teamDiv) {
    var userId = $playerNameDiv.parents(".player").eq(0).attr("data-userid");
    var teamNum = $teamDiv.attr("data-teamnum");
    
    // update the database data from the team drop move
    if(userId != null && teamNum != null) {
        updateUserTeam(userId, teamNum);
    }
}

/**
 * Used to keep the player and team divs sorted as they get updated
 */
function sortTeamsAndPlayers() {
    // keep team and player divs sorted
    var teamChildren = $("#teams").children(".team");
    
    var sortedChildren = [];
    $.each(teamChildren, function() {
        sortedChildren.push($(this));
    });
    
    sortedChildren.sort(function($x, $y) {
        var xTeamNum = $x.attr('data-teamnum');
        var xIsNum = $.isNumeric(xTeamNum);
        
        var yTeamNum = $y.attr('data-teamnum');
        var yIsNum = $.isNumeric(yTeamNum);
        
        if(xIsNum || yIsNum) {
            return xTeamNum > yTeamNum;
        }
        else{
            // both comparisons are not numbers, so are user id's representing players with no team
            var $xPlayerDiv = $("div.player[data-userid='"+xTeamNum+"']");
            var $yPlayerDiv = $("div.player[data-userid='"+yTeamNum+"']");
            
            var xUserName = $xPlayerDiv.attr('data-username');
            var yUserName = $yPlayerDiv.attr('data-username');
            
            return xUserName > yUserName;
        }
    });
    
    $.each(sortedChildren, function(index, $team) {
        $("#teams").append($team);
        
        var playerChildren = $team.children(".player");
        
        var sortedPlayerChildren = [];
        $.each(playerChildren, function() {
            sortedPlayerChildren.push($(this));
            $(this).detach();
        });
        
        sortedPlayerChildren.sort(function($x, $y) {
            return $x.attr('data-username') > $y.attr('data-username');
        });
        
        $.each(sortedPlayerChildren, function(index, $player) {
            $team.append($player);
        });
    });
}

/**
 * Sends update for player starting location to server
 */
function updateUserTeam(userId, teamNum) {
	//console.log("Updating team for "+userId+": "+teamNum);
	
	var inputMap = {
		userId: userId,
		teamNum: teamNum
	};
	
	$.getJSON("teamUpdate", inputMap)
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
		})
		.done(function(data) {
			if(data != null && data.updated == true) {
				//console.log("updated team: "+teamNum)
			}
		});
}

/**
 * Stages the given user/team update by fetching their info from the server and updating the page
 */
function ajaxStageTeamOrUser(teamNum, userId, forceLoadPlayer) {
    var inputMap = {
		userId: userId
	};
    
    // if the user is the current user, update the team select menu
    if(currentUserId == userId && teamNum != null) {
        $("select#team-select").val(teamNum).selectmenu("refresh");
    }
	
    var $allTeamsDiv = $("div#teams");
    
    // find out if the user is already staged
    var $playerDiv = $("div.player[data-userid='"+userId+"']");
    
    var $playerTeamDiv = null;
    if($playerDiv != null && $playerDiv.length > 0) {
        // find the team div for the already staged user
        $playerTeamDiv = $playerDiv.parents('div.team').eq(0);
        if(teamNum == null) {
            // determine existing team number from the existing player div
            teamNum = $playerTeamDiv.attr("data-teamnum");
        }
    }
    
    // find out if the team is already staged
    var $teamDiv;
    if(teamNum >= 0) {
        $teamDiv = $("div.team[data-teamnum='"+teamNum+"']");
    }
    else {
        // users without a positive teamNum will instead be found using their userid
        $teamDiv = $("div.team[data-teamnum='"+userId+"']");
    }
    
	var $tempDiv = $("<div>");
    if($teamDiv == null || $teamDiv.length == 0) {
        // the team doesn't yet exist on the stage, load it
        $tempDiv.load("stageTeam", inputMap, function() {
            
            if($playerDiv != null && $playerDiv.length > 0) {
                // the old player div is no longer needed
                $playerDiv.remove();
            }
            
    		// move the content to the teams area
            if($playerTeamDiv != null && $playerTeamDiv.children("div.player").length == 0) {
                // the old player team has no other children, replace it with this new team
                $playerTeamDiv.fadeOut(function() {
                    $playerTeamDiv.replaceWith($tempDiv.children()).fadeIn();
            		$tempDiv.remove();
                    
                    sortTeamsAndPlayers();
            		setupDynamicUI();
                    updateUnitCounts();
            		
            		var effectOptions = {color: "#3399FF"};
            		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
                });
            } 
            else {
                // load the new team section
                $tempDiv.children().detach().hide().appendTo($allTeamsDiv).fadeIn();
        		$tempDiv.remove();
                
                sortTeamsAndPlayers();
                setupDynamicUI();
                updateUnitCounts();
        		
        		var effectOptions = {color: "#3399FF"};
        		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
            }
        });
    }
    else if($playerDiv == null || $playerDiv.length == 0 || forceLoadPlayer) {
        // the team exists but the player doesn't yet, load it
        $tempDiv.load("stageUser", inputMap, function() {
    		// move the content to the teams area
            if($playerDiv != null && $playerDiv.length > 0) {
                $playerDiv.fadeOut(function() {
            		$playerDiv.replaceWith($tempDiv.children()).fadeIn();
                    $tempDiv.remove();
                    
                    sortTeamsAndPlayers();
                    setupDynamicUI();
                    updateUnitCounts();
                    
                    var effectOptions = {color: "#3399FF"};
            		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
            	});
            }
            else {
        		$tempDiv.children().detach().hide().appendTo($teamDiv).fadeIn();
                $tempDiv.remove();
                
                sortTeamsAndPlayers();
                setupDynamicUI();
                updateUnitCounts();
                
                var effectOptions = {color: "#3399FF"};
        		$("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
            }
        });
    }
	else {
        // the team and player exist, just move the player over
        $playerDiv.fadeOut(function() {
    		$playerDiv.detach().appendTo($teamDiv).fadeIn();
            
            sortTeamsAndPlayers();
            updateUnitCounts();
            
            var effectOptions = {color: "#3399FF"};
            $("div.player-info[data-userid='"+userId+"']").effect("highlight", effectOptions, 2000);
    	});
        
        // check to see if the old player team has no other children, if so then remove it
        if($playerTeamDiv != null && $playerTeamDiv.children("div.player").length <= 1) {
            $playerTeamDiv.fadeOut(function() {
                $playerTeamDiv.remove();
            });
        }
    }
}

/**
 * Loops through each player location label and sets the appropriate directional label for it
 */
function updateLocationIcons() {
	// first map out each location value to its icon class using the location selection shown for this player
	var locationOptions = $("select.location[data-userid='"+currentUserId+"']  option");
	
	var locationClassMap = {};
	$.each(locationOptions, function() {
		var location = $(this).text();
		var locationClass = $(this).attr("data-class");
		
		locationClassMap[location] = locationClass;
	});
	
	// find each player location element and set the appropriate icon class
	var locationLabels = $("div.player-info span.location, div.player-info select.location + span.ui-selectmenu-button");
	$.each(locationLabels, function() {
		var locationText = $(this).find("span.location-label, span.ui-selectmenu-text").text();
		
		var locationIconClass = locationClassMap[locationText];
		var locationIconSpan = $(this).find("span.ui-icon");
		
		locationIconSpan.removeClass();
		locationIconSpan.addClass("ui-icon "+locationIconClass);
	});
}

/**
 * Sends update for player starting location to server
 */
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
				//console.log("updated location: "+locationValue)
			}
		});
}

/**
 * Sends request to the server to add the session user to the staging for the game
 */
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
				// the polling will update the users and teams
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

/**
 * Prompts the user if they want to remove the user from the game before doing so
 */
function deleteUser() {
	// ask user to confirm deletion
	var $this = $(this);
	var userId = $this.attr("data-userid");
	
	$("#user-remove-dialog").dialog({
		resizable: false,
		modal: true,
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		},
		buttons: {
			Ok: function() {
				$(this).dialog("close");
				ajaxDeleteUser(userId, $this);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		position: {my: "center", at: "center", of: window}
	});
}

/**
 * Sends request to the server to remove the user from the staging for the game
 */
function ajaxDeleteUser(userId, $this) {
	dialogLoading.dialog("option", "position", {my: "center", at: "center", of: window});
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

/**
 * Requests for the camo selection screen from the server
 */
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

/**
 * Prepares the camo selection screen for being shown
 */
function showCamoSelect() {

	camoSelectUserID = $(".camo-selection").attr("data-userid");
	
    var idealDialogWidth = 800;
    
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    
    var dialogWidth = idealDialogWidth;
    if(windowWidth < dialogWidth) {
        // make sure the width of the dialog in the window isn't too small to show everything
        dialogWidth = windowWidth;
    }
    
    camoSelectDialog.dialog("option", "position", {my: "top", at: "top", of: window});
	camoSelectDialog.dialog("option", "width", dialogWidth);
    
    // setup the tabs
    $("#selection-panel").tabs({
        active: camoSelectionIndex
    });
    
    // setup the color selection input
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
			if($(this).data('changed') || camoPatternSelected) {
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
		if(origColor != inputColor || camoPatternSelected) {
			$("#color-input").spectrum("set", origColor);
			ajaxUpdateCamoColorSelection(camoSelectUserID, tinycolor(origColor));
		}
	});
    
    // setup the pattern selection tree
    camoPatternTree = $("#pattern-tree");
    camoPatternTree.jstree({
        "core": { 
            "check_callback" : true,
            "themes": { 
                "name" : "default-dark"
            }
        },
        "types" : {
            'default' : { 
                'valid_children' : ['default', 'file'],
                'icon' : 'jstree-folder' 
            },
            'file' : { 
                'valid_children' : [], 
                'icon' : 'jstree-file' 
            }
        },
        "plugins" : ['types', 'unique', 'sort', 'wholerow']
    });
    
    camoPatternTree.on("changed.jstree", function(e, data) {
        ajaxUpdateCamoPathSelection(camoSelectUserID, data);
    }).on('create_node.jstree', function(e, data) {
        //console.log("CREATED!");
    });
	
	camoSelectDialog.dialog("open");
}

/**
 * Requests the server to update based on a camo pattern path selection that was made
 */
function ajaxUpdateCamoPathSelection(userId, eventData) {
    
    var node = eventData.node;
    var inst = eventData.instance;
    
    if(userId == null || node == null) return;
    
    if(node.children.length > 0) {
        // children have already been loaded, close/open the node based on it's current state
        if(inst.is_open(node)) {
            inst.close_node(node);
        }
        else {
            inst.open_node(node);
        }
    }
    else {
        // if folder node, build the camo path to request fetching from
        var $node = $("#"+node.id);
        var patternPath = $node.attr("data-full-path");
        
        var inputMap = {
                userId: userId,
                path: patternPath
        }
        
        $node.addClass("jstree-loading");
        
        $.getJSON("camoPath", inputMap)
    		.fail(function(jqxhr, textStatus, error) {
    			var err = textStatus + ", " + error;
    			console.log( "Request Failed: " + err );
    		})
    		.done(function(data) {
                $node.removeClass("jstree-loading");
                
    			if(data != null) {
                    if(data.updated && data.image) {
                        camoPatternSelected = true;
                        
                        // update the preview unit image
    					var base64 = _arrayBufferToBase64(data.image);
    					
    					$("img.camo-unit-preview").attr("src", "data:image/gif;base64," + base64);
                    }
                    else if(data.camoPatternPaths != null) {
                        $.each(data.camoPatternPaths, function(i, path) {
                            
                            var pathFull = patternPath +"/"+ path;
                            var pathName = path;
                            var pathType = "default";
                            var pathIcon = null;
                            
                            if(pathName.indexOf(".jpg") > 0) {
                                pathType = "file";
                                pathName = pathName.substr(0, pathName.indexOf(".jpg"));
                                pathIcon = "../assets/camo/"+ pathFull;
                            }
                            
                            var newNodeId = inst.create_node(node, {
                                        data: {type: pathType},
                                        type: pathType,
                                        text: pathName,
                                        icon: pathIcon,
                                        id: node.id +"_"+ i,
                                        li_attr: {'data-full-path': pathFull}
                                    }, "last", function(new_node) {
                                        //console.log(new_node);
                                    });
                            
                        });
                        
                        inst.open_node(node);
                    }
    			}
    		});
    }
}

/**
 * Updates the camo color section from server with unit preview
 */
function ajaxUpdateCamoColorSelection(userId, rgbTinyColor) {
    camoPatternSelected = false;
    
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
					
					$("img.camo-unit-preview").attr("src", "data:image/gif;base64," + base64);
				}
			}
		})
		.always(function() {
			dialogLoading.dialog("close");
		});
}

/**
 * Requests the server to update to the new camo selection for the user
 */
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
