class menuClass {

/*
this can be thought of as "colmn menu" simlar to selecting files in column view.  

*/

#DOMid

constructor(DOMid){ // menuClass- client side  client-side
  this.#DOMid = DOMid;   // where menu is displayed
}

init(){

}


add(  // menuClass- client side
  html    // html for menu
  ){
  const newMenue     = document.createElement('div');
  newMenue.innerHTML = html;
  newMenue.style     = "border-style: solid; margin:5px 5px 5px 5px; padding:5px 5px 5px 5px;";
  document.getElementById(`${this.#DOMid}`).appendChild(newMenue);
}


deleteTo(  // menuClass- client side
  index //
  ) {
  const e = document.getElementById(`${this.#DOMid}`);

  while ( index < e.childElementCount ) {
    e.removeChild(e.lastElementChild);
  }
}


/*
init(){
  document.getElementById(this.#DOMid).innerHTML = `
  <table>
  <caption></caption>
  <tr id='${this.#DOMid}_row'></tr>
  </table>
  `
}


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
*/


} // menuClass client-side  -end class

export {menuClass} 