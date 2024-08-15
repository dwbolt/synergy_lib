import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'  ;

export class sfc_html extends HTMLElement { // sfc_html - client side

constructor() {  // sfc_html - client side
	// constructor is called when the element is displayed
	super();
	this.id = this.getAttribute("id"); // we will load
	this.proxy = new proxyClass();
}


async connectedCallback() { // sfc_html - client side
	// create a shadow dom   
	const msg = await this.proxy.RESTget(`${this.id}.html`)

	// add content sfc_html
	if (msg.ok) {
		this.innerHTML = msg.value;
	} else {
		// error
	}                       
}


} // end sfc_html


customElements.define("sfc-html", sfc_html); 
