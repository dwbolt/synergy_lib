export class graph { // web component

/*
tree structure - implement with graph

{
meta: {
node_root: 1
}

edges:{
id1: [n1,direction,n2,relation_name,data]        direction ->     <,>,=
,id2: []
}

,nodes: {
id1: {
"name": ""
"data" : ""
}

,id2: {
}

}

}
*/


constructor() {  // sfc_nav_tree - client side
	// constructor is called when the element is displayed
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


customElements.define("sfc-nav-tree", sfc_nav_tree); // tie class to custom web component
