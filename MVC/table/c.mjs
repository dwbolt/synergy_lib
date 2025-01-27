const {table_views    } = await app.load("MVC/table/c_views.mjs"); 

export class sfc_table  extends HTMLElement { // sfc_table - client-side 

/*
<sfc-table><sfc-table>  - table viewer web component - has aspects of controler & viewer, looking at splitting and refactor
*/


constructor(   // sfc_table - client-side
  // constructor is called when the element is displayed
) {
	super();  // call parent constructor HTMLElement

  // specify what data is displayed
  this.select = [];  // array of fileds to display
  this.pks    = [];  // array pks that point to data to be disaplay

  this.searchVisible       = false; // display boxes to put search criteria in
  this.line_number_visible = true;
  this.header_visible      = true;

  this.statusLineData    = ["tableName","nextPrev","rows","firstLast","rows/page","views"]; 

  this.columnTransform   = [];  // array of fucntions, one for each column
  this.footer            = [];  //

  this.tag         = null;  // name of tag to display if null, display entire table
  this.tags        = {}     // each attribute contains a list of indexes into this.model.json.rows these are a subset of the table rows

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


init(  // sfc_table - client-sid
){
  this.views  = this.shadow.getElementById('views');
  this.shadow.getElementById('table').addEventListener('click', this.record_show.bind(this) );
}


callback_add(
  method  // this calls method to add call back to
  ,when   // there maybe multiply places in a method that call backs are allow
  ,func   // function to add to callback list
){

  if (this.callback === undefined) {this.callback = {};}
    /* 
    this.callback ={
    "method_name1": {
        "when_name_1" : [callback1, callback...]
      ,"when_name_2" : [callback?,...]
      }
    
    ,"method_name_2":{
        "when_name?" : [callback?]
      }
    }
      */

  if (this[method] === undefined) {
    // error method does not exist in class
    app.sfc_dialog.show_error( `this[${method}] === undefined` );
    return;
  }

  if (this.callback[method] === undefined)      {this.callback[method]      = {} }  // make sure method exisits
  // method is in class, so add "when"
  if (this.callback[method][when] === undefined) {this.callback[method][when] = [] } // make sure call list exisits

  if ( !this.callback[method][when].includes( func )) {
    // callback is not in list, so add it 
    this.callback[method][when].push(func);
  }
}


callback_remove(
  method
  ,when
  ,func 
){
  const index = this.callback[method]?.[when]?.findIndex(val => val === func);  // find idex of func
  if (index) {
    // found callback to delete
    this.callback[method][when].splice(index,1);   // remove call back
  } else {
    // did not find callback to deleted
    app.sfc_dialog.show_error( `fucntion could not be found to remove from this.callback[${method}].[${when}]` );
  }
}


async css_add(path) { // calendar_class  client-side
  //<link rel="stylesheet" href="app.css" />
  const element = document.createElement('link');
  element.href = path;
  element.rel = "stylesheet";
  this.shadow.appendChild(element);
}


record_show(  // sfc_table - client-side
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
      this.record_sfc.table_set(this.model);                // let it know the model
      this.record_sfc.table_viewer_set(this);               // let it know the table views so it can formate
      this.record_sfc.show(data);                           // get sfc-record accociated with table & dislay record clicked on
  } 
}


delete_row(   // sfc_table - client-side
  key
) {
  this.getModel().delete_row(key);
  //this.statusLine ();
}


set_hidden(  // sfc_table - client-side
  value  // true -> hide; false -> show
  ){
  this.shadow.hidden = value;
}


display(        // sfc_table - client-side
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
  this.paging.rowMax = this.tags.filtered.length;  // do I need to subtract 1?
  this.paging.row    = 0;

  // fill in empty table
  this.statusLine();
  return this.display_data();  
 // this.displayFooter()      ;
}


display_intersection(  // sfc_table - client-side 
){
  const DOM    = document.getElementById(`${this.DOMid}__intersection`);  // get DOM to fill with select values
  const fields = this.groupby_fields.selected();                          // fields to intersect search
  let f        = this.model.meta_get("fields");                           // 
  let html     = ""                                                       // init html

  for (var i=0; i<  fields.length; i++) {
    // add selection and file with values
    html += `<input  id="${this.DOMid}_${f[i]}_search” type=“text” onchange="app.sfc_dialog.show_error('change')"><br>`;
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


change_page_size(  // sfc_table - client-side
  e  // event
  ) {
  this.change_number_lines(e.target.value );
  return this.display_data();
}


change_number_lines(
  number // lines to diplay in table - assume a number or string version comes in
){

  if (typeof(number) === "string") {
    try {
      number = parseInt(number);
    } catch (error) {
      app.sfc_dialog.error_client(`converstion of string to number failed <br>${error}`);
      return;
    }
  }

  this.paging.lines = number;
  this.grid_create();
}


rows_displayed(
  int  // new number of rows to display
){
  var element   = this.shadow.getElementById("rows_per_page");  // getting number of rows to display
  element.value = int;
  element.dispatchEvent(new Event('change'));                  // fire event to display new number of rows
}


// sfc_table - client-side
setStatusLineData(   value) {this.statusLineData      = value;}
setSearchVisible(    value) {this.searchVisible       = value;}
setLineNumberVisible(value) {this.line_number_visible = value;}
setRowNumberVisible( value) {this.rowNumberVisible    = value;}
setFooter(           value) {this.footer              = value;}


displayTagSelected( // sfc_table - client-side
  // user slected a tag to display
  e  // points to dropdown holding tags for table
) { // user selected a tags list to display
  this.displayTag(e.options[e.selectedIndex].value);
}


// sfc_table - client-side
displayTag(
  name  // points to dropdown holding tags for table
) { // user selected a tags list to display
  this.tag = name;
  this.paging.row = 0;
  return this.display_data();
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


display_data(){   // sfc_table - client-side
  // assume grid is already built, just fill it with data
  // return true  -> there was     data to display
  // return false -> there was not data to display

  if (this.paging.row < 0 || this.tags[this.tag].length <= this.paging.row) {
    // we have gone outside bounds of data,  nothing to display
    return false;
  }

  // fill grid with data from model
  for(let r=0; r<this.paging.lines; r++) {       // walk rows
    // get pk or row to display
    const index = r+this.paging.row;             // index into array of pks to display
    let pk;                                      // pk is undefined
    if (0 <= index && index<this.tags[this.tag].length) {
      // is data for next row, 
      pk = this.tags[this.tag][index];     // pk points to data we want to display
    } /*else {
      return false;// past last row or before
    }*/
  

    for(let c=0; c<this.select.length; c++) {    // walk columns in row
      // display columns in row
      const field_name = this.select[c];         // get field_name
      let   div =this.elements_grid[field_name].data[r];
      this.display_format(div, pk, field_name);
      if (this.line_number_visible) {
        div =this.elements_grid["_line_number"].data[r];
        if (pk === undefined) {
          div.innerHTML = "";
        } else {
          div.innerHTML = `${r+1}`;
          div.style["text-align"]  = "right" ; // asssume set to "right" or undefined -> left
          div.setAttribute("class"  , "link"); // show blue underline like a url to click on
          div.setAttribute("data-pk",  pk   ); // 
        }
      }
    }
  }

  // execute call back functions, offten used to format data eg covert 10 to $0.10 etc.
  this.callback?.display_data?.end.forEach( f => f( this.elements_grid ) ); 

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

  return true; // we displayed something
}


display_format( // sfc_table - client-side
   element     // div tag data will be displayed in
  ,pk          // orig field value, if undifined assume header, do not replace value
  ,field_name  // column number
){
  let html  = ""                              ; // default value is blank

  let align,value;                            ; // default is align left
  value = this.model.get_value(pk,field_name ); // get value from table 
  if (value === undefined || value === null) {
    value = "";
  }

  // there is some data, so format by type
  switch (this.model.get_field(field_name,"type") ) { 
  case "date" :  
    if (3 <= value.length) {
      // refactor code, assume format header
      const d = new Date(value[0],value[1]-1, value[2]);
      html = `${this.format.getISO(d)}`     
    }
   ; break;

  case "integer": case "float": case "pk": html = value; align="right"; break;

  case "money"     : html = `${this.format.money(value)}`; align="right"; break;

  case "text" : case "textarea" : case "html" :
  default          : html = value                           ; break;
  }

  if (pk !== undefined) {
    // assume we are formating rather than data rather than header
    element.innerHTML           = html ; // display transfored value
  }

  element.style["text-align"] = align; // asssume set to "right" or undefined -> left
}


genTags(){ // sfc_table - client-side
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


statusLine(   // sfc_table - client-side
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


views_toggle() {  // sfc_table - client-side
  if (this.views.style.display === "none") {
    this.views.style.display  = "flex";
  } else { 
    this.views.style.display = "none";
  }
}


// sfc_table - client-side  --- deprecate
setModel( // let class know what data it will be displaying/using
  db      // database object that table is in
  ,name   // name of table
) {
  this.tableName  = name;           // string
  this.model      = db.getTable(name);  // is of class table_class
  this.grid_create(true);
}


set_model( // let class know what data it will be displaying/using
   table  // table object 
  ,name   // name of table
) {
  this.model      = table;  // is of class table_class
  this.tableName  = name;   // string
  
  this.table_views  = new table_views(this);
  this.shadow.getElementById("search").selected_custom = this.table_views.search_create.bind( this.table_views );
  this.grid_create(true);
}


grid_create(
  start_over = false  // true mean wipe out exisitng grid
){
/*
this.elements_grid    = {  // is rebuilt when web component is attached to new model
  "field_name_?" : {
        "search" : {}  // points to a div tag that will hold user input for search, not currently used
      , "header" : []  // points to a div tag that will hold display header for column
      , "data"   : []  // each array item points to div tag that hold data for that row 
    }
  ,"field_name_?"
*/
  // create div tags to build grid from  
  // call each time add new columns to display or # of rows do display
  let div;
  const line = (this.line_number_visible ? 1 : 0 ); 
  if (start_over) {
    this.elements_grid   = {};  // wipe out existing grid
    if (this.select.length === 0) {
      // get default field selection from model
      this.select = this.select.concat( this.model.meta_get("select") ); // protection of select array should happen in model
    }

    let width = "";
    if  (this.line_number_visible) {
      width += "50px "
    }

    for (let i=0; i<this.select.length; i++) {
      const field_name = this.select[i];
      let v = this.model.meta_get("fields")[field_name].width;
      if (v === undefined) {
        if (field_name === "pk") {
          v = "50px"
        } else {
          v = "auto"
        }
      }
      width +=  v + " ";
    }
    this.table.style.setProperty("grid-template-columns",width);   // defines number of columns to display and the width of each column
  }

  // make sure div exists and are long enought to hold all the rows
  let c,field_name;
  for(c=0; c<this.select.length; c++){
    // walk all the field_names to be displayed
    field_name = this.select[c];
    this.column_add(field_name); 
  }

  if (this.line_number_visible) {
    this.column_add("_line_number");   // place to display line number so user can click to get more detail about a record in the table
  }

  this.table.innerHTML = "";  // get rid of all divs in grid display

  // attach div's in this.elements_grid to this.table so they can be displayed
  if (this.searchVisible ) {
    if (this.line_number_visible) {
      div = this.elements_grid["_line_number"].search;
      div.innerHTML = "Search"; // is really a header for search, or we could make it blank
      this.table.appendChild( div );
    }
    // add search row
    for (c=0; c<this.select.length; c++) {
      field_name = this.select[c];
      this.table.appendChild( this.elements_grid[field_name].search );
    }
  }

  if (this.header_visible) {
    if (this.line_number_visible) {
      div = this.elements_grid["_line_number"].header;
      div.style["text-align"]  = "right";
      this.table.appendChild(div );  // is really a header for search, or we could make it blank
    }
    // add header row 
    for (c=0; c<this.select.length; c++) {
      field_name = this.select[c];
      div = this.elements_grid[field_name].header ;
      this.display_format(div,undefined,field_name);
      if (field_name === "pk") {
        div.style["text-align"]  = "right";
      }
      this.table.appendChild(div);
    }
  } 

  // add elements from this.elements_grid to DOM
  for(let r=0; r<this.paging.lines; r++){
    if (this.line_number_visible) {
      this.table.appendChild( this.elements_grid["_line_number"].data[r]);  // #line - # row
    }
    for (c=0; c<this.select.length; c++) {
      field_name = this.select[c];
      const div =this.elements_grid[field_name].data[r];  // data from model
      this.table.appendChild(div )
    }
  }
}


column_add(field_name) {
  if (this.elements_grid[field_name] === undefined) {
    this.elements_grid[field_name] = {};    // init column to empty object
  }
  let col = this.elements_grid[field_name]

  // add column search 
  if (col.search === undefined) {
    col.search = document.createElement("div"   ); // add empty div for search
    col.search.innerHTML = `<input id="fn-${field_name}" type="text"/>`;
    let input     = col.search.querySelector("input");
    input.addEventListener("keyup",this.searchf.bind(this) );
  }

  // add column header
  if (col.header === undefined) {
    col.header           = document.createElement("div"   ); // add empty div for header of column
    let value;
    switch (field_name) {
    case "_line_number":  value ="Line"                       ; break;  // meta field header
    default: value = this.model.meta_get("fields")[field_name].header; break; // regular field
    }
    col.header.innerHTML = `<b>${value}</b>`;
  }

  // add column data
  if (col.data === undefined) {
    col.data   =                               []; // create empty array to pub each row for data to be displayed
  }
  for(let ii=0; ii<this.paging.lines; ii++) { 
    // can grow if rows is increased
    if (col.data[ii]=== undefined) {
      const div = document.createElement("div");
      col.data.push(div); 
    }
  }
}


getModel(){  // sfc_table - client-side
  if (this.model) {
    return this.model;// will be table class
  } else {
    app.sfc_dialog.show_error(`method getModel<br> this.model = ${typeof(this.model)}`);
  }
}  


genRows( // sfc_table - client-side
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


field(  // sfc_table - client-side
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


next( // sfc_table - client-side
) { //next page
  this.paging.row = this.paging.row + this.paging.lines;
  return this.display_data();
}


prev( /// sfc_table - client-side
) { // previous page
  this.paging.row = this.paging.row - this.paging.lines;
  /*
  if (this.paging.row < 0) {
    // should not be less than 0;
    this.paging.row = 0;
  }*/
  return this.display_data(); // true -> there was data to display
}


first( /// sfc_table - client-side
){  // first page
  this.paging.row = 0;
  return this.display_data();
}


last( /// sfc_table - client-side
){  // last page
  this.paging.row = parseInt((this.paging.rowMax-1)/this.paging.lines) * this.paging.lines;
  return this.display_data();


} // end sfc_table - client-side //  end


} // end class


customElements.define("sfc-table", sfc_table); // tie class to custom web component
