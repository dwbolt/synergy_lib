import  {loginClass     }   from '/_lib/UX/loginModule.js'     ;
import  {proxyClass     }   from '/_lib/proxy/proxyModule.js'  ;

class spa_class { // synergy.SFCKnox.org web site
	constructor() {  // spa_class - client side
		this.urlParams  = new URLSearchParams( window.location.search );
		this.login      = new loginClass();
		this.proxy      = new proxyClass();
		//this.format     = new formatClass();
		//this.widgetList;    // will hold instance of widgetListClass
		//this.css;           // var to hold json css file
	}
	
	
	async main() { // spa_class - client side
		this.pageName = this.urlParams.get('p'); // Single page app to load
		if (this.pageName === null) {
			// SPA not specifed, show synergy home page, from there they can login and select a SPA
			const newURL  = encodeURI(`${window.location.pathname}`);
			const newURLs = newURL.split('/');
			const lastToken = newURLs[newURLs.length-1].toLowerCase();
			if (lastToken === ""        ) { window.location.replace(newURL+"app.html?p=home"); }
			if (lastToken === "app.html") { window.location.replace(newURL+"?p=home"        ); }
			// should  never get here, since above code replaces this page 
		}
	
		//this.css                                        = await this.proxy.getJSON("css.json");
		document.getElementById("footer"    ).innerHTML = await this.proxy.getText("footer.html");
	/*
		if (await this.login.getStatus()) {
			// user logged in
			//document.getElementById("navigation").innerHTML = await this.proxy.getText(`/synergyData/${this.pageName}/menu.html`) 
			//document.getElementById("userName"  ).innerHTML = `${localStorage.nameFirst} ${localStorage.nameLast}`
		} else {
			// user not logged in
			//document.getElementById("navigation").innerHTML = await this.proxy.getText("menu.html")
		}
	*/
		// load main html
		document.getElementById("main").innerHTML = await this.proxy.getText(`/synergyData/${this.pageName}/_.html`);
	
		// load spa_module
		let element = document.createElement('script');
		element.src = `/synergyData/${this.pageName}/_.js`;
		element.type = "module";
		document.head.appendChild(element);

		// load css
		element      = document.createElement('link');
		element.href = `/synergyData/${this.pageName}/_.css`;
		element.rel  = "stylesheet"; 
		document.head.appendChild(element);
	}
	
	
	toggle(dom){ // spa_class - client side
		// toggle visibilty of dom element
		const e=document.getElementById(dom).style;
		if (e.display === "none") {
			// show element
			// assume we are toggleing a <div> or other block tag,  this will break code if the orignial display is something other than block;
			e.display = "block";  
		} else {
			// hide element
			e.display = "none";
		}
	//	document.getElementById(dom).style.visibility = "visible";   does not reliable hide children
	//	document.getElementById(dom).style.transform = "scale(1,1)";  did not work for me
	}
	
	
	} //  appClass - client side

	export {spa_class};