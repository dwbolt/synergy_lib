// _/lib/db/tableModule.js

import  {proxyClass   }   from '/_lib/proxy/proxyModule.js'    ;

class tableClass {  // tableClass - client-side

/*
similar to a table in sql rdb. working on support for:
 select - returns an array of row numbers that match the selection function passed in
 total -
 group by - in a seperate class for now
 sort - pass an array of indexes to be sorted, and an array of fields to sort on

these features are used in the following apps
  accounting
  server log
*/

#json   // json table loaded from disk
#url
#proxy

constructor( // tableClass - client-side
url
) {  
  // data
  this.#proxy = new proxyClass();
  this.#url   = url;
  
  this.#json  = {
    "description":""        // what is this table for
    ,"primary_key": 0    // index 0-> primary_key is the first column of data
    ,"field":{}             // calculated field from fieldA
    ,"fieldA":[]            // array of names to access field in rows
                            // search is optional array of size of search input
    ,"header" : []          // what is displayed for the header
    ,"index"  : []          // array of index fields
    ,"changes": {}          // current changed memory value
    ,"rows"   : []          // row data, one array for each row

    /*
      "key":{
         "column#": {"value_new":", value_orig:"}
        ,"column#": {"value_new":", value_orig:"}
        ..
      }
      ,"key2":{...}
    }   */       
    ,"rowsBuffer":[]        // array of arrays: buffer data for add, select, dupp, will change rows data if saved
                            // [rowIndex,[changes made]]  index of <0 is new row to be appended at end if saved
  }
}


async load(url) { // tableClass - client-side
  this.#url = url;
  this.#json = await this.#proxy.getJSON(this.#url );
  // init
  this.#json.changes = {};
  this.#json.index   = [];

  // index primary key
  this.index_primary();
}

