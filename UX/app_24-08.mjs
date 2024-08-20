import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'  ;
import  {formatClass    }   from '/_lib/format/format_module.js';


export class appClass { // synergy.SFCKnox.org web site


constructor() {  // appClass - client side
	this.urlParams   = new URLSearchParams( window.location.search );
	this.proxy       = new proxyClass();
	this.format      = new formatClass();
}


async main() { // appClass - client side
	// should just be called once for when a new spa (single page app) is load
	this.pages      = {}  // contians pointers to page classes as they are loaded

	this.css  = await this.proxy.getJSON("css.json");  // holds json info for styling 

	let page_name = this.urlParams.get('p'); // page to load from url
	if (page_name === null) {
		page_name = "home";  // set page to home if one is not given
	}

	await this.page_display(page_name);
}


async page_display(page_name) {
	// called each time a new page is displayed
	this.page_name = page_name;  // remember the page we are displaying

	// load page module code if not already loaded
	if (this.pages[this.page_name] === undefined) {
		let element  = document.createElement('script');
		element.src  = `pages/${this.page_name}/_.mjs`;
		element.type = "module";
		document.head.appendChild(element);
	} else {
		app.pages[this.page_name].display();
	}
}


page_json_get() {
	return this.pages[this.page_name].json;
}


button_press(index){
	this.pages[this.page_name].button_press(index);
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
file="app_24-03.js"
method="style_display"
domid=${domid}
value="${value}"
`);
			break;
	}
}


} // end appClass
