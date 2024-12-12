const {table_views    } = await app.load("MVC/table/c_views.mjs"); 

export class sfc_table_class  extends HTMLElement { // sfc_table_class - client-side 

/*
<sfc-table><sfc-table>  - table viewer web component - has aspects of controler & viewer, looking at splitting and refactor
*/


constructor(   // sfc_table_class - client-side
  // constructor is called when the element is displayed
) {
	super();  // call parent constructor HTMLElement

  // specify what data is displayed
  this.select = [];  // array of fileds to display
  this.pks    = [];  // array pks that point to data to be disaplay

  this.elements_grid    = {  // is rebuilt, everytime grid size changed - where table data is displayed
    // pointers to <div></div> elements in the grid
     "search" : []  // this.elements_grid.serch[column_number].textContent = to set value
    , "header": []  // this.elements_header[column_number].
    , "data"  : []  // this.elements_grid.data[row_number][column_number].text or innerHTML
  };
  this.search_values     = {}; // this.search_values[field_Name] = [value_of_search, search_type]
                               // place to save search values so they can be restored if grid size changes

  this.searchVisible     = true; // display boxes to put search criteria in
  this.statusLineData    = ["tableName","nextPrev","rows","firstLast","rows/page","views"]; 
  this.lineNumberVisible = true;
  //this.columnFormat      = [];  // array of td attributes, one for each column
  this.columnTransform   = [];  // array of fucntions, one for each column
  this.footer            = [];  //

  this.tag         = null;  // name of tag to display if null, display entire table
  this.tags        = {}     // each attribute contains a list of indexes into this.model.json.rows these are a subset of the table rows

  this.selected    = [];    // not sure this is still used, list of rows the user has selected for, (delete, copy, edit, make list)

  this.paging        = {}     // store paging states
  this.paging.lines  = 10;    // number of lines per page
  this.paging.row    =  0;    // row number of first line, start with 0
  this.paging.rowMax = null;  // max row of table or rowArray

  //does not seemed to be used -this.selectedFields = [3]; // used by groupby, sort hardcode to test
  //does not seemed to be used - this.dom       = {};       // saves attributes like onclick that will be added when html is rendered

  // add content to shadow dom
  this.shadow = this.attachShadow({ mode: "closed" });   // create a shadow dom   
  this.shadow.innerHTML =  `
<link href="${new URL(import.meta.url).origin}/_lib/MVC/table/_.css" rel="stylesheet">
<br>

<div id="views" style="display: none;" >
  <select size="5" style="margin-right: 2em;"></select>  

  <div id="search_tab" class="select_order"> <sfc-select-order id="search"></sfc-select-order> <div id="search_detail"></div> </div>
  <div id="select_tab" class="select_order"> <sfc-select-order id="select"></sfc-select-order> <div id="select_detail"></div> </div>
  <div id="sort_tab"   class="select_order"> <sfc-select-order id="sort"  ></sfc-select-order> <div id="sort_detail"  ></div> </div>
  <div id="group_tab"  class="select_order"> <sfc-select-order id="group" ></sfc-select-order> <div id="group_detail" ></div> </div>
</div>

<div id="status" style="text-align:left; margin-bottom:10px"></div>
<div id="table"  style="display: grid; grid-gap: 5px; border-style: solid; "></div>
<br>
`

this.table = this.shadow.getElementById("table");
this.shadow.getElementById("search_tab").style.display    = "flex";  // show search
import(`${app.lib}/format/_.mjs`).then(({ format }) => {this.format = format;})
}


init(  // sfc_table_class - client-side
){
  this.views  = this.shadow.getElementById('views');
  this.shadow.getElementById('table').addEventListener('click', this.record_show.bind(this) );
}


async css_add(path) { // calendar_class  client-side
  //<link rel="stylesheet" href="app.css" />
  const element = document.createElement('link');
  element.href = path;
  element.rel = "stylesheet";
  this.shadow.appendChild(element);
}


record_show(  // sfc_table_class - client-side
  event
){
  const data = event.target.getAttribute("data-pk");   // get pk of record to dislplay
  if (data) {
      // user clicked on pk to view record deta
      const collection = this.table.getElementsByClassName("link selected");
      for(let i=0; i<collection.length; i++) {
        collection[i].setAttribute("class","link")   // un-select any previous selection
      }

      event.target.setAttribute("class","link selected");   // add selected class to what the user clicked on
      this.record_sfc.table_set(this.model);  
      this.record_sfc.show(data);                           // get sfc-record accociated with table & dislay record clicked on
      if (this.record_show_custom) this.record_show_custom(event); 
  } 
}


record_show_custom(event) {
   if (this.relations) {
      this.relations.show(this.record_sfc);
   }
}


delete_row(   // sfc_table_class - client-side
  key
) {
  this.getModel().delete_row(key);
  //this.statusLine ();
}


set_hidden(  // sfc_table_class - client-side
  value  // true -> hide; false -> show
  ){
  this.shadow.hidden = value;
}


display(        // sfc_table_class - client-side
  // display table - for first time
  rowArray // optional rowarray, display if passed
) {
  this.tags = {}  // remove any previous tags
  this.tag = "filtered";

  if (Array.isArray(rowArray)) {
    // create tag with rowArray and display
    this.tags.filtered = rowArray;
  } else {
    // display full table
    this.tags.filtered = this.getModel().get_PK();
  }
  this.paging.rowMax = this.tags.filtered.length;
  this.paging.row    = 0;

  // fill in empty table
  this.statusLine();
  this.search_display();
  this.displayColumnTitles();
  this.displayData();  
 // this.displayFooter()      ;
}


display_intersection(  // sfc_table_class - client-side 
){
  const DOM    = document.getElementById(`${this.DOMid}__intersection`);  // get DOM to fill with select values
  const fields = this.groupby_fields.selected();                          // fields to intersect search
  let f        = this.model.meta_get("fields");                           // 
  let html     = ""                                                       // init html

  for (var i=0; i<  fields.length; i++) {
    // add selection and file with values
    html += `<input  id="${this.DOMid}_${f[i]}_search” type=“text” onchange="alert('change')"><br>`;
    html += `<div id="${this.DOMid}_${fields[i]}" style="display:grid; grid-template-columns:100px 600px;">`
    html += `<div><b>Count</b></div><div><b>${fields[i]}</b></div>` // header
    let unique_values = this.model.get_unique_values(fields[i]);
    for(var ii=0; ii<Math.min(10,unique_values.length); ii++) {
      html += 
      `<div>${this.model.get_unique_pks(fields[i],unique_values[ii]).length}</div>
      <div>${unique_values[ii]}</div>`
    }
    html + "</div>";
  } 

  DOM.innerHTML = html;
}


change_page_size(  // sfc_table_class - client-side
  e  // event
  ) {
  this.paging.lines = parseInt(e.target.value); // convert string to number;
  this.displayData();
}


rows_displayed(
  int  // new number of rows to display
){
  var element   = this.shadow.getElementById("rows_per_page");  // getting number of rows to display
  element.value = int;
  element.dispatchEvent(new Event('change'));                  // fire event to display new number of rows
}


// sfc_table_class - client-side
setStatusLineData(   value) {this.statusLineData    = value;}
setSearchVisible(    value) {this.searchVisible     = value;}
setLineNumberVisible(value) {this.lineNumberVisible = value;}
setRowNumberVisible( value) {this.rowNumberVisible  = value;}
setFooter(           value) {this.footer            = value;}


displayTagSelected( // sfc_table_class - client-side
  // user slected a tag to display
  e  // points to dropdown holding tags for table
) { // user selected a tags list to display
  this.displayTag(e.options[e.selectedIndex].value);
}


// sfc_table_class - client-side
displayTag(
  name  // points to dropdown holding tags for table
) { // user selected a tags list to display
  this.tag = name;
  this.paging.row = 0;
  this.displayData();
}


search_display(){ // sfc_table_class - client-side
  if (this.elements_grid.search[0].innerHTML === "Search") {return;} // search is already there, do nothing

  this.elements_grid.search[0].innerHTML = "Search";  // inside div tag

  // add search input for each row column
  let  size   = 10;  // number of characters allowed in search
  this.select.forEach((item, i) => {
    let div = this.elements_grid.search[i+1];
    div.innerHTML = `<input id="fn-${item}" type="text" value="${this.search_values[item]}" size="${size}"/>`;
    let input     = div.querySelector("input");
    input.addEventListener("keyup",this.searchf.bind(this) );
  });

  if (!this.searchVisible) {
    const search = this.elements_grid.search;
    for(let i=0; i<search.length; i++){
      search[i].style.display = "none" //hide search row
    }
  }
}


// copyed from c_views and modified
searchf(
  // user entered a key in search area
  event  // 
) {
  event.stopPropagation();  
  let element = event.target;  // element that user typed into
  const inputs = this.table.querySelectorAll("input")                  ;

  const search = []; // search critera  [[fname1,value1, searchtype1],[fname2,value2,searchtype2]... ]
  for(let i=0; i<inputs.length; i++) {
    const element     = inputs[i];           // element user made change to
    const field_name  = element.id.slice(3); // get rid of leading "fn-""
    const search_value = element.value.toLowerCase();
    if (search_value !== "") {
      search.push([field_name, search_value, "begin"]);  // for now only supporting string searches from beginning
    }
  }

  let pks; ;
  if (0 < search.length) {
    // get pks that match search 
    pks = this.model.search(search); // model retruns array of pks that match search criteria
    this.display(pks); // this.displayTag("search");
  } else {
    // display entire database
    this.display();
  }
}


displayColumnTitles( // sfc_table_class - client-side
){
  // add header    //  this.json[table].DOMid = domID; // remember where table was displayed
  this.skip_columns = 0;
  if (this.lineNumberVisible) {
    this.elements_grid.header[0].innerHTML = `<b>line</b>`;
    // add align right
    this.skip_columns++;
  }
  
  const fields = this.model.meta_get("fields");
  for(var i=0; i<this.select.length; i++){
    let align="";
    switch (fields[this.select[i]].type) {
      case "money"  :
      case "integer":
      case "float"  :
        align=` align="right"`;  break;
      default: break;
    }
    this.elements_grid.header[1+i].innerHTML = `<b>${fields[this.select[i]].header}</b>`;
    // add code to align
  };

  // set style
  this.table.style.setProperty("grid-template-columns",`repeat(${this.select.length + this.skip_columns},auto)`);   // not sure about this
}


displayData(){   // sfc_table_class - client-side
  // build one row at a time
  for (let i = 0; i < this.paging.lines; i++) {
    this.appendHTMLrow(i, i+this.paging.row);
  }

  // add event for search
  const search_hander =  this.search?.bind(this);  // fix bug, this.search should be defined
  if  (this.searchVisible) {
    this.select.forEach((item, i) => {
      const element = this.shadow.getElementById(`fn-${item}`); 
      element?.addEventListener('keyup', search_hander );
    });
  }

  // figure out maxrow
 if (this.tag === "null"  || this.tag === null) {
    // display all data
    this.paging.rowMax = this.getModel().get_PK().length;
  } else {
    // display subset of rows in tag
    this.paging.rowMax = this.tags[this.tag].length;
  }

  const rowMax =  this.shadow.getElementById("rowMax");
  if (rowMax !== null) {
    // update rowMax if there
    rowMax.innerHTML = this.paging.rowMax;
  }


  // enable/disable the prev and next button - should be a better way todo this
  if (this.paging.row  ===  0 ) {
    // hide previous & first button
    if ( document.getElementById("prev" ) ) {document.getElementById("prev" ).disabled = true;}
    if ( document.getElementById("first") ) {document.getElementById("first").disabled = true;}
  } else {
    // show previous & first button
    if ( document.getElementById("prev" ) ) {document.getElementById("prev" ).disabled = false;}
    if ( document.getElementById("first") ) {document.getElementById("first").disabled = false;}
  }

  if (this.paging.rowMax < this.paging.row + this.paging.lines  ) {
    // disabled next & last button
    if ( document.getElementById("next" ) ) {document.getElementById("next").disabled = true;}
    if ( document.getElementById("last" ) ) {document.getElementById("last").disabled = true;}
  } else {
    // enable  next & last button
    if ( document.getElementById("next" ) ) {document.getElementById("next").disabled = false;}
    if ( document.getElementById("last" ) ) {document.getElementById("last").disabled = false;}
  }
}


display_structure() { 
  // build empty <div></div> tags for grid to display table.  will be field with data later
  // needs to be called any time size of grid changes, number of rows changes, or number of columns changes
  let html=""
  
  table_data.innerHTML = html;
}


genTags(){ // sfc_table_class - client-side
  // delisplay the tags so user can choose which to view
  let options="";
  Object.keys(this.tags).forEach((item, i) => {
    options+=`<option value="${item}">${item}</option>`;
  });

  return `<select onchange="${this.globalName}.displayTagSelected(this)">
<option value=null>all</option>
${options}
</select>`
}


statusLine(   // sfc_table_class - client-side
){
  let html = "";
  const e_l = [];
  // create status line in the order of  this.status
  this.statusLineData.forEach((item, i) => {
    switch(item) {
      case "nextPrev":
        html += `<input id="prev" type="button" " value="Prev"/> <input id="next" type="button"  value="Next"/>`
        e_l.push(["prev", "click", this.prev]);
        e_l.push(["next", "click", this.next]); 
        break;
      case "firstLast":
        html += `<input id="first" type="button"  value="First"/> <input id="last"  type="button"  value="Last"/>`
        e_l.push(["first", "click", this.first]); //onclick ="${this.globalName}.first()"
        e_l.push(["last" , "click", this.last]); //onclick ="${this.globalName}.last() "
        break;
      case "tableName":
        html += `<b>Table: ${this.tableName}</b>`
        break;
      case "rows":
        html += `Rows: <span id="rowMax"></span>`
        break;
      case "tags":
        html += `tags: ${this.genTags()}`  // allow user to chose groups of records to display
        break;
      case "rows/page":
        html += `rows/page: <input id="rows_per_page" type="number" min="1" max="999" value="${this.paging.lines}"/>`
        e_l.push(["rows_per_page", "change", this.change_page_size]); //
        break;
      case "views":
        html += `<button id="views_toggle">Views</button>`
        e_l.push(["views_toggle", "click", this.views_toggle]); //
        break;

// move download & groupby to views
      case "download":
        html += `<input type="button" onclick="${this.globalName}.export()" value="Download CSV"/> <a id='download_link'></a>`
        break;
      case "groupBy":
        html += `<input id="group_by" type="button" value="Group"/>`
        e_l.push(["group_by", "click", this.groupBy_toggle]); //onclick="${this.globalName}.groupBy_toggle()"
        break;
      default:
        // custom
        html += item;
      }

    html += ` &nbsp ` // add extra space between user input items
  });

  // add to html to DOM
  this.shadow.getElementById("status").innerHTML = html;

  // add addEventListener for each UI element in the status div
  for(let i=0; i<e_l.length; i++) {
    const el = e_l[i];
    this.shadow.getElementById(el[0]).addEventListener(el[1], el[2].bind(this), {"capture":false} );
  }
}


views_toggle() {  // sfc_table_class - client-side
  if (this.views.style.display === "none") {
    this.views.style.display  = "flex";
  } else { 
    this.views.style.display = "none";
  }
}


displayFooter(){  // sfc_table_class - client-side
  // put agg functions here
  // add empty columns for lineNum and rowNum if they are being displayed
  let html    = "";
  let lineNum = ""; if (this.lineNumberVisible ) {lineNum = `<td></td>`;}

  const obj = this;  // give access to "this" in the forEach
  this.footer.forEach((item, i) => {
    html += `<tr>${lineNum}${rowNum}`;  // start a new row
    item.forEach((field,ii) => {
      let value;
      if (field==="${total()}") {
        value = obj.total(ii);   // calculate total
      } else {
        value = field;
      }

      html += this.formatTransform(value,ii);   // put value in for column

    });
    html += "</tr>"  // end row
  });

  // add footer to table
  this.getTableDom().children[3].innerHTML = html;
}


groupBy_toggle(// sfc_table_class - client-side
){
  // toggle group_by_div
  const div = document.getElementById("group_by");
  div.hidden  = !div.hidden;
}


getTableDom(// sfc_table_class - client-side
){
  const e=document.getElementById(this.DOMid);     // dom element where table is displayed
  const table =     e.children[0]; // should be table - brittle code
  return table;
}


// sfc_table_class - client-side  --- deprecate
setModel( // let class know what data it will be displaying/using
  db      // database object that table is in
  ,name   // name of table
) {
  this.tableName  = name;           // string
  this.model      = db.getTable(name);  // is of class table_class
  this.grid_create();
}


set_model( // let class know what data it will be displaying/using
   table  // table object 
  ,name   // name of table
) {
  this.model      = table;  // is of class table_class
  this.tableName  = name;   // string
  this.search_values = {} ; // remembers what user has typed in as search values
  this.search_clear();
  
  this.table_views  = new table_views(this);
  this.shadow.getElementById("search").selected_custom = this.table_views.search_create.bind( this.table_views );
  this.grid_create();
}


grid_create(){
  // create empty <div></div> to put search, heater, and data in display grid
  // call each time grid changes size
  this.table.innerHTML = ""; // empty grid

// make copy of default select fields so changes can not be made
  if (this.select.length === 0) {
    // init to table default select
    this.select = this.model.meta_get("select").slice(0);  // modify protection should be in model class
  }

  this.search_clear();

  let element;  // pushing one extra div for line number column
  // create search div
  this.elements_grid.search     = []             ; // start over
  
  for(let i=0; i<=this.select.length; i++) {
    element = document.createElement("div"); // create a new div tag
    this.elements_grid.search.push(element); // add to search
    this.table.appendChild(        element); // add to table grid
  };

  // create header div
  this.elements_grid.header     = [];
  for(let i=0; i<=this.select.length; i++) {
    element = document.createElement("div"); // create a new div tag
    this.elements_grid.header.push(element); // add header
    this.table.appendChild(        element); // add to table grid
  };

  // create array to div for data
  this.elements_grid.data     = [];
  for (let i=0; i<this.paging.lines; i++){
    this.data_add_row();
  }

  this.line_show_hide();
}


data_add_row() {
  // add row of <div> to put data in
  // create data div

  // add one row
  const row = this.elements_grid.data[this.elements_grid.data.length] = [];
  for(let i=0; i<=this.select.length; i++) {
    const element = document.createElement("div"); // create a new div tag
    this.table.appendChild(              element); // add to table grid
    row.push(                            element); // remember div in array so we can get to it quickly
  };
}


