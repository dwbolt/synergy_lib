export class web_components { 

/*

Used to dynamical load web components

code from chatgpt to dynically load web components
https://chatgpt.com/c/674f1bef-b588-800b-ab8b-2c1a42c863e2

*/

constructor() {  // appClass - client side
	// get local of _lib 
	const host = window.location.hostname.split(".");
	if      ( host[0].includes("local") ) { this.lib = `https://synergy_local.sfcknox.org/_lib`;} // use _lib on local      server
	else if ( host[0].includes("beta" ) ) { this.lib =  `https://synergy_beta.sfcknox.org/_lib`;} // use _lib on beta       server
	else                                  { this.lib =       `https://synergy.sfcknox.org/_lib`;} // use _lib on production server

	this.map = {
		"sfc-html"     : `${this.lib}/web_components/sfc-html/_.mjs`
		,"sfc-img"     : `${this.lib}/web_components/sfc-img/_.mjs`  
		,"sfc-urls"    : `${this.lib}/web_components/sfc-urls/_.mjs` 
		,"sfc-dialog"  : `${this.lib}/web_components/sfc-dialog/_.mjs` 
		,"sfc-login"   : `${this.lib}/web_components/sfc-login/_.mjs`
	}
}


async observer_create(){
	this.observer = new MutationObserver( await this.observe.bind(this)     ); // create Mutaion Observer
}


async observer_add(dom){
	this.observer.observe(dom, { childList: true, subtree: true } ); // check anytime body changes
}


async observe(mutaions) {
	// dom changed, see if there are any unload web componets
	for(let i=0; i<mutaions.length; i++) {
		const nodes = mutaions[i].addedNodes;
		for(let ii=0; ii<nodes.length; ii++) {
			// custom component not loaded
			const node = nodes[ii];
			await this.load(node);
		}
	}
}


async check(
	dom // check for any unload web componets is dom section
){
	const elements = dom.querySelectorAll('*');
	for(let i=0; i<elements.length; i++) {
		const node      = elements[i];
		await this.load(node);
	}
}


async load(
	node // web componet to load
) {
	if (node.nodeType !== Node.ELEMENT_NODE ) return;

	const tag_name = node.tagName.toLowerCase();
	if (tag_name.includes('-')     && // is a web component
		this.map[tag_name]         && // there is a path to load
		!customElements.get(tag_name) //it is not loaded
	) {
		try {
		  await import(this.map[tag_name]);
		} catch(err){
		  alert(`error importing ${tag_name}  error=${err}`);
		}
	}
}


} // end app_spa
