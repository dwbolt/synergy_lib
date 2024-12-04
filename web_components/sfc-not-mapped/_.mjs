export class sfc_not_mapped extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_urls - client side
	// constructor is called when the element is displayed
	super();
	this.innerHTML += `<br>Is not mapped ${this.nodeName.toLowerCase()}, add to web_components.mjs<br>`
}


} // end sfc_urls
