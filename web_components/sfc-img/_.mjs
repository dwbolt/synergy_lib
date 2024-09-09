export class sfc_img extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_dialog - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	
	if (this.innerHTML==="") {
		// show defaul img
		this.shadow.innerHTML =  `
		<div style="float:right;width:320px; height:200px;">
		Image not specified
		</div>
		   `
	} else {
		this.key  = this.innerHTML;  // used to access detailed info on pictures
		const obj = app.page_json["sfc-img"][this.key];


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


} // end sfc_img


customElements.define("sfc-img", sfc_img); 
