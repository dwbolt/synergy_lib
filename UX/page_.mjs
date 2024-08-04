// page module should extend this class 
class page_ { // sfcknox2/pages/home

constructor(name){
	this.name = name; // name of page
}

async init() {
	this.json = await app.proxy.getJSON(`pages/${this.name}/_.json`);  // load json data the has page html and other data
}


async display(){
	this.display_header();
	this.display_buttons();
	this.button_press(0); // display the first list/button
}


display_header(){
	// copy header from json to dom
	document.getElementById("header" ).innerHTML = this.json.header;
}


display_buttons(){
	// generate buttons from json to dom
	const buttons = this.json.buttons;
	let html = "";
	for(var i=0; i<buttons.length; i++) {
		let button = buttons[i];
		if (typeof(button.value) === "string") {
			// display button if button.value is defined
			let color = app.css.button_colors[i % app.css.button_colors.length];
			html +=  `<button  class="button" onclick="app.button_press(${i})" 
			style="background-color: var(${color}_fill); border-color: var(${color}_border);">${button.value}</button>`

		}

	}
	document.getElementById("buttons").innerHTML = html;
}


button_press( // appClass - client side
	// called from json buttons
	button_index
){
	let list, html = "";

	if ( ( -1 < button_index) && (button_index < this.json.buttons.length) ) {
		list = this.json.buttons[button_index].list;
	} else if (this.json.buttons.length === 0){
		alert(`error - file="app_module_24-08"
method="display"
button_index=${button_index}`);
return;
	}

	// walk list, build html
	for(var i=0; i<list.length; i++) {
		let color = app.css.button_colors[(i+button_index) % app.css.button_colors.length];
		html += `<div class="row" style="border-radius: 6px; border-style: solid; margin: 5px 5px 5px 5px; padding:  5px 5px 5px 5px; background-color: var(${color}_fill);  ">
		${this.json.nodes[list[i]]}</div>`;
	}

	app.main_shadow.innerHTML = html;  // display HTML
}

}
export {page_};
