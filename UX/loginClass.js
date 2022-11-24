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

  this.html         = {} // holds

  this.html.login = `
Username: <input id='userName'> <br/>
Password: <input id='password'  type='password' onkeydown='app.login.onEnter(this,event)'> enter or return key will attempt login<br/>
<input class='button' type='button' value='Log In'           onclick='app.login.logInOut(this)'>
<input class='button' type='button' value='Change Password'  onclick='app.login.changePWD(this)'>
<p id='msg'></p>
  `;

  this.html.changePWD = `
Username: <input id='userName'> <br/>
Password: <input id='password'  type='password'><br/>
Password New <input class='button' type='button' value='Log In'           '>
Retype New  <input class='button' type='button'  value='Change Password'
 onclick='app.login.changePWD(this)'>
<p id='msg'></p>
  `;

}


buildForm(  // loginClass - client side
  idDOM  // place to put form
) {
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
  document.getElementById(idDOM).innerHTML =
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

async logInOut(
  button //
) {
<<<<<<< Updated upstream
  const encoder  = new TextEncoder();
  const buffer   = encoder.encode(s_pwd);                          // conver string pwd to buffer
  const digest   = await crypto.subtle.digest('SHA-256', buffer);  // convert data buffer to a digest buffer
  const s_digest = btoa( new Uint8Array(digest) );                 // convert binary digest to string
  return s_digest;
}

getStatus(){
  // need to check server
  return this.status;
}

// loginClass - client side
// public: Sends the username and password digest to the server
// server returns s in order to try to log in
async login(
  DOMbutton  // login button
) {
    // get user credentials from web page
=======
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
>>>>>>> Stashed changes
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


<<<<<<< Updated upstream
async logout() { // loginClass - client side
  // public: Logs the user out by hiding the workspace, showing the login controls, and telling the server to end the user's session
=======
async logout( // loginClass - client side
  // public: Logs the user out by hiding the workspace,
  DOMbutton
) {
>>>>>>> Stashed changes
  // ask server to logout
  const msg = `{
    "server"      : "web"
    ,"msg"        : "logout"
  }`
   localStorage.removeItem("nameFirst");
 sessionStorage.removeItem("nameFirst");
   localStorage.removeItem("nameLast");
 sessionStorage.removeItem("nameLast");
 sessionStorage.removeItem("userKey");

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

<<<<<<< Updated upstream

  // Private functions
// loginClass
  loginupdateDOM() { // private: Changes the login div to reflect that a user is logged in
  	// Show person info in info span
  	const info = document.getElementById("userInfo");
  	info.innerHTML = `user:<span idr="userHandle">${this.userHandle}</span> &nbsp; app:${this.subapp} &nbsp; version:${this.version} &nbsp; DBlocation:${this.serverLocation} `;
    if (this.DBs.length > 1) {
      const dropdown = app.createDBDropdown(true);
      info.appendChild(dropdown);
      dropdown.setAttribute('onchange', "app.widget('changeDB', this)");
    }
  	info.classList.add('loggedIn');

  	// Turn login button into logout button
  	const loginButton = document.getElementById("loginButton");
  	loginButton.setAttribute("value", "Log Out");
  	loginButton.setAttribute("onclick", "app.widget('logout', this)");

  	// Hide name and password inputs
  	const controls = document.getElementById("loginControls");
  	controls.classList.add("hidden");
    controls.innerHTML = ""; // REMOVE name and password fields to try to fix autocomplete bug

    // add show profile button and popup, if they weren't already there
    const currentProfileButton = app.domFunctions.getChildByIdr(this.loginDiv, 'changeProfileButton');
    if (!currentProfileButton) {
      const profileButton = document.createElement('input');
      loginButton.parentElement.insertBefore(profileButton, loginButton.nextElementSibling); // insert the profile button after the login button
      profileButton.outerHTML = `<input idr="changeProfileButton" type="button" value="My Profile" onclick="app.widget('changeProfile', this)">`;
    }

    const currentProfilePopup = app.domFunctions.getChildByIdr(this.loginDiv, 'profilePopup');
    if (!currentProfilePopup) {
      const profilePopup = document.createElement('div');
      this.loginDiv.appendChild(profilePopup);
      profilePopup.outerHTML = `
        <div class="popup hidden" idr="profilePopup">
          <div class="popupHeader" idr="profilePopupHeader"></div>
          <div>
            <p>Name (edit to change your username): <input idr="profilePopupName" onblur="app.widget('checkUserName', this)"></p>
            <p>Current password (required): <input type="password" idr="profilePopupOldPassword"></p>
            <p>New password (leave blank if not changing password): <input type="password" idr="profilePopupPassword" onblur="app.widget('checkPassword', this)"></p>
            <p><input type="button" value="OK" idr="profilePopupOK" onclick = "app.widget('profilePopupOK', this)">
            <input type="button" value="Cancel" idr="profilePopupCancel" onclick="app.widget('profilePopupCancel', this)"></p>
          </div>
        </div>`;
    }

  	// Show favorites bar
  	document.getElementById("faveTable").classList.remove("hidden");

    // // Show required table
    // document.getElementById("searchLinks").classList.remove("hidden");
  }


// loginClass
  logoutUpdateDOM() { // private: Changes the login div to reflect that no user is logged in
  	// Show "Not Logged In" in info span
  	const info = document.getElementById("userInfo");
  	info.textContent = `Not Logged In`;
  	info.classList.remove("loggedIn");

  	// Turn login button into logout button
  	const button = document.getElementById("loginButton");
  	button.setAttribute("value", "Log In");
  	button.setAttribute("onclick", "app.widget('login', this)");

  	// Show name and password inputs, and reset their values to ""
  	const controls = document.getElementById("loginControls");
  	controls.classList.remove("hidden");
    controls.innerHTML = `
      Username: <input id="userName" idr="userName">
      Password: <input type="password" id="password" idr="userName" onkeydown="app.widget('loginOnEnter', this, event)">`;

    // Remove show profile button and popup
    const profileButton = app.domFunctions.getChildByIdr(this.loginDiv, 'changeProfileButton');
    if (profileButton) {
      profileButton.parentElement.removeChild(profileButton);
    }
    const profilePopup = app.domFunctions.getChildByIdr(this.loginDiv, 'profilePopup');
    if (profilePopup) {
      profilePopup.parentElement.removeChild(profilePopup);
    }

  	// Hide favorites bar
  	document.getElementById("faveTable").classList.add("hidden");
  }


setLoginTrue( // loginClass - client-side
  callBackFunction
){
=======
// loginClass - client-side
setLoginTrue(callBackFunction){
>>>>>>> Stashed changes
  this.loginTrue = callBackFunction;
}


setLoginFalse( // loginClass-  client-side
  callBackFunction
){
  this.loginFalse = callBackFunction;
}


<<<<<<< Updated upstream
}  // loginClass - client-side  // end class
=======
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
>>>>>>> Stashed changes
