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

constructor( // tableClass - client-side
url
) {  
  // data
  const page   = window.location;
  const urlEsc = new URL(`${page.protocol}//${page.host}/${url}`);
  this.#url   = urlEsc.toString();
  
  this.#json  = {
    "meta"   : {fields:{},"select" : []}
    //"description":""        // what is this table for
    ,"field":{}             // calculated field from fieldA
    ,"fieldA":[]            // array of names to access field in rows
                            // search is optional array of size of search input
              // what is displayed for the header
    ,"index"  : []          // array of index fields
    ,"deleted": {}          // {key: true, key2, true .....} listed of keys stored that are logally deleted
    ,"changes": {}          // current changed memory value
    /*
      "key":{
         "column#": {"value_new":", value_orig:"}
        ,"column#": {"value_new":", value_orig:"}
        ..
      }
      ,"key2":{...}
    }   */
    ,"PK"        : {}
    ,"columns"   : {}
    ,"rows"      : []       // row data, one array for each row 
    ,"rowsBuffer": []       // array of arrays: buffer data for add, select, dupp, will change rows data if saved
                            // [rowIndex,[changes made]]  index of <0 is new row to be appended at end if saved
  }
}


get_value(  // tableClass - client-side
  pk
  ,field
) {
  const meta_field = this.#json.meta.fields[field];
  switch(meta_field.location) {
    case "column":
      return this.#json.columns[field][pk];
    case "row":
      return this.#json.rows[this.#json.PK[pk]][meta_field.parm];
    case "multi":
      return this.#json.multi[this.#json.PK[pk]]
    default:
      // code block
      alert(`error tableModule.js method:get_value meta_field.location=${meta_field.location}`)
  }
}

