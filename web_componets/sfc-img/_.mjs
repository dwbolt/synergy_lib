class sfc_img extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_dialog - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	this.setAttribute("display","inline-block")
	this.shadow.innerHTML =  `
<div style="float:right;width:320px; height:200px;">
<img style="object-fit:contain; width:320px; height:200px;" src="/synergyData/visit/map.jpg">
</div>
   `

/**
 
<div id="pic_main_0" style="float:right;width:320px; height:200px;">
<img style="object-fit:contain; width:320px; height:200px;" src="/synergyData/visit/map.jpg">
</div>

 */

  //  this.shadow.getElementById('close').addEventListener('click', this.close.bind(this));
//	this.dialog = this.shadow.getElementById('dialog');
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

text_set(text){    // sfc_dialog- client side
	// not sure I like this, need to add html editor, and get rid of this, could just fource people to use raw html for now.
	this.body_set(text.replaceAll("\n","<br/>")); // convet /n to <br>,  this does not handle all cases
}



show() {      // sfc_dialog- client side
	this.dialog.className = "";      // we do not want it to popup
	this.shadow.getElementById("dialog").show();
}


showModal() { // sfc_dialog- client side
	this.dialog.className = "popup";      // we do not want it to popup
	this.close();       // close dialog if open
	this.shadow.getElementById("dialog").showModal();
}


close(){ // sfc_dialog- client side
	this.shadow.getElementById("dialog").close();
}


} // end sfc_img


export { sfc_img };
customElements.define("sfc-img", sfc_img); 
