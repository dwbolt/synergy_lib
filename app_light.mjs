// load external modules
import {web_components } from '/_lib/web_components/web_components.mjs' ; // class that allows dynamic loading of web_components
import {format         } from '/_lib/format/_.mjs'       ; // static class that formats data
const {sfc_dialog    } = await import(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-dialog/_.mjs` );  
const {sfc_login     } = await import(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-login/_.mjs`  );  


export class app_light { // synergy.SFCKnox.org web site

/**
 *  min application, give spa a way to load _lib from correct place
 */


constructor(domain) {  // app_light - client side
	this.lib  = `${domain}_lib/`   // get local of _lib 
	// load minimal things that application needs
	this.format = format;  // give other modules access to format static class
	
	// add one dialog and login.  Not all applications need login, but most do and it is small
	document.body.innerHTML += "<sfc-dialog></sfc-dialog> <sfc-login></sfc-login>";

	this.sfc_dialog = document.querySelector("sfc-dialog");  //
	this.sfc_login  = document.querySelector("sfc-login" );  //
}

async main() {
	this.web_components = new web_components();
}


async load(// app_light - client side
path // to module to load
){
	return await import(`${this.lib}/${path}`);  
}

} // end app_light
