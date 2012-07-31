/**
 * Model holds a pointer to a 3D Data Store,
 * i.e., the model data.
 *  Coordinate System:
 *        y
 *        |
 *        |____
 *       /     x
 *     z/
 *
 * @namespace cog1
 * @module model
 */
define(["exports", "dojo", "glMatrix"], function(exports, dojo) {

	// 3D Data Store, containing the mesh, etc.
	// Vertices are blocks of points with X Y Z.
	// Polygons should be closed, i.e. first=last point.
	// Colors are assigned to polygons corresponding to the order in polygonData.
	var data = null;
	// Working copy of the vertices to apply transform.
	var transformedVertices = null;
	// Needed for ready.
	var initTransformedVertricesDone = false;

	// Ready is true when the model data finished loading.
	function isReady() {
		if( ! data ) { return false; }
		if( ! initTransformedVertricesDone ) { return false; }
		return true;
	}

	/**
	 * @returns null until the model data finished loading.
	 *
	 */
	function getData() {
		return data;
	}

	function setData(_data) {
		data = _data;
	}

	function getTransformedVertices() {
		return transformedVertices;
	}

	/**
	 * Link to model to its data/mesh.
	 * @parameter string, name of the modeldata
	 */
	function create(_data) {
//		console.log("cog1.model.create: " + _data + " " + typeof _data);
		// Try to load a data-module with the name _data.
		if(_data === undefined || typeof _data !== "string") {
//			console.log("Error: Parameter for data not a String.");
			//alert("Error: Parameter for data not a String.");
		} else {
			// Load the data of the required 3d model.
			// The require forks, loads then calls given callback.
			require(["cog1/modelData/" + _data], requiredModelDataCbk);
		}
		// Return access object to the model.
		return {
			isReady : isReady,
			getData : getData,
			getTransformedVertices : getTransformedVertices,
			applyMatrix : applyMatrix,
		};
	}

	/**
	 * Called from require when model data has been read.
	 * Callback within the closure of this module-(function).
	 */
	function requiredModelDataCbk(_data) {
//		console.log("requiredModelDataCbk....");
		if(!dojo.isObject(_data)) {
//			console.log("Error: The data for the model is not valid: " + _data);
			alert("Error: model.create: " + _data);
			return;
		}
		setData(_data);
//		console.dir(data);
		initTransformedVertrices();
	}

	/**
	 * Set the dimensions of the data to the 2D-array structure.
	 */
	function initTransformedVertrices() {
//		console.log("initTransformedVertrices: " + data);
		if( ! data ) {
			return;
		}
		transformedVertices = [];
		for(var i = 0, len = data.vertices.length; i < len; i++) {
			transformedVertices[i] = [];
		}
		// We may copy the initial, not transformed data over.
		// But we may leave this out as well, it is done when the model-view matrix is applied.
		copyVertexDataToTransformedVertrices();
		initTransformedVertricesDone = true;
//		console.log("initTransformedVertrices ... done ");
	}

	/**
	 * This is only used for debugging when we want to see the
	 * untransformed vertices.
	 */
	function copyVertexDataToTransformedVertrices() {
		for(var i = 0, leni = data.vertices.length; i < leni; i++) {
			var vertex = data.vertices[i];
			var transformedVertex = transformedVertices[i];
			for(var j = 0, lenj = vertex.length; j < lenj; j++) {
				transformedVertex[j] = vertex[j];
			}
		}
	}

	/**
	 * Apply matrix to the mash given the data.
	 * Store the result in transformedVertices.
	 * @parameter matrix is a mat4 matrix
	 */
	function applyMatrix(matrix) {
		// Check if the data has finished loading.
		if(! isReady() ) {
			return;
		}
		var vertices = data.vertices;
		// We may start empty or just overwrite the existing array.
		for(var i = 0, len = vertices.length; i < len; i++) {
			mat4.multiplyVec3(matrix, vertices[i], transformedVertices[i]);
		}
	}

	/**
	 * Apply a projection matrix to the transformed vertices.
	 */
	function projectTransformedVertrices(matrix) {
		if(transformedVertices === null) {
			return;
		}
		for(var i = 0, len = transformedVertices.length; i < len; i++) {
			mat4.multiplyVec3(matrix, transformedVertices[i]);
		}
	}

	// Public API to module.
	exports.create = create;
});
