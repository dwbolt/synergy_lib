import  {proxyClass   }   from '/_lib/proxy/proxyModule.js'  ;

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
  this.form        = null; // holds pointer to form
  this.loginTrue;  //  callback functions
  this.loginFalse; //  callback functions
}


buildForm(  // loginClass - client side
  idDOM  // place to put form
) {
  this.form = document.getElementById(idDOM);
  let logInOut,loginState;

  // get login State
  if (this.getStatus()) {
    // logged in
    logInOut   = "Log Out";
    loginState = `Logged in top menu.`
  } else {
    // not logged in
    logInOut   = "Log In";
    loginState = "Logged out top menu.";
  }

  this.form.innerHTML = `
  Username: <input id='userName'> <br/>
  Password: <input id='password'  type='password' onkeydown='app.login.onEnter(this,event)'> enter or return key will attempt login<br/>
  <input class='button' type='button' value='${logInOut}'      onclick='app.login.logInOut(this)'>
  <input class='button' type='button' value='Change Password'  onclick='app.login.buildFormChangePWD()'>
  <p id='msg'>${loginState}</p>`;
}


buildFormUserAdd(  // loginClass - client side
idDom
) {
  document.getElementById(idDom).innerHTML =  `
  Username:     <input id='userName'   > <br/>
  First Name:   <input id='nameFirst'  > <br/>
  Last Name:    <input id='nameLast'   > <br/>
  Email:        <input id='email'      > <br/>
  Phone number: <input id='phone'      > <br/>
  Password New: <input id='password'> <br/>
  <input class='button' type='button' value='Add User'  onclick='app.login.userAdd(this)'>
  <p id='msg'></p>
    `;
}

 async userAdd() {// loginClass - client side

  // process server responce
  const msg = `{
    "server"      : "web"
    ,"msg"        : "addUser"
    ,"user"       : "${document.getElementById("userName" ).value}"
    ,"nameFirst"  : "${document.getElementById("nameFirst").value}"
    ,"nameLast"   : "${document.getElementById("nameLast" ).value}" 
    ,"email"      : "${document.getElementById("email"    ).value}" 
    ,"phone"      : "${document.getElementById("phone"    ).value}" 
    ,"pwd"        : "${document.getElementById("password" ).value}"
  }`

  const serverResp = await app.proxy.postJSON(msg);
  if (serverResp.msg) {
    // user added
    alert("User was sucessfully Added/changed");
  } else {
    // user was not added
    alert(`User add Failed,${JSON.stringify(serverResp)}`);
  }
}


async changePWD() {// loginClass - client side
  const user     = document.getElementById("userName").value;
  const pwd      = document.getElementById("password").value;
  const pwdNew   = document.getElementById("passwordNew").value;
  const pwdNew2  = document.getElementById("passwordNew2").value;

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

  const serverResp = await app.proxy.postJSON(msg);
  if (serverResp.msg) {
    // password changed
    alert("Password was sucessfully changed");
  } else {
    // password was not changed
    alert(`passward change Failed,${JSON.stringify(serverResp)}`);
  }
}


buildFormChangePWD(  // loginClass - client side
) {
  this.form.innerHTML =  `
  Username:    <input id='userName'                    ><br/>
  Password:    <input id='password'     type='password'><br/>
  Password New <input id='passwordNew'  type='password'><br/>
  Retype New   <input id='passwordNew2' type='password'><br/>
  <input class='button' type='button' value='Change Password'  onclick='app.login.changePWD(this)'>
  <p id='msg'></p>
    `;
}


async changePWD() {// loginClass - client side
  const user     = document.getElementById("userName").value;
  const pwd      = document.getElementById("password").value;
  const pwdNew   = document.getElementById("passwordNew").value;
  const pwdNew2  = document.getElementById("passwordNew2").value;

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

  const serverResp = await app.proxy.postJSON(msg);
  if (serverResp.msg) {
    // password changed
    alert("Password was sucessfully changed");
  } else {
    // password was not changed
    alert(`passward change Failed,${JSON.stringify(serverResp)}`);
  }
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
  // public: Sends the username and password to the server
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

    // ask server if this is a valid user
    const msg = `{
      "server" : "web"
      ,"msg"   : "login"
      ,"user"  : "${user}"
      ,"pwd"   : "${pwd}"
    }`

  // process server responce
  const serverResponse = await app.proxy.postJSON(msg);
  if (serverResponse.msg) {
    // login worked
    // this instance will go away when a new page loads, so save info in localStorage
      localStorage.user      = user;
    sessionStorage.user      = user;
      localStorage.nameFirst = serverResponse.nameFirst;
    sessionStorage.nameFirst = serverResponse.nameFirst;
      localStorage.nameLast  = serverResponse.nameLast;
    sessionStorage.nameLast  = serverResponse.nameLast;
    document.getElementById('msg').innerHTML  = `Menu reflects logged in state.`
    if (typeof(this.loginTrue) === "function") {
        // call application login true function
        this.loginTrue(msg);
    }

    // toggle button to logout
    DOMbutton.value   = "Log Out";
    window.location.reload();
  } else {
    // login failed
    document.getElementById('msg').innerHTML = 'Loggin Failed'
    if (typeof(this.loginFalse) === "function") {
        // call application login true function
        this.loginFalse();
    }
  }
}


displayUser( dom){
  document.getElementById(dom).innerHTML = `${sessionStorage.user} - ${localStorage.nameLast }, ${localStorage.nameFirst} `
}


async logout( // loginClass - client side
  DOMbutton
) {
  // ask server to logout
  const msg = `{
     "server"  : "web"
    ,"msg"     : "logout"
  }`

  // process server responce
  const serverResponse = await app.proxy.postJSON(msg);
  if (serverResponse.msg) {
    // log out worked on server side, all session information cleared

    // erase client side long in information
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("nameFirst");
    sessionStorage.removeItem("nameLast");
    sessionStorage.removeItem("userKey");

    document.getElementById('msg').innerHTML = `Menu reflects loggout state.`
    // toggle button to loggin
    DOMbutton.value   = "Log In";
    window.location.reload();
  } else {
    // logout failed
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


getStatus( // loginClass - client side
){
  // need to check server, for now just check cookkie, could also get timeout from server to make this better
  //https://www.w3schools.com/js/js_cookies.asp
  const cookies = document.cookie       // convert to string
  const cookiesA = cookies.split('; ')        // create arry of keys
  for (let i=0; i<cookiesA.length ;i++) {
    let keyValue = cookiesA[i].split('=');
    if (keyValue[0]==="userKey") {
      if (0 === keyValue[1].length) {
        return false;       // user has logged out
      } else {
        return true;        // client thinks the user is longed in - server may not
      }
    }
  }
  
  return false;
}

}  // loginClass - client-side // end class

export {loginClass};