import  {proxy     } from '/_lib/proxy/_.mjs'  ;


export class sfc_dialog extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_dialog - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	this.shadow.innerHTML =  `
   <link href="/_lib/web_componets/sfc-dialog/_.css" rel="stylesheet">
   <dialog id="dialog">
   <div id="title"></div><br>
   <hr>
   <div id="body"></div>
   <hr>
   <div id="buttons"><button id="close">Close</button></div>
   </dialog>            
   `

    this.shadow.getElementById('close').addEventListener('click', this.close.bind(this));
	this.dialog = this.shadow.getElementById('dialog');
}


connectedCallback() { // sfc_dialog - client side
	// create a shadow dom                           
}


title_set( html){ // sfc_dialog- client side
	this.shadow.getElementById("title").innerHTML = html;
}


body_set(html){    // sfc_dialog- client side
	this.shadow.getElementById("body").innerHTML = html;
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
	const msg_client = ` 
	client msg: ${error_msg_client} <br>
	<br>
	${new Error().stack}
	`;	

	// show user error message
	this.title_set("<h2>Client Side Error</h2>");
	this.body_set(`Will try to save the following error message on the server<br>${msg_client}`);
	this.show_modal();

	// save client error on server
	const msg = {
		"server"      : "web"
		,"msg"        : "client_error"
		,"msg_client" : msg_client
		}

	const serverResp = await proxy.postJSON(JSON.stringify(msg));
	if (!msg.ok) {
		alert("save of error was not successfull")
	}
}

} // end sfc_dialog


customElements.define("sfc-dialog", sfc_dialog); 
