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
	this.node_id = 0;
	this.edge_id =0;

	this.graph = {
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
		,"souces"  : []          // array of edges where this node is the source  
		,"target"  : []          // array of eges where this node is a target
		,"date"    : new Date()  // date time node was create, can be used for cashe and refresh
	}

	return this.node_id;
}


node_chidren(node_id) {
	return this.graph.node[node_id].children;
}


node_parents(node_id) {
	return this.graph.node[node_id].parents;
}


edge_add(  // MVC model graph - client side
	edge //  [node_parent, relation ,direction, node_child, label, {data}]
) {
	this.graph.edges[++this.edge_id] = {
		 "node_source": edge[0]
		,"relation"   : edge[1]
		,"direction"  : edge[2]  // >  directional, eg parent child   |  = not directional eg partner
		,"node_targe" : edge[3]
		,"label"      : edge[4]
		,"data"       : edge[5]
	}

	return this.edge_id;
}


} // end sfc_nav_tree

