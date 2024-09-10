import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class sfc_disk extends HTMLElement { // sfc_login - client side


constructor() {  // sfc_disk - client side
	// constructor is called when the element is displayed
	super();
	
	this.url_root   = this.innerHTML;  // constant
	this.url        = this.innerHTML;  // will get longer as user navigates deeper into directory tree 
	this.level      = 0             ;  // start at root, increment as user navicates deeper 

	// add content to shadow dom
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.shadow.innerHTML = `<div id="url"></div><sfc-nav-tree></sfc-nav-tree>`
	this.tree             = this.shadow.querySelector("sfc-nav-tree");  // 
	this.div_url          = this.shadow.getElementById("url")        ;  //
	this.stat             = [] 
}


async main(
){
	// list root directory as given in the constructor

	// add code to force login

	// get list of users root directory
	const msg = `{
"server" : "web"
,"msg"   : "dir"
,"url"   : "${this.url}"
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
	let html="";
	for(let i=0; i<status.files.length; i++) {
		html += `<option value="${i}">${status.files[i][0]}</option>`;
	}
	element.innerHTML = html;
	element.addEventListener('click', this.click.bind(this));
	this.tree.element_add(element);

	// update url
	this.div_url.innerHTML = `${app.lib}${this.url}`;
	this.stat[this.level]  = status.files;              // remember disk info

}


click(
	//user clicked on file or folder
	event
){
	// find out if a directory or file was clicked on
	const i      = event.target.value;  
	const is_dir = this.stat[this.level][i][1];

	if (is_dir) {
		// display files in directory
		this.url +=`/${this.stat[this.level][i][0]}`;
		this.level++;
		this.main();
	} else {
		// display information about file

	}
}


} // end sfc_disk

const {sfc_nav_tree} = await import(`${app.lib}_lib/web_components/sfc-nav-tree/_.mjs` );


customElements.define("sfc-disk", sfc_disk); 
