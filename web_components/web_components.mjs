export class web_components { 

/*

Used to dynamical load web components

code inspired from chatgpt to dynically load web components
https://chatgpt.com/c/674f1bef-b588-800b-ab8b-2c1a42c863e2

*/

constructor() {  // web_components - client side
	// get local of _lib 
	/*
	const host = window.location.hostname.split(".");
	if      ( host[0].includes("local") ) { this.lib = `https://synergy_local.sfcknox.org/_lib`;} // use _lib on local      server
	else if ( host[0].includes("beta" ) ) { this.lib =  `https://synergy_beta.sfcknox.org/_lib`;} // use _lib on beta       server
	else                                  { this.lib =       `https://synergy.sfcknox.org/_lib`;} // use _lib on production server
*/
	this.map = {
		 "sfc-calendar"     : `${app.lib}web_components/sfc-calendar/_.mjs` 
		,"sfc-dialog"       : `${app.lib}web_components/sfc-dialog/_.mjs` 
		,"sfc-disk"         : `${app.lib}web_components/sfc-disk/_.mjs`
		,"sfc-html"         : `${app.lib}web_components/sfc-html/_.mjs`
		,"sfc-img"          : `${app.lib}web_components/sfc-img/_.mjs`  
		,"sfc-login"        : `${app.lib}web_components/sfc-login/_.mjs`  
		,"sfc-not-mapped"   : `${app.lib}web_components/sfc-not-mapped/_.mjs`
		,"sfc-select-order" : `${app.lib}web_components/sfc-select-order/_.mjs`
		,"sfc-urls"         : `${app.lib}web_components/sfc-urls/_.mjs` 

		,"sfc-table"        : `${app.lib}MVC/table/c.mjs`
		,"sfc-record"       : `${app.lib}MVC/table/c_record.mjs`
		,"sfc-graph-v"      : `${app.lib}MVC/graph/v.mjs`
		,"sfc-graph-node-v" : `${app.lib}MVC/graph/node/v.mjs`
	}
}


async check(  // web_components - client side
	dom // check for any unload web componets is dom section
){
	if (dom.querySelectorAll === undefined) return;  // feels like there should be a better way to prevent error

	const elements = dom.querySelectorAll('*');
	for(let i=0; i<elements.length; i++) {
		const node      = elements[i];
		await this.load(node);
	}
}


async observer_create(){  // web_components - client side
	this.observer = new MutationObserver( await this.observe.bind(this)     ); // create Mutaion Observer
}


async observer_add(dom){  // web_components - client side
	this.observer.observe(dom, { childList: true, subtree: true } ); // check anytime body changes
}


async observe(mutaions) {  // web_components - client side
	// dom changed, see if there are any unload web componets
	for(let i=0; i<mutaions.length; i++) {
		const nodes = mutaions[i].addedNodes;
		for(let ii=0; ii<nodes.length; ii++) {
			// custom component not loaded
			const node = nodes[ii];
			await this.check(node);
		}
	}
}


async load(  // web_components - client side
	node // web componet to load
) {
	if (node.nodeType !== Node.ELEMENT_NODE) {return;} // assume only nodes can be web-componets

	const tag_name = node.tagName.toLowerCase()     ;  // get html tagname and convert to lower case for compare
	if (!tag_name.includes('-')            ) {return;} // node does not have "-" in it's name, not a web component
	if (customElements.get(tag_name)       ) {return;} // component already loaded, nothing todo

	let path = ""
	if ( this.map[tag_name]) {
		// there is path in this.map
		path = this.map[tag_name];
	} else {
		// componet is not in map, so map it <sfc_not_mapped> so message in html that it was not loaded
		path = this.map["sfc-not-mapped" ];
		const {sfc_not_mapped} = await import(path); // make sure sfc_not_mapped is defined
		customElements.define(tag_name, sfc_not_mapped); // tie class to custom web component
		return
	}

	try {
		// try to import web component
		await import(path);
	} catch(err){
		app.sfc_dialog.show_error(`error importing<br> path="${path}"  error=${err}`);
	}
}
	
	
} // end web_components
	