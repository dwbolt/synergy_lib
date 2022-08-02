class footerClass {

constructor() {
  this.json = {}
}


// load the footer
async loadFooter() {
	this.json = await app.proxy.getJSON(`/synergyData/app/footer.json`); // load the file that contains the footer data

	let html = `<div class="thick-border">
		<div class="thin-border">
			<div class="footer-content">`;

	// add the logo
	html += `<img src="`+this.json.logo[0].img+`" class="footer-logo" alt="`+this.json.logo[0].alt+`" />
		<div class="footer-links">
			<div class="columns">`;

	// add the phone
	html += `<div>`+this.json.phone+`</div>`;

	// add the social media links
	html += `<div>`;
	this.json.social.forEach((s, i) => { // s is each social media item in the "social" array
		html += `<a href="`+s.url+`" target="_blank"><img src="`+s.img+`" class="social" alt="`+s.alt+`" /></a>`;
	});
	html += `</div>`;

	// add the email
	html += `<div><a href="mailto:`+this.json.email+`" class="email">`+this.json.email+`</a></div>
		</div>`;

	// add the resource links
	html += `<div class="columns">
		<div>
			<p>Resources</p>`;
	this.json.resources.forEach((r, i) => { // r is each resource in the "resources" array
		html += `<p><a href="`+r.url+`">`+r.text+`</a></p>`;
	});
	html += `</div>`;

	// add the physical address
	html += `<div>
			<p>`+this.json.address[0]+`</p>
			<p>`+this.json.address[1]+`</p>
		</div>`;

	// add the involvement links
	html += `<div>
		<p>Get Involved</p>`;
	this.json.involve.forEach((v, i) => { // v is each item in the "involve" array
		html += `<p><a href="`+v.url+`">`+v.text+`</a></p>`;
	});
	html += `</div>
		</div>`;

	// add the copyright info
	html += `<div class="copyright">`+this.json.copyright+`</div>
						</div>
					</div>
				</div>
			</div>`;

	document.getElementById("footer").innerHTML = html;
}


} // end class
