/**
 * initialize the atmosphere chat and polling
 */
function initAtmosphere() {
	HPG.socket = $.atmosphere;
	
	// setup game chat meteor
	var chatRequest = {
		type: 'chat',
		url: 'atmosphere/chat/game'
	};
	HPG.subscribe(chatRequest, handleChat);
	
	// setup game action meteor
	var actionRequest = {
		type: 'game',
		url: 'atmosphere/action/game'
	};
	HPG.subscribe(actionRequest, handleAction);

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
		// Add the message from the update to the message display area
		var t = new Date(data.time);
		
		if(data.message != null && data.message.length > 0) {
			// only show a message if it had something to say
			addMessageUpdate("["+t.toLocaleTimeString()+"] "+data.message);
			
			if(data.user != null) {
				console.log(data.user+": "+data.message);
			}
		}
	}
}

function handleAction(data) {
	console.log(data);
	
	updateGameData(data);
}