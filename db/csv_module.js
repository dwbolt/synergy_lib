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

  while ( this.valueStart < this.csv.length) {
    // now add all the data to columns
    this.get_line();
    this.parse_line();

 
    if (1000 < (new Date() - this.display)  ) {
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


get_line(){
  this.end_lineN  = this.csv.indexOf('\n' , this.valueStart+1);
  if (this.csv[this.end_lineN-1] === "\r") {
    this.end_parse = this.end_lineN - 1;  // line ends in cr lf, get rid of cr
  } else {
    this.end_parse = this.end_lineN;
  }
}


parse_line() {  // csvClass: client-side
  while (!this.rowEnd) {  
    this.table.add_column_value(this.row.toString(), this.column.toString(),this.parse_value());
    this.column++; // goto next column
    if (this.rowEnd) {
      if(this.column_max < this.column) {
        // set highwater mark for column parsed
         this.column_max = this.column;
      }
      if        (! this.column === this.column_max) {
        // logg error if all lines do not have same number of columns - what does the spec say?
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

  if        (end_quote < end_lineN && 0<end_quote) {
    // most common case, end_quote inside line
    end = end_quote;
  } else if ( end_lineN < end_quote && 0<end_lineN) {
    // end_quote at end of line
    if        (this.csv[end_lineN-1] === '"') {
      end--;  // line ends with "/n
    } else if (this.csv[end_lineN-1] === '\r' && this.csv[end_lineN-2] === '"' )  {
      end = end -2;  // line ends with "/r/n
    } else {
      alert(`error: file="csv_module.js" method="parseQuote" end_quote="${end_quote}" end_LineN="${end_lineN}"`);
    }
  } else if (end_quote === -1 && end_lineN === -1) {
    // end of file without closing line
    end=this.csv.length;  // not sure this is right, test
  }

  let v = this.csv.slice( this.valueStart+1, end);
  this.testEndRow(end);

  return(v); // return string value in array
}


parse(){  // csvClass: client-side
  // find the end of the value, may come at next delimiter or end of line  \r\n or \n
  let ed  = this.csv.indexOf(this.delimiter, this.valueStart);
  let en  = this.csv.indexOf('\n'          , this.valueStart);
  let end = Math.min(ed,en);
  let newValueStart,v;

  if (end<0) {
    // did not find delimiter or did not find \n, try using max
    e=Math.max(ed,en);
  }
  if (end<0) {
    // at end of file with out end of row delimter
    end=this.csv.length;
  }

  if (end === en && this.csv[end-1] === '\r') {
    // end of line was a \r\n,  get ride of \r
    v = this.csv.slice( this.valueStart, end-1 )
  } else {
    v = this.csv.slice( this.valueStart, end )
  }

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
  if (this.csv[end] === "\n"  || this.csv.length === end) {
    this.rowEnd = true;
  }
  this.valueStart = end+1;
/*
    // find new start value
    if ( this.rowEnd === true && this.csv[e+2] === "\n") {
      this.valueStart = e+3;  // row ends with /r/n
    } else {
      this.valueStart = e+2;  // in mid line or row ends with /r
    }
    */
}


} // end of csvClass: client-side

export {csvClass};
