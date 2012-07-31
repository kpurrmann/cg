"use strict";
// Load initial set of dependencies and start.
require(["dojo", "parser", "app"], function(dojo, parser, app) {
	//alert("Dojo version " + dojo.version + " is loaded" + '\n\ndojoConfig = ' + dojo.toJson(dojo.config, true));	
	app.load();
	app.start(false);
});
