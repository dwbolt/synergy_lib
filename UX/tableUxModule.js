import {groupByClass} from '/_lib/db/groupByModule.js';

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

  this.paging       = {}     // store paging states
  this.paging.lines = 10;    // number of lines per page
  this.paging.row   =  0;    // row number of first line, start with 0
  this.paging.rowMax =20;    // max row of talalbe or rowArray

  this.selectedFields = [3]; // used by groupby, sort hardcode to test

  this.dom       = {};       // saves attributes like onclick that will be added when html is rendered
}


delete_row(   // tableUxClass - client-side
  key
) {
  this.getModel().delete_row(key);
  this.statusLine();
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
    this.paging.rowMax = rowArray.length;
  } else {
    // display full table
    this.tag = null;
    this.paging.rowMax = this.getModel().getRows().length;
  }

  // add status line and empty table to DOM
  document.getElementById(this.DOMid).innerHTML = `
  <table>
  <caption style="text-align:left;">put status line here</caption>
  <thead></thead>
  <tbody></tbody>
  <tfoot></tfoot>
  </table>`;

  // fill in empty table
  //this.statusLine();
  this.displaySearch();
  this.displayColumnTitles();
  this.displayData();  // will display statusLine
  this.displayFooter();
}


// tableUxClass - client-side
displayBuffer(        // display table - for first time
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


displayHeader( // tableUxClass - client-side
){
  this.displayColumnTitles();
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
  let table = this.getModel();
  const rows = table.getRows();
  // export header
  let csv = "";
  //let csv = table.genCSVrow(this.#json.header);

  if(this.tag) {
    // export just records that are in the tag
    const index = this.tags[this.tag];
    for(var i=0; i<index.length; i++) {
      csv += table.genCSVrow(rows[index[i]]);
    };
  } else {
    // export entire table
    for(var i=0; i<rows.length; i++) {
      csv += table.genCSVrow(rows[i]);
    };
  }


  const data = new Blob([csv], {type: 'text/plain'});

  // set data and download name for hyperlink
  const e=document.getElementById('export_link')
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
  //<th>
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
  this.model.getHeader().forEach((item, i) => {
    html += `<th>${search}</th>`;
  });
  html += "</tr>";

  // add to html to DOM
  const thead = this.getTableDom().children[1]; // should be thead
  thead.innerHTML = html;
}


// tableUxClass - client-side
displayColumnTitles(){
  // add header    //  this.json[table].DOMid = domID; // remember where table was displayed
  this.skip_columns = 0;
  let line=""; if (this.lineNumberVisible) {line = "<th>line</th>"; this.skip_columns++}
  let row =""; if (this.rowNumberVisible ) {row  = "<th>row</th>" ; this.skip_columns++}
  let html = `<tr>${line}${row}`;

  this.model.getHeader().forEach((item, i) => {
    html += "<th>" +item + "</th>";
  });

 html += "</tr>";

 // add to html to DOM
 this.getTableDom().children[1].innerHTML += html; // append to thead
}


// tableUxClass - client-side
displayData(){
  let html="";  // init html

  // build one row at a time
  for (let i = 0; i < this.paging.lines; i++) {
    html += this.appendHTMLrow(i+1, i+this.paging.row);
  }

  // display data
  this.getTableDom().children[2].innerHTML = html;

  // format data just appended
  // allow first child of each <td> tag to set attribute of <td> tag, the calenderClass was the first to use this
  // walk tr, then td to change class for td
  let tbody = document.getElementById(this.DOMid).children[0].children[2]; // first Child should be <table>   .children[2] should be <tbody>
  for(let i=0; i<tbody.children.length; i++) {
    let tr = tbody.children[i];
    for (let ii=0; ii<tr.children.length; ii++) {
      let td = tr.children[ii];
      // if we are displaying html, all first element to set parent class
      if (0 < td.children.length) {
        // html is being displayed, see if the first child is seting class
        let array = eval(td.children[0].getAttribute("data-parentAttribute"));
         if ( Array.isArray(array)) {
           td.setAttribute(array[0],array[1]);
         }
        let array2 = eval(td.children[0].getAttribute("data-parentAttribute2"));
         if ( Array.isArray(array2)) {
           td.setAttribute(array2[0],array2[1]);
         }
      }
    }
  }

  // figure out maxrow
  if (this.buffer) {
    // display bufffer
    this.paging.rowMax = this.model.getRowBuffer().length;
  } else if (this.tag === "null"  || this.tag === null) {
    // display all data
    this.paging.rowMax = this.model.getRows().length;
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


// tableUxClass - client-side
genTags(){
  let options="";
  Object.keys(this.tags).forEach((item, i) => {
    options+=`<option value="${item}">${item}</option>`;
  });

  return `<select onchange="app.tableUx.displayTagSelected(this)">
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
        html += `<input id="prev" type="button" onclick ="${this.globalName}.prev()" value="Prev"/><input id="next" type="button" onclick ="${this.globalName}.next()" value="Next"/>`
        break;
      case "firstLast":
        html += `<input id="first" type="button" onclick ="${this.globalName}.first()" value="First"/><input id="last" type="button" onclick ="${this.globalName}.last()" value="Last"/>`
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
        html += `rows/page: <input type="number" min="1" max="999" value="${this.paging.lines}" onchange="${this.globalName}.changePageSize(this)"/>`
        break;
      case "download":
        html += `<input type="button" onclick="${this.globalName}.export()" value="Download CSV"/> <a id='download_link'></a>`
        break;
      case "groupBy":
        html += `<input type="button" onclick="app.page.tableUX.groupBy()" value="Group"/>`
        break;
      default:
        // custom
        html += item;
      }

    html += ` &nbsp ` // add extra space between user input items
  });

  // add to html to DOM
  const caption     = this.getTableDom().children[0]; // should be caption
  caption.innerHTML = html;
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


groupBy(// tableUxClass - client-side

){
alert("not imlimented yet");
//this.groupBy   = new groupByClass();
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
   i         // is line the row is being displayed on
  ,rowIndex  // row data to be displayed
) {

  // decide if raw data or a tag list is being displayed
  let row,rowIndexDisp;
  if (this.buffer) {
    // display bufffer
    row          = this.model.getRowBuffer(rowIndex)
    rowIndexDisp = rowIndex
  } else if (this.tag === "null"  || this.tag === null) {
    // display all data
    row          = this.model.getRow(rowIndex);
    rowIndexDisp = rowIndex
  } else {
    // display subset of rows in tag
    rowIndexDisp = this.tags[this.tag][rowIndex];
    row          = this.model.getRow( rowIndexDisp);
  }

  if (!row) {
    return "";  // at end of data, do not append anything
  }

  // create html for each column in the row
  let lineNum=""; if (this.lineNumberVisible ) {lineNum = `<td>${i}</td>`           ;}
  let rowNum =""; if (this.rowNumberVisible  ) {rowNum  = `<td>${rowIndexDisp}</td>`;}

  let selected = "";
  if (this.selected.find(
    val => val === rowIndexDisp) )
     {selected="class='selected'";}
  let html   = `<tr ${selected} data-row=${rowIndexDisp}>${lineNum}${rowNum}`;

  let value;
  row.forEach((field,ii) => {
    // create display form of field
    if (field===null) {
      value=""; // display null values as blank
    } else {
      value = field;
    }

    html += this.formatTransform(value, ii);
  });
  html += "</tr>";
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
  if (typeof(value) === "string" && (value.startsWith("https://")  || value.startsWith("http://")) ) {
      // display URL
      html += `<td ${format}><a href="${show}" target="_blank">URL</a></td>`;
  } else if (!format && typeof(value) === "number" ) { // display number right justified
      html += `<td align='right'>${show}</td>`;
  } else {
      html += `<td ${format}>${show}</td>`;   // display raw data
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



genTable(  //+ tableUxClass - client-side
  s_tableName
  ) {//-+
  let rows = this.genRows();

  return `"${s_tableName}": {
"fieldA":  ${JSON.stringify(this.json.fieldA)}

,"header": ${JSON.stringify(this.json.header)}

,"rows": [
${rows}]
}\n\n`;
} //-


getColumnFormat( // tableUxClass - client-side
  i
  ) { // return <td> attributes to be added
  let f = this.columnFormat[i];
  if (f === undefined) {
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
  let i, col;
  const c = eDom.children;  // array of <th> tags were search criteria are stored
  let searched = false;
  // look at search field, if something is not empty search for all
  for (i=this.skip_columns; i<c.length; i++) {
    this.searchValue = c[i].firstChild.value.toLowerCase();  // get value of text search box
    if ( 0 < this.searchValue.length) {
      // found search string
      searched = true;
      this.tags.search = []
      const rows = this.getModel().getRows();
      for(let ii=0; ii<rows.length; ii++) {
        let str=rows[ii][i-this.skip_columns]; 
        if (typeof(str) ==="number" ){str = str.toString();}
        if (str && str.toLowerCase().includes(this.searchValue)) {
          this.tags.search.push(ii);
        }
      }
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
  this.displayData();
}


prev( /// tableUxClass - client-side
) { // previous page
  this.paging.row = this.paging.row - this.paging.lines;
  if (this.paging.row < 0) {
    // should not be less than 0;
    this.paging.row = 0;
  }
  this.displayData();
}


first( /// tableUxClass - client-side
){  // first page
  this.paging.row = 0;
  this.displayData();
}


last( /// tableUxClass - client-side
){  // last page
//  this.paging.row = this.model.getRowsLength()  - this.paging.lines
//  this.paging.row = this.paging.rowMax  - this.paging.lines
  this.paging.row = parseInt(this.paging.rowMax/this.paging.lines) * this.paging.lines;
  this.displayData();
}


///////////////////////////////////////////////  buffer methods
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

} // tableUxClass - client-side //  end


export {tableUxClass};