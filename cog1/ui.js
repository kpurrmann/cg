/**
 * The user interface UI
 * communicates with the app and with the scene.
 * @namespace cog1
 * @module ui
 */
define(["exports", "start", "app", "scene", "scenegraph", "framebuffer", "dojo", "dojo/on", "dojo/dom", "dojo/dom-construct", "dojo/dom-style", "dojo/mouse", "dojo/domReady!", "glMatrix"], function ui(exports, start, app, scene, scenegraph, framebuffer, dojo, on, dom, domConstruct, domStyle, mouse) {

	// Transformation deltas for on step.
	var delta = {
		rotate : 0.1,
		translate : 10.0,
		scale : 0.1,
	};
	// Rotationaxises.
	var axises = {
		X : [1, 0, 0],
		Y : [0, 1, 0],
		Z : [0, 0, 1]
	};
	signs = {
		plus : "+",
		minus : "-"
	};

	// Variables to track mouse movement.
	var mousePosX;
	var mousePosY;
	var currMouseButton;

	// Name of the interactive node.
	// This is not very generic...
	var interactNodename = "cube";

	/**
	 * Initialize the UI callbacks.
	 * @namespace cog1.ui
	 */
	function init() {
//		console.log("cog1.ui.init()");
		// Create GUI elements and callbacks.
		var controlsDiv = dom.byId("controlsDiv");
		for(var transform in delta) {
			for(var axis in axises) {
				for(var sign in signs) {
					// Create buttons.
					var button = domConstruct.create("button", {
						id : transform + signs + axis + "Button",
						innerHTML : transform + " " + signs[sign] + axis,
					}, controlsDiv);
					// Callbacks for buttons.
					var callback = callbackFactoryTransformNode(interactNodename, transform, signs[sign], delta[transform], axises[axis]);
					//button = dom.byId(transform + signs + axis + "Button");
					on(button, "click", callback);
				}
				domConstruct.create("br", {}, controlsDiv);
			}
			domConstruct.create("p", {}, controlsDiv);
		}
		// Toggle z-buffer debug.
		button = domConstruct.create("button", {
			id : "toggleZBufferDebugButton",
			innerHTML : "toggle Z-Buffer Debug",
		}, controlsDiv);
		on(button, "click", framebuffer.toggleDebug);
		// Mouse events.
		var canvasDiv = dom.byId("canvasDiv");
		on(canvasDiv, "mousedown", onMouseDown);
		on(canvasDiv, "mouseup", onMouseUp);
		on(canvasDiv, "mousemove", onMouseMove);
	}

	function callbackFactoryTransformNode(nodename, transformation, sign, delta, axis) {
		// Scale the transformation.
		if(sign == "-") { delta *= -1; }
		var scaledAxis = [];
		vec3.scale(axis, delta, scaledAxis);
		return function() {
			scenegraph.getNodeByName(nodename)[transformation](scaledAxis);
			// Wake up the animation-loop in case it is not running continuously.
			app.start(false);
		}
	}

	//////////////////////  Mouse Events //////////////////////

	function onMouseDown(e) {
		//console.log("onMouseDown "+e);
		mousePosX = e.clientX;
		mousePosY = e.clientY;
		currMouseButton = e.button;
		//console.log("currMouseButton "+currMouseButton);
	}

	function onMouseUp(e) {
		//console.log("onMouseUp "+e);
		mousePosX = undefined;
		mousePosY = undefined;
		currMouseButton = undefined;
		//console.log("currMouseButton "+currMouseButton);
	}

	function onMouseMove(e) {
		// console.log("onMouseMove "+e);
		// Consider only mouse dragged events.
		//console.log("currMouseButton "+currMouseButton);
		if(currMouseButton == undefined) {
			return;
		}

		// Calc movement.
		var mousePosXNew = e.clientX;
		var mousePosYNew = e.clientY;
		//currMouseButton = e.button;
		var diffX = mousePosXNew - mousePosX;
		var diffY = mousePosYNew - mousePosY;
		mousePosX = mousePosXNew;
		mousePosY = mousePosYNew;

		// Some representation of Z dim with a 2D mouse :(
		var diffZ = (diffX + diffY) / (Math.abs(diffX - diffY) + 1.0);
		//console.log("diff XYZ:"+diffX+"\t "+diffY+"\t "+diffZ+"\t ");
		// Difference vector for the transformation.
		var diffVec = [0, 0, 0];
		// The type of transformation.
		var transformation = undefined;
		// Scale the stepsize.
		var factor = 1;

		// Rotate.
		if(currMouseButton == "0") {
			transformation = "rotate";
			factor = 0.01;
			diffVec[0] += diffX * factor;
			diffVec[1] += diffY * factor;
			diffVec[2] += diffZ * factor;
		}
		// Translate.
		if(currMouseButton == "1") {
			transformation = "translate";
			factor = 2;
			diffVec[0] += diffX * factor;
			diffVec[1] += diffY * factor;
			//diffVec[2] += diffZ * factor;
		}
		// Scale.
		if(currMouseButton == "2") {
			transformation = "scale";
			// Max scale limit per mouse move.
			var limit = 1.1;
			// Adjust sensibility.
			diffX *= 0.5;
			diffY *= 0.5;
			diffZ *= 0.5;
			diffVec[0] *= Math.min(limit, Math.max(1, diffX));
			diffVec[1] *= Math.min(limit, Math.max(1, diffY));
			diffVec[2] *= Math.min(limit, Math.max(1, diffZ));
			// Divide if negative.
			diffVec[0] /= -Math.max(-limit, Math.min(-1, diffX));
			diffVec[1] /= -Math.max(-limit, Math.min(-1, diffY));
			diffVec[2] /= -Math.max(-limit, Math.min(-1, diffZ));
		}

		// Execute the transformation.
		if(!transformation) {
			return;
		}
		//console.log("diffVec: "+diffVec);
		scenegraph.getNodeByName(interactNodename)[transformation](diffVec);

		// Wake up the animation-loop in case it is not running continuously.
		app.start(false);
	}

	////////////////////// Event Debug //////////////////////

	function debugEventAlert(e) {
		console.log(e);
		alert("Event:" + e);
	}

	// Public API.
	exports.init = init;
});
