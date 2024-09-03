export class proxy { // proxyClass - client - side

/*

class to work with other web servers

*/

constructor() {  // proxyClass - client - side
}

//////////////// start REST API
/* Rest API
Create  - post - will create, error if already exists
Read.   - get
Update  - put  - will create if id does not exist on sever
                 will replace entire object 
Update - patch - only update new or changed fileds                 
Delete. - delete
*/

static async RESTget(url) {   // proxyClass - client - side
  try {
    const f = await fetch(url);
    if (f.ok) { // if HTTP-status is 200-299
      // get the response body (the method explained below)
      let t = await  f.text();
      return {ok:true, value:t};
    } else {
      return {ok:false, value:`file="proxy_module.js"
      method="RESTget"
      url = ${url}
      status = ${f.status}`}
    }
  } catch (e) {
    return {ok:false, value:e};
  }
}


static async RESTpost(   // proxyClass - client - side
   buffer // create binary resource on server
  ,url = window.location.href // server, default to current server
) {
  // Default options are marked with *
  const response = await fetch(encodeURI(url), {
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
  return await response.json();
}

static async RESTput(   // proxyClass - client - side
   buffer // create binary resource on server
  ,url = window.location.href // server, default to current server
) {
  // Default options are marked with *
  const response = await fetch(encodeURI(url), {
    method: 'PUT', // *GET, POST, PUT, DELETE, etc.
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
  return await response.json();
}


static async RESTpatch(   // proxyClass - client - side
   buffer // create binary resource on server
  ,url = window.location.href // server, default to current server
) {
  // Default options are marked with *
  const response = await fetch(encodeURI(url), {
    method: 'PATCH', // *GET, POST, PUT, DELETE, etc.
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
  return await response.json();
}



static async RESTdelete(   // proxyClass - client - side
  url 
) {
  const response = await fetch(encodeURI(url), {
    method: 'DELETE',
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/octet-stream'  //application/octet-stream
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    //body: buffer // body data type must match "Content-Type" header
  });
  return response
}


///////////////////////////////----------------------  replace these with rest api

static async postJSON(   // proxyClass - client - side
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


static async getJSON(  // proxyClass - client - side
  url // location of json file
) {
    try {
      const f = await fetch(url);
      if (f.ok) { // if HTTP-status is 200-299
        // get the response body (the method explained below)
        let j = await  f.json();
        return j;
      } else {
        alert(`${new Error().stack}`)
        alert(`proxyClass.getJSON error: 
url = ${url}  
status = ${f.status}`);
      }
    } catch (e) {
      alert(`${new Error().stack}`)
      alert(`proxyClass.getJSON 
error: url = ${url}  
error = ${e}`);
      alert("getJSON" + e);
    }
}


static async getJSONwithError(  // proxyClass - client - side
  url // location of json file
) {
    try {
      const f = await fetch(url);
      if (f.ok) { // if HTTP-status is 200-299
        // get the response body (the method explained below)
        let j = await  f.json();
        return {"json": j   , "status": f.status};
      } else {
        return {"json": null, "status": f.status};
      }
    } catch (e) {
      return   {"json": null, "error": e}
    }
}


static async getText(url) {   // proxyClass - client - side
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

