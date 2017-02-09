var setup = function (origin) {

	// var serverWindow = window;

	// if (serverWindow.server) {
	// 	serverWindow.server.init();
	// }
 	// serverWindow.server = new serverWindow.PostRPC.Server(origin);

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
'  head>',
'    <meta charset="UTF-8">',
'  </head>',
'  <body style="background: #fefefe;">',
'    <script type="text/javascript" src="../PostRPC.Server.js"></script>',
'    <script type="text/javascript">',
'      window.server = new window.PostRPC.Server(\'' + origin + '\');',
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
'  head>',
'    <meta charset="UTF-8">',
'  </head>',
'  <body style="background: #fefefe;">',
'    <script type="text/javascript" src="../PostRPC.Client.js"></script>',
'    <script type="text/javascript">',
'      window.client = new window.PostRPC.Client(\'' + origin + '\');',
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
	return clientIframe.contentWindow.client;
};

var findServerWindow = function () {
	var serverIframe = top.document.getElementById('server');
	return serverIframe.contentWindow;
};

var findServer = function () {
	var serverIframe = top.document.getElementById('server');
	return serverIframe.contentWindow.server;
};
