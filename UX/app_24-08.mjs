import  {proxy      } from '/_lib/proxy/_.mjs' ;
import  {format     } from '/_lib/format/_.mjs';
import  {page_      } from '/_lib/UX/page_.mjs'; // 


// web-components
import  {sfc_img   } from '/_lib/web_componets/sfc-img/_.mjs'   ; // preload sfc-img web component
import  {sfc_html  } from '/_lib/web_componets/sfc-html/_.mjs'  ; // preload sfc-html web component
import  {sfc_urls  } from '/_lib/web_componets/sfc-urls/_.mjs'  ; // preload sfc-urls web component

export class appClass { // synergy.SFCKnox.org web site


constructor() {  // appClass - client side
	this.urlParams   = new URLSearchParams( window.location.search );
}


async main() { // appClass - client side
	// should just be called once for when a new spa (single page app) is load
	this.pages   = {}  // contians pointers to page classes as they are loaded
	app.lib      = new URL(import.meta.url).origin + "/"; 
	const {sfc_dialog} = await import(`${app.lib}_lib/web_componets/sfc-dialog/_.mjs`);  // preload sfc-dialog 
	const {sfc_login } = await import(`${app.lib}_lib/web_componets/sfc-login/_.mjs` );  // preload sfc-login

	this.sfc_dialog  = document.querySelector("sfc-dialog"); // assume only one
	this.sfc_login   = document.querySelector("sfc-login" ); // assume only one

	this.css  = await proxy.getJSON("css.json");  // holds json info for styling 
	let page_name = this.urlParams.get('p'); // page to load from url
	if (page_name === null) {
		page_name = "home";  // set page to home if one is not given
	}

	await this.page_display(page_name);
}


async url_copy(   // appClass - client side
){
	// copy the url and page info so a user can get back do the page
	this.sfc_dialog.title_set("<h1>Copied URL to clipboard</h1>");
	const wl = window.location;

	// set text of dialog
	const url = `${wl.protocol}//${wl.hostname}${wl.pathname}?p=${this.page_name}`;
	this.sfc_dialog.body_set(`<p>"${url}" <br><br>has been copied to your clip board. You may now paste it to an email or other document.</p> <p>Sustainable Future Center implements their web information as Single Page Apps (SPA).  This means faster reponse times and less network trafic between your browser and the server.  You will notice that as you change pages, the url does not change.  The url that has been copied to your clipboard allows you to get back quickly to page you are on.</p>`);
 
	await navigator.clipboard.writeText(url);  // copy url to clipboard
	this.sfc_dialog.show_modal();               // show dialog
}


async page_display(  // appClass - client side
	page_name
) {
	const url_dir = `pages/${page_name}/`
	await this.page_display_url(page_name, url_dir);
}


async page_display_my(  // appClass - client side
	page_name
) {
	if ( await app.sfc_login.login_force( this.page_display_my.bind(this,page_name) )) {
		// user is logged in
		const url_dir = `/users/my_synergy_pages/${page_name}/`
		await this.page_display_url(page_name, url_dir);
  }
}


async page_display_url(  // appClass - client side
	 page_name  // 
	,url_dir    //  to _.json for page
) {
	this.page_name    = page_name;  // remember the page we are displaying - 
	this.page_url_dir = url_dir; 

	// load page module code if not already loaded
	if (this.pages[url_dir] === undefined) {
		this.pages[url_dir] = await this.page_load(url_dir);
	} else {
		app.pages[url_dir].display();
	}
}


async page_load(   // appClass - client side
	url_dir
) {
	// load page json - it has or points to resources to display page
	app.page_json          = await proxy.getJSON(`${url_dir}_.json`);
	app.page_json.url_dir  = url_dir;    // remember where the json was loaded from

	if        (app.page_json.module === undefined) {
		// used base class of page_
		const page_module = new page_(this.page_name, url_dir);
		await page_module.init(app.page_json,url_dir);
		return page_module;
	} else if (app.page_json.module === true) {
		// load custom page module from same directory as _.json
		let element  = document.createElement('script');
		element.src  = `${url_dir}_.mjs`;
		element.type = "module";
		document.head.appendChild(element);
		// loaded module must 
	} else {
		alert("error, file='app_24-08' method='page_load'")
	}
}

load_contact(element) {
	element.innerHTML = "load contact html"
}


page_json_get(     // appClass - client side
) {
	return this.pages[this.page_url_dir].json;
}


button_press(index){   // appClass - client side
	this.pages[this.page_url_dir].button_press(index);
}



picture(   // appClass - client side
	url
){
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

	return await proxy.getJSON(url);
}


goto(    // appClass - client side  ------- is this still used?
	select
){
	window.location.href = encodeURI(`${window.location.origin}/${select.value}`)
}


buttonURL() {  // appClass - client side
	this.widgetList.buttonURL();
}


show(dom){  // appClass - client side
	document.getElementById(dom).hidden = false;
	document.getElementById(dom).style.visibility = true;
}


hide(dom) {  // appClass - client side
	document.getElementById(dom).hidden = true;
	document.getElementById(dom).style.visibility = false;
}


style_display(   // appClass - client side
	domid,value
) {
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
