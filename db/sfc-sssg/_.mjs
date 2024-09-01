/*

<sfc-ssss> web compont

Search, Select, Sort, Group

*/

//import {groupByClass       } from '/_lib/db/groupBy_module.js'      ;


// web componets
//import {sfc_record_class} from '/_lib/db/sfc-record/_.mjs'           ;  // <sfc-record>


export class sfc_sssg  extends HTMLElement { // sfc_table_class - client-side
  // web componet to display table


constructor(   // sfc_table_class - client-side
  // constructor is called when the element is displayed
) {
	super();  // call parent constructor 

  // create a shadow dom                           
  this.shadow = this.attachShadow({ mode: "closed" });  
  // add content to shadow dom
  this.shadow.innerHTML =  `
<div style="display: flex; flex-direction: row;">
  <select size="5" style="margin-right: 2em;">
  </select>  

  <div>
    <div id="search_tab" >
    <h3>Search</h3>
    <sfc-select-order id=""search></sfc-select-order>
    </div>

    <div id="select_tab" style="display: none;">
    <h3>Select</h3>
    <sfc-select-order id="select"></sfc-select-order>
    </div>

    <div id="sort_tab" style="display: none;">
    <h3>Sort</h3>
    <sfc-select-order id="sort"></sfc-select-order>
    </div>

    <div id="group_tab" style="display: none;">
    <h3>Group</h3>
    <sfc-select-order id="group"></sfc-select-order>
    </div>
  </div>
<div>
`
  this.tab = "search";   // start with search tab selected

  this.select     = this.shadow.querySelector("select");              // get first <select>
  this.select.addEventListener('change', this.show_tab.bind(this));   // add change event hander

  // load the select with all the fields
  ["search","select","sort","group"].forEach(item => {
    this.load(item);
  })
  
}


connectedCallback() { // sfc_table_class - client-side
}

load(
  name // name of tab
){
  const s = ( name === this.tab ? " selected" : "")           ; // set select option
  this.select.innerHTML += `<option${s}>${name}</option>`     ; // allow user to select
  this[name]        = this.shadow.getElementById(name        ); // remember the <sfc-select-order> web componets
  this[name+"_tab"] = this.shadow.getElementById(name+"_tab "); // remember the tabs

  this[name].  // load up choices with fields names
}

show_tab( // sfc_table_class - client-side
){
  // hide current tab
  this[`${this.tab}_tab`].style.display = "none";

  // show tab clicked on
  this.tab = this.select.value;
  this[`${this.tab}_tab`].style.display = "block";
}


} // sfc_ssss - client-side //  end


customElements.define("sfc-sssg", sfc_sssg); 