import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'  ;
import  {formatClass    }   from '/_lib/format/format_module.js';
import  {loginClass     }   from '/_lib/UX/login_module.js'     ;

class appClass { // synergy.SFCKnox.org web site


constructor() {  // appClass - client side
	this.urlParams  = new URLSearchParams( window.location.search );
	this.login      = new loginClass();
	this.proxy      = new proxyClass();
	this.format     = new formatClass();

	this.css;           // var to hold json css file
}


async main() { // appClass - client side
	this.pageName = this.urlParams.get('p'); // page to load
	if (this.pageName === null) {
		// show home page if page is not specified
		const newURL  = encodeURI(`${window.location.pathname}`);
		const newURLs = newURL.split('/');
		const lastToken = newURLs[newURLs.length-1].toLowerCase();
		if (lastToken === ""        ) { window.location.replace(newURL+"app.html?p=home"); }
		if (lastToken === "app.html") { window.location.replace(newURL+"?p=home"        ); }
	}
	this.css  = await this.proxy.getJSON("css.json");  // hold color squence for buttons and strips

	this.page = await this.proxy.getJSON(`pages/${this.pageName}/_.json`);  // load json data the has page html and other data

	// load page module
	let element = document.getElementById("page_module");
	if (element) {
		element.remove();  // if previous module was loaded, remove it.
	}
	element     = document.createElement('script');
	element.id  = "page_module";
	element.src = `pages/${this.pageName}/_.mjs`;
	element.type = "module";
	document.head.appendChild(element);

	// load menu html
	let msg = await this.proxy.RESTget("menu.html");  // make web-component? or put in shadow dom
	if (msg.ok) {
		document.getElementById("menu").innerHTML = msg.value;
	} else {
		alert("error app_module_24main()")
	}

	this.display_header_buttons();
	this.display(0); // display the first list/button
}

picture(url){
	return `<div style="float:right;width:320px; height:200px;"><img style="object-fit:contain; width:320px; height:200px;" src="${url}"></div>`
}


async getPage(  // appClass - client side
	page  // get user page if they request it and they are loggedin
) {
	let url;
	// get page from user area if u is in the URL
	if (this.urlParams.get('u') != null) {
		url = `/users/myWeb/${page}`
	} else {
		// user SFC general page
		url = `synergyData/${page}`;
	}

	return await this.proxy.getJSON(url);
}


display_header_buttons(){
	document.getElementById("header" ).innerHTML = app.page.header;
	const buttons = app.page.buttons;

	let html = "";
	for(var i=0; i<app.page.buttons.length; i++) {
		let button = app.page.buttons[i];
		if (typeof(button.value) === "string") {
			// display button if button.value is defined
			let color = this.css.button_colors[i % this.css.button_colors.length];
			html +=  `<input class="button" type="button" value="${button.value}"  onclick="app.display(${i})" 
			style="background-color: var(${color}_fill); border-color: var(${color}_border);">`
		}

	}
	document.getElementById("buttons").innerHTML = html;
}

display( // appClass - client side
	// called from json buttons
	button_index
){
	let list, html = "";

	if (button_index<app.page.buttons.length) {
		list = app.page.buttons[button_index].list;
	} else if (app.page.buttons.length === 0){
		alert(`error - file="app_module_24-08"
method="display"
button_index=${button_index}`);
return;
	}

	// walk list, build html
	for(var i=0; i<list.length; i++) {
		let color = this.css.button_colors[(i+button_index) % this.css.button_colors.length];
		html += `<div class="row" style="border-radius: 6px; border-style: solid; margin: 5px 5px 5px 5px; padding:  5px 5px 5px 5px; background-color: var(${color}_fill);  ">
		${app.page.nodes[list[i]]}</div>`;
	}

	document.getElementById("main").innerHTML = html;  // display HTML

/*
	// goto url that will have the current button selected
	const urlParams = new URLSearchParams( window.location.search );
	let page="";
	if   (urlParams.get('p') != null) {
		let u="";
		if (urlParams.get('u') != null) {
			u="&u=" + urlParams.get('u');
		}
		page =  "p=" +urlParams.get('p') +u+ "&";
	}

	window.location.href = encodeURI(`${window.location.origin}/app.html?${page}b=${dom.id}`);
	*/
}

goto(select){
	window.location.href = encodeURI(`${window.location.origin}/${select.value}`)
}

buttonURL() {  // appClass - client side
	this.widgetList.buttonURL();
}


show(dom){ // appClass - client side
	document.getElementById(dom).hidden = false;
	document.getElementById(dom).style.visibility = true;
}


hide(dom) { // appClass - client side
	document.getElementById(dom).hidden = true;
	document.getElementById(dom).style.visibility = false;
}

style_display(domid,value) {
	// similar to show, hideå
	const element = document.getElementById(domid);

	switch (value) {
		case true:
			element.style.display = 'block';
			break;

		case false:
			element.style.display = 'none';
			break;

		case "toggle":
			if (element.style.display === "none") {
				element.style.display = 'block'
			} else {
				element.style.display = 'none'
			}
			break;

		default:
			alert(`
file="app_module_24-03.js"
method="style_display"
domid=${domid}
value="${value}"
`);
			break;
	}
}


} // end appClass

export { appClass };