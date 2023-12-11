import {csvClass    } from '/_lib/db/csv_module.js'     ;

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
#url_csv
#dir

constructor( // tableClass - client-side
url
) {  
  // data
  const page   = window.location;
  const urlEsc = new URL(`${page.protocol}//${page.host}${url}`);
  this.#url   = urlEsc.toString();
  this.db     = null; 
  this.#json  = {
    "meta"   : {fields:{},"select" : [], "PK":{}}
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
    ,"columns"   : {}
    ,"rows"      : []       // row data, one array for each row 
  }
}

set_db( db){this.db   = db;}
set_name(n){this.name = n;}

set_value(  // tableClass - client-side
  pk        // table primary key
  ,field    // field name we want value of
  ,value 
) {
  const meta_field = this.#json.meta.fields[field];
  switch(meta_field.location) {
    case "column":
      if (this.#json.columns[field] === undefined) {
        this.#json.columns[field] = {}; // init
      }
      this.#json.columns[field][pk] = value;
      break;
      
    default:
      // code block
      alert(`error file="table_module.js" method="set_value" meta_field.location=${meta_field.location}`);
      return;
  }

  if (this.#json.meta.PK[pk] === undefined) {
    // new pk, so add it
    this.#json.meta.PK[pk] = true;
  }
}


get_value(  // tableClass - client-side
  pk        // table primary key
  ,field    // field name we want value of
) {
  if (pk === null || pk === undefined ) {
    // pk is null or un
    return undefined;
  }
  const meta_field = this.#json.meta.fields[field];
  if (meta_field === undefined) {
    // assume data is stored in column, // not tested well, put in to support csv import
    return this.#json.columns[field][pk];
  }

  switch(meta_field.location) {
    case "column":
      if (this.#json.columns[field]) {
        return this.#json.columns[field][pk];  // still may return undefined
      } else {
        return undefined;
      }
      
    case "row":   // deprecate 
      if (this.#json.meta.PK[pk] != undefined  && this.#json.rows[this.#json.meta.PK[pk]]) {
        return this.#json.rows[this.#json.meta.PK[pk]][meta_field.param];
      } else {
        return null;
      }
      
    case "relation":
      if (this.#json.relation[pk] && this.#json.relation[pk][field]) {
        return this.#json.relation[pk][field];
      } else {
        return "";
      }
      
    default:
      // code block
      alert(`error file="table_module.js" method="get_value" meta_field.location=${meta_field.location}`);
  }
}


get_value_relation(  // tableClass - client-side
// returns display value for both relation fields and non-relation fields
pk
,field
) {
  let value = this.get_value(pk,field);
  if (this.meta_get("fields")[field].location === "relation") {
    // value is an array of PK, convert to human readable
    let r_value="";
    for(var i=0; i<value.length; i++){
      let pkr=value[i]; // relation pk
      let relation = this.db.getTable("relations").get_object(pkr);  // get relation object 
      if        (relation.table_1 === this.name && relation.pk_1 === pk) {
        // related to table 2
        r_value += this.format_values(2, relation);
      } else if (relation.table_2 === this.name && relation.pk_2 === pk) {
        // related to table 1
        r_value += this.format_values(1, relation);
      } else {
        // error
        alert(`error file="table_module.js" method="get_value_relation" pk="${pk}" this.name="${this.name}" relationn=${JSON.stringify(relation)}`);
      }
    }
    value = r_value;
  } 

  return value;
}


format_values(
   table_number  // 
  ,relation
  ){
  let html = "";
  const fields=["label","display","comment"];
  for(var i=0; i<fields.length; i++) {
    let table_name = relation[`table_${table_number}`];
    let pk         = relation[`pk_${table_number}`];
    let table      = this.db.getTable(table_name);
    html += table.get_value(pk,fields[i]) +" - "; 
  }
  return html+"<br>";
}


