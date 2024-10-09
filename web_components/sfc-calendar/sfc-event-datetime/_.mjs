const {table_class        } = await app.load("db/table_module.js");

export class sfc_event_datetime extends HTMLElement { // sfc_html - client side
/*
<sfc-event-datetime>pk</sfc-event-datetime>


*/


constructor() {  // sfc-event-datetime - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.pk = this.getAttribute("data-pk"); // event we are display

	this.table_events = new table_class(); 

	this.shadow.innerHTML = this.pk;  
}


async connectedCallback() { // 
	await this.table_events.load(this.table_urls[0]);   // for now just support one calendar
}


} // end sfc-event-datetime


customElements.define("sfc-event-datetime", sfc_event_datetime); 
