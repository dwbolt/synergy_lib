import  {proxy     } from '/_lib/proxy/_.mjs'  ;


export class sfc_dialog extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_dialog - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	this.shadow.innerHTML =  `
   <link href="${new URL(import.meta.url).origin}/_lib/web_components/sfc-dialog/_.css" rel="stylesheet">
   <dialog id="dialog">
   <div id="title"></div><br>
   <hr>
   <div id="body"></div>
   <hr>
   <div id="buttons"> <button id="close">Close</button></button> </div>
   </dialog>            
   `
	this.dialog = this.shadow.getElementById('dialog');
	this.shadow.getElementById('close').addEventListener('click', this.close.bind(this));
}


connectedCallback() { // sfc_dialog - client side
	// create a shadow dom                           
}


set(id,html){
	if (id==="buttons") {
		this.shadow.getElementById("buttons").innerHTML = html + ` <button id="close">Close</button>`;
		this.shadow.getElementById('close').addEventListener('click', this.close.bind(this));
	} else {
		const element = this.shadow.getElementById(id);
		if (element === null) {
			this.show_error(`element is null`);
		} else {
			element.innerHTML = html;
		}

	}
}


addEventListener(// sfc_dialog- client side
	 id        // dom id
	,event     // event name we want to capture, 'click'  or 'keyup' etc
	,fun       // funtion to execute 
){
	const element = this.shadow.getElementById(id);
	if (element === null) {
		this.show_error(`this.shadow.getElementById(${id}) is null`);
	} else {
		this.shadow.getElementById(id).addEventListener(event, fun);
	}
}


show() {      // sfc_dialog- client side
	this.dialog.className = "";      // we do not want it to popup
	this.dialog.show();
}


show_modal() { // sfc_dialog- client side
	this.dialog.className = "popup";      // we do not want it to popup
	this.close();       // close dialog if open
	this.dialog.showModal();
}


close(){ // sfc_dialog- client side
	this.dialog.close();
}


async show_error(error_msg_client){
	let stack = new Error().stack;  // replace all newlines with <br> so it will display as html

	const msg_client = `client msg: ${error_msg_client} <br><br>${stack.replaceAll("\n","<br>")}`;	

	// show user error message
	this.set("title","<h2>Client Side Error</h2>");
	this.set("body",`Will try to save the following error message on the server<br>${msg_client}`);
	this.show_modal();
	debugger;

	// save client error on server
	const msg = {
		"server"      : "web"
		,"msg"        : "client_error"
		,"msg_client" : msg_client
		}

	const serverResp = await proxy.postJSON(JSON.stringify(msg));    // wait for server to log client error
	if (!msg.ok) {
		app.sfc_dialog.show_error("saving error to server failed")
	}
}

} // end sfc_dialog


customElements.define("sfc-dialog", sfc_dialog); // tie class to custom web component
