import  {proxy          } from '/_lib/proxy/_.mjs'        ; // static class that makes async webcalls
import  {format         } from '/_lib/format/_.mjs'       ; // static class that formats data
import  {page_          } from '/_lib/UX/page_.mjs'       ; // 
import  {table_class    } from '/_lib/MVC/table/m.mjs'    ; // 
import  {web_components } from '/_lib/web_components/web_components.mjs' ; // class that allows dynamic loading of web_components

export class app_spa { // synergy.SFCKnox.org web site


constructor(domain) {  // appClass - client side
	this.lib         = `${domain}_lib/`   // get local of _lib 
	this.urlParams   = new URLSearchParams( window.location.search );
	this.format      = format;  // give other modules access to format static class
	this.edit        = false;  // show draft mode and allow ediot
}

async nav_menu_update(){
	debugger
	// for apps that change menu if logged, this method needs to be over ridden
}


async main() { // appClass - client side
	// add one dialog and login.  Not all applications need login, but most do and it is small
	document.body.innerHTML += "<sfc-dialog></sfc-dialog> <sfc-login></sfc-login>"; // body has changed load should fire

	// enable dynamic load ot sfc web componts
	this.web_components = new web_components(     );  // create map
	await this.web_components.check(document.body       );  // load any unload web components in body
	await this.web_components.observer_create(          );  // create observer
	await this.web_components.observer_add(document.body);  // observe changes in the body tab

	// remember to app dialog and login
	this.sfc_dialog  = document.querySelector("sfc-dialog"); // assume only one
	this.sfc_login   = document.querySelector("sfc-login" ); // assume only one

	// update longin status
	await this.sfc_login.login_status_update();  // let user know if they are already logined in

	// should just be called once when a new spa (single page app) is load
	this.pages   = {}  // contians pointers to page class as they are loaded

	this.css  = await proxy.getJSON("css.json");  // holds json info for styling 
	this.page_url_dir = this.urlParams.get('u'); // page to load from url
	if (this.page_url_dir !== null) {
		// url is known so display it
		await this.page_display_url();
	} else {
		// no url, see if a page is known
		let page = this.urlParams.get('p');
		if (page === null) {
			page = "home"  // set page to home if not specified;
		}
		await this.page_display(page);
	}
}


async load(// app_light - client side
	path // to module to load
){
	return await import(`${this.lib}${path}`);  
}


async url_copy(   // appClass - client side
help = undefined
){
	if (help) {
		app.sfc_dialog.set("title",`<b>Share Page</b>`);
		app.sfc_dialog.set("body",`<p>The internal URL is shown in the URL area and is also copied to your clipboard.  You can now paste the link into an email or other document.</p> <p>You will notice as you change pages the URL does not change.  This is becase the site is written as Single Page App (SPA).  This creates faster page loads since only changes are loaded and cached.  You will also notice that when you revisit a page it will load faster than the first time you visited the page.</p>`);
		app.sfc_dialog.show_modal();
		return;
	}

	// set text of dialog
	const url = this.url_get();
	await navigator.clipboard.writeText(url);  // copy url to clipboard

	window.location.href =  url;               // go to url
}


async date_copy(   // appClass - client side
){
	await navigator.clipboard.writeText( format.getISO(new Date()) );  // copy YYYY-MM-DD to clipboard
}


url_json_get(){
	return this.page_url_dir; // url to json
}


url_get(   // appClass - client side
){
	// return url of current page being displayed,
	// need to add suport for current button press
	const wl = window.location;
	return `${wl.protocol}//${wl.hostname}${wl.pathname}?u=${this.page_url_dir}`;
}


async page_display(  // appClass - client side
	page_name
) {
	// load page from web site
	this.page_url_dir = `pages/${page_name}/`
	await this.page_display_url();
}


async page_display_my(  // appClass - client side
	page_name
) {
	// load page from users mages
	if ( await app.sfc_login.login_force( this.page_display_my.bind(this,page_name) )) {
		// user is logged in
		//this.page_name    = page_name;  // remember the page we are displaying - 
		this.page_url_dir = `/users/my_synergy_pages/${page_name}/`
		await this.page_display_url();
  }
}


async page_display_url(  // appClass - client side
url = ""  // url to json file for page 
) {
	if (url!=="") {
		this.page_url_dir  = url;  // remember the page we are displaying - 
	}

	// load page module code if not already loaded
	if (this.pages[this.page_url_dir] === undefined || this.edit) {
		// if page is not loaded or were are in edit mode then reload page
		this.pages[this.page_url_dir] = await this.page_load(this.page_url_dir);
	} else {
		// page already loaded
		app.pages[this.page_url_dir].display();
	}
}


async page_load(   // appClass - client side
	url_dir
) {
	// load page json - it has or points to resources to display page
	app.page_json          = await proxy.getJSON(`${url_dir}_.json`); // load json for page
	app.page_json.url_dir  = url_dir;    // remember where the json was loaded from
	await this.draft_version(); // will update the json with draft changes

	if        (app.page_json.module === undefined || app.page_json.module === false) {
		// used base class of page_
		return await new page_().init();
	} else if (app.page_json.module === true) {
		// load custom page module from same directory as _.json
		let element  = document.createElement('script');
		element.src  = `${url_dir}_.mjs`;
		element.type = "module";
		document.head.appendChild(element);
		// loaded module must 
	} else {
		app.sfc_dialog.show_error( `case not handled, app.page_json.module: ${app.page_json.module}` );
	}
}


async draft_version(){  // appClass - client side
	// will update the json with draft changes from user database, every user can have a draft version of a page
	if ( sessionStorage.getItem("edit_mode") !== "true") {
		// edit mode must be true to see draft version
		return;
	}

	if ( !(await app.sfc_login.login_force( this.draft_version.bind(this) )) ) {
		return; // login was not successfull, nothing todo
  	}

	// user is loged in, so show any edits they have done to the page
	const table = new table_class(); 
	const msg = await table.load("/users/databases/synergy/web",[404]); // do not worry if table does not exist, just no custom version
	if (msg.status === 200) {
		// we have loaded their synergy table for web
		// get a list of edits for this page;
		const pks = table.search([ ["host", "equal", window.location.hostname], ["path","equal",app.page_json.url_dir] ]);
		for (let i=0; i<pks.length; i++) {
			const obj = table.get_object(pks[i]);
			if (obj !== undefined) {
				const attriutes = obj.attribute.split(".");  // path to attribut to change
				let att = app.page_json;  // starting point
				for (let ii=0; ii<attriutes.length-1; ii++) {
					att = att[attriutes[ii]];
				}
				if (obj.type === "json") {
					try {
						att[ attriutes[attriutes.length-1] ] = JSON.parse(obj.value);		
					} catch (error) {
						app.sfc_dialog.show_error(`json parse error on: ${obj.value}`);
					}
				} else {
					// assume typle is html
					att[ attriutes[attriutes.length-1] ] = `status: <b class="blink">${obj.status}</b> path = "${obj.path}" Attribute = "${obj.attribute}" <br><br>${obj.value}`;
				}
			}
		}
	}
}


load_contact(element) {  // appClass - client side
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
	domid
	,value
) {
	// similar to show, hide
	const element = document.getElementById(domid);

	switch (value) {
		case true : element.style.display = 'block'; break;
		case false: element.style.display = 'none' ; break;
		case "toggle":
			if (element.style.display === "none") {
				element.style.display = 'block'
			} else {
				element.style.display = 'none'
			}
			break;

		default:
			app.sfc_dialog.show_error( `case not handled<br>  domid=${domid}<br> value="${value}"` );
			break;
	}
}


test_harness(){
	this.test_window = window.open('','_blank');
  
	// Ensure the new window is created successfully
	if (this.test_window) {
		// Do something in the parent window
		this.test_window.document.title = "Test Harness";
		this.test_window.document.body.innerHTML = `
<h1>Test Harness</h1>
<input id="index" type="number" value="0">
<button id="prev">Previous Page/Button</button> <button id="next">Next Page/Button</button>`;
		let b = this.test_window.document.getElementById('prev');
		    b.addEventListener( 'click', this.test_harness_next.bind(this,-1) );

		    b = this.test_window.document.getElementById('next');
		    b.addEventListener( 'click', this.test_harness_next.bind(this,+1) );
	} else {
		app.sfc_dialog.show_error( `"window not created` );
	}
  }

  
  test_harness_next(inc){
	// get all the a tags from the nav menu
	const a_tags = document.getElementById("menu_choices").querySelectorAll("a");
	if(this.test_index === undefined){
		this.test_index=0;
	} else  {
		// increment or decrement
		this.test_index = this.test_index+inc;
	}

	// make sure this.test_index  is in bounds
	if (this.test_index < 0) {
		this.test_index = 0;
	} 
	if (a_tags.length <= this.test_index  ) {
		this.test_index = a_tags.length -1;
	}

	this.test_window.document.getElementById("index").value = this.test_index

	a_tags[this.test_index].onclick && a_tags[this.test_index].onclick();  // execute the onclick 
  }


} // end app_spa


/*

code from chatgpt to dynically load web components
https://chatgpt.com/c/674f1bef-b588-800b-ab8b-2c1a42c863e2

// define mapping from tag name to location
const componentMap = {
  'my-unknown-component': '/path/to/my-unknown-component.js',
  // Add other mappings here
};

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName.includes('-') &&
        !customElements.get(node.tagName.toLowerCase())
      ) {
        //console.log(`Unloaded component detected: ${node.tagName}`);
		// load componet
	  import(componentMap[tagName]).catch((err) =>
      console.error(`Failed to load component ${tagName}`, err)
    );
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

*/