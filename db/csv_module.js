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
  this.csv        = undefined ;   // csv file in memory to parse and put into database

  this.table      = table;   // place to put parsed data
  this.insertID   = false;   // do not insert ID column
  this.id         =     1;   // 
  this.column     = 0    ;   // first column is 1
  this.nextN      = -1;
  this.line_count = {};

  this.end_quoteR = undefined;  
  this.end_quoteN = undefined;
  this.end_quoteC = undefined;
  this.end_array  = ["",]
}


async parse_CSV(  // csvClass: client-side
   file          // file in memory to be parser
  ,DOMid         // DOMid  -> (optional) place to put status of current row being parsed
) {
  this.csv        = file;     //  file in memory to parse
  this.DOM        = document.getElementById(DOMid);

  // init class variables
  this.valueStart = 0;        // index into csv  where column parse starts
  this.row        = 0;        // row of csv file we have completed parsing
  this.row_old    = 0;        // keep track of rows parsed since last user update
  this.rowEnd     = false;
  this.delimiter  = ',';      // assume our delimter is a Comma
  this.quote      = '"';      // assume strings with quotes, comma's or crlf are quoted with double quotes
  this.display    = new Date();

  this.select = this.table.meta_get("select");   // select all the fields
  this.fields = this.table.meta_get("fields");   // create meta data for feilds
  await this.parse_for_one_second();  // start the parse process
}


async parse_for_one_second(){   // csvClass: client-side
  this.display = new Date();  // time the parse process started
  //while ( this.valueStart <this.csv.length && (new Date() - this.display) < 1000  ) {  //if there is more to parse and a second has not passed, continue 
  let row   = this.row.toString();
  while ( -1 < this.valueStart && this.valueStart < this.csv.length ) {  //if there is more to parse and a second has not passed, continue 
    if (this.parse_value()) {   // true -> we have value false->end of line
      // we got a value, so add it the record
      this.column++;
      let col   = this.column.toString();
      if (this.row === 0 ) {
        this.select.push(col); // show the field
        this.fields[col] = {"header":col, "type": "string", "location":"column"}  // some maybe numbers, bool or other.
      }

      if (this.value !== undefined) {
        /* only doing strings at this point
        let t=typeof(this.value);
        if (-1 === ["number","string"].findIndex((element)=>element===t)) {  // debug
          alert(t);
        }*/
        this.table.add_column_value(row, col, this.value);  // add parsed field value to table
      }
    } else {
      // we started a new line
      if (this.line_count[this.column] === undefined){
        // no lines with this number of columns exist, so init to empty array
        this.line_count[this.column] = [];
      }
      this.line_count[this.column].push(this.row); // keep track of number of fields parsed from each row

      this.column = 0;   // start new column
      this.row++;        // start new row
      row   = this.row.toString();
      if(this.valueStart < 0) { // debug
        alert(`error, file="csv_module" method="parse_for_one_second" this.valueStart="${this.valueStart}"`)
      }
    }
  }
 
  // show status
  let row_counts = "";
  const counts = Object.keys(this.line_count);
  for(let i = 0; i<counts.length; i++) {
    row_counts += `number of fields = ${counts[i]} - number of lines ${this.line_count[counts[i]].length}\n`
  }
  this.DOM.innerHTML = `${this.row} rows parsed total
${this.row - this.row_old} rows parsed this time slice 
next parse starting at = ${this.valueStart} file length=${this.csv.length}
${row_counts}`;

/*
  if (this.valueStart < this.csv.length) {
    this.row_old = this.row;
    setTimeout( this.parse_for_one_second.bind(this), 1)
  } else {
    // let user know there are unsaved changes
    //const changes = this.table.getJSON().changes;
    //changes.import = true;  
  }
  */
}


parse_value() {  // csvClass: client-side, return false if end of line, return true if value is parsed 
  //const start_1 = this.csv[this.valueStart-1];
  const start  = this.csv[this.valueStart];
  if (this.nextN < this.valueStart){
    // get the first /n after start
    let nextN = this.csv.indexOf("\n", this.valueStart);
    if(this.nextN < nextN ) {
      this.nextN = nextN
    } else {
      // missing \n at end of file
      this.nextN = this.csv.length;
    }
  }

  switch (start) {
  case this.delimiter:    // ,,  -> null
    this.value = undefined;  // we have a value
    this.valueStart++;
    return true;
  case this.quote :    
    //    ," this is Knoxville,TN",     -> string " this is Knoxville,TN"
    //    ," this is an escaped quote"""  -> string ' this is an escaped quote"'
    this.value = this.parseQuote();  // we have a value
    return true;
  case "\n" :    
    this.valueStart++;
    return false;   // end of line
  default:
    this.value = this.parse();
    return true;
  }
}


