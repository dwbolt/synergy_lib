import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'  ;
import  {formatClass    }   from '/_lib/format/format_module.js';
import  {loginClass     }   from '/_lib/UX/login_module.js'     ;
//import  {widgetListClass}   from '/_lib/UX/widgetList_module.js';
import  {calendarClass  }   from '/_lib/UX/calendar_module.js';


class appClass { // synergy.SFCKnox.org web site


constructor() {  // appClass - client side
	this.urlParams  = new URLSearchParams( window.location.search );
	this.login      = new loginClass();
	this.proxy      = new proxyClass();
	this.format     = new formatClass();
	this.calendar   = new calendarClass();

	this.widgetList;    // will hold instance of widgetListClass
	this.css;           // var to hold json css file
}

picture(url){
	return `<div style="float:right;width:320px; height:200px;"><img style="object-fit:contain; width:320px; height:200px;" src="${url}"></div>`
}


async main() { // appClass - client side
	this.pageName = this.urlParams.get('p'); // page to load
	if (this.pageName === null) {
		// show home page
		const newURL  = encodeURI(`${window.location.pathname}`);
		const newURLs = newURL.split('/');
		const lastToken = newURLs[newURLs.length-1].toLowerCase();
		if (lastToken === ""        ) { window.location.replace(newURL+"app.html?p=home"); }
		if (lastToken === "app.html") { window.location.replace(newURL+"?p=home"        ); }
	}

	this.css  = await this.proxy.getJSON("css.json");
	const dom = {id:"do"}
	app.display_header_buttons();
	app.display(0); // simulate press the "what we do button"
	//document.getElementById("footer"    ).innerHTML = await this.proxy.getText("footer.html");

	/*
	if (await this.login.getStatus()) {
		// user logged in
		document.getElementById("navigation").innerHTML = await this.proxy.getText("menuUser.html") 
		document.getElementById("userName"  ).innerHTML = `Home for: ${localStorage.nameFirst} ${localStorage.nameLast}`
	} else {
		// user not logged in
		document.getElementById("navigation").innerHTML = await this.proxy.getText("menu.html")
	}
	/*
/*
	// load data for page
	this.widgetList = new widgetListClass("main");
	this.widgetList.setJSON( await this.getPage(`${this.pageName}/_.json`) ); // add system or user path;

	// see if list or node is to be displayed
	const list      = this.urlParams.get('l');
	const node      = this.urlParams.get('n');
	const domButton = document.getElementById(this.urlParams.get('b'));    // see if button is being dispalyed

	if (list) {
		// display the nodes in list
		await this.widgetList.displayList(list);
	} else if (node) {
		await this.widgetList.displayNode(node);
	} else if (domButton) {
		// named button is there
		await this.widgetList.displayButton(domButton);
	} else if (document.getElementById('buttons').firstChild){
		// display first button
		await this.widgetList.displayButton( document.getElementById('buttons').firstChild );
	} else {
		// no button, assume rows has an array of nodes to display
		await this.widgetList.displayList("rows");
	}
	let x=0;  // dummy statement to set breakpoint on
	*/
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

	let html = "";
	for(var i=0; i<app.page.buttons.length; i++) {
		let button = app.page.buttons[i];
		let color = this.css.button_colors[i % this.css.button_colors.length];
		html +=  `<input class="button" type="button" value="${button.value}"  onclick="app.display(${i})" 
		style="background-color: var(${color}_fill); border-color: var(${color}_border);">`
	}
	document.getElementById("buttons").innerHTML = html;
}

display( // appClass - client side
	// called from json buttons
	button_index
){
	let html = "";
	const rows = app.page.buttons[button_index].list;

	// walk list and display
	for(var i=0; i<rows.length; i++) {
		//let color = this.css.rowColors[i % this.css.rowColors.length];
		let color = this.css.button_colors[(i+button_index) % this.css.button_colors.length];
		html += `<div class="row" style="border-radius: 6px; border-style: solid; margin: 5px 5px 5px 5px; padding:  5px 5px 5px 5px; background-color: var(${color}_fill);  ">
		${app.page.nodes[rows[i]]}</div>`;
	}

	document.getElementById("main").innerHTML = html;

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
