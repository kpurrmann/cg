/**
 * Framebuffer is used buffer the rendering output and to draw to the canvas.
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
    // We assume that the dimension of the canvas pixel match the CSS
    // pixel.
    var buf;
    // Z-Buffer, with size number of pixels.
    // Stores z-coordinate.
    var zBuf;
    // We remember the size of the buffers for speedup.
    var bufSize;
    var zBufSize;

    // For z buffer. Camera look in -z direction.
    var maxDistance = -10000;
    // Background color rgb
    var bgColor = [255, 255, 255, 255];
    // "white";

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

    /*
	 * @parameter _bgColor is an rgb array.
	 */
    function init(_ctx, _bgColor) {
        ctx = _ctx;
        if(_bgColor != undefined) {
            // Create a new local array, not a slow remote reference,
            // and not as a string but as a number ("255" != 255).
            for(var i = 0; i < _bgColor.length; i++) {
                bgColor[i] = Number(_bgColor[i]);
            }
            // Set alpha.
            bgColor[3] = 255;
        }
        // Initialize the frame-buffer.
        // console.log("framebuffer: " + ctx.width + " " + ctx.height);
        buf = ctx.getImageData(0, 0, ctx.width, ctx.height);
        if((ctx.width != buf.width) || (ctx.height != buf.height)) {
            console.log("WARNING: Dimension of the canvas pixel match the CSS pixel.");
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

    /**
	 * Perform zBuffer test.
	 * @parameter color is an object-array with rgba values
	 * @return true on pass.
	 */
    function zBufferTest(x, y, z, color) {

        // Check range.
        if(x < 0 || y < 0 || x >= ctx.width || y >= ctx.height) {
            return false;
        }

        var indexZBuf = y * ctx.width + x;

        // BEGIN exercise z-Buffer

        // The camera is in the origin looking in negative z-direction.

        if (zBuf[indexZBuf] > z) {
            return false;
        }
        zBuf[indexZBuf] = z;

        // END exercise z-Buffer

        return true;
    }

    /**
	 * Set a pixel/fragment in the frame-buffer and in z-buffer
	 * @parameter color is an object with colorname : rgba values
	 * @paramter performZBufferTest is set to true per default if not given.
	 */
    function set(x, y, z, color, performZBufferTest) {

        // Check range.
        if(x < 0 || y < 0 || x >= ctx.width || y >= ctx.height) {
            // console.log("Error: Framebuffer out of range: " + x + " ,
            // " + y);
            return;
        }

        // Perform zBuffer-test.
        if(performZBufferTest == undefined || performZBufferTest == true) {
            if(! zBufferTest(x, y, z, color)) {
                return;
            }
        }

        var rgba = color.rgbaShaded;
        // Index in frame-buffer.
        var index = (y * ctx.width + x) * 4;
        // Set default color black.
        if(color == undefined) {
            color = [0, 0, 0];
        }

        buf.data[index] = rgba[0];
        buf.data[index + 1] = rgba[1];
        buf.data[index + 2] = rgba[2];
        buf.data[index + 3] = rgba[3];
        // force alpha to 100%.
        // buf.data[index + 3] = 255;

        // Adjust the dirty rectangle.
        if(x < dirtyRect.x) {
            dirtyRect.x = x;
        } else if(x > dirtyRect.xMax) {
            dirtyRect.xMax = x;
        }
        if(y < dirtyRect.y) {
            dirtyRect.y = y;
        } else if(y > dirtyRect.yMax) {
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
            // for(var i = 0; i < zBufSize; i++) {
            zBuf[i] = maxDistance;
        }

        // Adjust size to frame-buffer with rgba.
        dirtyStartIndex *= 4;
        dirtyEndIndex *= 4;
        for( i = dirtyStartIndex; i < dirtyEndIndex; i += 4) {
            // for(var i = 0; i < bufSize; i+=4) {
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
    // dirtyRect.width = 0;
    // dirtyRect.height = 0;
    }

    function display() {

        if(scene.getDebug_zBuffer()) {
            MultiplyFramebufferWithZBuffer();
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
        // Initialize z-min and z-max (maxDistance is large negative)
        // reversed, complementary and scale linearly.
        var min = -maxDistance;
        var max = maxDistance;
        // Get min and max.
        for(var i = 0; i < zBufSize; i++) {
            if(zBuf[i] == maxDistance)
                continue;
            if(zBuf[i] > max) {
                max = zBuf[i];
            } else if(zBuf[i] < min) {
                min = zBuf[i];
            }
        }
        var range = Math.abs(max - min);
        if(range == 0)
            range = 1;
        // console.log("min="+min+" max="+max+" range="+range);
        // Scale between min and max.
        for(var i = 0; i < zBufSize; i++) {
            if(zBuf[i] == maxDistance) {
                continue;
            }
            // Set offset to zero (also wen min is negative) than scale.
            zBuf[i] = (zBuf[i] - min) / range;
        }
    }

    /*
	 * Multiply the z-buffer for visualization to interval [0,1].
	 */
    function MultiplyFramebufferWithZBuffer() {

        scaleZBuffer();

        var dirtyStartIndex = dirtyRect.y * ctx.width + dirtyRect.x;
        var dirtyEndIndex = dirtyRect.yMax * ctx.width + dirtyRect.xMax;

        for(var i = dirtyStartIndex; i < dirtyEndIndex; i++) {
            var z = zBuf[i];
            var j = i * 4;
            // Set the bgColor if z not maxDistance, which is not
            // scaled.
            if(z != maxDistance) {
                z = 1 - z;
                buf.data[j] *= z;
                buf.data[j + 1] *= z;
                buf.data[j + 2] *= z;
            // buf.data[j + 3] *= z // Alpha remains.
            }
        }
    }

    // Public API.
    exports.init = init;
    exports.set = set;
    exports.zBufferTest = zBufferTest;
    exports.reset = reset;
    exports.display = display;
});
