class dialog_sfc_class extends HTMLElement { // dialog_class - client side

constructor() {  // dialog_sfc_class - client side
	// constructor is called when the element is displayed
	super();

	// create a shadow dom                           
	this.shadow = this.attachShadow({ mode: "closed" });  
 	// add content to shadow dom
	this.shadow.innerHTML =  `
<link href="/_lib/web_componets/dialog-sfc/_.css" rel="stylesheet">
<dialog id="dialog" class="popup">
<div id="title"></div><br>
<div id="body"></div>
<div id="buttons"><button id="close">Close</button></div>
</dialog>            
`
}


connectedCallback() { // dialog_sfc_class - client side
    this.shadow.getElementById('close').addEventListener('click', this.close.bind(this));
  }

/*
handleClick() { // dialog_sfc_class - client side
alert('Button clicked!');
}


myMethod() { // dialog_sfc_class - client side
alert('My method called!');
}
*/

title_set( html){ // dialog_sfc_class- client side
	this.shadow.getElementById("title").innerHTML = html;
}


body_set(html){    // dialog_sfc_class- client side
	this.shadow.getElementById("body").innerHTML = html;
}

text_set(text){    // dialog_sfc_class- client side
	// not sure I like this, need to add html editor, and get rid of this, could just fource people to use raw html for now.
	this.body_set(text.replaceAll("\n","<br/>")); // convet /n to <br>
}

buttons_set(html){  // dialog_sfc_class- client side
	this.shadow.getElementById("buttons").innerHTML = html;
}


show() {      // dialog_sfc_class- client side
	this.shadow.getElementById("dialog").show();
}


showModal() { // dialog_sfc_class- client side
	this.shadow.getElementById("dialog").close();
	this.shadow.getElementById("dialog").showModal();
}


close(){ // dialog_sfc_class- client side
	this.shadow.getElementById("dialog").close();
}


} // end dialog_sfc_class


export { dialog_sfc_class };
customElements.define("dialog-sfc", dialog_sfc_class); 
