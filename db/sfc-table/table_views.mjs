/*

allows user to define, name and save table views

filter(search),  select fileds and order to display, Sort, Group
export csv and njs files

*/


export class table_views { // table_views - client-side


constructor(   // table_views - client-side
  // constructor is called when the element is displayed
) {
  // create a shadow dom                           
  this.shadow = this.attachShadow({ mode: "closed" });  
  // add content to shadow dom
  this.shadow.innerHTML =  `

`
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

  this[name].title_set(`<h3>${name}</h3>`)  // load up choices with fields names
  const a =[
    ["f1","xx"]
    ,["f2","x2x"]
  ]
  this[name].choices_add(a);
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
