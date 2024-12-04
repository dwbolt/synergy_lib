export class viewer_graph extends HTMLElement { // <sfc-graph-v>  web component

/*
[all nodes]

[selected source node] [source relations] [selected node]
*/


constructor() {  // sfc_graph - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.init();
}


async init(){  // sfc_nav_tree- client side
	this.shadow.innerHTML = `
<sfc-graph-nodes-v>list nodes to click on</sfc-graph-nodes-v>
<div style="display:flex; flex-direction: row;">

<sfc-graph-node-v id="left"  > left   </sfc-graph-node-v>
<sfc-graph-node-v id="center"> center </sfc-graph-node-v>
<sfc-graph-node-v id="right" > right  </sfc-graph-node-v>

</div>
`
	this.container        = this.shadow.querySelector("div");
	// made sure 
	await  app.web_components.check(this.shadow);
}


html_add(  // sfc_nav_tree- client side
	html    // html for menu
	){
	const newMenue     = document.createElement('div');
	newMenue.innerHTML = html;
	newMenue.style     = this.style_select
	this.container.appendChild(newMenue);
}


element_add(  // sfc_nav_tree- client side
	element    // dom element contianing  menu
	){
	const newMenue     = document.createElement('div');
	newMenue.style     = this.style_select
	newMenue.appendChild(element);  // put menu element in box

	this.container.appendChild(newMenue);  // add box to menu
}
  
  
delete_to(  // menuClass- client side
	event //
	) {
	// keep goint up the element chain utile this.container is found
	let element = event.target;                 // what the user clicked on <option>
	let parent  = event.target.parentElement;   // parent of clicked on
	while(parent != this.container) {
		element = parent;
		parent  = parent.parentElement;
	}
	
	// delete everthing to the right of what was clicked on
	const index  = Array.prototype.indexOf.call(parent.children, element);
	while ( index + 1 < this.container.childElementCount ) {
		this.container.removeChild(this.container.lastElementChild);
	}
	return index;
}


} // end sfc_nav_tree


customElements.define("sfc-graph-v", viewer_graph); // tie class to custom web component
