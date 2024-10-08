import {sfc_select_order} from '/_lib/web_components/sfc-select-order/_.mjs'           ;  // <sfc-select-order>

export class table_views { // table_views - client-side
/*

allows user to define, name and save table views

filter(search),  select fileds and order to display, Sort, Group
export csv and njs files

*/

constructor(   // table_views - client-side
  // constructor is called when the element is displayed
  view // <sfc-table>
) {
  // create a shadow dom  
  this.sfc_table = view;

  this.shadow =  this.sfc_table.shadow ;  // shadow of <sfc-table>

  this.tab = "search";   // start with search tab selected

  this.main_select     = this.shadow.querySelector("select");              // get first <select>
  this.main_select.addEventListener('change', this.show_tab.bind(this));   // add change event hander

  // load the select with all the fields
  ["search","select","sort","group"].forEach(item => {
    this.load(item);
  })
  
}


connectedCallback() { // table_views - client-side
}


load(   // table_views - client-side
  name // name of tab
){
  const s                     = ( name === this.tab ? " selected" : ""); // set select option
  this.main_select.innerHTML += `<option${s}>${name}</option>`         ; // add option to select
  this[name]                  = this.shadow.getElementById(name       ); // remember the <sfc-select-order> web componets
  this[name+"_tab"]           = this.shadow.getElementById(name+"_tab"); // remember the tabs

  // load up choices with fields names
  this[name].title_set(`<h3>${name}</h3>`)
  const fields = this.sfc_table.model.fields_get(); // array of all field names
  const a =[];
  for(let i=0; i<fields.length; i++) {
    a.push([fields[i],"xxx"]);
  }
   
  this[name].choices_add(a); //  display choices

}



show_tab( // table_views - client-side
){
  // hide current tab
  this[`${this.tab}_tab`].style.display = "none";

  // show tab clicked on
  this.tab = this.main_select.value;
  this[`${this.tab}_tab`].style.display = "block";
}


} // table_views - client-side //  end
