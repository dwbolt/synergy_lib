import  {proxy     } from '/_lib/proxy/_.mjs'  ;
import  {sfc_dialog} from '/_lib/web_components/sfc-dialog/_.mjs'  ;

export class sfc_login extends sfc_dialog { // sfc_login - client side


constructor() {  // sfc_login - client side
	// constructor is called when the element is displayed
	super();  // will create this.shadow
	this.set("title","Login");
}


user_display(){  // sfc_login - client side
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
  
	const serverResp = await proxy.postJSON(msg);
	if (serverResp.msg) {
	  // password changed
	  alert("Password was sucessfully changed");
	} else {
	  // password was not changed
	  alert(`passward change Failed,${JSON.stringify(serverResp)}`);
	}
  }


async login_status_update(       // sfc_login - client side
) {
	let logInOut,loginState;
	const login_status = document.getElementById("login_status");

	if (login_status === null || login_status === undefined) {
		// need to  find bug, this should not happen, for now just prevent error
		return;
	}

	// get login State
	if (await this.getStatus()) {
	  // logged in
	  login_status.innerHTML = this.user_display();
	  logInOut                  = "Log Out";
	  loginState                = `Logged in: ${this.user_display()}`;
	  if (this.e_pwd_change) {this.e_pwd_change.hidden = false;}            	// conside refactor, do not like all the testing before setting a value.
	  if (this.e_new       ) {       this.e_new.hidden = false;}
	} else {
	  // logged out
	  login_status.innerHTML    = "";
	  logInOut                  = "Log In";
	  loginState                = "Logged out";
	  if (this.e_pwd_change) {this.e_pwd_change.hidden = true;}
	  if (this.e_new       ) {       this.e_new.hidden = true;}

	  if (this.e_form) {this.e_form.innerHTML = `
Username: <input id='user_name'> <br/>
Password: <input id='password'  type='password'> enter or return key will attempt login<br/>
`;}
		this.input_user_name  = this.shadow.getElementById("user_name");
		this.input_password   = this.shadow.getElementById("password" );
		if (this.input_password) {this.input_password.addEventListener('keydown', this.on_enter.bind(  this));}
	}
	
	if (this.e_login_out) {this.e_login_out.innerHTML = logInOut;}  // update button
	this.set("title",loginState)           ;  // update message
}


async show_login(     // sfc_login - client side
){
	this.set("body",`
<p>
The login feature is in beta testing.  We hope to make it production by the end of 2024.
</p>

<p id="form"></p>
<p id='msg'></p>
		`);

	this.set("buttons",`
		<button id="login_out"  class="button">Log Out</button>
<button id="pwd_change" class="button">Change Password</button>
<button id="new"        class="button">Create New Login</button>`);

	this.e_form       = this.shadow.getElementById("form");
	this.e_msg        = this.shadow.getElementById("msg");

	// add eventListners for buttons
	this.e_login_out  = this.shadow.getElementById("login_out" );  this.e_login_out.addEventListener('click',     this.login_out.bind( this));
	this.e_pwd_change = this.shadow.getElementById("pwd_change"); this.e_pwd_change.addEventListener('click',    this.pwd_change.bind( this));
	this.e_new        = this.shadow.getElementById("new"       );        this.e_new.addEventListener('click', this.user_new_form.bind( this));

	await this.login_status_update();
	this.show_modal();
}


user_new_form(){
	this.e_form.innerHTML =  `
Username:     <input id='user_name'  > <br/>
First Name:   <input id='nameFirst'  > <br/>
Last Name:    <input id='nameLast'   > <br/>
Email:        <input id='email'      > <br/>
Phone number: <input id='phone'      > <br/>
Password New: <input id='password'   > <br/>
<button id="user_add">Add User</button>
<p id='msg'></p>`;

this.shadow.getElementById("user_add").addEventListener('click', this.user_add.bind(this));
}

async user_add() {// loginClass - client side
	// process server responce
	const msg = {
		"server"      : "web"
		,"msg"        : "addUser"
		,"user"       : this.shadow.getElementById("user_name" ).value
		,"nameFirst"  : this.shadow.getElementById("nameFirst").value
		,"nameLast"   : this.shadow.getElementById("nameLast" ).value
		,"email"      : this.shadow.getElementById("email"    ).value
		,"phone"      : this.shadow.getElementById("phone"    ).value
		,"pwd"        : this.shadow.getElementById("password" ).value
	}
  
	const serverResp = await proxy.postJSON(JSON.stringify(msg));
	if (serverResp.msg) {
	  // user added
	  alert("User was sucessfully Added/changed");
	} else {
	  // user was not added
	  alert(`User add Failed,${JSON.stringify(serverResp)}`);
	}
}


async login_force( callback ) {   // sfc_login - client side
	// prompt user to login if they are not logged in
	if (await this.getStatus() ) {
		// already logged in, no need to do anything
		return true;
	} else {
		// prompt user to logint
		this.loginTrue = callback;  // will call function, if login is successfull
		this.show_login();	
	}
}


async login_out(  // sfc_login - client side
  ) {
	// get user credentials from web page
	if        (this.e_login_out.innerHTML === "Log In" ) {await this.login( );
	} else if (this.e_login_out.innerHTML === "Log Out") {await this.logout();
	} else {
		this.e_msg.innerHTML = `error this.e_login_out.innerHTML="${this.e_login_out.innerHTML}"`
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
	const serverResponse = await proxy.postJSON(msg);
	if (serverResponse.msg) {
		// login worked
		// this instance will go away when a new page loads, so save info in localStorage
		localStorage.user        = user;
		sessionStorage.user      = user;
		localStorage.nameFirst   = serverResponse.nameFirst;
		sessionStorage.nameFirst = serverResponse.nameFirst;
		localStorage.nameLast    = serverResponse.nameLast;
		sessionStorage.nameLast  = serverResponse.nameLast;

		if (typeof(this.loginTrue) === "function") {
			// call application login true function
			this.loginTrue();
			this.close();        // close login dialog box hid 
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


async logout(            // sfc_login - client side
  ) {
	// ask server to logout
	const msg = `{
	   "server"  : "web"
	  ,"msg"     : "logout"
	}`
  
	// process server responce
	const serverResponse = await proxy.postJSON(msg);
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
	const serverResponse = await proxy.postJSON(`{"server":"web", "msg":"logged_in"}`);
	return serverResponse.msg;  // true -> logged in 
  }

} // end sfc_login


customElements.define("sfc-login", sfc_login); // tie class to custom web component
