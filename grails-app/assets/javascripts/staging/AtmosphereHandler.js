

/**
 * initialize the atmosphere chat and polling
 */
function initAtmosphere() {
	Jabber.socket = $.atmosphere;
	
	// setup game chat meteor
	var chatRequest = {
		type: 'chat',
		url: '../atmosphere/chat/game'
	};
	Jabber.subscribe(chatRequest, handleChat);
	
	// setup game staging meteor
	var stagingRequest = {
		type: 'staging',
		url: '../atmosphere/staging/game'
	};
	Jabber.subscribe(stagingRequest, handleStaging);

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

function handleChat(message) {
	var type = message.type;
	if (type == 'chat') {
		var $chat = $('#chat-window');
		
		var chatLine = "<div class='chat-line'>"
		if(message.user != null) {
			chatLine += "<span class='chat-user'>"+ message.user +":</span>";
		}
		if(message.message != null) {
			chatLine += "<span class='chat-message'>"+ message.message +"</span>";
		}
		chatLine += "</div>";
		
		$chat.append(chatLine);
		
		$chat.scrollTop($chat[0].scrollHeight);
	}
}

function handleStaging(data) {
	console.log(data);
	
	updateStagingData(data);
}

/*
The Jabber variable holds all JavaScript code required for communicating with the server.
It basically wraps the functions in atmosphere.js and jquery.atmosphere.js.
*/
var Jabber = {
	socket: null,
	chatSubscription: null,
	stagingSubscription: null,
	transport: null,

	subscribe: function (options, callFunction) {
		if(callFunction == null) {
			callFunction = function(data) { console.warn("callFunction not defined for subscription"); console.log(data); };
		}
		
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
			console.log('atmosphereOpen '+atmosphereRequest.type+' transport: ' + response.transport);
		};
		atmosphereRequest.onReconnect = function (request, response) {
			console.log("atmosphereReconnect");
		};
		atmosphereRequest.onMessage = function (response) {
			//console.log('onMessage: ' + response.responseBody);
			Jabber.onMessage(response, callFunction);
		};
		atmosphereRequest.onError = function (response) {
			console.log('atmosphereError: ');
			console.log(response);
		};
		atmosphereRequest.onTransportFailure = function (errorMsg, request) {
			console.log('atmosphereTransportFailure: ' + errorMsg);
		};
		atmosphereRequest.onClose = function (response) {
			console.log('atmosphereClose: ');
			console.log(response)
		};
		
		switch (options.type) {
			case 'chat':
				Jabber.chatSubscription = Jabber.socket.subscribe(atmosphereRequest);
				break;
			case 'staging':
				Jabber.stagingSubscription = Jabber.socket.subscribe(atmosphereRequest);
				break;
			default:
				return false;
		}
	},

	onMessage: function (response, callFunction) {
		var data = response.responseBody;
		var contents = JSON.parse(data);
		
		callFunction(contents);
	}
};