parseQuote() {  // csvClass: client-side
  this.valueStart++;  // go past the starting quote

  // most common case
  if ( (this.end_quoteR === undefined) || ( (0 < this.end_quoteR) && (this.end_quoteR < this.valueStart))) {this.end_quoteR = this.csv.indexOf('"\r' , this.valueStart);}
  if ( (this.end_quoteN === undefined) || ( (0 < this.end_quoteN) && (this.end_quoteN < this.valueStart))) {this.end_quoteN = this.csv.indexOf('"\n' , this.valueStart);}
  if ( (this.end_quoteC === undefined) || ( (0 < this.end_quoteC) && (this.end_quoteC < this.valueStart))) {this.end_quoteC = this.csv.indexOf('",'  , this.valueStart);}
 
  let end = this.csv.length;
  let inc   = 1;
  if (0<this.end_quoteR) {end = Math.min(end,this.end_quoteR)}
  if (0<this.end_quoteN) {end = Math.min(end,this.end_quoteN)}
  if (0<this.end_quoteC) {end = Math.min(end,this.end_quoteC)}

  let value = this.csv.slice(this.valueStart,end);
  if (valueStart === end) {
    // ,"",
    value = undefined;
    inc=2;
  }
  if (this.csv[end+inc] === '\r') {inc++;}  // start next parst on \n
  this.valueStart = end + inc ;
  return value;

  //const csv_part     = this.csv.slice(this.valueStart+1,end_comma);   

  // see if end of line happend before end_comma
  //const end_of_line  = csv_part.indexOf('"\n'  ); 
  //const end_of_lineR = csv_part.indexOf('"\r\n');
 
 /* let end_inc;

  if ( 0 < this.end_quoteC < this.nextN) {
    // end ",    the most common case
    end = end_comma;
    end_inc = 2;
  } else if (0<end_of_line && end_of_LineR === -1) {
    // end "/n    end of line next most common case
    end = this.valueStart + 1 +end_of_line;
    end_inc = 2;
  } else if (-1===end_of_line && 0<end_of_LineR) {
    // end "/r/n   very rare
    end = this.valueStart + 1 + end_of_LineR
    end_inc = 3;
  } else {
    alert("error - parseQuote")
  }

  let start       = this.valueStart+1;
  this.valueStart = end + end_inc;
  
  return this.csv.slice(start, end);*/
}


parse(){  // csvClass: client-side
  // find the end of the value, may come at next delimiter or end of line  \r\n or \n
  let end_delimiter  = this.csv.indexOf(this.delimiter, this.valueStart);  // search for next delimiter
  let value;

  if ( (0<end_delimiter) &&  (end_delimiter < this.nextN) ) {
    // most common case - not end of line
    value = this.csv.slice( this.valueStart, end_delimiter);
    this.valueStart = end_delimiter+1;
  }  else {
    // end of line
    value = this.csv.slice( this.valueStart, this.end_value());
    this.valueStart = this.nextN; // start on \n to trigger and end of line
  }
  /*
    v = this.csv.slice(this.valueStart);
    this.valueStart = this.csv.length; // will stop parse process
  } else if (ed<0 || (0<this.nextN && this.nextN<ed) ) {
    // did not find ending delimiter or at end of line come before end of del
    end = this.nextN;
    if (this.csv[end-1]==="\r" ) {
      end--;
    }
    v = this.csv.slice( this.valueStart, end )
    this.valueStart = this.nextN;
  }else {
    end =ed;
    v = this.csv.slice( this.valueStart, end )
    this.valueStart = end + 1;
  }
*/
 // this.test_reverse(start,"parse"); 
  return value;
}

end_value(){
  if (this.csv[this.nextN-1] == "\r") {
    return this.nextN-1;  // stop parse at \r
  } else {
    return this.nextN;    // stop at \n
  }
}


test_reverse(  // csvClass: client-side
  start, method){
  if (this.valueStart <= start) {
    alert(`error: file="csv_module" method="${method}" start=${start} this.valueStart=${this.valueStart}`)
  }
}


} // end of csvClass: client-side

export {csvClass}