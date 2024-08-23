import  {proxyClass     }   from '/_lib/proxy/_.mjs'  ;
import  {sfc_dialog     }   from '/_lib/web_componets/sfc-dialog/_.mjs'  ;

export class sfc_login extends sfc_dialog { // sfc_login - client side

constructor() {  // sfc_login - client side
	// constructor is called when the element is displayed
	super();  // will create this.shadow
	this.proxy  = new proxyClass();
	this.title_set("Login");
	/*
	if (this.innerHTML === "user_add") {
		this.shadow.innerHTML = "user_add";
	} if (this.innerHTML === "") {
		this.buildForm();
	} else {
		this.shadow.innerHTML =`error, no code to support "${this.shadow.innerHTML}"  `;
	}*/

}


/*
buildForm(  // sfc_login - client side
  ) { 
	// sfc_dialog- client side
	this.shadow.innerHTML = `
	Username: <input id='user_name'> <br/>
	Password: <input id='password'  type='password'> enter or return key will attempt login<br/>
	<button id="login_out"  class="button">Log Out</button>
	<button id="pwd_change" class="button">Change Password</button>
	<p id='msg'></p>`;

	this.input_user_name  = this.shadow.getElementById("user_name");
	this.input_password   = this.shadow.getElementById("password" );
	this.button_login_out = this.shadow.getElementById("login_out");
	this.p_msg            = this.shadow.getElementById("msg");

	this.shadow.getElementById("login_out" ).addEventListener('click'  , this.login_out.bind( this));
	this.shadow.getElementById("pwd_change").addEventListener('click'  , this.pwd_change.bind(this));
	this.shadow.getElementById("password"  ).addEventListener('keydown', this.on_enter.bind(  this));
}
*/

displayUser(){  // sfc_login - client side
	return `${localStorage.user} - ${localStorage.nameLast }, ${localStorage.nameFirst} `
}


async pwd_change() { // sfc_login - client side
	const user     = this.shadow.getElementById("user_name").value;
	const pwd      = this.shadow.getElementById("password").value;
	const pwdNew   = this.shadow.getElementById("passwordNew").value;
	const pwdNew2  = this.shadow.getElementById("passwordNew2").value;
  
	if (pwdNew != pwdNew2) {
	  // make sure new passwords match
	  alert("new passwords do not match, password NOT changed")
	  return;
	}
  
	// process server responce
	const msg = `{
	  "server"      : "web"
	  ,"msg"        : "changePWD"
	  ,"user"       : "${user}"
	  ,"pwd"        : "${pwd}"
	  ,"pwdNew"     : "${pwdNew}"
	}`
  
	const serverResp = await this.proxy.postJSON(msg);
	if (serverResp.msg) {
	  // password changed
	  alert("Password was sucessfully changed");
	} else {
	  // password was not changed
	  alert(`passward change Failed,${JSON.stringify(serverResp)}`);
	}
  }


async login_status_update() {
	let logInOut,loginState;
  
	// get login State
	if (await this.getStatus()) {
	  // logged in
	  logInOut   = "Log Out";
	  loginState = `Logged in: ${this.displayUser()}`;
	} else {
	  // not logged in
	  logInOut   = "Log In";
	  loginState = "Logged out";
	}
	
	this.button_login_out.innerHTML = logInOut  ;  // update button
	this.title_set(loginState);  // update message
}


async show_login(){
	this.body_set(`
Username: <input id='user_name'> <br/>
Password: <input id='password'  type='password'> enter or return key will attempt login<br/>
<p id='msg'></p>
<button id="login_out"  class="button">Log Out</button>
<button id="pwd_change" class="button">Change Password</button>
`);

	this.input_user_name  = this.shadow.getElementById("user_name");
	this.input_password   = this.shadow.getElementById("password" );
	this.button_login_out = this.shadow.getElementById("login_out");
	this.p_msg            = this.shadow.getElementById("msg");

	this.shadow.getElementById("login_out" ).addEventListener('click'  , this.login_out.bind( this));
	this.shadow.getElementById("pwd_change").addEventListener('click'  , this.pwd_change.bind(this));
	this.shadow.getElementById("password"  ).addEventListener('keydown', this.on_enter.bind(  this));

	await this.login_status_update();
	this.show_modal();
}

async login_out(  // sfc_login - client side
  ) {
	// get user credentials from web page
	if        (this.button_login_out.innerHTML === "Log In") {
	  await this.login();
	} else if (this.button_login_out.innerHTML === "Log Out") {
		await this.logout();
	} else {
		this.p_msg.innerHTML = `error this.button_login_out.innerHTML="${this.button_login_out.innerHTML}"`
	}

	this.login_status_update();
  }


  async login( // sfc_login - client side
	// public: Sends the user_name and password to the server
	// server returns s in order to try to log in
  ) {
	  // get user credentials from web page, and make sure something was enter for user_name and password
	const user = this.input_user_name.value;
	const pwd  = this.input_password.value;
	if (!(user && pwd)) {
		alert("Username and password are required!");
	return;
	}
  
	// ask server if this is a valid user
	const msg = `{
	"server" : "web"
	,"msg"   : "login"
	,"user"  : "${user}"
	,"pwd"   : "${pwd}"
	}`
  
	// process server responce
	const serverResponse = await this.proxy.postJSON(msg);
	if (serverResponse.msg) {
		// login worked
		// this instance will go away when a new page loads, so save info in localStorage
		localStorage.user      = user;
		sessionStorage.user      = user;
		localStorage.nameFirst = serverResponse.nameFirst;
		sessionStorage.nameFirst = serverResponse.nameFirst;
		localStorage.nameLast  = serverResponse.nameLast;
		sessionStorage.nameLast  = serverResponse.nameLast;

		if (typeof(this.loginTrue) === "function") {
			// call application login true function
			this.loginTrue(msg);
		}
	} else {
		// login failed
		alert('Loggin Failed');
		if (typeof(this.loginFalse) === "function") {
			// call application login true function
			this.loginFalse();
		}
	}
  }


async logout( // loginClass - client side
  ) {
	// ask server to logout
	const msg = `{
	   "server"  : "web"
	  ,"msg"     : "logout"
	}`
  
	// process server responce
	const serverResponse = await this.proxy.postJSON(msg);
	if (serverResponse.msg) {
	  // log out worked on server side, all session information cleared
  
	  // erase client side long in information
	  sessionStorage.removeItem("user");
	  sessionStorage.removeItem("nameFirst");
	  sessionStorage.removeItem("nameLast");
	  sessionStorage.removeItem("userKey");
	}
}


on_enter( // sfc_login - client side
	// should fire when user is in the passwowrd field on every keystroke
	  element
	, evnt
	, userRequest
  ) {
		// dwb change	 - if (textBox == this.passwordInput && evnt.key == "Enter") {
		if (evnt && evnt.key == "Enter") {
			return this.login(element, userRequest);
		}
  }

  async getStatus( // sfc_login - client side
  ){
	// ask server still logged in
	const serverResponse = await this.proxy.postJSON(`{"server":"web", "msg":"logged_in"}`);
	return serverResponse.msg;  // true -> logged in 
  }

} // end sfc_login


customElements.define("sfc-login", sfc_login); 
