class menuClass {

// supports two levels of menu

// menuClass  - client side
constructor() {
  this.json = {}  //
}


// menuClass  - client side
async loadMenu() {
  // load the file that contains the menu data
	this.json = await app.proxy.getJSON(`/synergyData/app/menu.json`);

  // init html
	let link, html = `<div>
			<span class="close-nav" onclick="closeNav()">&times;</span>
			<ul class="nav-menu">`;


	// add top menu item
	this.json.items.forEach((m, i) => { // m is each menu item in the "items" array
		// set up the json's url for good matching
		let thisUrl = m.url;
		if (thisUrl.endsWith(`.html`) == false) {
			if (thisUrl.endsWith(`/`) == false) {
				thisUrl += `/`;
			}
		}

    // set up the browser's url for good matching
    let aClass = ``;
    let browserUrl = window.location.href;
    browserUrl = browserUrl.replace(window.location.origin,``);
 		if (browserUrl == thisUrl) {
      // check to see if this should be class="selected"
			aClass = `class="selected"`;
		}

		// check to see if this menu item has children
		let lClass = ``;
		if (m.hasChildren === true) {
			lClass = `class="sub-menu"`;
		}

		// build the list item
    if (0 < m.url.length) {
      // there is a url at the top level
      link = `<a href="${m.url}" ${aClass}>${m.text}</a>`;
    } else {
      // only a label at top level
      link = m.text;
    }
		html += `<li ${lClass}>${link}`;
		html += this.addSubMenu(m) + `</li>`;
	});

	document.getElementById("navigation").innerHTML = html + "</ul></div>";
}


// menuClass  - client side
addSubMenu(m) {
  let html = "";
  // if this menu item has children, add submenu items
  if (m.hasChildren == true) {
    html += `<ul>`;
    this.json.subItems.forEach((s, n) => { // s is each sub-menu item in the "subItems" array
      if (m.text == s.parent) {
        // check to see if this should be class="selected"
        let subClass = ``;
        if (window.location.href == s.url) {
          subClass += ` class="selected"`;
        }

        html += `<li><a href="`+s.url+`"`+subClass+`>`+s.text+`</a></li>`;
      }
    });
    html += `</ul>`;
  }
  return html;
}


// menuClass  - client side
} // end class
