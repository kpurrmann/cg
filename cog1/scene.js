/**
 * Initialize the canvas.
 * Render the scene.
 * @namespace cog1
 * @module scene
 */
define(["exports", "dojo", "app", "scenegraph", "raster", "framebuffer", "data", "glMatrix"], function(exports, dojo, app, scenegraph, raster, framebuffer, data) {

	// Keep the canvas to access parameters.
	var canvas = null;
	// Drawing context for canvas.
	var ctx;

	// Scene is up to date, i.e. nothing changed,
	// all (model-) data has been loaded,
	// no animations are running.
	var upToDate = false;

	// There is one projection matrix for the scene.
	var projection = mat4.identity(mat4.create());
	// Viewport transformation matrix.
	var viewport = mat4.identity(mat4.create());
	// Combined matrix for faster calculation.
	var viewportProjection = mat4.create();
	// Combined matrix for faster calculation.
	var worldModelviewViewportProjection = mat4.create();

	// Font.
	var fontsizeInPt = 10;
	var font = fontsizeInPt + "pt Helvetica normal";
	var fontLineHeightInPt = Math.ceil(fontsizeInPt * 1.5);
	// Default drawing.
	var defaultColor = "black";
	var defaultTextColor = "grey";


	/**
	 * Initialize the scene, i.e., canvas, graphics-context, projection.
	 * If we wanted multiple scenes we would
	 * have to pass an index and maybe a enclosing div element.
	 */
	function init() {
//		console.log("cog1.scene.init()");
//		console.log(this);
		// Check if there is already a canvas in the scene.
		canvas = dojo.query("canvas")[0];
		if(!dojo.isObject(canvas)) {
			// Create a canvas for the scene.
			canvas = dojo.create("canvas", {
				id : "canvas",
				width : "800",
				height : "500",
				className : "canvas"
			}, dojo.body(), "first");
		}
		// Get the drawing context.
		if(canvas.getContext) {
			ctx = canvas.getContext("2d");
		}
		// Also store dimension of the canvas in the context,
		// to pass them all together as parameter.
		ctx.width = canvas.width;
		ctx.height = canvas.height;
		// Default display setting.
		ctx.strokeStyle = defaultColor;
		ctx.fillStyle = defaultColor;
		ctx.font = font;
		ctx.textAlign = "left";

		raster.init(ctx);

		// Initialize an calculate matrices that do not chance.
		setProjection();
		setViewport();
		calcviewportProjection();
		scenegraph.init();
	}
	
	/*
	 * When nodes are modified, they report to the scene
	 * that it needs rerendering.
	 */
	function setUpToDate(val){
		upToDate = val;
		// Tell app to run the loop.
		if(! upToDate){
			app.start(false);
		}
	}

	/**
	 * Set a default for the projection matrix.
	 * As a result all vertices inside the frustrum
	 * should be in a -1,+1 cube (clip cooordinates).
	 * This may be overwritten.
	 * If you do not do anything here, result will be
	 * an orthogonal-projection without scaling (z-value will be ignored).
	 * @parameter mat is a mat4 matrix.
	 */
	function setProjection(matrix) {
		if(matrix) {
			mat4.set(matrix, projection);
		} else {
			// Set frustrum to +- size of the canvas.
			var r = ctx.width;
			var t = ctx.height;
			// glMatrix has a bug. Set near to far to cancel the wrong transform in glMatrix.
			// mat4.ortho(-r, r, -t, t, 2, 0, projection);
			// Assume an ortho projection with a symetric frustrum.
			// Projection should be the unity matrix at this point.
			// See  mat4.multiplyVec4 for indices.
			projection[0] = 1.0 / r;
			projection[5] = 1.0 / t;
			// We do not clip at the near or far plane,
			// thus we leave out scaling the z-coordinate.
			//projection[10] = //-2/f-n;
			//projection[11] = -(f+n)/(f-n);
		}
	}

	/**
	 * Set a default for the viewport matrix.
	 * This may be overwritten.
	 * If you do not do anything here, result will be no transformation.
	 */
	function setViewport() {
		// Center the scene and scale frustrum to the canvas.
		// See  mat4.multiplyVec4 for indeces.
		var w = ctx.width;
		var h = ctx.height;
		var w2 = w / 2.0;
		var h2 = h / 2.0;
		viewport[0] = w2;
		viewport[5] = h2;
		viewport[12] = w2;
		viewport[13] = h2;
		//console.log("viewport: w" + w + " h" + h + " w2 " + w2 + " h2 " + h2);
		//var matrix = [w2, 0, 0, 0,  0, h2, 0, 0,  0, 0, 1, 0,  w2, h2, 1, 1];
		//mat4.set(matrix, viewport);
	}

	function calcviewportProjection() {
		//mat4.multiply(projection, viewport, viewportProjection);
		mat4.multiply(viewport, projection, viewportProjection);
	}

	/**
	 * Run the complete rendering pipeline for all nodes.
	 */
	function render() {
		if(upToDate) {
			return true;
		}

		framebuffer.reset();
		// Clear the canvas from debug info and from the 
		// remains of the last (maybe larger) dirty rectangle.
		ctx.clearRect(0,0,ctx.width, ctx.height);

		// Assume all is ready for rendering.
		upToDate = true;

		// A shortcut to the nodes.
		var nodes = scenegraph.getNodes();

		// Display matrices that are common for all nodes.
		displayViewProjectionMatrices();

//		console.log("cog1.scene.render() notes:" + nodes.length);
		// Loop over all nodes in the scene.
		// Leave out nodes if they are not ready yet
		// and report that.
		for(var i = 0; i < nodes.length; i++) {
//			console.log(nodes[i]);
//			console.log(nodes[i].getModel());
			// Verify that node is ready.
			if(!nodes[i].isReady()) {
				upToDate = false;
//				console.log("note not ready:" + i);
				continue;
			}
//			console.log("nodes[" + i + "] is ready");
			// Render the node.
			// Perform modelview, projection and viewport transformations in 3D.
			var worldModelview = nodes[i].updateModelview();
			// Combine all three matrices into one.
			mat4.multiply(viewportProjection, worldModelview, worldModelviewViewportProjection);
			// Display for debug.
			displayModelViewMatrix(i, worldModelview, nodes[i].getLocalModelview());
			// Apply the combined matrix to the node.
			// The result is stored in the transformedVertices of node.model.
			nodes[i].applyMatrix(worldModelviewViewportProjection);
			// Check if the node contains a model.
			var modelData = nodes[i].getModelData();
			if(modelData !== null) {
				var transformedVertices = nodes[i].getTransformedVertices();
				if(transformedVertices === null) {
//					console.error("scene.render: transformedVertices === null");
				}
				// Raster the 2D polygons of the node.
				rasterization(modelData, transformedVertices);
			}
		}

		framebuffer.display();

		return upToDate;
	}

	/**
	 * Rasterization step.
	 */
	function rasterization(modelData, transformedVertices) {
		var polygons = modelData.polygonVertices;
		var vertices = transformedVertices;
		// Loop over polygons in model.
		for(var p = 0; p < polygons.length; p++) {
			var polygon = polygons[p];
			var color = modelData.colors[modelData.polygonColors[p]];
			// Fill or stroke polygon.
			var fill = true;
			raster.scanlineDrawPolygon(ctx, transformedVertices, polygon, color, fill);
			// Stroke polygon on top to see black edges
			// (and to cover up (a bit) for edge fighting).
			var colorBlack = data.colors[6];
			if(fill) {
				//raster.scanlineDrawPolygon(ctx, transformedVertices, polygon, colorBlack, false);
			}
		}
	}

	/**
	 * Display Projection and View-port matrices.
	 */
	function displayViewProjectionMatrices() {
		displayMatrix("Projection", projection, 0, 100);
		displayMatrix("Viewport", viewport, 0, 200);
		displayMatrix("Projection-Viewport", viewportProjection, 0, 300);
	}

	function displayModelViewMatrix(nodeIndex, worldModelview, localModelview) {
		displayMatrix("Local Modelview Node " + nodeIndex, localModelview, ctx.width - 220, 100);
		displayMatrix("World Modelview Node " + nodeIndex, worldModelview, ctx.width - 220, 200);
		displayMatrix("ModelviewViewProject Node " + nodeIndex, worldModelviewViewportProjection, ctx.width - 220, 300);
	}

	/**
	 * Display a matrix for debug
	 * @parameter name of the matrix for debug, matrix and position on canvas
	 */
	function displayMatrix(name, matrix, xOffset, yOffset) {
		ctx.fillStyle = defaultTextColor;
		var str;
		var x = xOffset, y = yOffset;
		ctx.fillText(name + ":", x, y);
		x += fontLineHeightInPt;
		y += fontLineHeightInPt;
		var index = 0;
		for(var i = 0; i < 4; i++) {
			str = "";
			for(var j = 0; j < 4; j++) {
				str += matrix[index].toFixed(3) + "  ";
				index++;
			}
			ctx.fillText(str, x, y);
			y += fontLineHeightInPt;
		}
		// Reset color.
		ctx.fillStyle = defaultColor;
	}

	// Public API.
	exports.init = init;
	exports.setProjection = setProjection;
	exports.render = render;
	exports.setUpToDate = setUpToDate;
});
