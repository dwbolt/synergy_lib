import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class sfc_disk extends HTMLElement { // sfc_login - client side


constructor() {  // sfc_disk - client side
	// constructor is called when the element is displayed
	super();
	
	this.url_root   = this.innerHTML; // constant, get starting directory
	this.level      = 0             ; // start at root, increment as user navicates deeper 
	this.stat       = []            ; // store directory info for each level
	this.elements   = []            ; // place to store what the user has clicked on;

	// add content to shadow dom
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.shadow.innerHTML = `<div id="url"></div><sfc-nav-tree></sfc-nav-tree>`
	this.tree             = this.shadow.querySelector("sfc-nav-tree");  // direct acess to sfc-nav-tree
	this.div_url          = this.shadow.getElementById("url")        ;  // let user know the path that has been clicked on so far
}


async main(
){
	// list root directory as given in the constructor

	// add code to force login

	// create file path
	this.path = this.url_root;

	for (let i=0; i<this.tree.container.childElementCount; i++) {
		this.path += `/${this.stat[i][this.elements[i].value][0]}`;
	}

	// get list of users directory
	const msg = `{
"server" : "web"
,"msg"   : "dir"
,"url"   : "${this.path}"
	}`

	// process server responce
	const status = await proxy.postJSON(msg);  // {msg: true, files:[[file_name, stat]]
	// stat.isDirectory, stat.isSymbolicLink()
	if (!status.msg) {
		alert("error");
		return;
	}

	// add directory details
	let element  = document.createElement('select');
	element.size  = "10";
	element.style = "resize: both;"
	let html="";
	for(let i=0; i<status.files.length; i++) {
		html += `<option value="${i}">${status.files[i][0]}</option>`;
	}
	element.innerHTML = html;
	this.elements[this.tree.container.childElementCount] = element;   // remember elements

	element.addEventListener('click', this.click.bind(this));        // add click eventlistener
	this.tree.element_add(element);                                  // append element 

	// update url
	this.div_url.innerHTML = `${app.lib}${this.path}`;  // show path to selected file or folder
	this.stat[this.level]  = status.files;              // remember disk info

}


click(
	//user clicked on file or folder
	event  
){
	// find out if a directory or file was clicked on
	this.level             = this.tree.delete_to(event) ; // clear every thing to the right of where user clicked
	const i                = event.target.value         ; // index of <option> clicked on

	const is_dir = this.stat[this.level][i][1]; // true -> clicked on is a directory
	if (is_dir) {
		// display files in directory
		this.level++;
		this.main();
	} else {
		// display information about file
		const stat = this.stat[this.level][i];
		this.level++;
		this.tree.delete_to(event);
		let html = "";
		const keys=Object.keys(stat[2]);
		for (let i=0; i<keys.length; i++){
			html += `${keys[i]}: ${stat[2][keys[i]]}<br>`
		}
		this.tree.html_add(html);
	}
}


} // end sfc_disk

const {sfc_nav_tree} = await import(`${app.lib}_lib/web_components/sfc-nav-tree/_.mjs` );


customElements.define("sfc-disk", sfc_disk); 
