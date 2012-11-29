/**
 * Populate the scene-graph with nodes,
 * calling methods form the scenegraph module.
 * @namespace cog1
 * @module createScene
 */
define(["exports", "scenegraph"], function(exports, scenegraph) {
	/*
	 * 	Call methods form the scene-graph (tree) module to create the scene.
	 *
	 */
	function init() {
		var cubeNode = scenegraph.createNodeWithModel("cube", "cube");
		//var insideOutPolyNode = scenegraph.createNodeWithModel("insideOutPoly", "insideOutPoly");
		//cubeNode.translate([0,0,-10]);
		cubeNode.rotate([1,1,1]);
		scenegraph.setLights(0.2,1,[000,000,300]);
	}

	// Public API.
	exports.init = init;
});