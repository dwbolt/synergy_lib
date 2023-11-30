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
  this.end_lineN  = null ;   // index into csv where the next /n is,"maybe end of line or side a quote
  this.valueStart = null ;   // index into csv  where column parse starts

  this.error      = false;   // will be set to true if a parsing error occures
  this.table      = table;   // place to put parsed data
  this.insertID   = false;   // do not insert ID column
  this.id         =     1;   // 
  this.column     = 0    ;   // first column is 1
  this.column_max = 0;
  this.nextN      = -1;
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
  this.end_lineN  = this.csv.indexOf("/n" , this.valueStart+1);

  const select = this.table.meta_get("select");
  const fields = this.table.meta_get("fields");
  while ( this.valueStart <this.csv.length) {
    let row   = this.row.toString();
    if (this.parse_value()) {
      // we got a value, so add it the record
      this.column++;
      let col   = this.column.toString();
      if (this.row === 0 ) {
        this.column_max = this.column; // set highwater mark for column parsed
        select.push(col); // show the field
        fields[col] = {"header":col, "type": "string", "location":"column"}  // some maybe numbers, bool or other.
      }
      if (this.value !== null) {
        let t=typeof(this.value);
        if (-1 === ["number","string"].findIndex((element)=>element===t)) {  // debug
          alert(t);
        }
        this.table.add_column_value(row, col, this.value);
      }
    } else {
      // we started a new line
      if (this.column != this.column_max) {
        // log error if all lines do not have same number of columns - what does the spec say?
        this.show_error( `error on row="${row}", column=${this.column }, expected=${this.column_max}  col1="${this.table.get_value(row,"1")}" col2="${this.table.get_value(row,"2")}"`);
      }
      this.column = 0;   // start new column
      this.row++;        // start new row
    }

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

  //const header = this.table.meta_get("fiheaderelds");
  // select all the fields imported
  for(var i=1; i<=this.column_max; i++){

  }
}


show_error(message){  // csvClass: client-side
    this.error = true;
    this.DOM.innerHTML += message +"\r\n";
}


parse_value() {  // csvClass: client-side, return false if end of line, return true if value is parsed 
  const start1 = this.csv[this.valueStart-1];
  const start  = this.csv[this.valueStart];
  if (this.nextN < this.valueStart){
    this.nextN = this.csv.indexOf("\n", this.valueStart);
  }
  if        (start1 === this.delimiter && start === this.delimiter )  {  // ,,  -> null
    this.value = null;
    this.valueStart++;
    return true;
  } else if (start === this.quote ) {
//    ," this is Knoxville,TN",     -> string " this is Knoxville,TN"
//    ," this is an escaped quote"""  -> string ' this is an escaped quote"'
    this.value = this.parseQuote();
    return true;
  } else if (start === "\n"  ) {
    this.valueStart++;
    return false;   // end of line
  } else if (start === "\r" && start1 === "\n"  ) {
    this.valueStart += 2;
    return false;  // end of line
  } else {
  //  ,1,  -> number 1
  //  , hello ,  -> string " hello "
  if (start === this.delimiter) {
    this.valueStart++;
  }
  this.value = this.parse();
  return true;
  }
}


parseQuote() {  // csvClass: client-side
  // find the end of the quote   "            ",
  const end = this.csv.indexOf('",' , this.valueStart+1); 

  if        (0<end) {
    // most common case, end_quote inside line
    let v = this.csv.slice( this.valueStart+1, end);
    this.valueStart = end + 2 // get on the other side of "
  
    return(v); // return string value in array
  } else {
    alert(`errow file="csv_module.js" method="parseQuote" end=${end}`);
    return null;
  }
}


parse(){  // csvClass: client-side
  // find the end of the value, may come at next delimiter or end of line  \r\n or \n
  let ed  = this.csv.indexOf(this.delimiter, this.valueStart);  //
  let end,v;

  if (ed<0 || this.nextN<ed) {
    // did not find ending delimiter or at end of line come before end of del
    end = this.nextN;
    if (this.csv[end-1]==="\r" ) {
      end--;
    }
    v = this.csv.slice( this.valueStart, end )
    this.valueStart = this.nextN;
  } else {
    end =ed;
    v = this.csv.slice( this.valueStart, end )
    this.valueStart = end + 1;
  }

  const f = parseFloat(v); // return number value
  if (typeof(f) === "number") {
    v = f;  // see if v is a number
  }

  return v;
}


} // end of csvClass: client-side

export {csvClass};

/*
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
*/

/*
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
*/

/*
parse_line() {  // csvClass: client-side
  while (!this.rowEnd) {  
    let row   = this.row.toString();
    let col   = this.column.toString();
    let value = this.parse_value();
    this.table.add_column_value(row, col, value);
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
*/


/*
 
      ||                                            // /n   -> parseNull
      ||  (start === "\r" && start1 === "\n" ) ) {                  // /r/n -> parseNull
    if (start === "\r" && start1 === "\n" ) {
      this.valueStart++;  // take out "\r"
    }
 */