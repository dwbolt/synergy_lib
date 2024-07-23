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
	<div class="box" style="display: inline-block;">
	<link href="/_lib/web_componets/select-order-sfc/_.css" rel="stylesheet">
	<div id="title"></div>
	<input id="narrow" type="text" placeholder="Narrow choices" hidden> 
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
	</div></div>`

	this.choices   = this.shadow.getElementById("choices")   ; this.choices .addEventListener('click', this.choices_click.bind(  this));
	this.selected  = this.shadow.getElementById("selected")  ; this.selected.addEventListener('click', this.buttons_disable.bind(this));
	this.buttons   = this.shadow.getElementById("button_box"); this.buttons.addEventListener( 'click', this.button_click.bind(   this));
	this.narrow    = this.shadow.getElementById("narrow"    ); this.narrow.addEventListener(  'keyup', this.choices_html.bind(   this));
}


narrow_keyup(){
	// change choices bassed on what was typed in
	

}


connectedCallback() { // select_order_class - client side
}


title_set(html) {  // select_order_class - client side
	this.shadow.getElementById("title").innerHTML = html;
}

display(){  // select_order_class - client side
	this.choices_display();
}


toggle(id) {
	let element;
	switch (id) {
	case "multi" : this.multi = !this.multi; this.multi_display()   ; return;
	case "button": element= this.shadow.getElementById("button_box"); break ;
	case "narraw": element= this.shadow.getElementById(id)          ; break ;
	default      : alert(`error id=${id} case not handdled`)        ; return;
	}
	element.hidden = !element.hidden;
}


multi_display(){// select_order_class - client side
	this.shadow.getElementById("selected_box").hidden = !this.multi;
}


choices_add(  // select_order_class - client side
   // add a user choice
   choices // [ [value1,dispaly1], [value2, display2].....]
){
	this.choices_array = choices;
	if (10 < this.choices_array.length) {
		// show narrow if there are more than 10 items to choose from
		this.shadow.getElementById("narrow").hidden = false;
	}
	this.choices_html();
}


choices_html(){
	let html = "";
	const selected = this.selected_return();
	for(let i=0; i<this.choices_array.length; i++) {
		if ( !selected.includes(i.toString()) ) { // only add things not alread selected
		    let display = this.choices_array[i][0];
			if (display.includes(this.narrow.value) ) { // only add things that meet narrow search criteria
				html += `<option value="${i}">${display}</option>`; // store choice in object
			}
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
	if (this.muli) {
		// user click on a choice, move it to the selected
		this.selected.insertBefore(event.target,this.selected.firstChild);
	} else {
		this.choices_click_custom(); //
	}
	this.buttons_disable();
}


choices_click_custom() {
	alert("for muli=false the developer needs to overide this method")
}


buttons_disable(){  // select_order_class - client side
	let disable = "";
	let select = (this.multi ? this.selected: this.choices );

	if (select.selectedIndex === -1 || select.length === select.selectedIndex+1 ) {
		// bottom is selected
		disable += " bottom down ";
	}

	if ( select.selectedIndex < 1 ) {
		// top is selected
		disable += " top up ";
	} 

	if (select.selectedIndex === -1 ) {
		disable += " remove remove_all "
	}

	this.button_disable(disable); // disable buttons that should not be used
}


button_click(event) {  // select_order_class - client side
	// process buttons
	if (this.multi) {
		this.selected_move(event);
	} else {
		this.choices_move(event);
	}
	this.buttons_disable();  // see if some buttons need to be disabled
}


selected_move(event) { // select_order_class - client side
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
}


choices_move(event) {  // select_order_class - client side
	
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
}

} // select_order_class

export { select_order_class };
customElements.define("select-order-sfc", select_order_class);   // attach class to  web-component