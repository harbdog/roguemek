/*
The HPG variable holds all JavaScript code required for communicating with the atmosphere server.
It basically wraps the functions in atmosphere.js and jquery.atmosphere.js.
*/
var HPG = {
	socket: null,
	chatSubscription: null,
	stagingSubscription: null,
	gameSubscription: null,
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
			
			HPG.sendUserConnect(atmosphereRequest.type);
		};
		atmosphereRequest.onReconnect = function (request, response) {
			console.log("atmosphereReconnect");
		};
		atmosphereRequest.onMessage = function (response) {
			//console.log('onMessage: ' + response.responseBody);
			HPG.onMessage(response, callFunction);
		};
		atmosphereRequest.onError = function (response) {
			console.log('atmosphereError:');
			console.log(response);
		};
		atmosphereRequest.onTransportFailure = function (errorMsg, request) {
			console.log('atmosphereTransportFailure: ' + errorMsg);
		};
		atmosphereRequest.onClose = function (response) {
			console.log('atmosphereClose:');
			console.log(response)
			
			HPG.sendUserDisconnect(atmosphereRequest.type);
		};
		atmosphereRequest.onClientTimeout = function(response) {
			console.log('atmosphereClientTimeout:');
			console.log(response);
		};
		
		switch (options.type) {
			case 'chat':
				HPG.chatSubscription = HPG.socket.subscribe(atmosphereRequest);
				break;
			case 'staging':
				HPG.stagingSubscription = HPG.socket.subscribe(atmosphereRequest);
				break;
			case 'game':
				HPG.gameSubscription = HPG.socket.subscribe(atmosphereRequest);
				break;
			default:
				return false;
		}
	},
	
	unsubscribe: function () {
		if(HPG.socket != null) HPG.socket.unsubscribe();
	},

	onMessage: function (response, callFunction) {
		var data = response.responseBody;
		var contents = JSON.parse(data);
		
		//console.log("------ INCOMING HPG TRANSMISSION ------");
		//console.log(contents);
		
		callFunction(contents);
	},
	
	sendUserConnect: function(type) {
		var subscription;
		
		switch (type) {
			case 'staging':
				subscription = HPG.stagingSubscription
				break;
			case 'game':
				subscription = HPG.gameSubscription
				break;
			default:
				return false;
		}
		
		if(subscription) {
			// let the server handler know the user is connecting
			var data = {
				type: type,
				action: 'connectUser'
			};
			subscription.push(JSON.stringify(data));
		}
	},
	
	sendUserDisconnect: function(type) {
		var subscription;
		
		switch (type) {
			case 'staging':
				subscription = HPG.stagingSubscription
				break;
			case 'game':
				subscription = HPG.gameSubscription
				break;
			default:
				return false;
		}
		
		if(subscription) {
			// let the server handler know the user is connecting
			var data = {
				type: type,
				action: 'disconnectUser'
			};
			subscription.push(JSON.stringify(data));
		}
	}
};

window.onbeforeunload = function() {
	// first, close all active connections
	if(HPG.chatSubscription) {
		console.log("disconnecting chat subscription");
		HPG.chatSubscription.disconnect();
	}
	if(HPG.stagingSubscription) {
		console.log("disconnecting staging subscription");
		HPG.chatSubscription.disconnect();
	}
	if(HPG.gameSubscription) {
		console.log("disconnecting game subscription");
		HPG.chatSubscription.disconnect();
	}
	
	// then unsubscribe from the socket connection
	HPG.unsubscribe();
};

