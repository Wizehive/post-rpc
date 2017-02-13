var createFixture = function (origin, libpath) {
	// Create(if not exist) server iframe
	var serverIframe = top.document.getElementById('server');
	if (!serverIframe) {
		serverIframe = top.document.createElement('iframe');
        serverIframe.setAttribute('src', 'about:blank');
		serverIframe.setAttribute('id', 'server');
		serverIframe.setAttribute('style', 'position: fixed; top: 0; left: -99999px;');
        top.document.body.appendChild(serverIframe);
		var serverWindow = serverIframe.contentWindow;
		var serverDocument = serverWindow.document;
		var serverSource = [
			'<html>',
			'  <head>',
			'    <meta charset="UTF-8">',
			'  </head>',
			'  <body>',
			'    <script type="text/javascript" src="' + libpath + '/PostRPC.Server.js"></script>',
			'    <script type="text/javascript">',
			'        try {',
			'          console.log(\'create window.PostRPC.Server\');',
			'          window.postrpc_server = new window.PostRPC.Server(\'' + origin + '\');',
			'        }',
			'        catch(err) {',
			'            console.log(\'create window.PostRPC.Server Failed\', err.message);',
			'        }',
			'    <\/script>',
			'  </body>',
			'</html>'
		];
		serverDocument.open();
		for (var i = 0; i < serverSource.length; i++) {
			serverDocument.write(serverSource[i]);
		}
		serverDocument.close()
    }
	var serverIframe = top.document.getElementById('server');
	var serverWindow = serverIframe.contentWindow;
	var serverDocument = serverWindow.document;

	// Create(if not exist) client iframe
	var clientIframe = serverDocument.getElementById('client');
	if (!clientIframe) {
		var clientIframe = serverDocument.createElement('iframe');
        clientIframe.setAttribute('src', 'about:blank');
		clientIframe.setAttribute('id', 'client');
		clientIframe.setAttribute('style', 'position: fixed; top: 0; left: -99999px;');
        serverDocument.body.appendChild(clientIframe);
		var clientWindow = clientIframe.contentWindow;
		var clientDocument = clientWindow.document;
		var clientSource = [
			'<html>',
			'  <head>',
			'    <meta charset="UTF-8">',
			'  </head>',
			'  <body>',
			'    <script type="text/javascript" src="' + libpath + '/PostRPC.Client.js"></script>',
			'    <script type="text/javascript">',
			'        try {',
			'          console.log(\'create window.PostRPC.Client\');',
			'          window.postrpc_client = new window.PostRPC.Client(\'' + origin + '\');',
			'        }',
			'        catch(err) {',
			'            console.log(\'create window.PostRPC.Client Failed\', err.message);',
			'        }',
			'    <\/script>',
			'  </body>',
			'</html>'
		];
		clientDocument.open();
		for (var i = 0; i < clientSource.length; i++) {
			clientDocument.write(clientSource[i]);
		}
		clientDocument.close()
    }
	var clientIframe = serverDocument.getElementById('client');
	var clientWindow = clientIframe.contentWindow;
	var clientDocument = clientWindow.document;
};

var findClientWindow = function () {
	var serverIframe = top.document.getElementById('server');
	var serverWindow = serverIframe.contentWindow;
	var serverDocument = serverWindow.document;
	var clientIframe = serverDocument.getElementById('client');
	return clientIframe.contentWindow;
};

var findClient = function () {
	var serverIframe = top.document.getElementById('server');
	var serverWindow = serverIframe.contentWindow;
	var serverDocument = serverWindow.document;
	var clientIframe = serverDocument.getElementById('client');
	return clientIframe.contentWindow.postrpc_client;
};

var findServerWindow = function () {
	var serverIframe = top.document.getElementById('server');
	return serverIframe.contentWindow;
};

var findServer = function () {
	var serverIframe = top.document.getElementById('server');
	return serverIframe.contentWindow.postrpc_server;
};

var sleep = function (milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
};

var waitForFixture = function (milliseconds) {
	console.log('wait for fixture...');
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if (findServer() && findClient()) {
			console.log('fixture ready');
			break;
		}
		if ((new Date().getTime() - start) > milliseconds){
			console.log('fixture timeout');
			break;
		}
	}
};

var waitForServer = function (milliseconds) {
	console.log('wait for server fixture...');
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if (findServer()) {
			console.log('fixture ready');
			break;
		}
		if ((new Date().getTime() - start) > milliseconds){
			console.log('fixture timeout');
			break;
		}
	}
};
var waitForClient = function (milliseconds) {
	console.log('wait for client fixture...');
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if (findClient()) {
			console.log('fixture ready');
			break;
		}
		if ((new Date().getTime() - start) > milliseconds){
			console.log('fixture timeout');
			break;
		}
	}
};

var logTop = function () {
	console.log('context:');
	console.log(top.document.documentElement.innerHTML);
}

var logContext = function () {
	var contextIframe = top.document.getElementById('context');
	if (contextIframe) {
		console.log('context:');
		console.log(contextIframe.contentWindow.document.documentElement.innerHTML);
	} else {
		console.log('contextIframe NOT found');
	}
}

var logFixture = function () {
	var serverIframe = top.document.getElementById('server');
	if (serverIframe) {
		console.log('serverIframe found');
		var serverWindow = serverIframe.contentWindow;
		if (serverIframe) {
			console.log('serverWindow found');
			var serverDocument = serverWindow.document;
			if (serverDocument) {
				console.log('serverDocument found');
				var clientIframe = serverDocument.getElementById('client');
				if (clientIframe) {
					console.log('clientIframe found');
					var clientIframe = serverDocument.getElementById('client');
					if (clientIframe) {
						console.log('clientIframe found');
						var clientWindow = clientIframe.contentWindow;
						if (clientWindow) {
							console.log('clientWindow found');
							var clientDocument = clientWindow.document;
							if (clientDocument) {
								console.log('clientDocument found');


								if (top === serverWindow) {
									console.log('serverWindow same as top');
								}
								if (top === clientWindow) {
									console.log('clientWindow same as top');
								}
								if (serverWindow === clientWindow) {
									console.log('serverWindow same as clientWindow');
								}

								var server = serverWindow.postrpc_server;
								if (server) {
									console.log('server found');
								} else {
									console.log('server NOT found');
								}
								var client = clientWindow.postrpc_client;
								if (client) {
									console.log('client found');
								} else {
									console.log('client NOT found');
									if (top.postrpc_client) {
										console.log('client FOUND in top window');
									}
									if (window.postrpc_client) {
										console.log('client FOUND in THIS window');
									}
									if (serverWindow.postrpc_client) {
										console.log('client FOUND in serverWindow');
									}
								}
							} else {
								console.log('clientDocument NOT found');
							}
						} else {
							console.log('clientWindow NOT found');
						}
					} else {
						console.log('clientIframe NOT found');
					}
				} else {
					console.log('clientIframe NOT found');
				}
			} else {
				console.log('serverDocument NOT found');
			}
		} else {
			console.log('serverWindow NOT found');
		}
	} else {
		console.log('serverIframe NOT found');
	}
}
