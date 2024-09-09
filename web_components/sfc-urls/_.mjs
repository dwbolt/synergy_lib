export class sfc_urls extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_urls - client side
	// constructor is called when the element is displayed
	super();
	let html ="";

	// add content to shadow dom
	if (this.innerHTML==="") {
		this.innerHTML =  `<a href="javascript:void(0)">Link not defined</a`
	} else {
		this.key = this.innerHTML;  // used to access detailed info on pictures
		const obj = app.page_json["sfc-urls"][this.key];

		/*  load style sheet
		let url  = import.meta.url;   // chage it to url for css
		url = url.slice(0, url.length-3) + "css"
		<link rel="stylesheet" href="${url}" />
*/

		for (let i=0; i< obj.length; i++) {
			html += obj[i] + " &nbsp "
		}
		this.innerHTML = html;
	}
}


connectedCallback() { // sfc_dialog - client side
	// create a shadow dom                           
}



} // end sfc_urls


customElements.define("sfc-urls", sfc_urls); 
