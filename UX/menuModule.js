class menuClass {

/*
this can be thought of as "colmn menu" simlar to selecting files in column view.  

*/

#DOMid

constructor(DOMid){ // calendarEditClass  client-side
  this.#DOMid = DOMid;   // where menu is displayed
  document.getElementById(DOMid).innerHTML = `
  <table>
  <caption></caption>
  <tr id='${this.#DOMid}_row'></tr>
  </table>
  `
}

/*
menu(  // menuClass- client side
){  // init menu for application, display dropdown list of pages,
  // remember menu selection
  const e = document.getElementById('page');
  const i = e.selectedIndex;

  // add or remove data dependant menu items
  let html = `<option value= "home"     >Home </option>`

  if (this.login.getStatus()) {
    // logged in, so let user load data
    html += '<option value= "loadYear"  >Load Year</option>'
  }

  if (0<app.pages.loadYear.year) {
    // data is loaded, show allow options that use data
    html += `
    <option value= "reconcile" >Reconcile</option>
    <option value= "statements">Statements</option>
    <option value= "data"      >View/Edit Data</option>
    `
  }
  document.getElementById("page").innerHTML = html;

  // resore menu selection
  e.selectedIndex = i;
}
*/

add(  // menuClass- client side
  html    // html for menu
  ){
  const newMenue = document.createElement("td")
  newMenue.innerHTML = html;
  document.getElementById(`${this.#DOMid}_row`).appendChild(newMenue);
}


deleteTo(  // menuClass- client side
  index //
  ) {
  const e = document.getElementById(`${this.#DOMid}_row`);

  while ( index < e.childElementCount ) {
    e.removeChild(e.lastElementChild);
  }
}
  
} // menuClass client-side  -end class

export {menuClass} 