get_unique_values(// tableClass - client-side
  field_name
){
  if (!this.#json.unique_values            )  {
    // init if needed
    this.#json.unique_values             = {}
  }

  if (!this.#json.unique_values[field_name])  {;
    // build, if it does not exist
    const unique_values = this.#json.unique_values[field_name] = {};
    let pk = this.get_PK();
    // walk entire column/field
    for(var i=0; i<pk.length; i++){
      let value = this.get_value(pk[i],field_name);
      if(value) {
        if(!unique_values[value]) {
          // init
          unique_values[value] = []
        }
        // add pk to list for value
        unique_values[value].push(pk[i]);  // remember pk assocated with value
      }
    }
  }

  // make sure this.#json.unique_values is changed
  return Object.keys(this.#json.unique_values[field_name] );
}



get_unique_pks(// tableClass - client-side
  field_name
  ,value
){
  // return list of pks that have
  return this.#json.unique_values[field_name][value];
}

add_column_value( // tableClass - client-side
   pk             // primary key
  ,column_name    //
  ,column_value   //
){

  if (this.#json.meta.PK[pk] === undefined) {
    // assume all data is stored in column, may cause problems untill all row data is gone;
    // add Primary key
    this.#json.meta.PK[pk]=true;
  }
  if (this.#json.columns[column_name] === undefined) {
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
  dir        // location of table to load
  ) { 
  // load base table from json file
  this.#dir      = dir;
  this.#url      = dir+"/_.json";
  this.#url_csv  = dir+"/_.csv";
  await this.get_json();

  // apply change log
  await this.apply_changes();

  this.setHeader();

  // index primary key
  if (typeof(this.#json.meta.PK) !== "object") {
    // create PK
    this.PK_create(); 
  }
}


async apply_changes(){ // tableClass - client-side
  // init
  if (this.#json.changes === undefined) this.#json.changes = {};
  if (this.#json.deleted === undefined) this.#json.deleted = {};

  // load change file from csv 
  const msg     = await app.proxy.RESTget(this.#url_csv);                            
  if (!msg.ok) {
    alert(`error file="table_module.js"
method="apply_changes"
msg.ok="${msg.ok}"`);
    return;  // nothing todo since change file not loaded
  }
  
  // convert csv to table changes to table
  const table   = new tableClass();            // create table 
  const csv     = new csvClass(table);     
  await csv.parse_CSV(msg.value);                    // parse CSV file and into table

  // apply change log to table
  // will not work if parse takes more than a second
  const pk = table.PK_get();
  for(let i=1; i<pk.length; i++) {
    // assume first pk is 0 and points to header, so skip
    let obj = table.get_object(i);
    this.set_value(obj["1"],obj["2"],obj["3"]);
  }
}


async get_json(){  // tableClass - client-side
  let obj = await app.proxy.getJSONwithError(this.#url);   // get table in database
  if(obj.status === 404) {
    alert(`missing file="${this.#url}"
  create from template
  file="table_module.js" 
  method="load" `);
  
  this.#json  = {
    "meta": {
        "fields":{
          "pk"           : {"header":"pk"         , "type":"PK"    ,  "location":"column"}
          ,"label"        : {"header":"Label"      , "type":"string",  "location":"column"}
          ,"display"      : {"header":"Display"    , "type":"string",  "location":"column"}
          ,"comment"      : {"header":"Comment"    , "type":"string",  "location":"column"}
        }
    
        ,"select":["pk", "label", "display", "comment"]
    
        ,"deleted"    :{} 
        ,"PK"         :{}
        ,"PK_max"     :0
      }
    ,"columns":{}
    ,"relation":{}
    }; 
    const msg = await app.proxy.RESTpost(JSON.stringify( this.#json ), this.#url );  // save it 
  } else {
    this.#json  = obj.json; 
  }
}


get_object( // tableClass - client-side
  id        // primary key of row/object
  ){ 
  // 
  let object = {}, value;
  const select = this.#json.meta.select;  // list of object attributes 

  for(let i=0; i<select.length ;i++){
    // assume row, need to add other cases
    const field_name = select[i];
    const  location = this.#json.meta.fields[field_name].location;
    switch(location) {
      case "row":
        // data is in row
        let row_number = this.#json.meta.PK[id]; // ger row number from primary key index
        value = this.#json.rows[row_number][this.get_field(i,"param")];
        break;
      case "column":
        // data is in column
        value = this.#json.columns[field_name][id];
        break;
      default:
        // code block
        alert(`error: class="tableClass" method="get_object" location="${location}"`)
    }


    if (value) {
      object[select[i]] = value;
    }
  }

  return object;  // json version of row in table
}


PK_create(){  // tableClass - client-side
  // this only works for data stored rows, work to depricate

  alert(`file="table_module.js" method="PK_create" URL="${this.#url}" fix data`)
  // create primary key index 
  this.#json.meta.PK     = {};
  this.#json.meta.PK_max = 0; 
  
  // walk to entire table and index on column key
  const rows = this.getRows();
  if (!rows) {
    return;  // no rows, so return
  }
  for (var i=0; i< rows.length; i++) {
    let value = rows[i][0];  // the PK is always the starting column
    this.#json.meta.PK[value]=i.toString();  // store the row number 

    if (this.#json.meta.PK_max < value) {
      // find largest key value, primary key is an integer number that increments
      this.#json.meta.PK_max= value;
    }
  }
}


PK_get( // tableClass - client-side
  key=null  // primary key, return row
  ){
  if (key === null) {
    return Object.keys(this.#json.meta.PK);    // array of PK keys - use to walk all rows
  } else {
    return this.#json.rows[ this.#json.meta.PK[key] ];
  }
}


save2memory( // tableClass - client-side
  // make change to row in memory and update memory change log
  primary_key_value  // positive number edit exiting row,  negative number create new row
  ,record            // new record values
  ) {
  if(primary_key_value === undefined) {
    // adding a new record, so create a new PK
    primary_key_value = (++this.#json.meta.PK_max).toString();  // get next primary key
    this.#json.meta.PK[primary_key_value] = true;               // add it the pk meta data so it can be accessed
    record.pk = primary_key_value;                              // add it the record being saved
  }

  // get change log for row
  let changes = this.changes_get(primary_key_value);
  // see what fields changed for the row
  const fields = Object.keys(record);
  for(var i=0; i< fields.length; i++) {
    let field = fields[i];
    let edited_value   = record[field];                             // from edit form
    let current_value  = this.get_value(primary_key_value,field);  // from table memory

    // update change log
    if (edited_value !== current_value ) {
      // change was made to field
      if (changes[field] === undefined) {
        // first time field has changed for this row, add change log for field
        changes[field] = {"new_value": edited_value};
        //if (current_value != undefined){
          changes[field].original = current_value;  // undifined is ok
        //} 
      } else if (edited_value  === changes[field].original) {
        // original value was restored, so delete session change log
        delete changes[field];
        if (Object.keys(changes).length === 0) {
          // no changes left for that key, so delete key
          delete this.#json.changes[primary_key_value];
        }
      } else {
        // replace new_value
        changes[field].new_value = edited_value;
      }

      // update memery row
      this.set_value(primary_key_value, field, edited_value);
    }
  }

  return primary_key_value; // was set to new value if null;
  // need to save memory change log to server incase session is lost, so user will not loose there work
  // code here
}


async save2file( // tableClass - client-side
){
  // see any changes made table;
  const changes = Object.keys(this.#json.changes);
  if (changes.length  === 0) {
    alert("No changes to save");
    return;
  } else {
    delete this.#json.changes
  }

  // append to change file
  const msg  = await app.proxy.RESTpost( JSON.stringify(this.#json), this.#url);
  if (msg.success) {
    alert(`
    file=${this.#url}
    records changed=${changes.length}
    message = ${msg.message}`);
    this.#json.changes = {};  // start new change log
  } else {
    // save did not work
    alert(`error 
msg=${msg.message}
url="${this.#url}"
file="table_module.js"
method="save2file"`);
    this.#json.changes = changes; // restore change list
  };
  
  return msg;
}


async save_changes( // tableClass - client-side
){
  // see any changes made table;
  const changes = this.#json.changes;
  if (changes === {}) {
    alert("No changes to save");
    return;
  } else {
    delete this.#json.changes
  }

  // convert changes to CSV lines to append to existing file
  let csv = "";
  let pks=Object.keys(changes);
  const date = new Date();
  for(let i=0; i<pks.length; i++) {
    let pk     = pks[i];
    let fields = Object.keys(changes[pk]);
    for(let ii=0; ii<fields.length; ii++) {
      let field = fields[i];
      let value = changes[pk][field].new_value;
      csv += `${pk},${field},${value},${date}\n`;
    }
  }

  // append to change file
  const msg  = await app.proxy.RESTpatch( csv, this.#url_csv);
  if (msg.success) {
    alert(`
    file=${this.#url}
    records changed=${changes.length}
    message = ${msg.message}`);
    this.#json.changes = {};  // start new change log
  } else {
    // save did not work
    alert(`error 
msg=${msg.message}
url="${this.#url}"
file="table_module.js"
method="save_changes"`);
    this.#json.changes = changes; // restore change list
  };
  
  return msg;
}


/* test
delete( // tableClass - client-side
key  // pK to delete
){

  this.#json.deleted[key] = true;   // add key to deleted object
  delete this.#json.meta.PK[key];        // remove key from PK
  const changes = this.changes_get(key); // update change log
  changes.deleted=true;
}
*/


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
  const value = this.#json.meta.fields[field_name][attribute];
  if (typeof(value) === "string") {
    return value.toLowerCase(); // convert strings to lowercase for easy compare
  } else {
    return value;
  }
  }


 get_column(  // tableClass - client-side
  pk  // primary key
  ,i  // select index into header/select
 ) {
   const column_name  = this.#json.meta.select[i];
   let   column_value = this.#json.columns[column_name][pk];
   if (column_value === undefined) {
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
  if (changes === undefined) {
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
  if (change[field] === undefined) {
    // first time data is stored so create empty
    change[field] = {count: 0};
  }

  change[field]["count"]++;
}


genCSVrow( // tableClass - client-side
  pk) {
  // will only work for numbers, strings, boolean
  // Will not  work for dates, objects, etc...
  let line = "";
  let fields = this.meta_get("select");
  for(var i=0; i<fields.length; i++){
    let value = this.get_value(pk,fields[i]);
    if(!value){
      value="";   // empty string is value is not defined
    }
    let location = this.meta_get("fields")[fields[i]].location;
    if (location==="relation") {
      // add "[]"" so it only takes up one field location in the csv file
      value = `"[${value}]"`;
    }
    line += `${value},`;
  }
  return  line.slice(0, line.length-1) +"\r\n";     // get rid of trailing comma
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

/*
genTable(  // tableClass - client-side
// create JSON file to store table for later retrivial
) {
  return `{
 "fieldA"      :${JSON.stringify(this.#json.fieldA     )}
,"header"     :${JSON.stringify(this.#json.header      )}
,"deleted"    :${JSON.stringify(this.#json.deleted     )} 
,"PK"         :${JSON.stringify(this.#json.meta.PK     )}
,"PK_max"     :${JSON.stringify(this.#json.meta.PK_max )}

,"rows": [
${this.genRows()}]
}`;
}
*/

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