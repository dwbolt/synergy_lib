import {sfc_select_order} from '/_lib/web_components/sfc-select-order/_.mjs'           ;  // <sfc-select-order>

export class table_views { // table_views - client-side
/*

helper class of <sfc-table> is created in set_model method  sfc_table_class

allows user to define, name and save table views
select fileds
select records via search
sort
group 

*/


constructor(   // table_views - client-side
  // constructor is called when the element is displayed
  view // <sfc-table>
) {
  // create a shadow dom  
  this.sfc_table = view;                 // points to table viewer
  this.model     = this.sfc_table.model; // points to table data class

  this.shadow =  this.sfc_table.shadow ;  // shadow of <sfc-table>

  this.tab = "search";   // start with search tab selected

  this.main_select     = this.shadow.querySelector("select");              // get first <select>
  this.main_select.addEventListener('change', this.show_tab.bind(this));   // add change event hander

  ["search","select","sort","group"].forEach(item => {
    // load the select with all the fields
    this.load(item);
  })
  
}


search_create(){
  // user has selected field they want to search on, so create UI so they can search
  let html = "Will Search after each key strock<br>";
  const select_order = this.sfc_table.shadow.getElementById("search");  // points to instance of <sfc_select_order>
  const index_array  = select_order.selected_return(                );  // get selected and order fields from  
	for(let i=0; i<index_array.length; i++) {
    const obj = select_order.get(index_array[i]);
		html += `${obj[0]} <input type="text" id="fn-${obj[1]}"><br>`;
	};
  
  const detail     = this.sfc_table.shadow.getElementById("search_detail")
  detail.innerHTML = html;
  detail.addEventListener("keyup", this.searchf.bind(this));
}


searchf(
  // user entered a key in search area
  event  // 
) {
  event.stopPropagation();  

  const detail = this.sfc_table.shadow.getElementById("search_detail");
  const inputs = detail.querySelectorAll("input") ;

  const search = []; // search critera  [[fname1,value1, searchtype1],[fname2,value2,searchtype2]... ]
  for(let i=0; i<inputs.length; i++) {
    const element     = inputs[i];           // element user made change to
    const field_name  = element.id.slice(3); // get rid of leading "fn-""
    const search_value = element.value;
    if (search_value !== "") {
      search.push([field_name, search_value, "begin"]);  // for now only supporting string searches from beginning
    }
  }

  let pks; ;
  if (0 < search.length) {
    // get pks that match search 
    pks = this.model.search(search); // model retruns array of pks that match search criteria
    this.sfc_table.pks_display(pks); // this.displayTag("search");
  } else {
    // display entire database
    this.sfc_table.displayData();
  }
}



load(   // table_views - client-side
  name // name of tab
){
  const s                     = ( name === this.tab ? " selected" : ""   ); // set select option
  this.main_select.innerHTML += `<option${s}>${name}</option>`            ; // add option to select
  this[name]                  = this.shadow.getElementById(name          ); // remember the <sfc-select-order> web componets
  this[name+"_tab"]           = this.shadow.getElementById(name+"_tab"   ); // remember the tabs
  this[name+"_detail"]        = this.shadow.getElementById(name+"_detail"); // remember the detail 

  // load up choices with fields names
  this[name].title_set(`<h3>${name}</h3>`);
  const fields = this.sfc_table.model.fields_get(); // array of all field names
  const a =[];

  for(let i=0; i<fields.length; i++) {
    a.push([this.sfc_table.model.get_field(fields[i],"header"), fields[i]]);
  }
   
  this[name].choices_add(a); //  display choices
}



show_tab( // table_views - client-side
){
  // hide current tab
  this[`${this.tab}_tab`].style.display = "none";

  // show tab clicked on
  this.tab                              = this.main_select.value;
  this[`${this.tab}_tab`].style.display = "block";
}


} // table_views - client-side //  end
