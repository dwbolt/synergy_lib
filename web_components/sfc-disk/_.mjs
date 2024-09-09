
export class sfc_disk extends HTMLElement { // sfc_login - client side


constructor() {  // sfc_disk - client side
	// constructor is called when the element is displayed
	super();  
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	this.shadow.innerHTML =  `
<sfc-nav-tree></sfc-nav-tree>
   `
}


} // end sfc_disk

const {sfc_nav_tree} = await import(`${app.lib}_lib/web-components/sfc-disk/_.mjs` );

customElements.define("sfc-disk", sfc_disk); 
