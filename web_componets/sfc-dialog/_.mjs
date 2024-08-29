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


} // end sfc_dialog


customElements.define("sfc-dialog", sfc_dialog); 
