const {table_views    } = await app.load("MVC/table/c_views.mjs"); 

export class sfc_table_class  extends HTMLElement { // sfc_table_class - client-side 

/*
<sfc-table><sfc-table>  - table viewer web component - has aspects of controler


*/


constructor(   // sfc_table_class - client-side
  // constructor is called when the element is displayed
) {
	super();  // call parent constructor 

  // data
  this.searchVisible     = true; // display boxes to put search criteria in
  this.statusLineData    = ["tableName","nextPrev","rows","firstLast","rows/page","views"]; 
  this.lineNumberVisible = true;
  this.rowNumberVisible  = true
  this.columnFormat      = [];  // array of td attributes, one for each column
  this.columnTransform   = [];  // array of fucntions, one for each column
  this.footer            = [];  //

  this.tag         = null;  // name of tag to display if null, display entire table
  this.tags        = {}     // each attribute contains a list of indexes into this.model.json.rows these are a subset of the table rows

  this.selected    = [];    // list of rows the user has selected for, (delete, copy, edit, make list)

  this.paging        = {}     // store paging states
  this.paging.lines  = 10;    // number of lines per page
  this.paging.row    =  0;    // row number of first line, start with 0
  this.paging.rowMax = null    // max row of table or rowArray

  this.selectedFields = [3]; // used by groupby, sort hardcode to test

  this.dom       = {};       // saves attributes like onclick that will be added when html is rendered


  // create a shadow dom                           
  this.shadow = this.attachShadow({ mode: "closed" });  
  // add content to shadow dom
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

this.shadow.getElementById("search_tab").style.display    = "flex";  // show search
import(`${app.lib}/format/_.mjs`).then(({ format }) => {this.format = format;})
}


init(  // sfc_table_class - client-side
){
  this.views  = this.shadow.getElementById('views');
  this.shadow.getElementById('table').addEventListener('click', this.record_show.bind(this) );
}


record_show(  // sfc_table_class - client-side
  event
){
  const data = event.target.getAttribute("data-pk");   // get pk of record to dislplay
  if (data) {
      // user clicked on pk to view record deta
      const collection = this.shadow.getElementById("table").getElementsByClassName("link selected");
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
  this.displayData()        ;  
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


rows_displayed(int){
  var element = this.shadow.getElementById("rows_per_page");
  element.value = int;
  element.dispatchEvent(new Event('change'));
}


// sfc_table_class - client-side
setStatusLineData(   value) {this.statusLineData    = value;}
setSearchVisible(    value) {this.searchVisible     = value;}
setLineNumberVisible(value) {this.lineNumberVisible = value;}
setRowNumberVisible( value) {this.rowNumberVisible  = value;}
setFooter(           value) {
  this.footer   = value;
}



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
  if (!this.searchVisible) return ""; // not displaying search

  let html = `${( this.lineNumberVisible ? "<div>Search</div>": "") }`

  // add search input for each row column
  let  size   = 10;  // number of characters allowed in search
  this.model.meta_get("select").forEach((item, i) => {
    html += `<div><input id="fn-${item}" type="text" value="${this.search_values[item]}" size="${size}"/></div>`;
  });

  return html;
}


displayColumnTitles( // sfc_table_class - client-side
){
  // add header    //  this.json[table].DOMid = domID; // remember where table was displayed
  this.skip_columns = 0;
  let html=""; 
  if (this.lineNumberVisible) {
    html += `<div align="right"><b>line</b></div>`; this.skip_columns++;
  }
  
  const select = this.model.meta_get("select");
  const fields = this.model.meta_get("fields");
  for(var i=0; i<select.length; i++){
    let align="";
    switch (fields[select[i]].type) {
      case "money"  :
      case "integer":
      case "float"  :
        align=` align="right"`;  break;
      default: break;
    }
    html += `<div${align}><b>${fields[select[i]].header}</b></div>`;
  };

  // set style
  this.shadow.getElementById("table").style.setProperty("grid-template-columns",`repeat(${select.length + this.skip_columns},auto)`); 

 // add to html to DOM
 return html;
}


displayData(){   // sfc_table_class - client-side
  const table_data =  this.shadow.getElementById("table");

  let html="";  // init html
  html += this.search_display();
  html += this.displayColumnTitles();

  // build one row at a time
  for (let i = 0; i < this.paging.lines; i++) {
    html += this.appendHTMLrow(i+1, i+this.paging.row);
  }
  table_data.innerHTML = html;   // display data

  // add event for search
  const search_hander =  this.search?.bind(this);  // fix bug, this.search should be defined
  if  (this.searchVisible) {
    this.model.meta_get("select").forEach((item, i) => {
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


views_toggle(){  // sfc_table_class - client-side
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
  let rowNum  = ""; if (this.rowNumberVisible  ) {rowNum  = `<td></td>`;}

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
}


search_clear(){
  this.model.meta_get("select").forEach((item, i) => {
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
   i           // is line the row is being displayed on
  ,arrayIndex  // row data to be displayed
) {

  if ( this.tags[this.tag].length <= arrayIndex) {
    return ""; // no more data
  }

  const pk = this.tags[this.tag][arrayIndex];
  // create html for each column in the row
  let lineNum=""; 
  if (this.lineNumberVisible ) {
    // diaplay line number
    lineNum = `<div align="right" data-pk="${pk}" class="link"> ${i} </div>`;
  }

  let selected = "";
  if (this.selected.find( val => val === pk) ) {
    // show row as selected
    selected="class='selected'";
  }

  let html   = lineNum;
  const select = this.model.meta_get("select");
  for(let i=0; i<select.length; i++) {
    // create display form of field
    let value = this.model.get_value(pk, select[i]);

    if (value===null || value === undefined) {
      html += "<div></div>"; // display null values as blank
    } else {
      // convert to human readable form
      html += this.formatTransform(value, i);
    }

 
  };
  
  return html;
}


formatTransform( // sfc_table_class - client-side
  value   // orig field value
  , i     // column number
){
  let html = "";

  switch (this.model.get_field(i,"type") ) {
  case "html" :  html = value                                                   ; break;
  case "money":  html = `<div align="right">${this.format.money(value)}</div>`  ; break;
  case "date" :  
    const d = new Date(value[0],value[1]-1, value[2]);
    html = `<div>${this.format.getISO(d)}</div>`                                ; break;

  case "integer"   :
  case "float"     :
  case "pk"        :
                      html = `<div align="right">${value}</div>`                ; break;

  default          :  html = `<div>${value}</div>`                              ; break;
  }

  return html;
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


getColumnFormat( // sfc_table_class - client-side
  i
  ) { // return <td> attributes to be added
  let f = this.columnFormat[i];
  if (f === undefined) {
    return "";
  } else {
    return f;
  }
}


setColumnFormat( // sfc_table_class - client-side
  i       //
  ,value  //
  ) {  // set <td> attributes to be added
  this.columnFormat[i] = value;
}
clearColumnFormat(){ this.columnFormat =[];}


setColumnTransform( // sfc_table_class - client-side
  i
  ,value
  ) { // set function to be called before value is displayed
  this.columnTransform[i] = value;
}


clearColumnTransform(){ this.columnTransform = [];}


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

}


customElements.define("sfc-table", sfc_table_class); // tie class to custom web component





/*groupby(  // sfc_table_class - client-side  
){
  // user clicked group by button, so create a group by table and display it

  // create groupby instance   
  const groupby_fields = this.groupby_fields.selected();     // user selected
  const g              = new groupByClass();      
  const list = g.groupBy(this.model, groupby_fields); // create groups

  // convert info in groupByClass to table
  const table  = new table_class();           // create blank table to put data in
  const fields = table.meta_get("fields");
  groupby_fields.forEach((field, index) => {
    fields[field]          = {};
    fields[field].header   = index;
    fields[field].location = "column";
    fields[field].type     = "string";
  });
  fields.count            = {};
  fields.count.header     = "Count";
  fields.count.location   = "column";
  fields.count.type       = "number";

  fields.pk_list          = {};
  fields.pk_list.header   = "pk_list";
  fields.pk_list.location = "column";
  fields.pk_list.type     = "array";

  const keys = Object.keys(list);  // keys an array of

  // add data to table
  keys.forEach((key, index) => {
    //t.appendRow([key,g.groups[key].rowIndex.length])
    table.add_column_value(key,"0"      ,key             );
    table.add_column_value(key,"count"  ,list[key].length);
    table.add_column_value(key,"array"  ,list[key]       );
  });


  // display table
  this.tableUxG.model     = t;               // attach table data to tableUX
  this.tableUxG.tableName = this.tableName+"-GroupBy";  //
  this.tableUxG.display();                   // show table to user
} */


/*
  setSelected(         array) {
    this.selected          = array;
  
    // as CSV file
    const table = this.getModel();    // get access to class holding the table data
    const pks  = table.get_PK();    // get access to array of rows
    let csv = table.genCSV_header();;
  
    if(this.tag) {
      // export just records that are in the tag
      const index = this.tags[this.tag];
      for(var i=0; i<index.length; i++) {
        csv += table.genCSVrow(index[i]);
      };
    } else {
      // export entire table
      for(var i=0; i<rows.length; i++) {
        csv += table.genCSVrow(rows[i]);
      };
    }
  
  
    const data = new Blob([csv], {type: 'text/plain'});
  
    // set data and download name for hyperlink
    const e=document.getElementById('download_link')
    const url = window.URL.createObjectURL(data);
    e.href = url;
    e.download = `${this.tableName}.csv`
    e.click(); // now click the link  start the download/export
  }
    */