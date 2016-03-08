/**
 * initialize the atmosphere chat and polling
 */
function initAtmosphere() {
	HPG.socket = $.atmosphere;
	
	// setup game chat meteor
	var chatRequest = {
		type: 'chat',
		url: '../atmosphere/chat/game'
	};
	HPG.subscribe(chatRequest, handleChat);
	
	// setup game staging meteor
	var stagingRequest = {
		type: 'staging',
		url: '../atmosphere/staging/game'
	};
	HPG.subscribe(stagingRequest, handleStaging);

	$('#chat-input').keypress(function (event) {
		if (event.which === 13) {
			event.preventDefault();
			var data = {
				type: 'chat',
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
		
		var chatLine = "<div class='chat-line'>"
		if(data.time != null) {
			chatLine += "<span class='chat-time'>"+"["+new Date(data.time).toLocaleTimeString()+"]"+"</span>";
		}
		if(data.user != null) {
			chatLine += "<span class='chat-user'>"+ data.user +":</span>";
		}
		if(data.message != null) {
			chatLine += "<span class='chat-message'>"+ data.message +"</span>";
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