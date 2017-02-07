
var setupServer = function (origin) {

	var server = new window.PostRPC.Server(origin);
	window.server = server;

};

var setupClient = function (origin) {

		// Create(if not exist) a child iframe and create client within it
		var iframe = document.getElementById('client');

		if (!iframe) {
			var iframeWindow, iframeDocument, script;
			var iframe = window.document.createElement('iframe');
	        iframe.setAttribute('src', 'about:blank');
			iframe.setAttribute('id', 'client');
			iframe.setAttribute('style', 'position: fixed; top: 0; left: -99999px;');

	        window.document.body.appendChild(iframe);

			var iframeWindow = iframe.contentWindow;
			var iframeDocument = iframeWindow.document;

    		script = iframeDocument.createElement('script');
			script.type = "text/javascript";

			var inject = function (origin) {
			    var client = new parent.PostRPC.Client(origin);
			    window.client = client;
			}

			script.innerHTML = '(' + inject.toString() + '(\'' + origin + '\'));';
			iframeDocument.body.appendChild(script);
	    }

	    return iframe;

};
