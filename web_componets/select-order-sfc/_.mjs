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
}


connectedCallback() { // select_order_class - client side
	this.choices   = [];  // this  [[display1,obj1], [display2, object2],...] , search on choices may narrow the options displayed
	this.selected  = [];  // aray of indexes that the user has selected, display in reverser order
	
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

    this.shadow.addEventListener('click', this.click.bind(this));
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
	display   // text displayed to choice
	,obj      //{"display"="??","comment"="??",order=number}  object associated with what is displayed
	){

	this.choices.push([display,obj]);             // store choice in object
}


choices_display( // select_order_class - client side
){
	// show the choices
	const choices = this.shadow.getElementById(`choices`);
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
	for(let i=0; i)
	return selected;
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


click(event){  // select_order_class - client side
	let parent = event.target.parentElement;
	switch (parent.id) {
	case "choices":
		// user click on a choice
		this.selected_add(event.target.value)    // move to selected
		event.target.remove();  // remove from choice
		return;

	case "selected":
		// user click on a selected, enable valid button choices
		let disable = "";
		if (parent.length === parent.selectedIndex+1 ) {
			// bottom is selected
			disable += " bottom down ";
		}

		if (0 === parent.selectedIndex ) {
			// top is selected
			disable += " top up ";
		} 

		this.button_disable(disable);
		return;

	default:
		// 
		break;
	}

	// process buttons
	const button = event.target;
	const sel    = this.shadow.getElementById("selected");  // selection box
	const index  =  parseInt(sel.value);                    // choice index
	switch (button.id) {
	case "top": // move selected to top 
		for(let i=0; i<this.selected.length; i++){
			if (this.selected[i] === index) {
				this.selected.splice(i,1); // remove;
				this.selected.push(index); // move to top 
				break;
			}
		}
		this.selected_display();
		break;

	case "up": // move selected up one place
		for(let i=0; i<this.selected.length; i++){
			if (this.selected[i] === index) {
				const temp = this.selected[i+1]; 
				this.selected[i+1] = index;
				this.selected[i]   = temp;
				break;
			}
		}
		this.selected_display();
		break;

	case "down": // move selected down one place
		for(let i=0; i<this.selected.length; i++){
			if (this.selected[i] === index) {
				const temp = this.selected[i-1]; 
				this.selected[i-1] = index;
				this.selected[i]   = temp;
				break;
			}
		}
		this.selected_display();
		break;

	case "bottom": // move selected to bottom 
		for(let i=0; i<this.selected.length; i++){
			if (this.selected[i] === index) {
				this.selected.splice(i,1); // remove;
				this.selected.unshift(index) ;// move to bottom 
				break;
			}
		}
		this.selected_display();
		break;	

	case "remove":  // remove selected item from selected list
		for(let i=0; i<this.selected.length; i++){
			if (this.selected[i] === index) {
				this.selected.splice(i,1);  	// remove 
				break;
			}
		}
		this.choices_display();
		this.selected_display();
		break;

	default:
		break;
	}
}


} // select_order_class

export { select_order_class };
customElements.define("select-order-sfc", select_order_class);   // attach class to  web-component