/**
 * initialize the atmosphere chat and polling
 */
function initAtmosphere() {
	HPG.socket = $.atmosphere;
	
	// setup game chat meteor
	var chatRequest = {
		type: CHAT_REQUEST_TYPE,
		url: atmosphereURL+'/chat/game'
	};
	HPG.subscribe(chatRequest, handleChat);
	
	// setup game staging meteor
	var stagingRequest = {
		type: STAGING_REQUEST_TYPE,
		url: atmosphereURL+'/staging/game'
	};
	HPG.subscribe(stagingRequest, handleStaging);

	$('#chat-input').keypress(function (event) {
		if (event.which === 13) {
			event.preventDefault();
			var data = {
				type: CHAT_REQUEST_TYPE,
				message: $(this).val()
			};
			HPG.chatSubscription.push(JSON.stringify(data));
			$(this).val('');
		}
	});
}

function handleChat(data) {
	var type = data.type;
	if (type == 'chat') {
		var $chat = $('#chat-window');
		
		var chatLine = "<div class='chat-line'>\n"
		if(data.time != null) {
			chatLine += "<span class='chat-time'>"+"["+new Date(data.time).toLocaleTimeString()+"]"+"</span>\n";
		}
		if(data.user != null) {
			chatLine += "<span class='chat-user'>"+ data.user +":</span>\n";
		}
		if(data.message != null) {
			if(data.recipient != null) {
				// TODO: handle team message differently from tell message, when tells are implemented
				chatLine += "<span class='team-message'>"+ data.message +"</span>\n";
			}
			else {
				chatLine += "<span class='chat-message'>"+ data.message +"</span>\n";
			}
		}
		chatLine += "</div>";
		
		$chat.append(chatLine);
		
		// TODO: allow customization of colors in chat!
		var effectOptions = {color: shadeColor("#3399FF", -0.5)};
		$(".chat-line").last().effect("highlight", effectOptions, 2000);
		
		$chat.scrollTop($chat[0].scrollHeight);
	}
}

function handleStaging(data) {
	updateStagingData(data);
}
