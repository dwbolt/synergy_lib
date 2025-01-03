import  {proxy     }   from '/_lib/proxy/_.mjs'  ;

export class sfc_html extends HTMLElement { // sfc_html - client side

constructor() {  // sfc_html - client side
	// constructor is called when the element is displayed
	super();
	//this.id   = this.getAttribute("id"); // we will load
	this.href = this.getAttribute("href");

	if (!(this.href === null)) {
		proxy.RESTget(this.href)
	  .then((msg) => {
		if (msg.ok) {
			this.innerHTML = msg.value;
		} else {
			this.innerHTML = `error, load faild - sfc_htm -  href="${this.href}"`;
		}          
	  })
	  .catch((error) => {
		console.error("Error fetching data:", error);
	  });
  } else {
	// error
	this.innerHTML = `error - sfc_htm  href="${this.href}"`;
	return;
  }
}

} // end sfc_html


customElements.define("sfc-html", sfc_html); // tie class to custom web component
