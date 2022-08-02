/* class to work with json file

not started yet, just copied csv class

load from file,
load for server
display
edit
save local file download
save to server


*/


class jsonClass {


constructor() {
//  this.fsp  = require('fs').promises;   // asycn wrapper on fs
  this.csv;                 // cvs file in memory to convert to JSON
  this.json = {};           // will be the JSON object we write to file
  this.json.rows =[];       // where this.json.rows[0] is the first row and this.json.rows[0][0] is the first field in the first row
  this.json.len = [];       // this.json.len[36] returns an array of all rows that had 36 fields in it.

  this.rowStart   = 0;        // pointer to where we are parsing
  this.valueStart = 0;        // start of valueStart
  this.maxColumns = 0;        // set after first row, used test all subsquet rows are the same length
  this.row        = 0;        // row of csv file we have completed parsing
  this.rowEnd     = false;
  this.delimiter  = ',';      // assume our delimter is a Comma
  this.quote      = '"'       // assume strings with quotes, comma's or crlf are quoted with double quotes
  this.rowDebug   = 7;
}


// main entry point
async read(fileName) {
  try {
    // read entire file into memory
//    this.cvs = await this.fsp.readFile(fileName+'.csv');
    let buff = await this.fsp.readFile(fileName+'.csv');

    // will create this.json from this.cvs
    this.parseCSV( buff.toString('utf8') );

    // write this.json so it can be read later
    await this.fsp.writeFile(fileName+".json", JSON.stringify(this.json));

    console.log(`\n\nSuccessful  rows=${this.row}   maxColumns=${this.maxColumns}\n\n`);
  } catch (e) {
    console.error("\n\nError:  " + e);
  }
}


parseCSV(file){
  this.csv = file;

  // now loop and put every thing else in json.rows
  while ( this.valueStart < this.csv.length) {
    this.json.rows.push( this.parseRow() );
//    if  ( Number.isInteger(this.row/this.rowDebug) ) {
    if  (this.row > this.rowDebug) {
      debugger; // put break here for debuging
    }
  }
}


parseRow() {
  const a = [];   // returns this array with each element one field in the array

  while (!this.rowEnd) {
    a.push( this.parseValue() );
  }

  // now add row to array of other rows with the same lenght
  let l = this.json.len[ a.length ]
  if ( !Array.isArray(l) ) {
    this.json.len[ a.length ] = [];
    l = this.json.len[ a.length ]
  }  // if not an array, init with empty array
  l.push( this.row );  // add row number to the array with the same number of fields
  this.rowEnd = false;
  this.row++;
  return a;
}


parseValue() {
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


parseQuote(){
  // find the end of the quote   "            ",
  let e1 = this.csv.indexOf('",', this.valueStart+2);
  let e2 = this.csv.indexOf('"\r', this.valueStart+2);
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


parse(){
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
  let n = parseFloat(v);
  if (isNaN(n)) {
    return(v); // return string value in array
  } else {
    return(v) // return number value
  }
}


parseNull() {
  this.testEndRow(this.valueStart);
  return (null);
}


testEndRow(e) {
  if (this.csv[e] === "\n"  || this.csv.length === e) {
    this.rowEnd = true;
  }
  this.valueStart = e+1;
}


displayTable(domID) {
  let html= `<table><tr><th>#</th>`;

  // add header
  this.json.rows[0].forEach((item, i) => {
    html += "<th>" +item + "</th>";
  });
  html += "</tr>"

  // add rows
  this.json.rows.forEach((row, i) => {
    html += `<tr><td>${i+1}</td>`;
    row.forEach((field,i) => {
      if (field===null) field="";
      if (field.startsWith("https://")  || field.startsWith("http://") ) {
          html += `<td><a href="${field}" target="_blank">URL</a></td>`;
      } else {
          html += "<td>" +field + "</td>";
      }
    })
    html += "</tr>";
  });
  html += "<tr>";

  document.getElementById(domID).innerHTML = html;
}


error(className){
  // not implemented
}

} // end of class
