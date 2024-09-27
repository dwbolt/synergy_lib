import  {proxy     }   from '/_lib/proxy/_.mjs'  ;

export class sfc_event_datetime extends HTMLElement { // sfc_html - client side
/*
<sfc-event-datetime>pk</sfc-event-datetime>


*/


constructor() {  // sfc-event-datetime - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.pk = this.getAttribute("data-pk"); // event we are display
	this.shadow.innerHTML = this.pk;  
}

/*
async connectedCallback() { // 
}
*/

} // end sfc-event-datetime


customElements.define("sfc-event-datetime", sfc_event_datetime); 
