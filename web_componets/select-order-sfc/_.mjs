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
		<button id="top">Top</button><br>
		<button id="up">^</button><br>
		<button id="down">v</button><br>
		 <button id="bottom">Bottom</button><br>
		<br>
		<button id="remove">Remove</button> <button id="remove_all">All</button>
		</div>
	</div>`

	this.choices   = this.shadow.getElementById("choices");  
	this.selected  = this.shadow.getElementById("selected"); 
	this.buttons   = this.shadow.getElementById("button_box");

    this.shadow.getElementById("choices"   ).addEventListener('click', this.choices_click.bind( this));
	this.shadow.getElementById("selected"  ).addEventListener('click', this.selected_click.bind(this));
	this.shadow.getElementById("button_box").addEventListener('click', this.button_click.bind(  this));
}


connectedCallback() { // select_order_class - client side
}


display(){  // select_order_class - client side
	this.choices_display();
	//this.selected_display();
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
	this.choices_html();
}

choices_html(){
	let html = "";
	const selected = this.selected_return();
	for(let i=0; i<this.choices_array.length; i++) {
		if ( !selected.includes(i.toString()) ) {
			html += `<option value="${i}">${this.choices_array[i][0]}</option>`; // store choice in object
		}
	}
	this.choices.innerHTML = html;
}


selected_add(   // select_order_class - client side
	// user made a choice
	choices  // [ [value1,dispaly1], [value2, display2].....]
) {
	this.slected_array = choices;
	this.selected_html();
}


selected_return() {  // select_order_class - client side
	const selected = [];
	let child = this.selected.firstChild;
	while (child) {
		selected.push(child.value);
		child = child.nextSibling;
	}

	return selected;  // return an array of values
}


selected_html() {  // select_order_class - client side
	// redisplay the choices that have been selected
	const selected_value = parseInt(this.selected.value);

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
	const button_list = this.buttons.children;
	for(let i=0; i<button_list.length; i++) {
		let node = this.buttons.children[i];
		let id   = node.id;
		if (id) {
			// only buttons have ids
			node.disabled = name_string.includes(id);
		}
	}
}


choices_click(event){  // select_order_class - client side
	// user click on a choice, move it to the selected
	this.selected.insertBefore(event.target,this.selected.firstChild);
	this.selected_click(); //
}


selected_click(){  // select_order_class - client side
	// user click on a selected -  update button status
	let disable = "";
	if (this.selected.selectedIndex === -1 || this.selected.length === this.selected.selectedIndex+1 ) {
		// bottom is selected
		disable += " bottom down ";
	}

	if ( this.selected.selectedIndex < 1 ) {
		// top is selected
		disable += " top up ";
	} 

	if (this.selected.selectedIndex === -1 ) {
		disable += " remove remove_all "
	}

	this.button_disable(disable); // diaable buttons that should not be used
}


button_click(event) {  // select_order_class - client side
	// process buttons
	const element = this.selected.options[this.selected.selectedIndex];  // selected element
	switch (event.target.id) {
	case "top": // move selected to top 
		this.selected.insertBefore(element, this.selected.firstChild);
		break;

	case "up": // move selected up one place
		this.selected.insertBefore(element, element.previousSibling);
		break;

	case "down": // move selected down one place
		this.selected.insertBefore(element.nextSibling, element) ;
		break;

	case "bottom": // move selected to bottom 
		this.selected.insertBefore(element,                 this.selected.lastChild);
		this.selected.insertBefore(this.selected.lastChild, element );
		break;	

	case "remove":  // remove selected item from selected list
		this.selected.remove(element);
		this.selected.selectedIndex = 0; // select the top item
		this.choices_html();
		break;

	case "remove_all":  // remove all selected
		this.selected.innerHTML = "";
		this.choices_html();
		break;

	default:
		break;
	}
	this.selected_click();  // see if some buttons need to be disabled
}


} // select_order_class

export { select_order_class };
customElements.define("select-order-sfc", select_order_class);   // attach class to  web-component