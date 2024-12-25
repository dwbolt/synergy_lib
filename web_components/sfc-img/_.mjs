export class sfc_img extends HTMLElement { // dialog_class - client side

constructor() {  // sfc_dialog - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
	// add content to shadow dom
	
	if (this.innerHTML==="") {
		// let user know that an image was specifted
		this.shadow.innerHTML =  `
		<div style="float:right;width:320px; height:200px;">
		Image not specified
		</div>
		   `
	} else {
		this.key     = this.innerHTML;  // used to access detailed info on pictures
		this.obj     = app.page_json["sfc-img"][this.key];
		this.picture = 0;
		this.image_set();
		this.shadow.addEventListener('click', this.event_click.bind(this));
	}
}


image_set() {
	let buttons;
	if (this.obj.length === 1) {
		// only one picture, no need for next previous buttons;
		buttons = ""
	} else {
		buttons = `<button> < </button> ${this.picture+1}/${this.obj.length} <button> > </button>`;
	}
	
	let url  = import.meta.url;   // chage it to url for css
	url = url.slice(0, url.length-3) + "css"
	
	this.shadow.innerHTML =  `
	<link rel="stylesheet" href="${url}" />
	<div>
	<img id="img" src="${this.obj[this.picture][0]}"><br/>
	       ${this.obj[this.picture][1]} ${buttons}
	</div>`
	

}


event_click(event) { // sfc_dialog - client side
	// process next, prev button
	const button = event.target.innerText.toLowerCase();
	switch (button) {
		case ">":
			this.picture++;                            // goto next picture
			if (this.obj.length <= this.picture) {
				// index too big so wrap
				this.picture = 0;
			}
			this.image_set();
			break;
	
		case "<":
			this.picture--;                            // goto next picture
			if (this.picture<0) {
				// index too small so wrap to last picture
				this.picture = this.obj.length -1;
			}
			this.image_set();
			break;

		default:
			break;
	}       
}


} // end sfc_img


customElements.define("sfc-img", sfc_img); // tie class to custom web component
