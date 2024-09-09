import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class sfc_disk extends HTMLElement { // sfc_login - client side


constructor() {  // sfc_disk - client side
	// constructor is called when the element is displayed
	super();
	
	this.url = this.innerHTML;
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	this.shadow.innerHTML =                          `<sfc-nav-tree></sfc-nav-tree>`
	this.tree             = this.shadow.querySelector("sfc-nav-tree");
}


async main(
){
	// force login

	// get list of users root directory
	const msg = `{
"server" : "web"
,"msg"   : "dir"
,"url"   : "${this.url}"
	}`

	// process server responce
	const status = await proxy.postJSON(msg);
	if (!status.msg) {
		alert("error");
		return;
	}

	let element  = document.createElement('select');
	element.size  = "10";
	let html="";
	for(let i=0; i<status.files.length; i++) {
		html += `<option value="${i}">${status.files[i][0]}</option>`;
	}
	element.innerHTML = html;
	element.addEventListener('click', this.click.bind(this));
	this.tree.element_add(element);
}

click(
	//user clicked on file or folder
	event
){


}


} // end sfc_disk

const {sfc_nav_tree} = await import(`${app.lib}_lib/web_components/sfc-nav-tree/_.mjs` );


customElements.define("sfc-disk", sfc_disk); 
