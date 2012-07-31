/**
 * Framebuffer is used buffer the rendering output and
 * to draw to the canvas.
 * Z-Buffer is included in this module.
 *
 * @namespace cog1.frambuffer
 * @module frambuffer
 */
define(["exports", "scene"], function(exports, scene) {

	// Drawing context for canvas.
	var ctx;

	// Fragment buffer as ImageData with size of canvas * 4 (rgba).
	// Thus we use a 1D buffer as storage.
	// We assume that the dimension of the canvas pixel match the CSS pixel.
	var buf;
	// Z-Buffer, with size number of pixels.
	var zBuf;
	// We remember the size of the buffers for speedup.
	var bufSize;
	var zBufSize;

	// For z buffer.
	var maxDistance = 10000;
	// Background color rgb
	var bgColor = [255, 255, 255, 255];
	//"white";

	// Rectangle with region of modified pixel.
	// We only repazBuf[i] the dirty rectangle.
	var dirtyRect = {
		x : undefined,
		y : undefined,
		xMax : undefined,
		yMax : undefined,
		width : undefined,
		height : undefined
	};

	// Display the z-buffer instead of the frame-buffer.
	var debug_zBuffer = true;
	
	function init(_ctx) {
		ctx = _ctx;
		// Initialize the frame-buffer.
//		console.log("framebuffer: " + ctx.width + " " + ctx.height);
		buf = ctx.getImageData(0, 0, ctx.width, ctx.height);
		if((ctx.width != buf.width) || (ctx.height != buf.height)) {
//			console.log("WARNING: Dimension of the canvas pixel match the CSS pixel.");
		}
		// Calculate size for rgba pixel.
		bufSize = ctx.width * ctx.height * 4;
		// Initialize the zBuffer.
		zBufSize = ctx.width * ctx.height;
		bufSize = zBufSize * 4;
		zBuf = new Array(zBufSize);

		// Init dirty rectangle.
		dirtyRect.x = 0;
		dirtyRect.y = 0;
		dirtyRect.xMax = ctx.width;
		dirtyRect.yMax = ctx.height;

		reset();
	}

	/*
	 * Set a pixel/fragment in the frame-buffer and in z-buffer
	 * @parameter color is an object-array with rgba values
	 */
	function set(x, y, z, color) {

		// Check range.
		if(x < 0 || y < 0 || x >= ctx.width || y >= ctx.height) {
			//console.log("Error: Framebuffer out of range: " + x + " , " + y);
			return;
		};

		// Perform zBuffer-test.
		// Overwrite existing pixel with same val
		// to cover z-fights.
		var indexZBuf = y * ctx.width + x;
		// Todo exercise z-Buffer : .....
		// .....
		


		// Index in frame-buffer.
		var index = indexZBuf * 4;
		// Set default color black.
		if(!color) {
			color = [0, 0, 0];
		}
		// Take rgb from color object.
		var colorname = Object.keys(color)[0];
		var rgba = color[colorname];
		buf.data[index] = rgba[0];
		buf.data[index + 1] = rgba[1];
		buf.data[index + 2] = rgba[2];
		buf.data[index + 3] = rgba[3];
		// force alpha to 100%.
		//buf.data[index + 3] = 255;

		// Adjust the dirty rectangle.
		if(x < dirtyRect.x) {
			dirtyRect.x = x;
		}
		if(x > dirtyRect.xMax) {
			dirtyRect.xMax = x;
		}
		if(y < dirtyRect.y) {
			dirtyRect.y = y;
		}
		if(y > dirtyRect.yMax) {
			dirtyRect.yMax = y;
		}
	}

	/*
	 * Call before every frame or to clear.
	 */
	function reset() {

		var dirtyStartIndex = dirtyRect.y * ctx.width + dirtyRect.x;
		var dirtyEndIndex = dirtyRect.yMax * ctx.width + dirtyRect.xMax;

		// Reset frame-buffer to bgColor.
		var r = bgColor[0];
		var g = bgColor[1];
		var b = bgColor[2];
		var a = bgColor[3];

		// Reset zBuffer.
		for(var i = dirtyStartIndex; i < dirtyEndIndex; i++) {
			//for(var i = 0; i < zBufSize; i++) {
			zBuf[i] = maxDistance;
		}

		// Adjust size to frame-buffer.
		dirtyStartIndex *= 4;
		dirtyEndIndex *= 4;
		for(var i = dirtyStartIndex; i < dirtyEndIndex; i++) {
			//for(var i = 0; i < bufSize; i+=4) {
			buf.data[i] = r;
			buf.data[i + 1] = g;
			buf.data[i + 2] = b;
			buf.data[i + 3] = a;
		}

		// Reset dirty rectangle.
		dirtyRect.x = ctx.width;
		dirtyRect.y = ctx.height;
		dirtyRect.xMax = 0;
		dirtyRect.yMax = 0;
		//dirtyRect.width = 0;
		//dirtyRect.height = 0;
	}

	function display() {

		if(debug_zBuffer) { 
			scaleZBuffer();
			MulitplyFramebufferWithZBuffer();
		}

		dirtyRect.width = dirtyRect.xMax - dirtyRect.x;
		dirtyRect.height = dirtyRect.yMax - dirtyRect.y;
		// Check if nothing changed.
		if(dirtyRect.width < 0 || dirtyRect.height < 0) {
			return;
		} else {
			// Add one pixel to include the max.
			dirtyRect.width++;
			dirtyRect.height++;
		}
		ctx.putImageData(buf, 0, 0, dirtyRect.x, dirtyRect.y, dirtyRect.width, dirtyRect.height);
	}

	/*
	 * Scale the z-buffer for visualization to interval [0,1].
	 */
	function scaleZBuffer() {
		// Set z-min=0 and z-max=1.0 and scale linearly
		var min = maxDistance;
		var max = 0;
		// Get min and max.
		for(var i = 0; i < zBufSize; i++) {
			if(zBuf[i] == maxDistance)
				continue;
			if(zBuf[i] > max) {
				max = zBuf[i];
			}
			if(zBuf[i] < min) {
				min = zBuf[i];
			}
		}
		var range = max - min;
		if(range == 0)
			range = 1;
		//console.log("min="+min+" max="+max+" range="+range);
		// Scale between min and max.
		for(var i = 0; i < zBufSize; i++) {
			if(zBuf[i] == maxDistance)
				continue;
			zBuf[i] = (zBuf[i] - min) / range;
		}
	}

	/*
	 * Mulitply the z-buffer for visualization to interval [0,1].
	 */
	function MulitplyFramebufferWithZBuffer() {

		var dirtyStartIndex = dirtyRect.y * ctx.width + dirtyRect.x;
		var dirtyEndIndex = dirtyRect.yMax * ctx.width + dirtyRect.xMax;

		for(var i = dirtyStartIndex; i < dirtyEndIndex; i++) {
			z = zBuf[i];
			var j = i * 4;
			buf.data[j] *= z;
			buf.data[j + 1] *= z
			buf.data[j + 2] *= z
			//buf.data[j + 3] *= z // Alpha remains.
		}
	}
	
	function toggleDebug() {
		debug_zBuffer = ! debug_zBuffer;
		scene.setUpToDate(false);
	}

	// Public API.
	exports.init = init;
	exports.set = set;
	exports.reset = reset;
	exports.display = display;
	exports.toggleDebug = toggleDebug;
});
