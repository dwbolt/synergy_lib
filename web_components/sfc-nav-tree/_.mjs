export class sfc_nav_tree extends HTMLElement { // <sfc-nav-tree>  web component

/*
similar to a column view of a file system
*/


constructor() {  // sfc_nav_tree - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.init();
}


connectedCallback() { // sfc_nav_tree - client side
	// create a shadow dom                           
}


init(){  // sfc_nav_tree- client side
	this.shadow.innerHTML = `<div style="display:flex"> </div>`
	this.container        = this.shadow.querySelector("div");
  }


html_add(  // sfc_nav_tree- client side
	html    // html for menu
	){
	const newMenue     = document.createElement('div');
	newMenue.innerHTML = html;
	newMenue.style     = "border-style: solid; margin:5px 5px 5px 5px; padding:5px 5px 5px 5px;";
	this.container.appendChild(newMenue);
  }


  element_add(  // sfc_nav_tree- client side
	element    // dom element contianing  menu
	){
	const newMenue     = document.createElement('div');
	newMenue.style     = "border-style: solid; margin:5px 5px 5px 5px; padding:5px 5px 5px 5px;";
	newMenue.appendChild(element);  // put menu element in box

	this.container.appendChild(newMenue);  // add box to menu
  }
  
  
  delete_to(  // menuClass- client side
	index //
	) {
  
	while ( index < this.container.childElementCount ) {
		this.container.removeChild(e.lastElementChild);
	}
  }


} // end sfc_nav_tree


customElements.define("sfc-nav-tree", sfc_nav_tree); 
