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
}

function handleChat(data) {
	var type = data.type;
	if (type == 'chat'
			&& data.message != null && data.message.length > 0) {
		addMessageUpdate(data.message, data.time, data.user);
	}
}

function handleAction(data) {
	updateGameData(data);
}