 line_show_hide() {
  // first column with line number
  let value = (this.rowNumberVisible? "block":"none");
  this.elements_grid.search[0].style.display = value;  // search
  this.elements_grid.header[0].style.display = value;  // header

  for (let r=0; r<this.paging.lines; r++) {
    this.elements_grid.data[r][0].style.display = value; // data
  }
 }


search_clear(){
  this.select.forEach((item, i) => {
    this.search_values[item] = "";  // init to blank
  })
}


getModel(){
  if (this.model) {
    return this.model;// will be table class
  } else {
alert(`
this.model=${this.model}

call stack=${Error().stack}
`);
  }
}  


appendHTMLrow(  // sfc_table_class - client-side
  // append row from table or tag list
   i           // index of data row array, is line the row is being displayed on
  ,arrayIndex  // row data to be displayed
) {

  if ( this.tags[this.tag].length <= arrayIndex) {
    // clear out any old data
    for(let ii=0; ii<=this.select.length; ii++) {
      // create display form of field
      const element         = this.elements_grid.data[i][ii]; // get a <div> tage in the row
      element.innerHTML     = ""                            ; // clear it out
    }
    return // no more data
  }

  const pk = this.tags[this.tag][arrayIndex];
  while (this.elements_grid.data.length<=i) {
    // make sure there is a place to put data
    this.data_add_row();
  }
  let element = this.elements_grid.data[i][0];
  // create html for each column in the row
  if (this.lineNumberVisible ) {
    // diaplay line number
    element.innerHTML    =     i+1;  // line number, array starts at 0 so add one
    element.setAttribute("style"  , "align:right;"); // align number to rigth
    element.setAttribute("class"  , "link"        ); // show blue underline like a url to click on
    element.setAttribute("data-pk",  pk           ); // 
  }

  let selected = "";
  if (this.selected.find( val => val === pk) ) {
    // show row as selected
    element.class        += " selected" ;  // not sure this will work
  }

  for(let ii=0; ii<this.select.length; ii++) {
    // create display form of field
    this.display_format(this.elements_grid.data[i][ii+1], pk, this.select[ii]);
  };
}


display_format( // sfc_table_class - client-side
   element  // div tag data will be displayed in
  ,pk   // orig field value
  ,field_name     // column number
){
  let html  = ""                                      ; // default value is blank
  let align;                                          ; // default is align left
  let value = this.model.get_value(pk,field_name ); // get value from table
  if (value !== undefined && value !== null) {
    // there is some data, so format by type
    switch (this.model.get_field(field_name,"type") ) { 
    case "html" :  html = value                                           ; break;

    case "date" :  
      const d = new Date(value[0],value[1]-1, value[2]);
      html = `${this.format.getISO(d)}`                                   ; break;
  
    case "integer"   :
    case "float"     :
    case "pk"        : html = value;                         align="right"; break;

    case "money"     : html = `${this.format.money(value)}`; align="right"; break;

    default          : html = value                           ; break;
    }
  }
  element.innerHTML   = html ;  // display transfored value
  element.style.align = align;  // asssume set to "right" or undefined -> left
}


setDom( // sfc_table_class - client-side
  // this is used in the display() method
  element //  2022-04-16 need more doc, not sure this is still used
  ,value  //
) {
  this.dom[element] = value;
}


genRows( // sfc_table_class - client-side
// creating text file to save
) {
  let txt="";

  this.json.rows.forEach((r, i) => {
    // will only work for numbers, strings, boolean
    //  Will not work for dates, objects, etc...
    txt += ","+JSON.stringify(r)+"\n"
  })

  return " "+ txt.substr(1)  // replace leading comma wiht a space
}


total( // sfc_table_class - client-side
  // add error checking for non-numbers
  col  // column to total
) {
  let total = 0;
  let f;

  // decide if column number or name was passed
  if        (typeof(col) === "number") {
    f = col;
  } else if (typeof(col) === "string") {
    f = this.model.json.field[col];
  } else {
    alert(`error in: sfc_table_class.total(), col=${col}`);
  }

  // decide if entire table will be totaled or list of rows
  if (this.tag === "null"  || this.tag === null) {
    // total all rows in table for column
    this.model.json.rows.forEach((row, i) => {
      total += row[f];
    });
  } else {
    // total subset of rows in tag for column
    this.tags[this.tag].forEach((rowIndex, i) => {
      total += this.model.json.rows[rowIndex][f];
    });
  }

  return total;
}


unique( // sfc_table_class - client-side
  // return all the unique values in a table for the given field
  s_field
  ) {
  const a=[];
  const f=this.json.field;
  this.json.rows.forEach((r) => {
    let v = r[f[s_field]];
    if (!a.includes(v)) {
      a.push(v);
    }
  });

  return a;
}


setJSON(  // sfc_table_class - client-side
  j
  ) {
  // replace place holder of new table with data from loaded file
  Object.entries(j).forEach((item, i) => {
    this.json[item[0]] = item[1];  // replace default value with loaded value
  });
}


f(  // sfc_table_class - client-side
  fieldName
  ) {
  return this.model.json.field[fieldName];
}


field(  // sfc_table_class - client-side
  fieldA  // create the field attribute from the fieldA
  ) {
  if (fieldA) {
    // set the field Array
    this.json.fieldA = fieldA
  }

  this.json.field = {};
  this.json.fieldA.forEach((item, i) => {
    this.json.field[item] = i;
  });
}


next( // sfc_table_class - client-side
) { //next page
  this.paging.row = this.paging.row + this.paging.lines;
  this.displayData();
}


prev( /// sfc_table_class - client-side
) { // previous page
  this.paging.row = this.paging.row - this.paging.lines;
  if (this.paging.row < 0) {
    // should not be less than 0;
    this.paging.row = 0;
  }
  this.displayData();
}


first( /// sfc_table_class - client-side
){  // first page
  this.paging.row = 0;
  this.displayData();
}


last( /// sfc_table_class - client-side
){  // last page
  this.paging.row = parseInt(this.paging.rowMax/this.paging.lines) * this.paging.lines;
  this.displayData();


} // sfc_table_class - client-side //  end


} // end class


customElements.define("sfc-table", sfc_table_class); // tie class to custom web component