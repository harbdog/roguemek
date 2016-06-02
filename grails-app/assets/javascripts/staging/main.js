// This is the main javascript file for the RogueMek staging client 
//
//= require_self
//= require_tree .

"use strict";

var dialogLoading;

/**
 * Prepares staging page on load
 */
function initStaging() {
	window.onbeforeunload = function() {
		HPG.disconnectUplink();
	};
	
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
	
	// setup items related to map selection
	initMapUI();
	
	// setup items related to unit selection
	initUnitUI();
	
	// setup items related to user actions
	initUserUI();
    
    // add general buttons and their actions
    $("button.disabled").button();
    
    // setup any dynamic UI pieces present at init
    setupDynamicUI();
	
	// update icons for locations
    updateLocationIcons();
    
    // load list of chat users just before connecting to the Atmosphere server
    loadChatUsersList();
    
    // begin HPG communications
    initAtmosphere();
    
    // auto scroll to bottom of chat at load
    var $chat = $('#chat-window');
    $chat.scrollTop($chat[0].scrollHeight);
}

/**
 * Sets up any parts of the UI that may be added or removed with ajax
 */
function setupDynamicUI() {
	
	// set up/update unit related dynamic UI
	setupDynamicUnitUI();
	
	// set up/update user related dynamic UI
	setupDynamicUserUI();
}

/**
 * Loads initial list of users connected to chat
 */
function loadChatUsersList() {
	$.getJSON("../game/listChatUsers", 
		null
	)
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(handleChatUsersList);
}

/**
 * Handles initializing the list of chat users
 * @param userDataList
 */
function handleChatUsersList(userDataList) {
	$.each(userDataList, function(index, userData) {
		userData.add = true;
		handleChatUsersUpdate(userData);
	});
}

/**
 * Handles adding and removing users from the chat users list
 * @param userData
 */
function handleChatUsersUpdate(userData) {
	//<div><span class="chat-user">CapperDeluxe</span></div>
	var userId = userData.userid;
	var userName = userData.username;
	
	var $chatUserDiv = $("div[data-chat-userid='"+userId+"']")
	
	if(userData.add) {
		var $chatUserSpan = $chatUserDiv.find("span");
		if(!$chatUserSpan.hasClass("chat-user")) {
		
			$chatUserDiv.find("span")
					.switchClass("game-user", "chat-user");
			
			// TODO: allow customization of colors in chat!
			var effectOptions = {color: shadeColor("#3399FF", -0.5)};
			$chatUserDiv.effect("highlight", effectOptions, 1000);
		}
	}
	else if(userData.remove){
		var $chatUserSpan = $chatUserDiv.find("span");
		if(!$chatUserSpan.hasClass("game-user")) {
			$chatUserDiv.find("span")
					.switchClass("chat-user", "game-user");
		}
	}
	else if(userData.join) {
		// first, make sure it doesn't already exist
		if($chatUserDiv.length) {
			$chatUserDiv.fadeIn();
			return
		}
		
		var $chatUsers = $('#chat-users');
		
		// create the div section containing the user name
		var $chatUserDiv = $("<div>").attr("data-chat-userid", userId);
		var $chatUserSpan = $("<span>", {class: "chat-user"}).text(userName);
		
		$chatUserDiv.append($chatUserSpan);
		$chatUsers.append($chatUserDiv);
		
		// TODO: allow customization of colors in chat!
		var effectOptions = {color: shadeColor("#3399FF", -0.5)};
		$chatUserDiv.effect("highlight", effectOptions, 1000);
	}
	else if(userData.leave){
		$chatUserDiv.fadeOut(function() {
			var $this = $(this);
			// waiting a short while before complete removal just in case it was only a refresh event
			setTimeout(function(){
				if($this.is(":visible") == false) {
					$this.remove()
				}
			},500);
		});
	}
}

/**
 * Handle all staging updates resulting from server actions
 * @param data
 */
