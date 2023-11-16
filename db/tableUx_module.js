import {dbClass            } from '/_lib/db/db_module.js'           ;
import {groupByClass       } from '/_lib/db/groupBy_module.js'      ;
import {recordUxClass      } from '/_lib/db/recordUx_module.js'     ;
import {tableClass         } from '/_lib/db/table_module.js'        ;
import {select_order_class } from '/_lib/UX/select_order_module.js' ;


class tableUxClass { // tableUxClass - client-side

  //////////////////////////////////////////////////////
  /*

  User Experince for things that have can have table display.

  */


// tableUxClass - client-side
constructor(
   domID       // where table will be displayed
  ,globalName  // is used in UX on onChange, onClick etc events to get back to this instace of the object
) {
  this.DOMid       = domID;     // remember where table will be displayed
  this.globalName = globalName; // remember is used in UX on onChange, onClick etc events

  // data
  this.recordUX          = new recordUxClass(this);
  this.tableUxB          = null;  // points to tableUx used for edit and copy buffer
  this.model;               // pointer to instance of tableClass
  this.tableName;           // name of table in Database
  this.searchVisible     = true; // display boxes to put search criteria in
  this.statusLineData    = ["tableName","nextPrev","rows","firstLast","tags","rows/page","download","groupBy"];
  this.lineNumberVisible = true;
  this.rowNumberVisible  = true
  this.columnFormat      = [];  // array of td attributes, one for each column
  this.columnTransform   = [];  // array of fucntions, one for each column
  this.footer            = [];  //

  this.buffer      = false; // are we displaying the model buffer
  this.tag         = null;  // name of tag to display if null, display entire table
  this.tags        = {}     // each attribute contains a list of indexes into this.model.json.rows these are a subset of the table rows

  this.selected    = [];    // list of rows the user has selected for, (delete, copy, edit, make list)

  this.paging        = {}     // store paging states
  this.paging.lines  = 10;    // number of lines per page
  this.paging.row    =  0;    // row number of first line, start with 0
  this.paging.rowMax = null    // max row of table or rowArray

  this.selectedFields = [3]; // used by groupby, sort hardcode to test

  this.dom       = {};       // saves attributes like onclick that will be added when html is rendered
}


delete_row(   // tableUxClass - client-side
  key
) {
  this.getModel().delete_row(key);
  this.statusLine();
}


set_hidden(  // tableUxClass - client-side
  value  // true -> hide; false -> show
  ){
  document.getElementById(this.DOMid).hidden = value;
}


display(        // tableUxClass - client-side
  // display table - for first time
  rowArray=null // optional rowarray, display if passed
) {
  this.tags = {}  // remove any previous tags

  if (Array.isArray(rowArray)) {
    // create tag with rowArray and display
    this.tag = "filtered";
    this.tags.filtered = rowArray;
  //  this.paging.rowMax = rowArray.length;
  } else {
    // display full table
    this.tag = null;
  //  this.paging.rowMax = this.getModel().get_PK().length;
  }

  // add status line and empty table to DOM
  document.getElementById(this.DOMid).innerHTML = `
  <div id="${this.DOMid}_status" style="text-align:left; margin-bottom:10px"></div>
  <div id="${this.DOMid}_table"  style="display: grid; grid-gap: 5px; border-style: solid; "></div>
  `;
  
  // add fields to group by
  this.groupby_fields = new select_order_class(`${this.DOMid}__group_by_fields`,`${this.globalName}.groupby_fields`);
  this.groupby_fields.set_template(
    `<input type="button" value="Search"   onclick="${this.globalName}.display_intersection()"><br>
     <input type="button" value="group by" onclick="${this.globalName}.groupby()">
    `
  );
  const fields = this.model.meta_get("fields");
  this.model.meta_get("select").forEach((field, i) => {
    this.groupby_fields.add_choice(field,{"text": fields[field].header});
  });
  this.groupby_fields.add_choices();

  // fill in empty table
  //this.displaySearch()      ;
  this.displayData()        ;  // will display statusLine
 // this.displayFooter()      ;
}


display_intersection(  // tableUxClass - client-side 
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


groupby(  // tableUxClass - client-side  
){
  // user clicked group by button, so create a group by table and display it

  // create groupby instance   
  const groupby_fields = this.groupby_fields.selected();     // user selected
  const g              = new groupByClass();      
  const list = g.groupBy(this.model, groupby_fields); // create groups

  // convert info in groupByClass to table
  const table  = new tableClass();           // create blank table to put data in
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
  
}


changePageSize(  // tableUxClass - client-side
  e
  ) {
  this.paging.lines = parseInt(e.value); // convert string to number;
  this.displayData();
}


// tableUxClass - client-side
setStatusLineData(   value) {this.statusLineData    = value;}
setSearchVisible(    value) {this.searchVisible     = value;}
setLineNumberVisible(value) {this.lineNumberVisible = value;}
setRowNumberVisible( value) {this.rowNumberVisible  = value;}
setFooter(           value) {
  this.footer   = value;
  if (this.tableUxB) {
    // make the buff point to the same model as the main tableUx
    this.tableUxB.footer  = value;
  }
}
setSelected(         array) {this.selected          = array;}
setBuffer(         tableUx) {this.tableUxB          = tableUx;}  // rember the tableUx Buffer


export( // tableUxClass - client-side
){ // as CSV file
  const table = this.getModel();    // get access to class holding the table data
  const pks  = table.get_PK();    // get access to array of rows
  //let csv     = table.genCSVrow(table.meta_get("header")); // export header
  let csv = "";

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



displayTagSelected( // tableUxClass - client-side
  // user slected a tag to display
  e  // points to dropdown holding tags for table
) { // user selected a tags list to display
  this.displayTag(e.options[e.selectedIndex].value);
}


// tableUxClass - client-side
displayTag(
  name  // points to dropdown holding tags for table
) { // user selected a tags list to display
  this.tag = name;
  this.paging.row = 0;
  this.displayData();
}


// tableUxClass - client-side
displaySearch(){
  if (!this.searchVisible) return;
  // add next & prev buttons
  let html = `
  <tr onchange="${this.globalName}.search(this)" id="search">
  ${( this.lineNumberVisible ? "<th></th>": "") }
  ${( this.rowNumberVisible  ? "<th></th>": "") }`;

  // add search input for each row column
  let search, size   = 10;  // number of characters allowed in search
  if (this.searchVisible) {
    // do not display search fields
    search = `<input type="text" size="${size}">`;
  } else {
    search = "";
  }
  this.model.meta_get("select").forEach((item, i) => {
    html += `<th>${search}</th>`;
  });
  html += "</tr>";

  // add to html to DOM
  document.getElementById(``).innerHTML = html;
}


displayColumnTitles( // tableUxClass - client-side
){
  // add header    //  this.json[table].DOMid = domID; // remember where table was displayed
  this.skip_columns = 0;
  let line=""; if (this.lineNumberVisible) {line = "<div><b>line</b></div>"; this.skip_columns++}
  let html = line;

  const select = this.model.meta_get("select");
  const fields = this.model.meta_get("fields");
  for(var i=0; i<select.length; i++){
    html += `<div><b>${fields[select[i]].header}</b></div>`;
  };

  // set style
  document.getElementById(`${this.DOMid}_table`).style.setProperty("grid-template-columns",`repeat(${select.length + this.skip_columns},auto)`); 

 // add to html to DOM
 document.getElementById(`${this.DOMid}_table`).innerHTML = html; // append to thead
}


displayData(){   // tableUxClass - client-side
  let html="";  // init html
  this.displayColumnTitles();
  // build one row at a time
  for (let i = 0; i < this.paging.lines; i++) {
    html += this.appendHTMLrow(i+1, i+this.paging.row);
  }

  // display data
  const table_data =  document.getElementById(`${this.DOMid}_table`)
  table_data.innerHTML += html;

  // format data just appended
  // allow first child of each <td> tag to set attribute of <td> tag, the calenderClass was the first to use this
  // walk tr, then td to change class for td
  for(let i=0; i<table_data.children.length; i++) {
    let div = table_data.children[i];
    //for (let ii=0; ii<tr.children.length; ii++) {
    //  let td = tr.children[ii];
      // if we are displaying html, all first element to set parent class
    if (0 < div.children.length) {
      // html is being displayed, see if the first child is seting class
      let array = eval( div.firstChild.getAttribute("data-parentAttribute") ) ;
      if ( Array.isArray(array)) {
        div.setAttribute(array[0],array[1]);
      }
      array = eval( div.firstChild.getAttribute("data-parentAttribute2") );
      if ( Array.isArray(array)) {
        div.setAttribute(array[0],array[1]);
      }
    }
    //}
  }

  // figure out maxrow
  if (this.buffer) {
    // display bufffer
    this.paging.rowMax = this.model.getRowBuffer().length;
  } else if (this.tag === "null"  || this.tag === null) {
    // display all data
    this.paging.rowMax = this.getModel().get_PK().length;
  } else {
    // display subset of rows in tag
    this.paging.rowMax = this.tags[this.tag].length;
  }
  this.statusLine();

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


genTags(){ // tableUxClass - client-side
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


statusLine(   // tableUxClass - client-side
){
  let html = "";

  // create status line in the order of  this.status
  this.statusLineData.forEach((item, i) => {
    switch(item) {
      case "nextPrev":
        html += `<input id="prev" type="button" onclick ='${this.globalName}.prev()' value="Prev"/>
                 <input id="next" type="button" onclick ='${this.globalName}.next()' value="Next"/>`
        break;
      case "firstLast":
        html += `<input id="first" type="button" onclick ='${this.globalName}.first()' value="First"/>
                 <input id="last"  type="button" onclick ='${this.globalName}.last()' value="Last"/>`
        break;
      case "tableName":
        html += `<b>Table: ${this.tableName}</b>`
        break;
      case "rows":
        html += `Rows: ${this.paging.rowMax}`
        break;
      case "tags":
        html += `tags: ${this.genTags()}`
        break;
      case "rows/page":
        html += `rows/page: <input type="number" min="1" max="999" value="${this.paging.lines}" onchange='${this.globalName}.changePageSize(this)'/>`
        break;
      case "download":
        html += `<input type="button" onclick='${this.globalName}.export()' value="Download CSV"/> <a id='download_link'></a>`
        break;
      case "groupBy":
        html += `<input type="button" onclick='${this.globalName}.groupBy_toggle()' value="Group"/>`
        break;
      default:
        // custom
        html += item;
      }

    html += ` &nbsp ` // add extra space between user input items
  });

  // add to html to DOM
 document.getElementById(`${this.DOMid}_status`).innerHTML = html;
}


displayFooter(){  // tableUxClass - client-side
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


groupBy_toggle(// tableUxClass - client-side
){
  // toggle group_by_div
  const div = document.getElementById(`${this.DOMid}__group_by`);
  div.hidden  = !div.hidden;
}


getTableDom(// tableUxClass - client-side
){
  const e=document.getElementById(this.DOMid);     // dom element where table is displayed
  const table =     e.children[0]; // should be table - brittle code
  return table;
}

// tableUxClass - client-side
setModel( // let class know what data it will be displaying/using
  db      // database object that table is in
  ,name   // name of table
) {
  this.tableName  = name;           // string
  this.model      = db.getTable(name);  // is of class tableClass
  if (this.tableUxB) {
    // make the buff point to the same model as the main tableUx
    this.tableUxB.tableName  = name;           // string
    this.tableUxB.model      = db.json[name];  // is of class tableClass
  }
}

getModel(){return this.model}  // will be table class


appendHTMLrow(  // tableUxClass - client-side
  // append row from table or tag list
   i           // is line the row is being displayed on
  ,arrayIndex  // row data to be displayed
) {

  // decide if raw data or a tag list is being displayed
  let PK;
  if (this.buffer) {
    // display bufffer
    PK = rowIndex
  } else if (this.tag === "null"  || this.tag === null) {
    // display all data
    PK = arrayIndex;
  } else {
    // display subset of rows in tag
    if (arrayIndex < this.tags[this.tag].length) {
      PK = this.tags[this.tag][arrayIndex];
    } else {
      return ""; // no more data
    }
  }

  // create html for each column in the row
  let lineNum=""; if (this.lineNumberVisible ) {lineNum = `<div onclick="${this.globalName}.recordUX.show('${PK}')"><a class="link"> ${i} </a></div>`           ;}
  //let rowNum =""; if (this.rowNumberVisible  ) {rowNum  = `<div>${PK}</div>`;}

  let selected = "";
  if (this.selected.find(
    val => val === PK) )
     {selected="class='selected'";}
  //let html   = `<tr ${selected} data-row=${PK}>${lineNum}${rowNum}`;
  let html   = lineNum;
  const select = this.model.meta_get("select");
  for(let i=0; i<select.length; i++) {
    // create display form of field
    let value = this.model.get_value_relation(PK,select[i]);

    if (value===null || typeof(value)==="undefined") {
      value=""; // display null values as blank
    }

    html += this.formatTransform(value, i);
  };
  return html;
}


formatTransform( // tableUxClass - client-side
  value   // orig field value
  , i     // column number
){
  let html = "";
  let show;
  if (this.columnTransform[i]) {
    show = this.columnTransform[i](value); //  convert pennys to dollars for example
  } else {
    show = value;
  }

  const format = this.getColumnFormat(i);
/*
  if (typeof(value) === "string" && (value.startsWith("https://")  || value.startsWith("http://")) ) {
      // display URL
      html += `<td ${format}><a href="${show}" target="_blank">URL</a></td>`;
  } else if (!format && typeof(value) === "number" ) { // display number right justified
      html += `<td align='right'>${show}</td>`;
  } else {
      html += `<td ${format}>${show}</td>`;   // display raw data
  }
*/
  if (typeof(value) === "string" && (value.startsWith("https://")  || value.startsWith("http://")) ) {
    // display URL
    html += `<td ${format}><a href="${show}" target="_blank">URL</a></td>`;
} else if (!format && typeof(value) === "number" ) { // display number right justified
    html += `<div align='right'>${show}</div>`;
} else {
    html += `<div ${format}>${show}</div>`;   // display raw data
}

  return html;
}


setDom( // tableUxClass - client-side
  // this is used in the display() method
  element //  2022-04-16 need more doc, not sure this is still used
  ,value  //
) {
  this.dom[element] = value;
}


genRows( // tableUxClass - client-side
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


getColumnFormat( // tableUxClass - client-side
  i
  ) { // return <td> attributes to be added
  let f = this.columnFormat[i];
  if (typeof(f) === "undefined") {
    return "";
  } else {
    return f;
  }
}


setColumnFormat( // tableUxClass - client-side
  i       //
  ,value  //
  ) {  // set <td> attributes to be added
  this.columnFormat[i] = value;
  if (this.tableUxB) {
    // make the buff point to the same model as the main tableUx
    this.tableUxB.columnFormat[i] = value;
  }
}
clearColumnFormat(){ this.columnFormat =[];}


setColumnTransform( // tableUxClass - client-side
  i
  ,value
  ) { // set function to be called before value is displayed
             this.columnTransform[i] = value;
  if (this.tableUxB) {
    // make the buff point to the same model as the main tableUx
    this.tableUxB.columnTransform[i] = value;
  }
}


clearColumnTransform(){ this.columnTransform = [];}


total( // tableUxClass - client-side
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
    alert(`error in: tableUxClass.total(), col=${col}`);
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


unique( // tableUxClass - client-side
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


setJSON(  // tableUxClass - client-side
  j
  ) {
  // replace place holder of new table with data from loaded file
  Object.entries(j).forEach((item, i) => {
    this.json[item[0]] = item[1];  // replace default value with loaded value
  });
}


f(  // tableUxClass - client-side
  fieldName
  ) {
  return this.model.json.field[fieldName];
}


field(  // tableUxClass - client-side
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


search( // tableUxClass - client-side
  // user made change in search criteria
// use recursion
   eDom      // element where search and display is done.
  //,index = 2 // skip first two columns, there is not search values there
) {
  let i;
  const c = eDom.children;  // array of <th> tags were search criteria are stored
  let searched = false;
  // look at search field, if something is not empty search for all
  for (i=this.skip_columns; i<c.length; i++) {
    this.search_value = c[i].firstChild.value.toLowerCase();  // get value of text search box
    if ( 0 < this.search_value.length) {
      // found search string
      searched = true;
      this.tags.search = []
      const pks = this.getModel().get_PK();
      const field = this.model.meta_get("select")[i-this.skip_columns];
      // search for string in data
      for(let ii=0; ii<pks.length; ii++) {
        let value = this.model.get_value(pks[ii],field); 
        if (typeof(str) ==="number" ){str = str.toString();}
        if (str && str.toLowerCase().includes(this.searchValue)) {
          this.tags.search.push(pks[ii]);  // push the primary key
        }
      }
      i=c.length;  // end loop
    }
  }

  if (searched) {
    // display found records
    this.displayTag("search");
  } else {
    // search cleared, so display all
    this.tag           = null;  
    this.paging.rowMax = this.getModel().getRows().length;
    this.paging.row    = 0;
    this.statusLine();
    this.displayData();
  }
}


next( // tableUxClass - client-side
) { //next page
  this.paging.row = this.paging.row + this.paging.lines;
  this.display();
}


prev( /// tableUxClass - client-side
) { // previous page
  this.paging.row = this.paging.row - this.paging.lines;
  if (this.paging.row < 0) {
    // should not be less than 0;
    this.paging.row = 0;
  }
  this.display();
}


first( /// tableUxClass - client-side
){  // first page
  this.paging.row = 0;
  this.display();
}


last( /// tableUxClass - client-side
){  // last page
//  this.paging.row = this.model.getRowsLength()  - this.paging.lines
//  this.paging.row = this.paging.rowMax  - this.paging.lines
  this.paging.row = parseInt(this.paging.rowMax/this.paging.lines) * this.paging.lines;
  this.display();
}


} // tableUxClass - client-side //  end


export {tableUxClass};


///////////////////////////////////////////////  buffer methods
/*
displayBuffer(        // tableUxClass - client-side  
  // display table - for first time
) {
  //this.tags = {}  // remove any previous tags

  // add status line and empty table to DOM
  document.getElementById(this.DOMid).innerHTML = `
  <table>
  <caption style="text-align:left;">put status line here</caption>
  <thead></thead>
  <tbody></tbody>
  <tfoot></tfoot>
  </table>`;

  // fill in empty table
  this.statusLine();
  this.displaySearch();
  this.displayColumnTitles()
  this.displayDataBuffer();
  this.displayFooter();
}
*/


/*
table2buffer( // tableUxClass - client-side
  a_index //  array of row numbers into
  ) {
  // clear the buffer
  this.json.rowsBuffer = [];

  // make a copy of the data for the buffer so change buffer does not change data in table
  a_index.forEach((rowNumber, i) => {
    this.json.rowsBuffer.push( [rowNumber, Array.from(this.json.rows[rowNumber]) ] );
  });
}


bufferGet( // tableUxClass - client-side
// is this used?
  s_field
  ) {
  return this.json.rowsBuffer;
}


// tableUxClass - client-side
// convert all strings that should be numbers to numbers
bufferSetType() {
  this.json.fieldA.forEach((column, i) => {
    if (column.startsWith("n_")) {
      // found a number column
      this.json.rowsBuffer.forEach((r, ii) => {
        // convert that column to a number
        r[1][i] = Number(r[1][i]);
      });
    }
  });
}


bufferSave(// tableUxClass - client-side
) {  // to table in memory
  this.bufferSetType();
  this.json.rowsBuffer.forEach((item, i) => {
    // does not handle the case of growing or srinking the number of items in the buffer
    this.json.rows[item[0]] = item[1];
  });
}


bufferAppend( // tableUxClass - client-side

) {  // to table in memory
  this.bufferSetType();
  this.json.rowsBuffer.forEach((item, i) => {
    this.json.rows.push( item[1]  );
  });
}


bufferInput2Json(  // tableUxClass - client-side
// move data from DOM to table buffer
) {
  let r,col;
  // a_rows ->  an array of rows of input buffer data
  const a_rows = document.getElementById(this.DOMidBuffer).firstChild.firstChild.children;
  for (r=1; r<a_rows.length; r++) {  // skip first row, it is the header
    let empty = true;
    for (col=1; col<=this.json.fieldA.length; col++) { // skip first column, it has the row number
      let v = a_rows[r].children[col].firstChild.value;  // read html input value
      if (empty && v!=="") {
        empty = false;  // will keep this row, it has data
      }
      this.json.rowsBuffer[r-1][1][col-1] = v;   // set json value
    }
    if (empty) {
      // do not save empty row in data
      this.json.rowsBuffer.pop();
    }
  }

  // make sure it was stored correctly and apply any formating
  this.bufferDisplay();
}


bufferDisplay(// tableUxClass - client-side
  s_domID = s_domID=this.DOMidBuffer // s_domID optional for subsequet calls.
  , on = ""
) {
  this.DOMidBuffer = s_domID;

  // header
  let html= `<table ${on} onchange="app.page.bufferChange()"><tr><th>#</th>`;
  html += this.displayHeader()

  // now the buffer
  // add rows
  this.json.rowsBuffer.forEach((row, i) => {
    html += this.bufferAppendRow(row,i);
  });

  document.getElementById(s_domID).innerHTML = html + "</table>";;
}


bufferAppendRow( // tableUxClass - client-side
  row
  ,i
  ) {
  let html = `<tr><td>${i+1}</td>`;
  let format;

  row[1].forEach((field,ii) => {
    if (field===null) {
      field="";
    }
    format = this.getColumnFormat(ii);

    html += `<td${format}><input type="text" value="${field}"></td>`;

  });
  html += "</tr>";
  return html;
}


bufferCreateEmpty( // tableUxClass - client-side
  n_rows // number of rows to add
  ) {
  const rows = [];
  let i,ii;

  // create n_rows
  for(i=0; i<n_rows; i++) {
    let empty = []; //
    for(ii=0; ii<this.model.getHeader().length; ii++) {
      empty.push(null); // create an array of null as long as the header
    }
    rows.push([-1,empty]);  // -1 -> a new row, a positive number is an edit
  }

  // save empty buffer
  this.model.json.rows = rows;
}
*/