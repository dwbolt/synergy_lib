/*

https://www.youtube.com/watch?v=TAB_v6yBXIE

*/

class dialog_class { // dialog_class - client side

constructor(dom_id) {  // dialog_class - client side
	this.dom_id          = dom_id;             
	this.dom_id_title    = dom_id+ "_title"  ; // modal_header
	this.dom_id_body     = dom_id+ "_body"    ;
	this.dom_id_buttons  = dom_id+ "_buttons" ;

	document.getElementById(this.dom_id).innerHTML = `
<div id="${this.dom_id}_title"></div><br>
<div id="${this.dom_id}_body"></div><br>
<div id="${this.dom_id}_buttons"></div>
`
}


title_set( html){ //dialog_class - client side
	document.getElementById(this.dom_id_title).innerHTML = html;
}


body_set(html){ //dialog_class - client side
	document.getElementById(this.dom_id_body).innerHTML = html;
}


buttons_set(html){  //dialog_class - client side
	document.getElementById(this.dom_id_buttons).innerHTML = html;
}


show() { //dialog_class - client side
	document.getElementById(this.dom_id).show();
}


showModal() { //dialog_class - client side
	document.getElementById(this.dom_id).showModal();
}


close(){ //dialog_class - client side
	document.getElementById(this.dom_id).close();
}


} // end appClass


export { dialog_class };
