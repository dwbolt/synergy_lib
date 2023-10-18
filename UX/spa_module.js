import  {loginClass     }   from '/_lib/UX/loginModule.js'     ;
import  {proxyClass     }   from '/_lib/proxy/proxyModule.js'  ;
//import  {formatClass    }   from '/_lib/format/formatModule.js';
//import  {widgetListClass}   from '/_lib/UX/widgetListModule.js';


class spa_class { // synergy.SFCKnox.org web site


constructor() {  // spa_class - client side
	this.urlParams  = new URLSearchParams( window.location.search );
	this.login      = new loginClass();
	this.proxy      = new proxyClass();
	//this.format     = new formatClass();
	//this.widgetList;    // will hold instance of widgetListClass
	//this.css;           // var to hold json css file
}


async main() { // appClass - client side
	this.pageName = this.urlParams.get('p'); // Single page app to load
	if (this.pageName === null) {
		// SPA not specifed, show synergy home page, from there they can login and select a SPA
		const newURL  = encodeURI(`${window.location.pathname}`);
		const newURLs = newURL.split('/');
		const lastToken = newURLs[newURLs.length-1].toLowerCase();
		if (lastToken === ""        ) { window.location.replace(newURL+"app.html?p=home"); }
		if (lastToken === "app.html") { window.location.replace(newURL+"?p=home"        ); }
		// should  never get here, since above code replaces the code
	}

	//this.css                                        = await this.proxy.getJSON("css.json");
	document.getElementById("footer"    ).innerHTML = await this.proxy.getText("footer.html");

	if (await this.login.getStatus()) {
		// user logged in
		document.getElementById("navigation").innerHTML = await this.proxy.getText(`/synergyData/${this.pageName}/menu.html`) 
		document.getElementById("userName"  ).innerHTML = `Home for: ${localStorage.nameFirst} ${localStorage.nameLast}`
	} else {
		// user not logged in
		document.getElementById("navigation").innerHTML = await this.proxy.getText("menu.html")
	}

	// load database  page
	document.getElementById("main").innerHTML = await this.proxy.getText(`/synergyData/${this.pageName}/m_main.html`);
}

show(dom){ // appClass - client side
	document.getElementById(dom).hidden = false;
	document.getElementById(dom).style.visibility = true;
}


hide(dom) { // appClass - client side
	document.getElementById(dom).hidden = true;
	document.getElementById(dom).style.visibility = false;
}


} // end spa_class

export { spa_class };
