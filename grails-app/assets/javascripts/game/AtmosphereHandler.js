// variable used to know whether the game should try to reconnect to chat after regaining focus
var reconnectGameChat = false;

/**
 * initialize the atmosphere chat and polling
 */
function initAtmosphere() {
	HPG.socket = $.atmosphere;
	
	// setup game chat meteor
	var chatRequest = {
		type: CHAT_REQUEST_TYPE,
		url: 'atmosphere/chat/game'
	};
	HPG.subscribe(chatRequest, handleChat);
	
	// setup game action meteor
	var actionRequest = {
		type: GAME_REQUEST_TYPE,
		url: 'atmosphere/action/game'
	};
	HPG.subscribe(actionRequest, handleAction);
}

function handleChat(data) {
	var type = data.type;
	if (type == CHAT_REQUEST_TYPE
			&& data.message != null && data.message.length > 0) {
		addMessageUpdate(data.message, data.time, data.user);
	}
}

function handleAction(data) {
	updateGameData(data);
}