index_primary(){
  this.index(this.#json.primary_key);
}

async save2file( // tableClass - client-side
){
  // see if it is a new table;
  const changes = Object.keys(this.#json.changes);
  if (0<changes.length) {
    // only save file if there are changes to the table or it is new
    const msg   = await this.#proxy.RESTpost( this.genTable() ,this.#url);
    alert(`
    file=${this.#url}
    records changed=${changes.length}
    save status = ${msg.statusText}`)
    if (msg.statusText=="OK") {
      this.#json.changes = {};
    };
  }
}


save2memory( // tableClass - client-side
  // make change to row in memory and update memory change log
  primary_key_value  // positive number edit exiting row,  negative number create new row
  ,record            // new record values
  ) {
  // get change log for row
  let changes = this.changes_get(primary_key_value);
  // see what fields changed for the row
  for(var i=0; i< record.length; i++) {
    if (i !== this.get_primary_key() ) {  // skip primary key
      // not on primary key
      let edited_value   = record[i];  // from edit form
      let current_value  = this.getRowByIndex(this.get_primary_key(), primary_key_value)[i];  // from table memory

      // update change log
      if (edited_value !== current_value ) {
        // change was made to field
        if (typeof(changes[i]) === "undefined") {
          // first time field has changed for this row, add change log for field
          changes[i] = {"original":current_value, "new_value":edited_value};
        } else if (edited_value  === changes[primary_key_value][i]["original"]) {
          // original value was restored, so delete session change log
          delete changes[i];
        } else {
          // replace new_value
          changes[primary_key_value][i].new_value = edited_value;
        }

        // update memery row
        this.getRowByIndex(this.get_primary_key(), primary_key_value)[i]  = edited_value;
      }
    }
  }

  // need to save memory change log to server incase session is lost, so user will not loose there work
  // code here
}


index(  // tableClass - client-side
  key  // column # to index on
  ){ 
  // create index on column key;
  if (typeof(key)  === "number") {
    const rows  = this.getRows();
    const index = {}
    let max     = 0; // next primary key

    // walk to entire table and index on column key
    for (var i=0; i< rows.length; i++) {
      let value = rows[i][key];  // get row's key value
      index[value]=i;            // store the row number 

      if (key === this.get_primary_key() && max<value) {
        // find largest key value, primary key is an integer number that increments
        max = value;
      }
    }

    this.#json.index[key]=index;  // index of field key
    if (key === this.get_primary_key() ) {
      this.#json.primary_key_max = max;
    }
  } else {
    // key not valid
    alert(`tableModule.js index key=${key} is not a number`);
  }
}


sortList(  // tableClass - client-side
    a_list     // array of row indexes that need to be sorted
  , a_fields   // array of fields to sort on
) {
  // a_list will be return sorted
  a_list.sort( (a,b)=> {
    // a and b are indexes in table
    const ra = this.#json.rows[a];    // a row from a_table
    const rb = this.#json.rows[b];    // b row from a_table
    const f  = this.#json.field;

    let ret = 0;
    a_fields.forEach((field, i) => {
      let va = ra[f[field]];  // value of field in row a
      let vb = rb[f[field]];  // value of field in row b
      if        ( va < vb ) {
        ret = -1;
        return;
      } else if ( va > vb ) {
        ret =  1;
        return;
      }
    });
    return ret;  // must be equal for all fields in the a_list
  });
}


getValue(rowIndex,fieldName)  // tableClass - client-side
                {return this.#json.rows[rowIndex][this.#json.field[fieldName]] ;}

getHeader()      {return this.#json.header        ;} // tableClass - client-side
getField()       {return this.#json.field         ;} // tableClass - client-side
getRows()        {return this.#json.rows          ;} // tableClass - client-side
getRow(index)    {return this.#json.rows[index]   ;} // tableClass - client-side
get_primary_key(){return this.#json.primary_key   ;} // tableClass - client-side

changes_get(key) { // tableClass - client-side
  // return change object for record with primary key = key
  let changes = this.#json.changes[key];
  if (typeof(changes)==="undefined") {
    // no privous changes to row, so init to empty change object
              this.#json.changes[key] = {};
    changes = this.#json.changes[key];
  } 
  
  return changes;
}


getRowByIndex( // tableClass - client-side
   index // index number 0-> first field in table
  ,value // value of index
  )   {return this.#json.rows[ this.#json.index[index][value] ];} // tableClass - client-side

getRowsLength() {return this.#json.rows.length   ;} // tableClass - client-side
getJSON(      ) {return this.#json               ;} // tableClass - client-side

appendRow(  // tableClass - client-side
  a_row
  ){
  this.#json.rows.push(a_row);  // adding new row
  change_summary("append");  // incremnet append count
}


change_summary(  // tableClass - client-side
  field
  ){
  const change = changes_get("summary");
  if (typeof(change[field]) ==="undefined") {
    // first time data is stored so create empty
    change[field] = {count: 0};
  }

  change[field]["count"]++;
}


setHeader(a_header){this.#json.header = a_header;} // tableClass - client-side


genCSV( // tableClass - client-side
) { // create a string in CSV of the table
    // add a_header

    let csv = this.genCSVrow(this.#json.header);
    /*
    if (tag === null) {
      // all data 
      this.#json.rows.forEach((r, i) => {
        csv += this.genCSVrow(r);
      });
    } else {
      let rows = this.#json.rows;
      let index = this.tags[tag];
      for(var i=0; i<index.length; i++) {
        csv += this.genCSVrow(rows[index[i]]);
      }
    }
*/
    //return csv.substr(1)  // remove leading comma on first line
    return csv  // remove leading comma on first line
}


genCSVrow( // tableClass - client-side
  row) {
  // will only work for numbers, strings, boolean
  // Will not  work for dates, objects, etc...
  let line = JSON.stringify(row);
  return  line.slice(1, line.length-1) +"\r\n";     // get rid of [   ]
}


//////////////////////////////////     buffer methods

getRowBuffer(index) {return (index ? this.#json.rowsBuffer[index] : this.#json.rowsBuffer);}


table2buffer(  // tableClass - client-side
  a_index  // a_index-> array of row numbers into
) {
  // clear the buffer
  this.#json.rowsBuffer = [];

  // make a copy of the data for the buffer so change buffer does not change data in table
  a_index.forEach((rowNumber, i) => {
    // make copy of row and add row number at end
    this.#json.rowsBuffer.push(
      Array.from(this.#json.rows[rowNumber]).concat(rowNumber));
  });
}


bufferGet( // tableClass - client-side
  row  //
) {
  if (typeof(row) === "number") {
    return this.#json.rowsBuffer[row];
  } else {
    return this.#json.rowsBuffer;
  }
}


bufferSetType( // tableClass - client-side
) { // convert all strings that should be numbers to numbers
  this.#json.fieldA.forEach((column, i) => {
    if (column.startsWith("n_")) {
      // found a number column
      this.#json.rowsBuffer.forEach((r, ii) => {
        // convert that column to a number
        r[1][i] = Number(r[1][i]);
      });
    }
  });
}


bufferSave(  // tableClass - client-side
) {  // to table in memory
  this.bufferSetType();
  this.#json.rowsBuffer.forEach((item, i) => {
    // does not handle the case of growing or srinking the number of items in the buffer
    this.#json.rows[item[0]] = item[1];
  });
}




bufferInput2Json( // tableClass - client-side
  // move data from DOM to table buffer
) {
  let r,col;
  // a_rows ->  an array of rows of input buffer data
  const a_rows = document.getElementById(this.DOMid.buffer).firstChild.firstChild.children;
  for (r=1; r<a_rows.length; r++) {  // skip first row, it is the header
    let empty = true;
    for (col=1; col<=this.#json.fieldA.length; col++) { // skip first column, it has the row number
      let v = a_rows[r].children[col].firstChild.value;  // read html input value
      if (empty && v!=="") {
        empty = false;  // will keep this row, it has data
      }
      this.#json.rowsBuffer[r-1][1][col-1] = v;   // set json value
    }
    if (empty) {
      // do not save empty row in data
      this.#json.rowsBuffer.pop();
    }
  }

  // make sure it was stored correctly and apply any formating
  this.bufferDisplay();
}



bufferAppendRow(  // tableClass - client-side
  row,i) {
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


bufferCreateEmpty(  // tableClass - client-side
  // bufferCreateEmpty bufferAppend can fail if more than one instance of tableModule is running. a second Buffer append could overwrite the first
  n_rows  // adding
) {
  this.#json.rowsBuffer = [];

  let i,ii;

  // create n_rows
  for(i=1; i<n_rows+1; i++) {
    let empty = []; // create emty row
    for(ii=0; ii<this.#json.header.length; ii++) {
      empty.push(""); // create an array of null as long as the header
    }
    empty[this.get_primary_key()] = this.#json.primary_key_max+i;
    this.#json.rowsBuffer.push(empty);  // -1 -> a new row, a positive number is an edit
  }
}


bufferAppend(  // tableClass - client-side

) {  
  // copy rows from buffer to memory
  this.bufferSetType();
  this.#json.rowsBuffer.forEach((item, i) => {
    // copy from buffer to memory
    this.#json.primary_key_max = item[this.get_primary_key()];
    this.#json.rows.push( item );
    // update primary key index
    let value = item[this.#json.primary_key];  // get row's key value
    this.#json.index[this.#json.primary_key][value] = this.#json.rows.length-1;   // store the row number 
  });

  // need to update other indexes
}


genRows() {  // tableClass - client-side
  // creating text file to save
  let txt="";

  this.#json.rows.forEach((r, i) => {
    // will only work for numbers, strings, boolean
    //  Will not work for dates, objects, etc...
    txt += ","+JSON.stringify(r)+"\n"
  })

  return " "+ txt.slice(1)  // replace leading comma with a space
}


genTable(  // tableClass - client-side
) {
  return `{
 "fieldA":      ${JSON.stringify(this.#json.fieldA     )}
,"primary_key": ${JSON.stringify(this.#json.primary_key)}
,"header":      ${JSON.stringify(this.#json.header     )}

,"rows": [
${this.genRows()}]
}`;
}


getColumnFormat(i) { // tableClass - client-side
  let f = this.#json.columnFormat[i];
  if (f === undefined) return "";
  return f;
}


clearRows() {this.#json.rows = [];}  // tableClass - client-side


total(  // tableClass - client-side
  col  // integer of column
) {
  // add error checking for non-numbers
  let total = 0;

  // add col rows
  this.#json.rows.forEach((row, i) => {
    total += row[col];
  });

  return total;
}


unique(s_field) {  // tableClass - client-side
  // return all the unique values in a table for the given field
  const a=[];
  const f=this.#json.field;
  this.#json.rows.forEach((r) => {
    let v = r[f[s_field]];
    if (!a.includes(v)) {
      a.push(v);
    }
  });

  return a;
}


select(   // tableClass - client-side
  f  // f is boolean function, returns true if we want the row included in the list
) {
  let a=[]  // return a list of indexes of table that match the selection criteria
  let field = this.#json.field;
  this.#json.rows.forEach((r, i) => {
    // need to pass the test into the function, for now hard code
    try {
      if ( f(field, r) ) {
        a.push(i);
      }
    }  catch(err) {
      alert(`tableClass.select error=${err}`)
    }
  });
  return a;
}


filter(  // tableClass - client-side
  f  // f is boolean function, returns true if we want the row included in the list
) {
  return this.#json.rows.filter(f);
}


setJSON(j) {  // tableClass - client-side
  // replace place holder of new table with data from loaded file
  Object.entries(j).forEach((item, i) => {
    this.#json[item[0]] = item[1];  // replace default value with loaded value
  });
}


f(fieldName) { // tableClass - client-side
  return this.#json.field[fieldName];
}


field( // tableClass - client-side
  fieldA   // create the field attribute from the fieldA
) {
  if (fieldA) {
    // set the field Array
    this.#json.fieldA = fieldA
  }

  this.#json.field = {};
  this.#json.fieldA.forEach((item, i) => {
    this.#json.field[item] = i;
  });
}


} //  end  of // tableClass - client-side

export {tableClass};