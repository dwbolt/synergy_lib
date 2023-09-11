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
	this.set_template();
}


clear_choices(){  // select_order_class - client side
	this.count   = 0;
	this.choices = {}
	this.order   = [];  // display order of choices by value
}


set_template() {  // select_order_class - client side
	document.getElementById(this.DOMid).innerHTML = `
	<table>
	<tr>
	<td>
	Choose<br>
	<select id="${this.DOMid}_choice" onclick="${this.globalName}.choose(this)"  size="5">

	</select>
	</td>

	<td>
	selected<br>
	<select id="${this.DOMid}_selected" onclick="${this.globalName}.move_to_selected(this)" size="5">
	</select>
	</td>

	<td>
	<input type="button" value="do something"
	</td>
	</tr>
	</table>
	`
}


move_to_selected(   // select_order_class - client side
	dom //
){
	const value = dom.value;
	// remove from choice
	dom.remove(dom.selectedIndex);

	// add to selected
	const selected = document.getElementById(`${this.DOMid}_selected`);
	const option   = document.createElement("option");
    option.text  = this.choices[value].text;
	option.value = value;
x.add(option, x[0]);


	selected.add()

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


get_values(  //  select_order_class - client side
	// return array of selected vaules
) {

}



} // select_order_class

export { select_order_class };
