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
) {  
	super();              // call parent constructor
	this.shadow  = this.attachShadow({ mode: "closed" });   // create a shadow dom that has sepreate id scope from other main dom and other shadow doms
	
	this.shadow.innerHTML = `
	<link href="/_lib/web_componets/select-order-sfc/_.css" rel="stylesheet">
	<div  style="display:flex;" hidden>
		<div id="choices_box" class="box">
		<b>Choices</b><br>
		<!-- add narrow at some point-->
		<select id="choices" size="7"></select>
		</div>

		<div id="selected_box" class="box">
		<b>Selected</b><br>
		<select id="selected" size="7"></select>
		</div>

		<div id="button_box" class="box">
		<b>Operations</b><br>
		<button id="top">Top</button> <button id="up">Up</button><br>
		<br>
		 <button id="bottom">Bottom</button> <button id="down">Down</button><br>
		<br>
		<button id="remove">Remove</button> <button id="remove_all">all</button>
		</div>
	</div>`

	this.choices   = this.shadow.getElementById("choices");  
	this.selected  = this.shadow.getElementById("selected"); 

    this.shadow.getElementById("choices"   ).addEventListener('click', this.choices_click.bind( this));
	this.shadow.getElementById("selected"  ).addEventListener('click', this.selected_click.bind(this));
	this.shadow.getElementById("button_box").addEventListener('click', this.button_click.bind(  this));
}


connectedCallback() { // select_order_class - client side
}


display(){  // select_order_class - client side
	this.choices_display();
	this.selected_display();
}


toggle(id) {
	const element = this.shadow.getElementById(id+"_box");
	element.hidden = !element.hidden;
}


choices_add(  // select_order_class - client side
   // add a user choice
   choices // [ [value1,dispaly1], [value2, display2].....]
){
	this.choices_array = choices;
	let html = "";
	for(let i=0; i<choices.length; i++) {
		html += `<option value="${choices[i][0]}">${choices[i][1]}</option>` // store choice in object
	}
	this.choices.innerHTML += html;
}


selected_add(   // select_order_class - client side
	// user made a choice
	index // string, convert to number
) {
	this.selected.push(parseInt(index));  // add to selected
	this.selected_display();
}


selected_return(){  // select_order_class - client side
	const selected = [];
	const element = this.shadow.getElementById("selected");
	for(let i=0; element.length;i++) {
		selected.push();
	}
	return selected;  // return an array of values
}


selected_display() {  // select_order_class - client side
	// redisplay the choices that have been selected
	const selected       = this.shadow.getElementById(`selected`);
	const selected_value = parseInt(selected.value);
	if(!selected) {
		alert("error, element selected not found")
		return;
	}  // refactor

	let html = "";
	let select;
	for(var i=this.selected.length-1; -1<i; i--) {
		let index = this.selected[i];
		if (selected_value === index) {
			select = "selected";
		} else {
			select = "";
		}
		html  += `<option value='${index.toString()}' ${select}>${this.choices[index][0]}</option>`
	}
	selected.innerHTML = html;

	if (this.selected.selectedIndex === undefined) {
		// nothing selected, so disable all buttons
		this.button_disable(" top up bottom down remove ");
	} else if (this.selected.length === 1) {
		// on selection disable all but remove
		this.button_disable(" top up bottom down ");
	}
}


button_disable(  // select_order_class - client side
	name_string // " top up "
){
	const button_list = ["top","up","bottom","down","remove"];
	for(let i=0; i<button_list.length; i++) {
		let button_id   = button_list[i];
		let button      = this.shadow.getElementById(button_id);
		button.disabled = name_string.includes(button_id);
	}
}


choices_click(event){  // select_order_class - client side
	// user click on a choice, move it to the selected
	this.selected.insertBefore(event.target,this.selected.firstChild);
}


selected_click(event){  // select_order_class - client side
	// user click on a selected
	parent = event.target.parent;

	let disable = "";
	if (parent.length === parent.selectedIndex+1 ) {
		// bottom is selected
		disable += " bottom down ";
	}

	if (0 === parent.selectedIndex ) {
		// top is selected
		disable += " top up ";
	} 

	this.button_disable(disable); // diaable buttons that should not be used
}


button_click(event) {  // select_order_class - client side
	// process buttons
	const button = event.target;
	const sel    = this.shadow.getElementById("selected");  // selection box
	const index  =  parseInt(sel.value);                    // choice index
	switch (button.id) {
	case "top": // move selected to top 
		this.selected.insertBefore(event.target, this.selected.firstChild);
		break;

	case "up": // move selected up one place
		this.selected.insertBefore(event.target, event.target.previousSibling);
		break;

	case "down": // move selected down one place
		this.selected.insertBefore(event.target, event.target.nextSibling);
		break;

	case "bottom": // move selected to bottom 
		this.selected.insertBefore(event.target, this.selected.lastChild);
		break;	

	case "remove":  // remove selected item from selected list
		this.selected.remove(event.target);
		this.
		break;

	default:

		break;
	}
}


} // select_order_class

export { select_order_class };
customElements.define("select-order-sfc", select_order_class);   // attach class to  web-component