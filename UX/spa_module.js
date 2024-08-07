import  {loginClass     }   from '/_lib/UX/login_module.js'     ;
import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'  ;
import  {formatClass    }   from '/_lib/format/format_module.js'  ;


class spa_class { // synergy.SFCKnox.org web site

constructor() {  // spa_class - client side
	this.urlParams  = new URLSearchParams( window.location.search );
	this.login      = new loginClass();
	this.proxy      = new proxyClass();
	this.format     = new formatClass();
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
	
	document.getElementById("footer"    ).innerHTML = await this.proxy.getText("footer.html");

	// load main html
	document.getElementById("main").innerHTML = 
	    await this.proxy.getText(`/synergyData/spa/${this.pageName}/_.html`);

	// load spa_module
	let element = document.createElement('script');
	element.src = `/synergyData/spa/${this.pageName}/_.mjs`;
	element.type = "module";
	document.head.appendChild(element);

	// load css
	element      = document.createElement('link');
	element.href = `/synergyData/spa/${this.pageName}/_.css`;
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