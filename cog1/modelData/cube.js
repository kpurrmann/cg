/**
 * 3D Data Store for a model.
 * @namespace cog1.data
 * @module cube
 */
define(["exports", "data"], function(exports, data) {

	// Edge length of the cube.
	var a = 200;

	var vertices = [
			// bottom
			[-a,-a,-a],
			[ a,-a,-a],
			[ a,-a, a],
			[-a,-a, a],
			// top		
			[-a,a,-a],
			[ a,a,-a],
			[ a,a, a],
			[-a,a, a]
	];
	// Use default colors.
	var colors = data.colors;
	var normals = []; 
	var textureCoord = [];	
	var polygonVertices = [
		[0,1,2,3,0],
		[4,5,6,7,4],
		[0,1,5,4,0],
		[1,2,6,5,1],
		[2,3,7,6,2],
		[3,0,4,7,3]
	];	
	var polygonColors = [0,1,2,3,4,5];	
	var polygonNormals = [];
	var polygonTextureCoord = [];
	
	// Public API.
	exports.vertices = vertices;
	exports.colors = colors;
	exports.normals = normals;
	exports.textureCoord = textureCoord;
	exports.polygonVertices = polygonVertices;
	exports.polygonColors = polygonColors;
	exports.polygonNormals = polygonNormals;
	exports.polygonTextureCoord = polygonTextureCoord;
});