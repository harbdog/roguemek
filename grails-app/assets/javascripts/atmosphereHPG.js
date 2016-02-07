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
		};
		atmosphereRequest.onReconnect = function (request, response) {
			console.log("atmosphereReconnect");
		};
		atmosphereRequest.onMessage = function (response) {
			//console.log('onMessage: ' + response.responseBody);
			HPG.onMessage(response, callFunction);
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

	onMessage: function (response, callFunction) {
		var data = response.responseBody;
		var contents = JSON.parse(data);
		
		callFunction(contents);
	}
};