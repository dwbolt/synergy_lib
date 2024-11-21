import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class sfc_disk extends HTMLElement { // sfc_disk - client side

/*

Browser user data as default
 
 */

constructor() {  // sfc_disk - client side
	// constructor is called when the element is displayed
	super();
	
	this.level      = 0             ; // start at root, increment as user navicates deeper 
	this.stat       = []            ; // store directory info for each level
	this.elements   = []            ; // place to store what the user has clicked on;

	// add content to shadow dom
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.shadow.innerHTML = `
	<div id="root"></div>
	<div id="url"></div>
	<button>copy url to clipboard</button>
	<sfc-nav-tree></sfc-nav-tree>
	<input id="file_name" type=“text” size="25">
		<button onclick="app.page.folder_new()">New Folder</button>
		<button>Save</button>
		<button>Cancel</button><br>
	<textarea id="display-edit"></textarea><br>
	
	` 
	this.tree             = this.shadow.querySelector( "sfc-nav-tree");  // direct acess to sfc-nav-tree
	this.div_url          = this.shadow.getElementById("url"         );  // let user know the path that has been clicked on so far
	this.textarea         = this.shadow.querySelector( "textarea"    );  //      

	const button         = this.shadow.querySelector( "button"    );
	button.addEventListener('click',this.url2clipboard.bind(this));
}


async folder_new(){// sfc_disk - client side
	const folder_name = this.shadow.getElementById("file_name").value.trim();  // get ride of leading and trailing white space
	if (folder_name==="") {
		alert("Input folder name to create");
		return;
	}

	// create folder
	
}


async url2clipboard() {  // sfc_disk - client side
	let url;
	const a = this.div_url.querySelector("a");               // should only be one <a>
	await navigator.clipboard.writeText(a.href);  // copy url to clipboard
}


async main(
	url = null
){
	// list root directory as given in the constructor

	// add code to force login

	// create file path
	if (url === null) {
		this.path      = this.path_root ; // init this.path
	} else {
		this.path      = url                                              ; // init this.path
		this.path_root = url                                              ; // remember root path
		this.shadow.getElementById("root").innerHTML = `root url: ${url}` ; // show root to user
	}

	for (let i=0; i<this.tree.container.childElementCount; i++) {
		this.path += `/${this.stat[i][this.elements[i].value][0]}`;
	}

	// get list of users directory
	const msg = {
		"server" : "web"
		,"msg"   : "dir"
		,"url"   : this.path
	}

	// process server responce
	const status = await proxy.postJSON(JSON.stringify(msg));  // {msg: true, files:[[file_name, stat]]
	// stat.isDirectory, stat.isSymbolicLink()
	if (!status.msg) {
		alert("error");
		return;
	}

	// add directory details
	let element  = document.createElement('select');
	element.size   = "10";

	let html="";
	for(let i=0; i<status.files.length; i++) {
		html += `<option value="${i}">${status.files[i][0]}</option>`;
	}
	element.innerHTML = html;
	this.elements[this.tree.container.childElementCount] = element;   // remember elements

	element.addEventListener('click', this.click.bind(this));        // add click eventlistener
	this.tree.element_add(element);                                  // append element 

	// show path to selected folder - url take you to new browser at that locaion
	this.div_url.innerHTML = `url: <a href="/_lib/web_components/sfc-disk/_.html?url=${this.path}" target="_blank">${this.path}</a>`;
	this.stat[this.level]  = status.files;              // remember disk info

}


async click(
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
		// display information about file to the right
		const stat = this.stat[this.level][i];
		this.level++;
		this.tree.delete_to(event);
		let html = "";
		const keys=Object.keys(stat[2]);
		for (let i=0; i<keys.length; i++){
			html += `${keys[i]}: ${stat[2][keys[i]]}<br>`
		}
		this.tree.html_add(html); // show detail of item clicked on

		// update url
		const url = `${new URL(import.meta.url).origin}${this.path}/${stat[0]}`
		this.div_url.innerHTML = `url: <a href="${url}" target="_blank">${url}</a>`;  // show path to selected file or folder

		// if ascii, display it
		const file_name = stat[0].split(".")            
		const file_ext = file_name[file_name.length-1];
		if (" txt json nsj html ".includes(file_ext)) {
			// display & allow edit ascii files - of txt, json, nsj, 
			const msg = await proxy.RESTget(url);
			if (msg.ok) {
				// file was fetched, so display it
				this.shadow.getElementById("file_name"   ).value     = stat[0];
				this.shadow.getElementById("display-edit").innerHTML = msg.value;
			}
		}


		//document.getElementById("edit").addEventListener('click',this.edit);
	}
}


} // end sfc_disk

const {sfc_nav_tree} = await import(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-nav-tree/_.mjs` );


customElements.define("sfc-disk", sfc_disk); // tie class to custom web component
