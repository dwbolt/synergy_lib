export class model_graph { // MVC model graph - client side

/*
node can have 0 to many edges or relatons
0 edeges -> an orphane node

source -> relation -> target     | choose one to store do not support recipiicle realtions
source -> relation  <- target   bidirectional represend as two edges, so differect data can be on each edge
Edges have direction they will be hirearical or pear

> for hirearical
= for peer
relations that are bidirectional will be listed seprate

*/


constructor(viewer) {  // MVC model graph - client side
	if (viewer === undefined) {
		this.viewer = [];
	} else {
		this.viewer = [viewer];  // in most cases a model will have only one viewer
	}

	this.init();
}


init() { // MVC model graph - client side
	this.node_id     = 0;
	this.edge_id     = 0; 
	this.edge_index  = {};
	/*
{
"relation": {edge_ids:[], bi_directional: boolean}   // asssume uni_directional unless bi_directional = true
}
	 */

	this.graph           = {
	 "meta"  : {}
	,"edges" : {}
	,"nodes" : {}}
}


viewer_add(  // MVC model graph - client side
	viewer
){
	this.viewer.push(viewer);  // model may have more than one viewer
}



node_add(  // MVC model graph - client side
	node // [label, node_data]
){
	this.graph.nodes[++this.node_id] = {
		"label"    : node[0]
		,"data"    : node[1]
		,"target"  : []          // array of edge id where node is target
		,"source"  : []          // array of edge id where node is source 
		,"date"    : new Date()  // date time node was create, can be used for cashe and refresh
	}

	return this.node_id;
}


node_source(node_id) {  // MVC model graph - client side
	return this.graph.node[node_id].source;
}


node_target(node_id) {  // MVC model graph - client side
	return this.graph.node[node_id].target;
}


edge_add(  // MVC model graph - client side
	edge //  [node_source, relation, node_target, {data}]
) {
	const node_source = edge[0];
	const relation    = edge[1];
	const node_target = edge[2];

	// create new edge
	this.graph.edges[++this.edge_id] = {
		 "node_source" : node_source  // node_id
		,"relation"    : relation     //
		,"node_target" : node_target  // node_id
		,"data"        : edge[3]  // place to store data for edge
	}

	// update edge index
	if (this.edge_index[relation] === undefined) {
		this.edge_index[relation] = {"edge_ids": []}
	} 
	this.edge_index[relation].edge_ids.push(this.edge_id);

	// update node source and target arrays
	this.graph.nodes[node_source].source.push(this.edge_id);
	this.graph.nodes[node_source].target.push(this.edge_id);

	return this.edge_id;
}


} // end sfc_nav_tree

