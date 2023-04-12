class proxyClass { // proxyClass - client - side

/*

class to work with other web servers

*/

constructor() {  // proxyClass - client - side
}

/* Rest API
Create  - post
Read.   - get
Update  - put
Delete. - delete
*/


async RESTpost(   // proxyClass - client - side
   buffer // create binary resource on server
  ,url = window.location.href // server, default to current server
) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/octet-stream'  //application/octet-stream
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: buffer // body data type must match "Content-Type" header
  });
  return response
}


//----------------------

async postJSON(   // proxyClass - client - side
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
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: json // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}


async getJSON(  // proxyClass - client - side
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


async getText(url) {   // proxyClass - client - side
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


}  // proxyClass - client - side  // end of class
