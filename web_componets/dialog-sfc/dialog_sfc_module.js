/*

https://www.youtube.com/watch?v=TAB_v6yBXIE

*/

class dialog_sfc_class extends HTMLElement { // dialog_class - client side

constructor() {  // dialog_sfc_class - client side
	// constructor is called when the element is displayed
	super();

	// create a shadow dom                           
	this.shadow = this.attachShadow({ mode: "closed" });  
 	// add content to shadow dom
	this.shadow.innerHTML =  `
<link href="dialog_sfc.css" rel="stylesheet">
<dialog id="dialog" class="popup" open>
<div id="title"></div><br>
<div id="body"></div><br>
<div id="buttons"><button id="myButton">Click me</button></div>
<dialog>            
`
}

/*
connectedCallback() { // dialog_sfc_class - client side
    this.shadow.getElementById('myButton').addEventListener('click', this.handleClick.bind(this));
  }

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
