// load external modules
const {sfc_dialog    } = await import(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-dialog/_.mjs` );  
const {sfc_login     } = await import(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-login/_.mjs`  );  


export class app_light { // synergy.SFCKnox.org web site

/**
 *  min application, give spa a way to load _lib from correct place
 */


constructor() {  // app_light - client side
	// load minimal things that application needs

	// add one dialog and login.  Not all applications need login, but most do and it is small
	document.body.innerHTML += "<sfc-dialog></sfc-dialog> <sfc-login></sfc-login>";

	// get local of _lib 
	const host = window.location.hostname.split(".");
	if      ( host[0].includes("_local") ) { this.lib = `https://synergy_local.sfcknox.org/_lib`;} // use _lib on local      server
	else if ( host[0].includes("_beta" ) ) { this.lib =  `https://synergy_beta.sfcknox.org/_lib`;} // use _lib on beta       server
	else                                   { this.lib =       `https://synergy.sfcknox.org/_lib`;} // use _lib on production server

	this.sfc_dialog = document.querySelector("sfc-dialog");  //
	this.sfc_login  = document.querySelector("sfc-login" );  //
}


async load(// app_light - client side
path // to module to load
){
	return await import(`${this.lib}/${path}`);  
}

} // end app_light
