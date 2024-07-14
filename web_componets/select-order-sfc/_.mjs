class select_order_class  extends HTMLElement { 

/*
input -  [
	[value,display,comment]
	....
]

user will have a list of choices on left, if they click on it moves to right,
they can order the selected choices on right.

*/


constructor( // select_order_class - client side
//	 DOMid       // where select_order widget will be displayed
//	,globalName  // is used in UX on onChange, onClick etc events to get back to this instace of the select_order
) {  
//	this.DOMid      = DOMid;     // remember where table will be displayed
//	this.globalName = globalName; // remember is used in UX on onChange, onClick etc events
	super();                                                         // call parent constructor
	this.shadow           = this.attachShadow({ mode: "closed" });   // create a shadow dom that has sepreate id scope from other main dom and other shadow doms
	this.clear_choices();
}


clear_choices(){  // select_order_class - client side
	// this.count   = 0;  // this.couices.length
	this.choices   = [];  // this  [[display,obj], [display], object], search on choices may narrow the options displayed
	this.selected  = [];  // aray of indexes that the user has selected
}


shadow_set(buttons) {  // select_order_class - client side
	//const dom = document.getElementById(this.DOMid);
	//if (!dom) return;  // do not like this code, refactor dwb 09/25/23

	this.shadow.innerHTML = `
	<div  style="display:flex;">
		<div>
		Choose<br>
		<!-- add narrow at some point-->
		<select id="choice" size="5"></select>
		</div>

		<div>
		selected<br>
		<select id="selected" size="5"></select>
		</div>

		<div>
		${buttons}
		</div>
	</div>`
}


connectedCallback() { // dialog_sfc_class - client side
    this.shadow.addEventListener('click', this.click.bind(this));
}


choice_add(  // select_order_class - client side
	display   // text displayed to choice
	,obj      //{"display"="??","comment"="??",order=number}  object associated with what is displayed
	){
	this.choices.push([display,obj]);             // store choice in object
}


choice_display( // select_order_class - client side
){
	const choices = this.shadow.getElementById(`choice`);
	if(!choices) {
		alert("error, element choice not found")
		return;
	}  // refactor

	let html = "";
	for(var i=0; i<this.choices.length; i++) {
		if ( this.selected.findIndex( val => val === i ) === -1 ) {
			html  += `<option value='${i.toString()}'>${this.choices[i][0]}</option>`
		}
	}
	choices.innerHTML = html;
}

click(event){
	switch (event.target.parentElement.id) {
	case "choice":
		// move to selected
		event.target.parentElement.value
		// remove from choice
		dom.remove(dom.selectedIndex);
		break;

	default:
		// move to choice
		break;
}
	

}

///////////      refactor methods below

move_to(   // select_order_class - client side
	 dom // selected clicked on
	,move_to //
){
	const value = dom.value;

	// remove from clicked on
	dom.remove(dom.selectedIndex);

	// add to bottom of move_to
	const move = document.getElementById(`${this.DOMid}${move_to}`);
	const option   = document.createElement("option");
    option.text  = this.choices[value].text;
	option.value = value;
	move.add(option);
}


get_DOM_choice(   // select_order_class - client side
){
	// return DOM element that 
	return document.getElementById("${this.DOMid}_choice");
}


display( // select_order_class - client side
){
	const html = "select_order_class";

	document.getElementById(this.DOMid).innerHTML = html;
}


selected(  //  select_order_class - client side
	// return array of selected vaules
) {
	const ret = [];
	const options = document.getElementById(`${this.DOMid}_selected`).options;
	for(var i=0; i<options.length; i++){
		ret.push(options[i].value);
	}

	return ret;
}



} // select_order_class

export { select_order_class };
customElements.define("select-order-sfc", select_order_class);   // attach hello_world_class to  "hello-world" web-component