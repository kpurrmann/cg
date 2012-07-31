/**
 * The scene-graph with nodes.
 * @namespace cog1
 * @module scene
 */
define(["exports", "dojo", "model", "node"], function(exports, dojo, model, node) {

	// Contains the scene-graph, a tree of
	// nodes (a model with a transform) in the scene.
	var nodes = new Array();
	
	/*
	 * 	Create scene-graph (tree).
	 */
	function init(){
//		console.log("cog1.scenegraph.init()");
		var cubeNode = createNodeWithModel("cube", "cube");		
	}

	/**
	 * Create a node with model and given model data.
	 * @parameter modelData
	 * @parameter parent node is optional
	 * @returns node
	 */
	function createNodeWithModel(name, modeldata, parent) {
		// to observer pattern.
		var newModle = model.create(modeldata);
//		console.log(newModle);
		var newNode = node.create(name, newModle, parent);
//		console.log(newNode);
		nodes.push(newNode);
		upToDate = false;
		return newNode;
	}
	
	/*
	 * 	Access to the nodes in the scene-graph.
	 */
	function getNodes() {
		return nodes;
	}

	function getNodeByName(name) {
		for (var n in nodes) {
		  if(nodes[n].name == name) { return nodes[n]; }
		}
//		console.log("Error: node not found in scenegraph: "+ name);
		return null;
	}
	
	// Public API.
	exports.init = init;	
	exports.createNodeWithModel = createNodeWithModel;
	exports.getNodes = getNodes;
	exports.getNodeByName = getNodeByName;
});
