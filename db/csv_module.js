class csvClass { // csvClass: client-side

  /*

  class to parse csv file and put into instance of _lib/dbClass/tableClass

  would like to also create csv from _lib/dbClass/tableClass

  link to spec for CSV (Comma seperated Values)
  https://datatracker.ietf.org/doc/html/rfc4180
  spec allos CRLF to be in side of quotes - have not tested this

  */


constructor(  // csvClass: client-side
  table   // place to put parsed data
) {
//  this.fsp  = require('fs').promises;   // asycn wrapper on fs
  this.csv;                 // cvs file in memory to convert to JSON
  //this.rowDebug  = 999;   // can be used to debug
  this.error      = false;   // will be set to true if a parsing error occures
  this.table      = table;   // place to put parsed data
  this.insertID   = false;   // do not insert ID column
  this.id         =     1;   // 
  this.column     = 0    ;
  this.column_max = 0;
}


parseCSV(  // csvClass: client-side
   file          // file in memory to be parser
  ,DOMid         // DOMid  -> (optional) place to put status of current row being parsed
) {
  this.csv        = file;     //  file in memory to parse
  this.DOM        = document.getElementById(DOMid);

  // init class variables
  this.rowStart   = 0;        // pointer to where we are parsing
  this.valueStart = 0;        // start of valueStart
  this.row        = 0;        // row of csv file we have completed parsing
  this.row_old    = 0;
  this.rowEnd     = false;
  this.delimiter  = ',';      // assume our delimter is a Comma
  this.quote      = '"';      // assume strings with quotes, comma's or crlf are quoted with double quotes
  this.display    = new Date();
  // now loop and put everything else in json.rows
  while ( this.valueStart < this.csv.length) {
    // now add all the data
    this.parseRow();
    if (1000 < (new Date() - this.display)  ) {
      // display progress every second
      /*
      this.DOM.innerHTML = 
      `${this.row} rows parsed total - ${this.row - this.row_old} rows parsed this time slice `;
             */

      console.log(`${this.row} rows parsed total - ${this.row - this.row_old} rows parsed this time slice `);
      this.row_old = this.row;
      this.display = new Date();

    }
  }

  // force save if use presses save button
  const changes = this.table.getJSON().changes;
  changes.import = true;  


  // create meta data
  const select = this.table.meta_get("select");
  const fields = this.table.meta_get("fields");
  const header = this.table.meta_get("fiheaderelds");
  // select all the fields imported
  for(var i=0; i<this.column_max; i++){
    let field = i.toString();  // "0","1","2".....
    select.push(field); 
    fields[field] = {"header":field, "type": "string", "location":"column"}  // some maybe numbers, bool or other.
  }
}


parseRow() {  // csvClass: client-side
  while (!this.rowEnd) {  
    this.table.add_column_value(this.row.toString(), this.column.toString(),this.parseValue());
    this.column++; // goto next column
    if (this.rowEnd) {
      if(this.column_max<this.column) {
        this.column_max = this.column;
      }
      if        (! this.column === this.column_max) {
        this.error(`error on row ${this.row}, column=${this.column }, expected ${this.column_max} `);
      }
    }
  }

  // init for next row
  this.column = 0;
  this.rowEnd = false;
  this.row++;
}


error(message){  // csvClass: client-side
    this.error = true;
    this.DOM.innerHTML += message +"<br/>";
}


parseValue() {  // csvClass: client-side
  if      (this.csv[this.valueStart] === this.delimiter
      ||   this.csv[this.valueStart] === "\n"
      ||  (this.csv[this.valueStart] === "\r" && this.csv[this.valueStart+1] === "\n" ) ) {
    // /r/n -> parseNull
    // /n   -> parseNull
    // ,,  -> null
    if (this.csv[this.valueStart] === "\r" && this.csv[this.valueStart+1] === "\n" ) {
      this.valueStart++;  // take out "\r"
    }
    return this.parseNull();
  } else if (this.csv[this.valueStart] === this.quote ) {
//    ," this is Knoxville,TN",     -> string " this is Knoxville,TN"
//    ," this is an escaped quote"""  -> string ' this is an escaped quote"'
    return this.parseQuote();
  } else {
  //  ,1,  -> number 1
  //  , hello ,  -> string " hello "
    return this.parse();
  }
}


parseQuote(){  // csvClass: client-side
  // find the end of the quote   "            ",
  let e1 = this.csv.indexOf('",', this.valueStart+1);   // was +2
  let e2 = this.csv.indexOf('"\r', this.valueStart+1);  // was +2
  let e=Math.min(e1,e2);
  if (e<0) {e=Math.max(e1,e2);} // one e1 or e2 not found so use max
  let v = this.csv.slice( this.valueStart+1, e );
  if (e === e2) {
    // at end of row
    this.rowEnd = true;
  }
  if ( this.rowEnd = true && this.csv[e+2] === "\n") {
    // row ends with /r/n
    this.valueStart = e+3;
  } else {
    // row ends with /r
    this.valueStart = e+2;
  }

  return(v); // return string value in array
}


parse(){  // csvClass: client-side
  // find the end of the value, may come at next delimiter or end of line  \r\n or \n
  let ed=this.csv.indexOf(this.delimiter, this.valueStart);
  let en=this.csv.indexOf('\n'          , this.valueStart);
  let e=Math.min(ed,en);
  let newValueStart,v;

  if (e<0) {
    // did not find delimiter or did not find \n, try using max
    e=Math.max(ed,en);
  }
  if (e<0) {
    // at end of file with out end of row delimter
    e=this.csv.length;
  }

  if (e === en && this.csv[e-1] === '\r') {
    // end of line was a \r\n,  get ride of \r
    v = this.csv.slice( this.valueStart, e-1 )
  } else {
    v = this.csv.slice( this.valueStart, e )
  }

  this.testEndRow(e);
  //return(v)
  if (isNaN(v)) {
    return(v); // return string value in array
  } else {
    return( parseFloat(v) ) // return number value
  }
}


parseNull() { // csvClass: client-side
  this.testEndRow(this.valueStart);
  return (null);
}


testEndRow(e) {  // csvClass: client-side
  if (this.csv[e] === "\n"  || this.csv.length === e) {
    this.rowEnd = true;
  }
  this.valueStart = e+1;
}


exportCSV() { // csvClass: client-side
 const rows = this.table.getRows();
}


} // end of csvClass: client-side

export {csvClass};
