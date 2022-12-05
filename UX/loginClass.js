class loginClass { // loginClass - client side

/* code modifed from harmony
  constructor(
buildForm(
onEnter  - looks ad key press and tries to logsin if ender in pressed
getStatus
login - send to server and try to login
logout() - logs user out of server

// move to server?
string2digestBase64(
  -----------
*/


constructor(  // loginClass - client side
) {
  this.proxy = new proxyClass();
  this.user;            // json object returned when users logs in
  this.requests    = [];   // Used by REST to track requests made by this widget.
  this.status      = false; // not logedin yet
  this.loginTrue;  //  callback functions
  this.loginFalse; //  callback functions

  this.form         = null; // holds pointer to form

  this.html         = {}     // holds
  this.html.login = `
Username: <input id='userName'> <br/>
Password: <input id='password'  type='password' onkeydown='app.login.onEnter(this,event)'> enter or return key will attempt login<br/>
<input class='button' type='button' value='Log In'           onclick='app.login.logInOut(this)'>
<input class='button' type='button' value='Change Password'  onclick='app.login.buildFormChangePWD()'>
<p id='msg'></p>
  `;

  this.html.changePWD = `
Username:    <input id='userName'> <br/>
Password:    <input id='password'     type='password'><br/>
Password New <input id='passwordNew'  type='password'><br/>
Retype New   <input id='passwordNew2' type='password'><br/>
<input class='button' type='button' value='Change Password'  onclick='app.login.changePWD(this)'>
<p id='msg'></p>
  `;
}


buildForm(  // loginClass - client side
  idDOM  // place to put form
) {
  this.form = document.getElementById(idDOM);
  this.form.innerHTML = this.html.login;

  // get login State
  let loginState;
  if (sessionStorage.nameFirst && sessionStorage.nameFirst === localStorage.nameFirst
   && sessionStorage.nameLast  && sessionStorage.nameLast  === localStorage.nameLast
  ) {
    // logged in
    loginState = `<a href="/app.html?p=home&u=">${sessionStorage.nameFirst} ${sessionStorage.nameLast}</a>`
  } else {
    // not logged in
    loginState = "not logged in";
  }

  // put login form on screen
  document.getElementById("msg").innerHTML = loginState;
}


buildFormChangePWD(  // loginClass - client side
) {
  this.form.innerHTML = this.html.changePWD;
}


changePWD(){// loginClass - client side
  alert("changePWD")
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


async logInOut(  // loginClass - client side
  button  // login button
) {
  // get user credentials from web page
  if (button.value === "Log In") {
    await this.login(button);
  } else {
    await this.logout(button);
  }
}


async login( // loginClass - client side
  // public: Sends the username and password digest to the server
  // server returns s in order to try to log in
  DOMbutton  //
) {
    // get user credentials from web page, and make sure something was enter for userName and password
    const user = document.getElementById("userName").value;
  	const pwd  = document.getElementById("password").value;
  	if (!(user && pwd)) {
  		alert("Username and password are required!");
      return;
  	}

    // encrypt password, so the server never sees it
    const pwdDigest = await this.string2digestBase64(pwd);

    // ask server if this is a valid user
    const msg = `{
      "server"      : "web"
      ,"msg"        : "login"
      ,"user"       : "${user}"
      ,"pwdDigest"  : "${pwdDigest}"
    }`

  // process server responce
  this.user = await app.proxy.postJSON(msg);
  this.status = this.user.msg;  // remember login status
  if (this.user.msg) {
    // login worked
    // this instance will go away when a new page loads, so save info in localStorage
      localStorage.nameFirst = this.user.nameFirst;
    sessionStorage.nameFirst = this.user.nameFirst;
      localStorage.nameLast  = this.user.nameLast;
    sessionStorage.nameLast  = this.user.nameLast;
    document.getElementById('msg').innerHTML  = `<a href="/app.html?p=home&u=">${sessionStorage.nameFirst} ${sessionStorage.nameLast}</a>`
    if (typeof(this.loginTrue) === "function") {
        // call application login true function
        this.loginTrue();
    }

    // toggle button to logout
    DOMbutton.value   = "Log Out";
  } else {
    // login failed
    document.getElementById('msg').innerHTML = 'Loggin Failed'
    if (typeof(this.loginFalse) === "function") {
        // call application login true function
        this.loginFalse();
    }
  }
}


async logout( // loginClass - client side
  DOMbutton
) {
    // public: Logs the user out by hiding the workspace
    localStorage.removeItem("nameFirst");
  sessionStorage.removeItem("nameFirst");
    localStorage.removeItem("nameLast");
  sessionStorage.removeItem("nameLast");
  sessionStorage.removeItem("userKey");

  // ask server to logout
  const msg = `{
     "server"  : "web"
    ,"msg"     : "logout"
  }`

  // process server responce
  this.user = await app.proxy.postJSON(msg);
  if (this.user.msg) {
    // out loged in worked
    document.getElementById('msg').innerHTML = `Logged out`
    // toggle button to loggin
    DOMbutton.value   = "Log In";
  } else {
    // login failed
    document.getElementById('msg').innerHTML = 'Logout Failed'
  }
}


setLoginTrue( // loginClass - client-side
  callBackFunction
){
  this.loginTrue = callBackFunction;
}


setLoginFalse( // loginClass-  client-side
  callBackFunction
){
  this.loginFalse = callBackFunction;
}


async string2digestBase64(  // loginClass - client side
  // convert string to digest base64 string
  // passwords are not stored on the server, only the digest of the password
  s_pwd // string
) {
  const encoder  = new TextEncoder();

  const buffer   = encoder.encode(s_pwd);                          // conver string pwd to buffer
  const digest   = await crypto.subtle.digest('SHA-256', buffer);  // convert data buffer to a digest buffer
  const s_digest = btoa( new Uint8Array(digest) );                 // convert binary digest to string
  return s_digest;
}


getStatus( // loginClass - client side
){
  // need to check server
  return this.status;
}


}  // loginClass - client-side // end class
