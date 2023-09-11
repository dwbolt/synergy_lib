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

	document.getElementById(this.DOMid).innerHTML = `
	<table>
	<tr>
	<td>
	<select id="${this.DOMid}_choice" size="4" >
	</select>
	</td>

	<td>
	<select id="${this.DOMid}_selected" size="4">
	</select>
	</td>

	<td>
	<input type="button" value="do something"
	</td>
	</tr>
	</table>
	`
}

/*
let html = `<select size="4" onclick="app.page.database_select(this)">`;
// build list of databases to choose
for(let i=0; i<dbkey.length; i++ ) {
  html += `<option value="${dbkey[i]}">${dbkey[i]}</option>`;
}
html += "</select>"
*/


clear_choices(){  // select_order_class - client side
	this.count   = 1;
	this.choices = {}
	this.order   = [];  // display order of choices by value
}

get_DOM_choice(){
	// return DOM element that 
	return document.getElementById("${this.DOMid}_choice");
}

add_choice(  // select_order_class - client side
	value    // value returned when selected
	,obj     //{"display"="??","comment"="??",order=number}
	){
	this.choices[value] = obj;             // store choice in object
	obj.order           = this.count++;    // remember order choice was added
	this.order.push(value);                // add choice to list, will be displayed
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
