// page module should extend this class 

import {proxy} from '/_lib/proxy/_.mjs' ;

export class page_ { // sfcknox2/pages/home

constructor(  // class page_ - client side
	url // directory where _.json file is and optional _.mjs
){ 
	if (url) {
		this.dir_url = url; // name of page for backward compatibily
		debugger;
		alert(`see about delete url=${url}`);  // I think this can be depricated

	} else {
		this.dir_url =	app.page_json.url_dir;
	}
}


async init(         // class page_ - client side
	json  // page difintion
) {
	if (json) {
		this.json    = json   ; // save page resources
		debugger;
		alert(`see about delete json in init`);  // I think this can be depricated
	} else {
		this.json = app.page_json;
	}

	await this.display();
	await app.web_components.check(document.body);  // load any unload web components in body
 
	return this  // allow chaining
}


async display(     // class page_ - client side
){
	this.display_header();
	this.display_buttons();
	await this.button_press(0); // display the first list/button
	app.page = this;            // remember the page displayed

}


display_header(     // class page_ - client side
){
	// copy header from json to dom
	document.getElementById("header" ).innerHTML = this.json.header;
}


display_buttons(    // class page_ - client side
){
	// generate buttons from json to dom
	const buttons = this.json.buttons;
	let html = "";
	for(var i=0; i<buttons.length; i++) {
		let button = buttons[i];
		if (typeof(button.value) === "string") {
			// display button if button.value is defined
			let hook_post="";
			if (button.hook_post) {
				// allow for method to run after button is pushed and data displayed
				hook_post = button.hook_post;
			}
			let color = app.css.button_colors[i % app.css.button_colors.length];
			html +=  `<button  class="button" onclick="app.button_press(${i});${hook_post}" 
			style="background-color: var(${color}_fill); border-color: var(${color}_border);">${button.value}</button>`

		}

	}
	document.getElementById("buttons").innerHTML = html;
}


async button_press(   // class page_ - client side
	button_index
){
	let list, html = "";

	// validate button_index range
	if ( ( -1 < button_index) && (button_index < this.json.buttons.length) ) {
		list = this.json.buttons[button_index].list;
	} else if (this.json.buttons.length === 0){
		app.sfc_dialog.show_error(`case not handled<br> button_index=${button_index}`);
		return;
	}

	// walk list, build html
	for(var i=0; i<list.length; i++) {
		let color = app.css.button_colors[(i+button_index) % app.css.button_colors.length];
		let node_name = list[i];
		html += `<div id="${node_name}" class="row" style="background-color: var(${color}_fill);  ">`
		if ( this.json.html?.[node_name] ) {
			// use html in already loaded json file
			html += `${this.json.html[node_name]}`;
		} else if ( this.json?.load[node_name] ) {
			// load html from file
			let msg =  await proxy.RESTget(`${this.json.url_dir}${this.json.load[node_name]}` );
			if (msg.ok) {
				html += msg.value;
			} else {
				html += `node not loaded ${node_name}`;
				debugger;
			}
		} else {
			// missing the node so put dummy info in page
			html += `node name = ${node_name} <p>should be in editor or load or html</p>`
		}
		html += "</div>"
	}

	document.getElementById("main").innerHTML = html;  // display HTML

	// run method associated with button
	const method = this.json.buttons[button_index].method;
	if (method) {
		await this[method]();
	}
}

}   // end class page_ - client side
