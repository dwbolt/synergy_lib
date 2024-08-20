import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'  ;

export class sfc_login extends HTMLElement { // sfc_html - client side

constructor() {  // sfc_html - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });
	if (this.innerHTML === "user_add") {
		this.shadow.innerHTML = "user_add";
	} if (this.innerHTML === "") {
		this.buildForm();
	} else {
		this.shadow.innerHTML =`error, no code to support "${this.shadow.innerHTML}"  `;
	}

	onkeydown='app.login.onEnter(this,event)'
}


buildForm(  // loginClass - client side
  ) {
	this.shadow.innerHTML = `
	Username: <input id='user_name'> <br/>
	Password: <input id='password'  type='password'> enter or return key will attempt login<br/>
	<button class='button' id="login_out" >Log Out</button>
	<button class='button'>Change Password</button>
	<p id='msg'></p>`;

	this.shadow.getElementById("login_out").addEventListener( 'click'  , this.login_out.bind( this));
	this.shadow.getElementById("login_out").addEventListener( 'click'  , this.login_out.bind( this));
	this.shadow.getElementById("pwd_change").addEventListener('click'  , this.pwd_change.bind(this));
	this.shadow.getElementById("pwd_change").addEventListener('keydown', this.on_enter.bind(  this));
}


async connectedCallback() { // sfc_html - client side        
	let logInOut,loginState;
  
	// get login State
	if (await this.getStatus()) {
	  // logged in
	  logInOut   = "Log Out";
	  loginState = `Logged in top menu.`
	} else {
	  // not logged in
	  logInOut   = "Log In";
	  loginState = "Logged out top menu.";
	}
    
	this.shadow.getElementById("msg").innerHTML = loginState;
}


onEnter( // loginClass - client side
	// should fire when user is in the passwowrd field on every keystroke
	  element
	, evnt
	, userRequest
  ) {
		// dwb change	 - if (textBox == this.passwordInput && evnt.key == "Enter") {
		if (evnt.key == "Enter") {
			return this.login(element, userRequest);
		}
  }

  async getStatus( // loginClass - client side
  ){
	// ask server still logged in
	const serverResponse = await this.proxy.postJSON(`{"server":"web", "msg":"logged_in"}`);
	return serverResponse.msg;  // true -> logged in 
  }

} // end sfc_html


customElements.define("sfc-login", sfc_login); 
