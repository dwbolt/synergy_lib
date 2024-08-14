export class sfc_img extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_dialog - client side
	// constructor is called when the element is displayed
	super();
	this.json = app.page_json_get();
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	if (this.innerHTML==="") {
		// show defaul img
		/*
		this.shadow.innerHTML =  `
		<div style="float:right;width:320px; height:200px;">
		<img style="object-fit:contain; width:320px; height:200px;" src="${this.json["sfc-img"][this.key][0][0]}>
		</div>
		   `*/
	} else {
		this.key = this.innerHTML;  // used to access detailed info on pictures
		const obj = this.json["sfc-img"][this.key];


		let next,previous;
		if (obj.length === 1) {
			// only one picture, no need for next previous buttons;
			next     = "";
			previous = "";
		} else {
			next     = "<button>Next</button>";
			previous = "<button>Previous</button>";
		}

		let url  = import.meta.url;   // chage it to url for css
		url = url.slice(0, url.length-3) + "css"

		this.shadow.innerHTML =  `
		<link rel="stylesheet" href="${url}" />
		<div>
		<img id="img" src="${obj[0][0]}"><br/>
		${previous} ${obj[0][1]} ${next}
		</div>`
	}

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


customElements.define("sfc-img", sfc_img); 
