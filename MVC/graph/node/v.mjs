export class viewer_graph_node extends HTMLElement { // <sfc-graph-node-v>  web component

/*
[all nodes]

[selected source node] [source relations] [selected node]
*/


constructor() {  // sfc_graph_node - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.init();
}


init(){  // sfc_nav_tree- client side
	this.shadow.innerHTML = `${this.innerHTML } <b>flesh out viewer_graph_node</b> `
	this.innerHTML =" "; // get rid of oringinal html
}




} // end sfc_nav_tree


customElements.define("sfc-graph-node-v", viewer_graph_node); // tie class to custom web component
