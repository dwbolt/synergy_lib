import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class sfc_disk extends HTMLElement { // sfc_login - client side


constructor() {  // sfc_disk - client side
	// constructor is called when the element is displayed
	super();
	
	this.level      = 0             ; // start at root, increment as user navicates deeper 
	this.stat       = []            ; // store directory info for each level
	this.elements   = []            ; // place to store what the user has clicked on;

	// add content to shadow dom
	this.shadow = this.attachShadow({ mode: "closed" });  
	this.shadow.innerHTML = `<div id="url"></div> <button>copy url to clipboard</button> <sfc-nav-tree></sfc-nav-tree> <textarea>xxx</textarea>` 
	this.tree             = this.shadow.querySelector( "sfc-nav-tree");  // direct acess to sfc-nav-tree
	this.div_url          = this.shadow.getElementById("url"         );  // let user know the path that has been clicked on so far
	this.textarea         = this.shadow.querySelector( "textarea"    );  //      

	const button         = this.shadow.querySelector( "button"    );
	button.addEventListener('click',this.url2clipboard.bind(this));
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
		this.path      = url            ; // init this.path
		this.path_root = url            ; // remember root path
	}

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

	// show path to selected folder - url take you to new browser at that locaion
	this.div_url.innerHTML = `<a href="/_lib/web_components/sfc-disk/_.html?url=${this.path}" target="_blank">${this.path}</a>`;
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
		// display information about file to the right
		const stat = this.stat[this.level][i];
		this.level++;
		this.tree.delete_to(event);
		let html = "";
		const keys=Object.keys(stat[2]);
		for (let i=0; i<keys.length; i++){
			html += `${keys[i]}: ${stat[2][keys[i]]}<br>`
		}
		this.tree.html_add(html);

		// update url
		const url = `${app.lib}${this.path}/${stat[0]}`
		this.div_url.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;  // show path to selected file or folder
	}
}


} // end sfc_disk

const {sfc_nav_tree} = await import(`${app.lib}/_lib/web_components/sfc-nav-tree/_.mjs` );


customElements.define("sfc-disk", sfc_disk); 