class select_order_class { 

/*
input -  [
	[value,display,comment]
	....
]

user will have a list of choices on left, if they click on it moves to right,
they can order the selected choices on right.

*/


constructor( // select_order_class - client side
	 DOMid       // where select_order widget will be displayed
	,globalName  // is used in UX on onChange, onClick etc events to get back to this instace of the select_order
) {  
	this.DOMid      = DOMid;     // remember where table will be displayed
	this.globalName = globalName; // remember is used in UX on onChange, onClick etc events
	this.clear_choices();
}


clear_choices(){  // select_order_class - client side
	this.count   = 0;
	this.choices = {}
	this.order   = [];  // display order of choices by value
}


set_template(buttons) {  // select_order_class - client side
	const dom = document.getElementById(this.DOMid);
	if (!dom) return;  // do not like this code, refactor dwb 09/25/23

	dom.innerHTML = `
	<table>
	<tr>
	<td>
	Choose<br>
	<select id="${this.DOMid}_choice" onclick="${this.globalName}.move_to(this,'_selected')"  size="5">

	</select>
	</td>

	<td>
	selected<br>
	<select id="${this.DOMid}_selected" onclick="${this.globalName}.move_to(this,'_choice')" size="5">
	</select>
	</td>

	<td>
	${buttons}
	</td>
	</tr>
	</table>
	`
}


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


add_choice(  // select_order_class - client side
	value    // value returned when selected
	,obj     //{"display"="??","comment"="??",order=number}
	){
	this.choices[value] = obj;             // store choice in object
	obj.order           = this.count++;    // remember order choice was added
	this.order.push(value);                // add choice to list, will be displayed
}


add_choices( // select_order_class - client side
){
	const choices = document.getElementById(`${this.DOMid}_choice`);
	if(!choices) {return;}  // refactor

	let html = "";
	for(var i=0; i<this.count; i++) {
		let value = this.order[i]
		html  += `<option value='${value}'>${this.choices[value].text}</option>`
	}
	choices.innerHTML = html;
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
