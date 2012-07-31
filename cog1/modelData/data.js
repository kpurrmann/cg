/**
 * 3D Data Store for a model.
 * 
 * This is an empty data template 
 * that explains the format.
 * See cube.js as an example.
 * 
 * It also defines some default colors.
 * 
 * @namespace cog1.data
 * @module cube
 */
define(["exports"], function(exports) {

	// Array with data for one model.
	//
	// Vertices with x,y,z
	var vertices = [];
	// Color array  with default colors "red", "green".
	// The color array contains objects of the form:
	// {colorname : [r,g,b,a]}, the name can be accessed 
	// via the Object.keys() function.
	var colors = [
		{red : [255, 0, 0, 255]},
		{green : [0, 255, 0, 255]},
		{blue : [0, 0, 255, 255]},
		{cyan : [0, 255, 255, 255]},
		{magenta : [255, 0, 255, 255]},
		{yellow : [255, 255,0, 255]},
		{black : [0, 0, 0, 255]},
	];
	// Normals.
	var normals = [];
	// Texture coordinates.
	var textureCoord = [];
	
	// All of the above array-data can be combined to polygons referencing the indices of the arrays above.
	//
	// Specifies faces/polygons and its vertex reference number, i.e. the index in the vertices array.
	var polygonVertices = [];
	// Color for each polygon as index in color array.
	var polygonColors = [];	
	// Normals for each vertex of the polygon.
	var polygonNormals = [];
	// Texture coordinates for each vertex of the polygon.
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