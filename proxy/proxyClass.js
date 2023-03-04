/*

class to work with other web servers
this may need to be on server rather than client

*/


// proxyClass
class proxyClass {


// proxyClass
constructor() {
}


// proxyClass
async postJSON(
   json // json messege to send
  ,url = window.location.href // server, default to current server
) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: json // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}


// proxyClass
async getJSON(
  url // location of json file
) {
    try {
      const f = await fetch(url);
      if (f.ok) { // if HTTP-status is 200-299
        // get the response body (the method explained below)
        let j = await  f.json();
        return j;
      } else {
        alert(`proxyClass.getJSON error: url = ${url}  status = ${f.status}`);
      }
    } catch (e) {
      alert("getJSON" + e);
    }
}


// proxyClass
async getText(url) {
    try {
      const f = await fetch(url);
      if (f.ok) { // if HTTP-status is 200-299
        // get the response body (the method explained below)
        let t = await  f.text();
        return t;
      } else {
        alert(`proxyClass.getText error: url = ${url}  status = ${f.status}`);
      }
    } catch (e) {
      alert("getText" + e);
    }
}


} // end of class
