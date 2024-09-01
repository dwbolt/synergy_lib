/*

<sfc-ssss> web compont

Search, Select, Sort, Group

*/

//import {groupByClass       } from '/_lib/db/groupBy_module.js'      ;


// web componets
//import {sfc_record_class} from '/_lib/db/sfc-record/_.mjs'           ;  // <sfc-record>


export class sfc_sssg  extends HTMLElement { // sfc_sssg - client-side
  // web componet to display table


constructor(   // sfc_sssg - client-side
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
    <sfc-select-order id="search"></sfc-select-order>
    </div>

    <div id="select_tab" style="display: none;">
    <sfc-select-order id="select"></sfc-select-order>
    </div>

    <div id="sort_tab" style="display: none;">
    <sfc-select-order id="sort"></sfc-select-order>
    </div>

    <div id="group_tab" style="display: none;">
    <sfc-select-order id="group"></sfc-select-order>
    </div>
  </div>
<div>
`
  this.tab = "search";   // start with search tab selected

  this.main_select     = this.shadow.querySelector("select");              // get first <select>
  this.main_select.addEventListener('change', this.show_tab.bind(this));   // add change event hander

  // load the select with all the fields
  ["search","select","sort","group"].forEach(item => {
    this.load(item);
  })
  
}


connectedCallback() { // sfc_sssg - client-side
}


load(   // sfc_sssg - client-side
  name // name of tab
){
  const s                     = ( name === this.tab ? " selected" : ""); // set select option
  this.main_select.innerHTML += `<option${s}>${name}</option>`         ; // add option to select
  this[name]                  = this.shadow.getElementById(name       ); // remember the <sfc-select-order> web componets
  this[name+"_tab"]           = this.shadow.getElementById(name+"_tab"); // remember the tabs

  this[name].title_set(`<h3>${name}</h3>`)  // load up choices with fields names
  const a =[
    ["f1","xx"]
    ,["f2","x2x"]
  ]
  this[name].choices_add(a);
}


show_tab( // sfc_sssg - client-side
){
  // hide current tab
  this[`${this.tab}_tab`].style.display = "none";

  // show tab clicked on
  this.tab = this.main_select.value;
  this[`${this.tab}_tab`].style.display = "block";
}


} // sfc_ssss - client-side //  end


customElements.define("sfc-sssg", sfc_sssg); 