function updateStagingData(data) {
	var effectOptions = {color: "#3399FF"};
	var userId = data.user;
	
	if(data.chatUser != null) {
		// update displayed list of users in the staging chat room
		handleChatUsersUpdate(data.chatUser);
	}
	else if(data.map != null) {
		var mapName = data.map;
		selectedMapId = data.mapId;
		
		// since only the game owner can select using #map-button, others will get updates on #map-selected
		$("#map-selected").button("option", "label", mapName)
				.effect("highlight", effectOptions, 2000);
		
		// show highlight effect if button showing
		$("#map-button").button("option", "label", mapName)
				.effect("highlight", effectOptions, 2000);
	}
	else if(data.location != null && userId != null) {
		var location = data.location;
		
		// update if it is a select menu
		$("div.player-info[data-userid='"+userId+"'] select.location").val(location).iconselectmenu("refresh");
		
		// update if it is a label
		$("div.player-info[data-userid='"+userId+"'] span.location-label").text(location);
		
		// update the icons associated with the location
		updateLocationIcons();
		
		// highlight only the location that got updated
		var locationLabels = $("div.player-info[data-userid='"+userId+"'] span.location, div.player-info[data-userid='"+userId+"'] select.location + span.ui-selectmenu-button");
		locationLabels.effect("highlight", effectOptions, 1500);
	}
	else if((data.rgbCamo != null || data.patternCamo != null) && userId != null) {
		// update the units on the page without forcing reload
		ajaxStageTeamOrUser(null, userId, true);
	}
	else if(data.unitAdded != null) {
		var unitId = data.unitAdded;
		
		// add the unit on the page without forcing reload
		ajaxStageUnit(unitId, userId);
	}
	else if(data.unitRemoved != null) {
		var unitId = data.unitRemoved;
		$("div[data-unitid='"+unitId+"']").closest("div.player-unit").fadeOut(
			function() {
				$(this).remove();
				
				// update displayed counts of units/tonnage
				updateUserUnitCounts(userId);
			}
		);
	}
	else if(data.userAdded != null) {
		var userId = data.userAdded;
		var userName = data.userName;
		
		// update the users and teams on the page without forcing reload
		ajaxStageTeamOrUser(-1, userId);
		
		// update the chat list
		handleChatUsersUpdate({userid: userId, username: userName, join: true});
	}
	else if(data.userRemoved != null) {
		var userId = data.userRemoved;
		
		var $playerDiv = $("div.player[data-userid='"+userId+"']");
		var $teamDiv = $playerDiv.parent("div.team");
		$playerDiv.fadeOut();
		
		// TODO: only remove the team div if no players remain in it
		$teamDiv.fadeOut(function() {
			$(this).remove();
		});
		
		// if the user removed is the current user, show alert and redirect back to dropship
		if(currentUserId == userId) {
			alert("You have been removed from battle by the owner, returning to dropship");	// TODO: i18n this message
			redirectToDropship();
		}
		else {
			// update the chat list
			handleChatUsersUpdate({userid: userId, leave: true});
		}
	}
	else if(data.userReady != null) {
		var isReady = data.userReady;
		
		var readyCheckbox = $("input#ready-"+userId+".player-ready[type=checkbox]");
		readyCheckbox.prop('checked', isReady).trigger("change");
		
		if(userId == currentUserId) {
			// update user's ready box also
			$("input#user-ready[type=checkbox]").prop('checked', isReady).trigger("change");
		}
	}
	else if(data.teamNum != null) {
		var teamNum = data.teamNum;
		
		// move the player div to the correct new team div
		ajaxStageTeamOrUser(teamNum, userId);
	}
	else if(data.gameState != null) {
		if(data.gameState == "A") {
			console.log("The game is now active");
			
			$("#launch-button").button();
			
			// show a modal dialog with the launch button
			$("#launch-dialog").dialog({
		    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
		    	title: "Prepare for Battle",
		    	autoOpen: true,
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
		}
	}
}

/**
 * Redirects to the leave link automatically, which brings user back to the dropship
 */
function redirectToDropship() {
	var dropshipUrl = $("#leave-link").attr("data-leave-link");
	if(dropshipUrl != null) {
		// setting currentUserId null so when it redirects it doesn't show the removed from game message
		currentUserId = null;
		window.location.replace(dropshipUrl);
	}
}

/**
 * Used to set the selection range of a given element 
 * from http://stackoverflow.com/a/499158/854696
 */
function setSelectionRange(input, selectionStart, selectionEnd) {
	if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(selectionStart, selectionEnd);
	}
	else if (input.createTextRange) {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character', selectionEnd);
		range.moveStart('character', selectionStart);
		range.select();
	}
}

/**
 * Used to set the caret position of a given element
 * from http://stackoverflow.com/a/499158/854696
 */
function setCaretToPos (input, pos) {
	setSelectionRange(input, pos, pos);
}

/**
 * Lightens or darkens given given
 * From http://stackoverflow.com/questions/5560248/
 * @param color as hex notation
 * @param percent as -1.0 to 1.0 positive for lighten, negative for darken
 * @returns {String} newly shaded color as hex notation
 */
function shadeColor(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}
/**
 * Blends two colors together
 * From http://stackoverflow.com/questions/5560248/
 * @param c0 first color
 * @param c1 secont color
 * @param p percent as 0 to 1.0
 * @returns {String} newly blended color as hex notation
 */
function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
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

//http://lions-mark.com/jquery/scrollTo/
$.fn.scrollTo = function( target, options, callback ){
  if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
  var settings = $.extend({
    scrollTarget  : target,
    offsetTop     : 50,
    duration      : 500,
    easing        : 'swing'
  }, options);
  return this.each(function(){
    var scrollPane = $(this);
    var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
    var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
    scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
      if (typeof callback == 'function') { callback.call(this); }
    });
  });
}
