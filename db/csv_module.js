class csvClass { // csvClass: client-side   _lib/db/csv_module.js

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
  this.csv        = null ;   // csv file in memory to parse and put into database
  this.end_lineN  = null ;   // index into csv where the line being parses ends at /n
  this.valueStart = null ;   // index into csv  where column parse starts

  this.error      = false;   // will be set to true if a parsing error occures
  this.table      = table;   // place to put parsed data
  this.insertID   = false;   // do not insert ID column
  this.id         =     1;   // 
  this.column     = 0    ;
  this.column_max = 0;
}


parse_CSV(  // csvClass: client-side
   file          // file in memory to be parser
  ,DOMid         // DOMid  -> (optional) place to put status of current row being parsed
) {
  this.csv        = file;     //  file in memory to parse
  this.DOM        = document.getElementById(DOMid);

  // init class variables
  this.valueStart = 0;        
  this.row        = 0;        // row of csv file we have completed parsing
  this.row_old    = 0;        // keep track of rows parsed since last user update
  this.rowEnd     = false;
  this.delimiter  = ',';      // assume our delimter is a Comma
  this.quote      = '"';      // assume strings with quotes, comma's or crlf are quoted with double quotes
  this.display    = new Date();

  while ( this.get_line()) {
    // now add all the data to columns
    this.parse_line();

    if (1000 < (new Date() - this.display)  ) {
      console.log(`${this.row} rows parsed total - ${this.row - this.row_old} rows parsed this time slice - this.valueStart = ${this.valueStart} - this.csv.length=${this.csv.length}`);
      this.row_old = this.row;
      this.display = new Date();
    }
  }

  // let user know there are unsaved changes
  const changes = this.table.getJSON().changes;
  changes.import = true;  

  // create meta data
  const select = this.table.meta_get("select");
  const fields = this.table.meta_get("fields");
  //const header = this.table.meta_get("fiheaderelds");
  // select all the fields imported
  for(var i=0; i<this.column_max; i++){
    let field = i.toString();  // "0","1","2".....
    select.push(field); // show the field
    fields[field] = {"header":field, "type": "string", "location":"column"}  // some maybe numbers, bool or other.
  }
}


get_line(){
  this.end_lineN  = this.csv.indexOf('\n' , this.valueStart+1);
  if (this.end_lineN<0) {
    // end of file, did not get a new line
    return false;
  }

  if (this.csv[this.end_lineN-1] === "\r") {
    this.end_parse = this.end_lineN - 2;  // line ends in cr lf, get rid of cr
  } else {
    this.end_parse = this.end_lineN - 1;
  }
  return true;  // we have a line to parse
}


parse_line() {  // csvClass: client-side
  while (!this.rowEnd) {  
    let row = this.row.toString();
    let col = this.column.toString();
    this.table.add_column_value(row, col,this.parse_value());
    if (this.rowEnd) {
      if (this.column_max < this.column) {
        // set highwater mark for column parsed
         this.column_max = this.column;
      }
      if (this.column != this.column_max) {
        // logg error if all lines do not have same number of columns - what does the spec say?
        this.show_error( `error on row ${this.row}, column=${this.column }, expected ${this.column_max} col0="${this.table.get_value(row,"0")}" col1="${this.table.get_value(row,"1")}" `);
      }
    }
    this.column++; // goto next column
  }

  // init for next row
  this.column = 0;
  this.rowEnd = false;
  this.row++;
}


show_error(message){  // csvClass: client-side
    this.error = true;
    this.DOM.innerHTML += message +"\r\n";
}


parse_value() {  // csvClass: client-side
  const start = this.csv[this.valueStart];

  if      ( 
          (start === this.delimiter && this.csv[this.valueStart+1] === this.delimiter)
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


parseQuote() {  // csvClass: client-side
  // find the end of the quote   "            ",
  const end_quote  = this.csv.indexOf('",' , this.valueStart+1); 
  let end;

  if        (end_quote < this.end_parse  && 0<end_quote) {
    // most common case, end_quote inside line
    end = end_quote;
  } else if ( this.end_parse < end_quote && 0 < this.end_parse) {
    // end_quote at end of line
    end = this.end_parse
  } else if (end_quote === -1 ) {
    // end of file without closing line
    end=this.csv.length;  // not sure this is right, test
  }

  let v = this.csv.slice( this.valueStart+1, end);
  this.testEndRow(end+1); // get on the other side of "

  return(v); // return string value in array
}


parse(){  // csvClass: client-side
  // find the end of the value, may come at next delimiter or end of line  \r\n or \n
  let ed  = this.csv.indexOf(this.delimiter, this.valueStart);
  let end, newValueStart,v;

  if (ed<0) {
    // did not find ending delimiter -> at end of file
    end = this.end_parse;
  } else {
    end = Math.min(ed, this.end_parse);
  }

  v = this.csv.slice( this.valueStart, end )

  this.testEndRow(end);

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


testEndRow(end) {  // csvClass: client-side
  if (this.valueStart < end+1) {
    this.valueStart = end+1;
  } else {
    this.show_error(`Error this.valueStart=${this.valueStart}  end=${end}`);
  }
  

  if (  this.end_parse <= this.valueStart) {
    this.rowEnd     = true;
    this.valueStart = this.end_lineN+1;
  }
}


} // end of csvClass: client-side

export {csvClass};
