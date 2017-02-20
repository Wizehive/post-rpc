var createFixture = function (origin, libpath) {
	var serverIframe, serverWindow, serverDocument, serverSource;
	// Create(if not exist) server iframe
	serverIframe = top.document.getElementById('server');
	if (!serverIframe) {
		serverIframe = top.document.createElement('iframe');
        serverIframe.setAttribute('src', 'about:blank');
		serverIframe.setAttribute('id', 'server');
		serverIframe.setAttribute('style', 'position: fixed; top: 0; left: -99999px;');
        top.document.body.appendChild(serverIframe);
		serverWindow = serverIframe.contentWindow;
		serverDocument = serverWindow.document;
		serverSource = [
			'<html>',
			'  <head>',
			'    <meta charset="UTF-8">',
			'  </head>',
			'  <body>',
			'    <script type="text/javascript" src="' + libpath + '/PostRPC.Server.js"  data-cover></script>',
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
		serverDocument.close();
    }
	serverIframe = top.document.getElementById('server');
	serverWindow = serverIframe.contentWindow;
	serverDocument = serverWindow.document;

	var clientIframe, clientWindow, clientDocument, clientSource;
	// Create(if not exist) client iframe
	clientIframe = serverDocument.getElementById('client');
	if (!clientIframe) {
		clientIframe = serverDocument.createElement('iframe');
        clientIframe.setAttribute('src', 'about:blank');
		clientIframe.setAttribute('id', 'client');
		clientIframe.setAttribute('style', 'position: fixed; top: 0; left: -99999px;');
        serverDocument.body.appendChild(clientIframe);
		clientWindow = clientIframe.contentWindow;
		clientDocument = clientWindow.document;
		clientSource = [
			'<html>',
			'  <head>',
			'    <meta charset="UTF-8">',
			'  </head>',
			'  <body>',
			'    <script type="text/javascript" src="' + libpath + '/PostRPC.Client.js"  data-cover></script>',
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
		for (var j = 0; j < clientSource.length; j++) {
			clientDocument.write(clientSource[j]);
		}
		clientDocument.close();
    }
	clientIframe = serverDocument.getElementById('client');
	clientWindow = clientIframe.contentWindow;
	clientDocument = clientWindow.document;
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

var logTop = function () {
	console.log('context:');
	console.log(top.document.documentElement.innerHTML);
};

var logContext = function () {
	var contextIframe = top.document.getElementById('context');
	if (contextIframe) {
		console.log('context:');
		console.log(contextIframe.contentWindow.document.documentElement.innerHTML);
	} else {
		console.log('contextIframe NOT found');
	}
};

var logFixture = function () {
	var serverIframe, serverWindow, serverDocument, server;
	var clientIframe, clientWindow, clientDocument, client;

	serverIframe = top.document.getElementById('server');
	if (serverIframe) {
		console.log('serverIframe found');
		serverWindow = serverIframe.contentWindow;
		if (serverIframe) {
			console.log('serverWindow found');
			serverDocument = serverWindow.document;
			if (serverDocument) {
				console.log('serverDocument found');
				clientIframe = serverDocument.getElementById('client');
				if (clientIframe) {
					console.log('clientIframe found');
					clientIframe = serverDocument.getElementById('client');
					if (clientIframe) {
						console.log('clientIframe found');
						clientWindow = clientIframe.contentWindow;
						if (clientWindow) {
							console.log('clientWindow found');
							clientDocument = clientWindow.document;
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

								server = serverWindow.postrpc_server;
								if (server) {
									console.log('server found');
								} else {
									console.log('server NOT found');
								}

								client = clientWindow.postrpc_client;
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
};