add_column_value( // tableClass - client-side
   pk             // primary key
  ,column_name    //
  ,column_value   //
){

  if (typeof(this.#json.PK[pk]) === "undefined") {
    // assume all data is stored in column, may cause problems untill all row data is gone;
    // add Primary key
    this.#json.PK[pk]=true;
  }
  if (typeof(this.#json.columns[column_name]) === "undefined") {
    this.#json.columns[column_name] = {};
  }

  this.#json.columns[column_name][pk] = column_value;
}


set_select(  // tableClass - client-side
  filed_names  // array of field names
){
  this.#json.meta.select = filed_names;

  // set header based on select - seems like this should be in UX module (dwb)
  this.#json.meta.header=[];
  for(var i=0; i<this.#json.meta.select.length; i++) {
    let field_name =  this.#json.meta.select[i];
    this.#json.meta.header.push( this.#json.meta.fields[field_name].header);
  }
}


meta_get(  // tableClass - client-side
  name // meta attribute name
  ){  
  return this.#json.meta[name];
}


get_PK( // tableClass - client-side
) {
  // array of PK keys for entire table;
  return Object.keys(this.#json.meta.PK);
}


async load(  // tableClass - client-side
  url        // location of table to load
  ) { 
  this.#url = url;
  let obj;
  //do {
    obj  = await app.proxy.getJSONwithError(this.#url);   // get table in database
    if(obj.json === null) {
      alert(`missing or bad file="${this.#url}"`);
      // add code to not show table in db menu
      return;
      // missing or ill formed json file, so store an empty good one 
      //await app.proxy.RESTpost(this.default_table_structure() ,this.#url)
    }
  //} while (obj.json === null);
  this.#json  = obj.json; 
  this.setHeader();

  // init
  if (typeof(this.#json.changes) === "undefined") this.#json.changes = {};
  if (typeof(this.#json.deleted) === "undefined") this.#json.deleted = {};

  // index primary key
  if (typeof(this.#json.PK) !== "object") {
    // create PK
    this.PK_create(); 
  }
}


get_object( // tableClass - client-side
  id        // primary key of row/object
  ){ 
  // 
  let object = {};
  const select = this.#json.meta.select;  // list of object attributes 
  for(let i=0; i<select.length ;i++){
    // assume row, need to add other cases
    let row_number = this.#json.meta.PK[id]; // ger row number from primary key index
    let value = this.#json.rows[row_number][this.get_field(i,"param")];
    if (value) {
      object[select[i]] = value;
    }
  }

  return object;  // json version of row in table
}


default_table_structure() {
  const tableName=this.#url.slice(0,this.#url.length-7).split("/");  // take off /_.json, then slit
  switch(tableName[tableName.length-1]) {
    case "people":
      return `{
  "fieldA" : []
  ,"header": ["id", "FIRST NAME", "LAST NAME", "EMAIL ADDRESS", "OFFICE NUMBER", "CELL NUMBER", "PERSONAL NOTES"]
  ,"rows"  : []
}`
      
    case "orgainization":
      return `
{
  "fieldA":      []
  ,"header":      ["id","NAME"," NOTES "]
  ,"rows": []
}`

    case "phone":
      return `
{
"fieldA":      []
,"header":      ["id","NAME"," NOTES "]
,"rows": []
}`

    case "address":
      return `
{
"fieldA":      []
,"header":      ["id","NAME"," NOTES "]
,"rows": []
}`

    case "url":
      return `
{
"fieldA":      []
,"header":      ["id","NAME"," NOTES "]
,"rows": []
}`

    default:
      // code block
  }
}

PK_create(){
  // create primary key index 
  this.#json.PK     = {};
  this.#json.PK_max = 0; 
  
  // walk to entire table and index on column key
  const rows = this.getRows();
  for (var i=0; i< rows.length; i++) {
    let value = rows[i][0];  // the PK is always the starting column
    this.#json.PK[value]=i;  // store the row number 

    if (this.#json.PK_max < value) {
      // find largest key value, primary key is an integer number that increments
      this.#json.PK_max = value;
    }
  }
}


PK_get( // tableClass - client-side
  key=null  // primary key, return row
  ){
  if (key === null) {
    return Object.keys(this.#json.PK);    // array of PK keys - use to walk all rows
  } else {
    return this.#json.rows[ this.#json.PK[key] ];
  }
}


async save2file( // tableClass - client-side
){
  // see if it is a new table;
  const changes = Object.keys(this.#json.changes);
  if (0<changes.length) {
    // only save file if there are changes to the table or it is new
    //const msg   = await app.proxy.RESTpost( this.genTable() ,this.#url);
    const file = app.format.obj2string(this.#json) 
    const msg   = await app.proxy.RESTpost( file, this.#url);

    alert(`
      file=${this.#url}
      records changed=${changes.length}
      save status = ${msg.statusText}`
    );

    if (msg.statusText=="OK") {
      // start new change log
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
    if (i !== 0) {  // skip primary key
      // not on primary key
      let edited_value   = record[i];  // from edit form
      let current_value  = this.PK_get(primary_key_value)[i];  // from table memory

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
        this.PK_get(primary_key_value)[i]  = edited_value;
      }
    }
  }

  // need to save memory change log to server incase session is lost, so user will not loose there work
  // code here
}


delete( // tableClass - client-side
key  // pK to delete
){

  this.#json.deleted[key] = true;   // add key to deleted object
  delete this.#json.PK[key];        // remove key from PK
  const changes = this.changes_get(key); // update change log
  changes.deleted=true;
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


get_field( // tableClass - client-side
  i  // index into select array
  ,attribute  // header or type or location..
  ){
  const field_name = this.#json.meta.select[i];

  switch(attribute){
  case "header":
    return this.#json.meta.fields[field_name][0];
  case "type":
    return this.#json.meta.fields[field_name][1];
  case "location":
    return this.#json.meta.fields[field_name][2];
  case "param":
    return this.#json.meta.fields[field_name][3];
  default:
    alert(`error in "tableModule.js" method="get_field" i="${i}"  field="${field}"`); 
  }
  return null;
  }


get_multi(  // tableClass - client-side
  pk  // primary key
  ,i  // select index into header/select
 ) {
   const type       = this.get_field(i,"type");
   let multi;
   try {
    multi = this.#json.multi[pk][type];
  } catch (e) {
    // it is not defined, so return an empty array
    multi = [];
  }


   if (!Array.isArray(multi)){multi = []} // make empty array if not already an array
   return multi;
 }


 get_column(  // tableClass - client-side
  pk  // primary key
  ,i  // select index into header/select
 ) {
   const column_name  = this.#json.meta.select[i];
   let   column_value = this.#json.columns[column_name][pk];
   if (typeof(column_value) === "undefined") {
    // return empty string if not defin
    column_value = "";
    }
   return column_value;
 }
 

getValue(rowIndex,fieldName)  // tableClass - client-side
    {return this.#json.rows[rowIndex][this.#json.field[fieldName]] ;}


setHeader(   // tableClass - client-side
value = null  //  
)      {
  // set header
  if (Array.isArray(value)) {
    // 
    this.#json.meta.header = header;
    return; 
  }

  // create header from meta data
  this.#json.meta.header = [];
  const fields           = this.#json.meta.fields;  // point to field meta data
  const select           = this.#json.meta.select;  // array of field names to be displayed
  for(let i=0; i<select.length; i++) {
    this.#json.meta.header.push(fields[select[i]].header); 
  }
} 


getField()       {return this.#json.field         ;} // tableClass - client-side
getRows()        {return this.#json.rows          ;} // tableClass - client-side
getRow(index)    {return this.#json.rows[index]   ;} // tableClass - client-side
get_primary_key(){return this.#json.primary_key   ;} // tableClass - client-side

changes_get(key=null) { // tableClass - client-side
  // return change object for record with primary key = key
  if (key === null){
    // return all the changes is a key is not passed in
    return this.#json.changes;
  }

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
  this.change_summary("append");  // incremnet append count
}


change_summary(  // tableClass - client-side
  field
  ){
  const change = this.changes_get("summary");
  if (typeof(change[field]) ==="undefined") {
    // first time data is stored so create empty
    change[field] = {count: 0};
  }

  change[field]["count"]++;
}


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
    for(ii=0; ii<this.getHeader().length; ii++) {
      empty.push(""); // create an array of null as long as the header
    }
    empty[0] = this.#json.PK_max+i;
    this.#json.rowsBuffer.push(empty);  // -1 -> a new row, a positive number is an edit
  }
}


bufferAppend(  // tableClass - client-side
// append buffer to main data
) {  
  // copy rows from buffer to memory
  this.bufferSetType();
  this.#json.rowsBuffer.forEach((item, i) => {
    // copy from buffer to memory
    this.#json.PK_max = item[0];
    this.#json.rows.push( item );
    // update primary key index
    const PK = item[0];  // get PK value
    this.#json.PK[PK] = this.#json.rows.length-1;   // Point index to row
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
// create JSON file to store table for later retrivial
) {
  return `{
 "fieldA"      :${JSON.stringify(this.#json.fieldA     )}
,"header"     :${JSON.stringify(this.#json.header      )}
,"deleted"    :${JSON.stringify(this.#json.deleted     )} 
,"PK"         :${JSON.stringify(this.#json.PK          )}
,"PK_max"     :${JSON.stringify(this.#json.PK_max      )}

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