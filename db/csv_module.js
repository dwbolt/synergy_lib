export class csvClass { // csvClass: client-side   _lib/db/csv_module.js

  /*

  class to parse csv file and put into instance of _lib/dbClass/tableClass

  would like to also create csv from _lib/dbClass/tableClass

  link to spec for CSV (Comma seperated Values)
  https://datatracker.ietf.org/doc/html/rfc4180
  spec allos CRLF to be in side of quotes - have not tested this

  assume records end in \r\n
  
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

  this.new_line = false; 
}


async parse_CSV(  // csvClass: client-side
   file          // file in memory to be parser
  ,DOMid         // DOMid  -> (optional) place to put status of current row being parsed
) {
  this.csv        = file;     //  file in memory to parse
  this.DOM        = document.getElementById(DOMid);

  this.valueStart = 0;        // index into csv  where column parse starts

  /*
  // see if end_of_line is "\r\n" or "\n"
  if ( -1 === this.csv.indexOf("\r\n", this.valueStart)) {   // not a perfect test
    // assume end of line is "\n"n
    this.end_of_line = "\n";
  } else {
    this.end_of_line = "\r\n";
  }
*/
  this.end_of_line = "\n";

  if (! (this.csv.slice(this.csv.length-this.end_of_line.length) ===  this.end_of_line)) {
    // add end of line to file
    this.csv += this.end_of_line;
  }

  // init class variables

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
  let row;
  while ( -1 < this.valueStart && this.valueStart < this.csv.length ) {  //if there is more to parse and a second has not passed, continue 
    this.parse_value();   
    // we got a value, so add it the record
    this.column++;
    let col   = this.column.toString();
    if (this.row === 0 ) {
      // add column to table meta data
      this.select.push(col); // show the field
      this.fields[col] = {"header":col, "type": "string", "location":"column"}  // some maybe numbers, bool or other.
    }

    if (! (this.value === undefined) ) {
      // only doing strings at this point
      row   = this.row.toString();
      this.table.add_column_value(row, col, this.value);  // add parsed field value to table
    }

    if(this.new_line) {
      this.new_line = false;
      // we started a new line
      if (this.line_count[this.column] === undefined){
        // no lines with this number of columns exist, so init to empty array
        this.line_count[this.column] = [];
      }
      this.line_count[this.column].push(this.row); // keep track of number of fields parsed from each row

      this.column = 0;   // start new column
      this.row++;        // start new row
      row   = this.row.toString();
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
}


parse_value() {  // csvClass: client-side
  // non quoted value
  const start  = this.csv[this.valueStart];
  if ( (-1 === this.nextN) || (this.nextN < this.valueStart) ){
    // get the next end of line 
    this.nextN = this.csv.indexOf(this.end_of_line, this.valueStart);
  }

  switch (start) {
  case this.delimiter:    // ,,  -> null
    this.value = undefined;  // we have a value
    this.valueStart++;
    break;
  case this.quote :    
    //    " this is Knoxville,TN",     -> string " this is Knoxville,TN"
    //    " this is an escaped quote"""  -> string ' this is an escaped quote"'
    //    " sdfk "\r\n
    this.value = this.parseQuote();  // we have a value
    break;
  default:
    this.value = this.parse();
    break;
  }
}


parseQuote() {  // csvClass: client-side
  this.valueStart++;  // go past the starting quote

  let value = "";  // walk a chartact at a time
  let more = true;
  while(more)  {
    let next_1   = this.csv.slice(this.valueStart, this.valueStart+1);
    let next_2   = this.csv.slice(this.valueStart, this.valueStart+2);
    let next_EOL = this.csv.slice(this.valueStart, this.valueStart+1+this.end_of_line.length);

    if         (next_2 === '",') {
      more = false;         // done parsing value
      this.valueStart += 2;
    } else if  (next_EOL === `"${this.end_of_line}`)  {
      more = false;         // done parsing value
      this.valueStart += 1+this.end_of_line.length;
      this.new_line = true;
    } else if ( next_2 === '""' ){
      value += '"';
      this.valueStart += 2;  // un escape "" -> "
    } else {
      value += next_1;  // add next character to value
      this.valueStart++;
    }
  } 

  if (value === "") {
    value = undefined;
  }
  return value;
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
    value = this.csv.slice( this.valueStart, this.nextN);
    this.valueStart = this.nextN+this.end_of_line.length; // start on \n to trigger and end of line
    this.new_line = true;
  }
  return value;
}


} // end of csvClass: client-side
