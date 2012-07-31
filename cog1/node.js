/**
 * An node in the scene contains a model (3D-data) and a
 * transform, i.e. translate, rotate, scale vectors for a node in the scene.
 * It can have a parent node.
 */
define(["exports", "dojo", "scene", "glMatrix"], function(exports, dojo, scene) {

	// The UI finds nodes by name.
	var name = "";
	// 3D-Model, if null the node may only serve as an empty group.
	var model = null;
	// Parent node.
	var parent = null;
	// List of children /child nodes.
	var children = [];

	// Local transformations (translation, rotation, scale)
	// for the model or group.
	var transformation = {
		translate : [0,0,0],
		rotate : [1,1,1], // around x,y,z axis angle in radians
		scale : [1,1,1]
	};
	// Modelview matrix as 4x4 glMatrix to
	// Transform, i.e. translate, rotate, scale the node.
	// Local Modelview not including the transformations of the parents.
	var localModelview = mat4.create();
	// World coordinates, including transformation of parents.
	var worldModelview = mat4.create();
	// Track changes via transformations and update only when necessary.
	var localModelviewUpToDate = false;
	var worldModelviewUpToDate = false;

	function getLocalModelview() {
		updateModelview();
		return localModelview;
	}

	function getWorldModelview() {
		updateModelview();
		return worldModelview;
	}

	function getModel() {
		return model;
	}

	function getModelData() {
		if(model === null) {
			return null;
		}
		return model.getData();
	}

	function getTransformedVertices() {
		if(model === null) {
			return null;
		}
		return model.getTransformedVertices();
	}

	function setWorldModelviewNotUpToDate() {
		worldModelviewUpToDate = false;
	}

	/**
	 * Create a node and return an interface object to it.
	 * This interface node is used in the scene-graph.
	 * @ returns node.
	 */
	function create(_name, _model, _parent) {
//		console.log("cog1.node.create:" + _model);
		if(_name !== undefined) {
			name = _name;
		}
		if(_model !== undefined) {
			model = _model;
		}
		if(_parent !== undefined) {
			parent = _parent;
		}
		var newNode = {
			name : name,
			addChild : addChild,
			tellChildren : tellChildren,
			isReady : isReady,
			getLocalModelview : getLocalModelview,
			getWorldModelview : getWorldModelview,
			updateModelview : updateModelview,
			getModel : getModel,
			getModelData : getModelData,
			getTransformedVertices : getTransformedVertices,
			getLocalModelview : getLocalModelview,
			getWorldModelview : getWorldModelview,
			applyMatrix : applyMatrix,
			translate : translate,
			rotate : rotate,
			scale : scale,
		};
		// Register as child;
		if(parent) {
			parent.addChild(newNode);
		}
		// Return access object to the node.
		return newNode;
	}

	function addChild(node) {
		children.push(node);
	}

	function tellChildren(fkt) {
		// First tell myself.
		fkt();
		for(var i = 0; i < children.length; i++) {
			children[i][fkt]();
		};
	}

	/**
	 * Checks if model data has finished loading.
	 * @returns true if model is ready for rendering
	 */
	function isReady() {
		var ready = true;
		if(model !== null) {
			ready = ready && model.isReady();
		}
		return ready;
	}

	/**
	 * First update the local model-view matrix
	 * then traverse up the graph and incorporate
	 * the transformations of the parents recursively.
	 * This is due to optimization as calculations
	 * are performed more than once in each frame.
	 *
	 * @ returns worldModelview Matrix
	 */
	function updateModelview() {
		// update LocalModelview() {
		if(! localModelviewUpToDate) {
			// Calculate local modelview.
			mat4.identity(localModelview);
			mat4.translate(localModelview, transformation.translate);
			mat4.rotateX(localModelview, transformation.rotate[0]);
			mat4.rotateY(localModelview, transformation.rotate[1]);
			mat4.rotateZ(localModelview, transformation.rotate[2]);
			mat4.scale(localModelview, transformation.scale);
			// Locally we are up to date, but we have to adjust world MV.
			localModelviewUpToDate = true;
			worldModelviewUpToDate = false;
		}
		// update WorldModelview
		if(! worldModelviewUpToDate) {
			 mat4.identity(worldModelview);
			// Include transformation of parent node.
			if(parent !== null) {
				pwmv = parent.updateModelview();
				mat4.multiply(worldModelview, pwmv, worldModelview);
			}
			// Combine world of parents with local to this world.
			mat4.multiply(worldModelview, localModelview, worldModelview);
			worldModelviewUpToDate = true;
		}
		return worldModelview;
	}

	/**
	 * @parameter delta to add to the current translation.
	 */
	function translate(vec) {
		transform(transformation.translate, vec);
	}

	/**
	 * @parameter delta to add to the current rotation.
	 */
	function rotate(vec) {
		transform(transformation.rotate, vec);
	}

	/**
	 * @parameter delta to add to the current scale.
	 */
	function scale(vec) {
		transform(transformation.scale, vec);
	}

	/**
	 * @parameter delta to add to the current translation.
	 */
	function transform(trans, vec) {
//		console.log("transform name: " + name);
		localModelviewUpToDate = false;
		worldModelviewUpToDate = false;
		vec3.add(trans, vec, null);
		// Tell children the world of their parents has changed.
		tellChildren(setWorldModelviewNotUpToDate);
		scene.setUpToDate(false);
		//updateModelview() is called from render function.
	}

	/**
	 * Apply a matrix to vertices if node contains a model.
	 * @parameter mat mat4 matrix
	 */
	function applyMatrix(matrix) {
		// Project the model.
		if(model !== null) {
			model.applyMatrix(matrix);
		}
	}

	// Public API to module.
	// The API of the node object is defines in the create() method.
	exports.create = create;
});
