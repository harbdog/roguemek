

/**
 * initialize the atmosphere chat and polling
 */
function initAtmosphere() {
	Jabber.socket = $.atmosphere;
	
	var atmosphereRequest = {
		type: 'chat',
		url: '../atmosphere/chat/game'
	};
	Jabber.subscribe(atmosphereRequest);

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