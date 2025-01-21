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
	  app.sfc_dialog.show_error("new passwords do not match, password NOT changed")
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
	  app.sfc_dialog.set("title","<h2>Sucess</h2>");  //do I want to log this as an error
	  app.sfc_dialog.set("body",`Password changed`);
	  app.sfc_dialog.show_modal();
	} else {
	  // password was not changed
	  app.sfc_dialog.show_error(`passward change failed<br> serverResp: ${JSON.stringify(serverResp)}`);
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
The login feature is in beta testing.  We hope to make it production in the first quarter of 2025.
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
	const name_user  = this.shadow.getElementById("user_name" ).value;
	const name_first = this.shadow.getElementById("nameFirst" ).value;
	const name_last  = this.shadow.getElementById("nameLast"  ).value;

	const msg = {
		"server"      : "web"
		,"msg"        : "user_add"
		,"user"       : name_user
		,"nameFirst"  : name_first
		,"nameLast"   : name_last
		,"email"      : this.shadow.getElementById("email"    ).value
		,"phone"      : this.shadow.getElementById("phone"    ).value
		,"pwd"        : this.shadow.getElementById("password" ).value
	}
  
	const serverResp = await proxy.postJSON(JSON.stringify(msg));
	if (serverResp.msg) {
	  // user added
	  app.sfc_dialog.set("title","<b>Add User</b>");
	  app.sfc_dialog.set("body" ,`User: ${name_user} <br>First Name: ${name_first} <br>Last Name: ${name_last}`);
	  app.sfc_dialog.show_modal();
	} else {
	  // user was not added
	  app.sfc_dialog.show_error(`User add Failed<br> msg=${JSON.stringify(serverResp)}`);
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
	let b="";  
	const user = this.input_user_name.value;
	const pwd  = this.input_password.value;
	if (0 === user.length) {b+= "user name is missing<br>"}
	if (0 ===  pwd.length) {b+= "password is missing<br>"}
	if ( 0 < b.length ) {
		app.sfc_dialog.set("title",`<b>Missing information</b>`);
		app.sfc_dialog.set("body",`${b}`);
		app.sfc_dialog.show_modal();
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
		if (typeof(this.loginFalse) === "function") {
			this.loginFalse();  // call application login false function
		} else {
			app.sfc_dialog.show_error('Loggin Failed<br>Check "user name" and password and try again.  <br>Contact David if problem persists.');
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
