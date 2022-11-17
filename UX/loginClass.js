// loginClass - client side
class loginClass {

  /* code modifed from harmony

  // public
  loginOnEnter(element, evnt, userRequest) - takes a keypress event and, if the key pressed was Enter, calls login (enabling a keyboard shortcut)
  login(element, userRequest) - sends the username and password entered by the user to the server in order to try to log in. Also shows the workspace (buttons, etc.) and hides the login controls.
  logout() - logs the user out by hiding the workspace, showing the login controls, and telling the server to end the user's session.
  dropFavorite(input, evnt) - adds an entry to the favorites list
  saveFavoritesList(control, userRequest) - updates the list of favorites in the database
  changeDB(dropdown, userRequest) - switches to a different database

  // private
  createLogin() - stripped-down code that just gets HTML from widgetLogin.html and plugs it in
  loginupdateDOM() - changes the login div to reflect that a user is logged in

  getSettings(userRequest) - gets the Settings and Favorites documents from the database
  adjustSettings() - If the settings document contains references to attributes that don't exist in the fields object, remove them.
  getFavorites(userRequest, GUIDs) - searches for all favorite documents that aren't already cached
  loadFavorites(GUIDs) - adds an entry to the favorites table for each favorite document
  addFavoriteCell(row, cell, GUID) - adds a single cell to the favorites list, containing information for the doc with the given GUID

  logoutUpdateDOM() - changes the login div to reflect that no user is logged in. Runs on logout or timeout

  createButtons() - Populates the buttons div with a button for each node type. Clicking the button creates a search table for that node type.
  removeButtons() - clears the list of search buttons
  removeWidgets() - removes all widgets from the work area. Runs when user logs out, or when a DIFFERENT user logs in after timeout

  // unused
  createDebug - currently, dummy function that just alerts it's been called - will eventually create the debug header if/when we reintroduce it
  buildRegressionHeader - currently, dummy function that just alerts it's been called - will eventually create the regression header
  */

// loginClass - client side
constructor(
) { // public: Creates the widgetLogin instance
  this.proxy = new proxyClass();
  this.user;            // json object returned when users logs in
  this.requests    = [];   // Used by REST to track requests made by this widget.
  this.status      = false; // not logedin yet
  this.loginTrue;  //  callback functions
  this.loginFalse; //  callback functions
}


// loginClass - client side
buildForm(
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
  document.getElementById(idDOM).innerHTML = `
Username: <input id='userName'> <br/>
Password: <input type='password' id='password'  onkeydown='app.login.onEnter(this,event)'><br/>
<input class='button' type='button' id='loginButton'  value='Log In'  onclick='app.login.login(this)'>
<input class='button' type='button' id='logoutButton' value='Log Out' onclick='app.login.logout(this)'>
<div id='myPage'></div>
  `;
  document.getElementById('myPage').innerHTML = loginState;
}


// loginClass - client side
// should fire when user is in the passwowrd field on every keystroke
onEnter(element, evnt, userRequest) { // public: Takes a keypress event and, if the key pressed was Enter, calls login (enabling a keyboard shortcut)
  	// dwb change	 - if (textBox == this.passwordInput && evnt.key == "Enter") {
  	if (evnt.key == "Enter") {
  		return this.login(element, userRequest);
  	}
}


// loginClass - client side
// convert string to digest base64 string
// passwords are not stored on the server, only the digest of the password
async string2digestBase64(
  s_pwd // string
) {
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
    const user = document.getElementById("userName").value;
  	const pwd  = document.getElementById("password").value;

    // make sure something was enter for userName and password
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
  if (this.user.msg) {
    // loged in worked
    this.status = true;
    // this instance will goaway when a new page loads, so save info in localStorage
      localStorage.nameFirst = this.user.nameFirst;
    sessionStorage.nameFirst = this.user.nameFirst;
      localStorage.nameLast  = this.user.nameLast;
    sessionStorage.nameLast  = this.user.nameLast;
    document.getElementById('myPage').innerHTML  = `<a href="/app.html?p=home&u=">${sessionStorage.nameFirst} ${sessionStorage.nameLast}</a>`
    if (typeof(this.loginTrue) === "function") {
        // call application login true function
        this.loginTrue();
    }
  } else {
    this.status = false;
    // login failed
    document.getElementById('myPage').innerHTML = 'Loggin Failed'
    if (typeof(this.loginFalse) === "function") {
        // call application login true function
        this.loginFalse();
    }
  }
}


async logout() { // loginClass - client side
  // public: Logs the user out by hiding the workspace, showing the login controls, and telling the server to end the user's session
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
    document.getElementById('myPage').innerHTML = `Logged out`
  } else {
    // login failed
    document.getElementById('myPage').innerHTML = 'Logout Failed'
  }
}


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
  this.loginTrue = callBackFunction;
}


setLoginFalse( // loginClass-  client-side
  callBackFunction
){
  this.loginFalse = callBackFunction;
}


}  // loginClass - client-side  // end class
