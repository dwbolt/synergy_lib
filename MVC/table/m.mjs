import {csvClass  } from '/_lib/MVC/table/csv.mjs'     ;
import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class table_class {  // table_class - client-side

/*
similar to a table in sql rdb. working on support for:
 select - returns an array of row numbers that match the selection function passed in
 total -
 group by - in a seperate class for now
 sort - pass an array of indexes to be sorted, and an array of fields to sort on

these features are used in the following appsthis.meta.PK_max
  accounting
  server log
*/

// https://chatgpt.com/c/675866ce-60a8-800b-8426-0a63feb74ac8   make properites readonluy


constructor( // table_class - client-side
url          // directory where table _meta.json, changes.csv, columns.json live
) {
  if (url !== undefined) {
    this.url_set(url);
  }
  this.db      = undefined; 

  // init meta
  this.meta = {
    "fields":{
        "pk" : {"header" : "PK"         , "type" : "pk"     , "location" : "column" }
    }

    ,"select" : ["pk"]
    ,"PK_max" :0
  }

  this.columns = {"pk":{}};

  this.viewers =[] ;  //keep track of viewers that need to told of model changes;
}


set_db( db){this.db   = db;}    // table_class - client-side
set_name(n){this.name =  n;}    // table_class - client-side


set_value(  // table_class - client-side
  pk        // table primary key
  ,field    // field name we want value of
  ,value 
) {
  this.check_pk(pk);

  const meta_field = this.meta.fields[field];
  switch(meta_field?.location) {
    case undefined:
    case "column":
      if (this.columns[field] === undefined) {
        this.columns[field] = {}; // init
      }
      if (value === null) {
        delete this.columns[field][pk];   // for some reason JSON.stringify converts undivined to null, so convert back to undifined
      } else {
        this.columns[field][pk] = value;
      }
      break;
      
    default:
      // code block
      app.sfc_dialog.show_error(`case meta_field?.location: ${meta_field?.location} is not handles`);
      return;
  }
}


fields_get(){
  // return list of all fields in meta, first select then any not already included
  return this.meta.select;

  // walk all fields and add any not already there.

}


search_equal(   // table_class - client-side
  // return array of pk that meet criteria
  field_name
  ,value
){
const pk_a=[]
const pks = Object.keys(this.columns.pk);
for(let i=0; i<pks.length; i++){
  const pk = pks[i];
  if (this.columns[field_name][pk] === value) {
    pk_a.push(pk);
  }
}
return pk_a;
}


search_start(   // table_class - client-side
  // return array of pk that meet criteria
  field_name
  ,value
){
const pk_a=[]
const pks = Object.keys(this.columns.pk);
for(let i=0; i<pks.length; i++){
  const pk = pks[i];
  if (this.columns[field_name][pk] === value) {
    pk_a.push(pk);
  }
}
return pk_a;
}


search( // sfc_table_class - client-side
  critera  // [[field_name, value_min,searh_type_min, search_type_max optional, value_max optional],...]  
) {
  let s_pks =[];  // return array of pks that match search critera
  let pks;        // array of pks to search

  if (0 < critera.length) {
    for(let i=0; i<critera.length; i++) {
      // get search criteria
      const cr           = critera[i];
      const field_name   = cr[0];
      const search_value = cr[1];
      if (i===0) {
        // first filter, start with the entire database
        pks = this.get_PK();
      } else {
        // narrow sections with preview selections
        pks = s_pks.slice();  // make a copy of
        s_pks =[];
      }

      // all the values of the column
      for(let ii=0; ii<pks.length; ii++){
        let field_value  = this.get_value(pks[ii],field_name); 
        if (field_value) {
          // field_value is defined, so see if it matches search criteria
          let push=false;
          if (typeof(field_value) ==="number" ){field_value = field_value.toString();}  // this is not right, numbers need special processing
          field_value = field_value.toLowerCase();
          switch (cr[2]) {
            case "begin"   : if (search_value  === field_value.substring(0,search_value.length)) {push = true} break;
            case "contains": if (field_value.includes(search_value))                             {push = true} break;
            default: break;
          }
          if (push) {
            s_pks.push(pks[ii]);  // found a match, push the primary key
          } 
        }
      }
    }
  }   // do I need an else here?
  
  return s_pks;
}


get_value(  // table_class - client-side
  pk        // table primary key
  ,field    // field name we want value of
) {
  if (pk === null || pk === undefined ) {
    // pk is null or un
    return undefined;
  }
  
  const meta_field = this.meta.fields[field];
  if (meta_field === undefined) {
    // assume data is stored in column, // not tested well, put in to support csv import
    return this.columns[field]?.[pk];
  }

  switch(meta_field.location) {
    case "column":
      if (this.columns[field]) {
        return this.columns[field][pk];  // still may return undefined
      } else {
        return undefined;
      }
      
    default:
      // code block
      app.sfc_dialog.show_error(`meta_field.location: ${meta_field.location}`);
      break;
  }
}


value2string(  // table_class - client-side
  value
){ 
  // value is json
  const type = typeof(value);
  switch (type) {
    case "undefined":
      value = ""; break;
    case "object":
      value = JSON.stringify(value); break;
    case "number":
      value = value.toString();
    case "string":
      break; // no chages need
    default: 
      app.sfc_dialog.show_error(`case type="${type}" not handled`);
  }
  return value;
}


get_unique_values(// table_class - client-side
  field_name
){
  app.sfc_dialog.show_error(`method get_unique_values is depricated `);
/*
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
  */
}



get_unique_pks(// table_class - client-side
  field_name
  ,value
){
  app.sfc_dialog.show_error(`method get_unique_pks() is deprecated`);
  debugger;
  // return list of pks that have
  //return this.#json.unique_values[field_name][value];
}


add_column_value( // table_class - client-side
   pk             // primary key
  ,column_name    //
  ,column_value   //
){
  this.check_pk(pk);

  if (this.columns[column_name] === undefined) {
    // add columns_name
    this.columns[column_name] = {};
  }

  this.columns[column_name][pk] = column_value;
}


check_pk(// table_class - client-side
  pk  // make sure pk is a number
  ){
  let pk_num = pk;
  if (typeof(pk_num)==="string"){
    pk_num = Number.parseInt(pk_num)
  } else if (typeof(pk_num)!="number") {
    app.sfc_dialog.show_error(`pk_num is not a number typeof(pk_num)="${typeof(pk_num)}"`);
    return;
  }

  if (this.columns.pk === undefined) {
    // init the primary key column
    this.columns.pk = {};
  }
  
  if (this.columns.pk[pk] === undefined) {
    // new pk, so add it
    this.columns.pk[pk]= pk;
    if (this.meta.PK_max <= pk_num) {
      this.meta.PK_max = pk_num;   // this should always be the case
    } else {
      app.sfc_dialog.show_error(`pk_num=${pk_num}  <br>this.meta.PK_max=${this.meta.PK_max } <br>this.url_meta="${this.url_meta}`);
    }
  }
}


set_select(  // table_class - client-side
field_names  // array of field names
){
  this.meta.select = field_names;

  // set header based on select - seems like this should be in UX module (dwb)
  this.meta.header=[];
  for(var i=0; i<this.meta.select.length; i++) {
    let field_name =  this.meta.select[i];
    this.meta.header.push( this.meta.fields[field_name].header);
  }
}


meta_get(  // table_class - client-side
  name // meta attribute name
  ){  
  return this.meta[name];
}


get_PK( // table_class - client-side
) {
  // array of PK keys for entire table;
  if (this.columns.pk === undefined) {
    return []; // table is empty so return empty array
  } else {
    return Object.keys(this.columns.pk);
  }
}


url_set(  // table_class - client-side
  dir     // root page where table lives
  ){
  this.dir          = dir;
  this.url_meta     = dir+"/_meta.json";
  this.url_columns  = dir+"/columns.json";
  this.url_changes  = dir+"/changes.nsj";   // new line seperated json
}


async load(  // table_class - client-side
  dir        // location of table to load
  ,status_array = []// 
  ) {
  this.url_set(dir);
  this.readonly = false;

  // load table meta data
  const msg = await proxy.getJSONwithError(this.url_meta);
  if (       msg.status === 200){
    this.meta = msg.json;
  } else if (msg.status === 404) { 
    // does not exist, so create it
    
  } else if (0<= status_array.find( 
    (element) => element === msg.status )) {
    // calling function will handle error
    return msg;
  } else {
    // calling funtions is not handleing error,
    this.meta = {}
    app.sfc_dialog.show_error(`error not being handled <br>url="${this.url_meta}" <br>msg=${JSON.stringify(msg)}`);
    this.readonly = true;
    return; // not sure what code should do, need to test  
  }

  // load columns
  if (this.readonly) {
      this.json = {};
    } else {
    const msg_col = await proxy.getJSONwithError(this.url_columns);
    if (msg_col.status === 200){
      this.columns = msg_col.json;
    } else {
      app.sfc_dialog.show_error(`load failed url="${this.url_columns}"<br>  msg=${JSON.stringify(msg)}`);
      this.readonly = true;
      return msg_col;
    }
  }

  // load and apply change log
  await this.apply_changes();
  this.header_set();

  return msg;
}


async apply_changes(log){ // table_class - client-side
  // load change file
  let msg;
  
  if (log === undefined) {
   msg     = await proxy.RESTget(this.url_changes);                            
    if (!msg.ok) {
      app.sfc_dialog.show_error(`loading change file failed msg="${JSON.stringify(msg)}`);
      return;  // nothing todo since change file not loaded
    }
    log =msg.value;
  }

  // walk through change file and apply changes
  let start =0;
  this.field_names = undefined; // assume fields are not defined
  while(start < log.length) {  // last caracter in file is \n, do not process
    let obj,str;
    let end = log.indexOf("\n", start);
    try {
      str = log.slice(start,end)
      obj = JSON.parse(str);
    } catch (error) {
      app.sfc_dialog.show_error(`JSON.parse(str) failed "str"="${str}"`);
    }

    if (Array.isArray(obj)) {
      switch (obj[1]) {
      case "a":  // append
        this.append(obj);
        break;

      case "h":  // header
        this.meta_from_header(obj)
        break;    

      case "f":  // field  names
        this.field_names = obj.splice(2);  // remove date and "f'", so only field names remain 
        break;    

      default:
        // assume old data, with 
        // assume set value, data is in the form [pk,atrribute,value,date] eg. ["5","name_first",null,"2024-05-29T20:39:09.465Z"]
        this.set_value(obj[0],obj[1],obj[2]);
        break;
      }
    } else {
      // assume command  {"command":"delete", "pk":"5",  "date":"2024-05-29T20:39:09.465Z"}
      switch (obj.command) {
        case "delete":
          if (typeof(obj.pk)==="string" && this.columns.pk[obj.pk]) {
            // remove access to pk object
            delete this.columns.pk[obj.pk];
          } else {
            // 
            app.sfc_dialog.show_error(`this.columns.pk[obj.pk] not available to detete pk = {obj.pk} `);
          }
          break;

        default:
          app.sfc_dialog.show_error(`command not supported object.command="${object.command}`);
          break;
      }
    }
    start = end+1;
  }
}


meta_from_header(  // table_class - client-side
  header // array [timestamp,"h", field0 name, field1 name, ...]
){
  // init meta
  this.meta.fields           = {};
  this.meta.fields.pk        = {"header" : "PK"       ,  "type" : "pk"      , "location" : "column"}
  this.meta.select           = ["pk"];
  this.meta.PK_max           = 0;

  // walk the heade list, skip timestamp and "h" command
  for(let i=2; i<header.length; i++) {
    this.meta.fields[     (i-2).toString()] = {"header" : header[i], "location" : "column"};
    this.meta.select.push((i-2).toString())
  }
}


append(  // table_class - client-side
  record  // array [time steamp, "a", value 0, value 1....]
){
  this.meta.PK_max++;  // create next pk
  const pk = this.meta.PK_max;
  this.set_value(pk,"pk",pk);                    // add the pk
  for(let i=2; i<record.length; i++) {  // s
    let field_name = (this.field_names ? this.field_names[i-2]: (i-2).toString());
    this.set_value(pk, field_name, record[i]);  // add remainder of reco;
  }
}


async create(  // table_class - client-side
  name,      // name of table
  meta_name  // name of structure
  ) {
  // get temple meta of table
  let url       = `/_lib/MVC/table/tables_meta/${meta_name}.json`;
  let msg = await proxy.RESTget(url);
  if (!msg.ok) {
    app.sfc_dialog.show_error(`create of table "${name}" failed.  could not find url="${url}"`);
    debugger;
    return;
  }

  // save meta data fro table
  this.meta = JSON.parse(msg.value);                       
  msg = await proxy.RESTpost(msg.value, this.url_meta);
  if (!msg.success) {
    app.sfc_dialog.show_error(`create of table "${name}" failed.  could not save url="${this.url_meta}"`);
    debugger;
  }

  return msg;
}


get_object( // table_class - client-side
  id        // primary key of row/object
  ){ 
  // 
  let object = {}, value;
  const select = this.meta.select;  // list of object attributes 

  for(let i=0; i<select.length ;i++){
    const field_name = select[i];
    const field      = this.meta.fields[field_name];
    switch(field.location) {
      case "column":
        // data is in column
        if (this.columns[field_name] === undefined) {
          value = undefined;
        } else {
          value = this.columns[field_name][id];  // maybe undefined
          if ( "string pk json text textarea float integer date-time date".includes(field.type) ) {
             // value is already set nothing todo
          } else if (field.type === "money") {
            if (value !== undefined) {
              // convert pennies to  $xx,xxx.xx
            }
          } else {
            app.sfc_dialog.show_error(`field.type="${field.type}" <br>field_name="${field_name}"`);
          }
        }
        break;

      default:
        app.sfc_dialog.show_error(`case not handled field.location=${field.location}`);
        break;
    }

    if (value !== undefined) {
      object[field_name] = value;
    }
  }

  object._relations = this.columns["_relations"]?.[id];

  return object;  // json version of row in table
}


get_object_display( // table_class - client-side
  id        // primary key of row/object
  ){ 
  // 
  let object = {}, value;
  const select = this.meta.select;  // list of object attributes 

  for(let i=0; i<select.length ;i++){
    const field_name = select[i];
    const field      = this.meta.fields[field_name];
    switch(field.location) {
      case "column":
        // data is in column
        if (this.columns[field_name] === undefined) {
          value = undefined;
        } else {
          value = this.columns[field_name][id];  // maybe undefined
          if ( "string pk json text textarea float integer date-time date".includes(field.type) ) {
             // value is already set, do not want to trigger error below
          } else {
            app.sfc_dialog.show_error(`case not handled field.location=${field.location}`);
          }
        }
        break;

      default:
        app.sfc_dialog.show_error(`case not handled field.type=${field.type}`);
        break;
    }

    if (value !== undefined) {
      object[field_name] = value;
    } else {
      object[field_name] = "";
    }
  }

  return object;  // json version of row in table
}


PK_get( // table_class - client-side
  key  // primary key, return row
  ){
    app.sfc_dialog.show_error(`method PK_get() is deprecated`);
}


// rewwrite to save to change file and memory
async save( // table_class - client-side
  // make change in memory and update change log
  record            // new record values
  ) {
  if(record.pk === undefined) {
    // adding a new record, so create a new PK
    record.pk = (++this.meta.PK_max).toString();      // get next primary key                           // add it the record being saved
  }

  // get change log for row
  let csv = "",change;
  // see what fields changed for the row
  const fields = this.meta.select;
  const date = new Date();
  for(var i=0; i< fields.length; i++) {
    let field = fields[i];
    let edited_value   = record[field];                    // from edit form
    let current_value  = this.get_value(record.pk,field);  // from table memory - convert to string for compare 

    // update change log
    if (this.value2string(edited_value) !== this.value2string(current_value) ) {
      // append to  change log
      let csv_value = edited_value;      // convert new line -> /n and quotes -> /""
      if (csv_value === "") {
        csv_value = undefined;  // convert empty fields to undifined
      }

      csv += this.change_log_add( record.pk, field, csv_value);

      // update memery row
      if (edited_value===""){
        // convert form value of empty string to undefined
        edited_value = undefined;
      }
      this.set_value(record.pk, field, edited_value);
    }
  }

  return await this.change_log_patch(csv);
}


change_log_add(
  pk, field, value
) {
  return `${JSON.stringify( [pk, field, value, new Date().toISOString()] )}\n`;     
}


async change_log_patch(  // table_class - client-side
  nsj  // string to append
){
  // append to change file
  const msg  = await proxy.RESTpatch( nsj, this.url_changes);
  if (!msg.success) {
    // save did not work
    app.sfc_dialog.show_error(`update change log failed<br> url="${this.url_changes}"<br> msg=${msg.message}`);
  };

  return msg; // was set to new value if null;
  // need to save memory change log to server incase session is lost, so user will not loose there work
  // code here
}


async merge( // table_class - client-side
dir
){
  // needs refactor,  should rename old columns file and change files, so history is preserved *****************
  if (dir != undefined) {
    this.url_set(dir);
  }
 
  // save column file with changes applied
  let msg  = await proxy.RESTpost( JSON.stringify(this.columns), this.url_columns);
  if (!msg.success) {
    // save did not work
    app.sfc_dialog.show_error(`save columns failed<br> this.url_changes="${this.url_changes}"<br> `);
  return msg;
  };

  // empty change file
  msg  = await proxy.RESTpost("", this.url_changes);
  if (!msg.success) {
    // save did not work
    app.sfc_dialog.show_error(`empty change file failed<br> this.url_changes="${this.url_changes}"<br> `);
  };

  // save meta data 
  msg  = await this.meta_save();
  // needs error processing

  return msg;
}


async meta_save(){
  // save meta data 
  let msg  = await proxy.RESTpost(JSON.stringify(this.meta), this.url_meta);
  if(!msg.success) {
    app.sfc_dialog.show_error(`meta_save failed<br> this.url_changes="${this.url_meta}"<br> `);
  return msg;
  }
}


async delete(record){// table_class - client-side
  let msg;
  if (record) {
    // delete record in memory
    delete this.columns.pk[record.pk];  // record is still in columns, we have just removed it from the active list of PK

    // update change log
    msg  = await proxy.RESTpatch( 
      `{"pk":"${record.pk}", "command":"delete", "date":"${new Date().toISOString()}" }\n`, this.url_changes);
    if (!msg.success) {
      // delete did not work
      app.sfc_dialog.show_error(`delete failed<br> url="${this.url_changes}"<br>  msg=${msg.message}<br>`);
    }
  } else {
    // delete table
    msg = await proxy.RESTdelete(this.dir );
    // need error processing
  }

  return msg;
}


get_field( // table_class - client-side
  i  // index # ->into select array  --- index is string
  ,attribute  // header or type or location..
  ){
  let field_name;
  if        (typeof(i) === "number") {
    field_name = this.meta.select[i];
  } else if (typeof(i) === "string") {
    field_name  = i;
  } else {
    //error
    app.sfc_dialog.show_error(`case not handled <br> type(i) === =${type(i)}<br>`);
    return null;
  }
  
  const value = this.meta.fields[field_name][attribute];
  if (typeof(value) === "string") {
    return value.toLowerCase(); // convert strings to lowercase for easy compare
  } else {
    return value;
  }
}


 get_column(  // table_class - client-side
  pk  // primary key
  ,i  // select index into header/select
 ) {
   const column_name  = this.meta.select[i];
   let   column_value = this.columns[column_name][pk];
   if (column_value === undefined) {
    // return empty string if not defin
    column_value = "";
    }
   return column_value;
 }
 

header_set() {   // table_class - client-side
  // create header from meta data
  this.meta.header = [];
  const fields           = this.meta.fields;  // point to field meta data
  const select           = this.meta.select;  // array of field names to be displayed
  for(let i=0; i<select.length; i++) {
    let field = fields[select[i]];
    if (field === undefined) {
      app.sfc_dialog.show_error( `
select[i] = "${select[i]}"
this.dir  = "${this.dir}"
msg       = "select field does not exist in field meta data"`);
    } else {
      this.meta.header.push(field.header); 
    }
  }
}


async header_make(
  pk  // of row that holds header, so copy it
) {
  debugger
  const fields           = this.meta.fields;  // point to field meta data
  const select           = this.meta.select;  // array of field names to be displayed
  for(let i=0; i<select.length; i++) {
    const field_name = select[i];
    let field = fields[field_name];
    if (field === undefined) {
      app.sfc_dialog.show_error(`select[i] = "field undefined <br> field_name: ${field_name}"<br> `);
    } else {
      const value = this.get_value(pk, field_name);
      if (field.header !== "PK") {
        field.header = value; 
      }

    }
  }
  this.header_set();   // move data from meta to active header
  await this.meta_save();  // save header
  // update view
}


genCSV_header(){  // table_class - client-side
  let csv = "";
  let header = this.meta_get("header");
  for(let i=0; i<header.length; i++) {
    csv += `,"${header[i]}"`; // export header
  }
  csv = csv.slice(1)+"\n";
  return csv;
}


genCSVrow( // table_class - client-side
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


//getField()       {return this.meta.field         ;} // table_class - client-side


/*
change_summary(  // table_class - client-side
  field
  ){
  const change = this.changes_get("summary");
  if (change[field] === undefined) {
    // first time data is stored so create empty
    change[field] = {count: 0};
  }

  change[field]["count"]++;
}
*/


/*
sortList(  // table_class - client-side
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
*/

/*getRows()        {return this.#json.rows          ;} // table_class - client-side
getRow(index)    {return this.#json.rows[index]   ;} // table_class - client-side  */
//get_primary_key(){return this.#json.primary_key   ;} // table_class - client-side

/*
changes_get(key=null) { // table_class - client-side
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
*/
/*
getRowByIndex( // table_class - client-side
   index // index number 0-> first field in table
  ,value // value of index
  )   {return this.#json.rows[ this.#json.index[index][value] ];} // table_class - client-side

getRowsLength() {return this.#json.rows.length   ;} // table_class - client-side
getJSON(      ) {return this.#json               ;} // table_class - client-side
*/

/*
appendRow(  // table_class - client-side
  a_row
  ){
  this.#json.rows.push(a_row);  // adding new row
  this.change_summary("append");  // incremnet append count
}
*/

/*
genRows() {  // table_class - client-side
  // creating text file to save
  let txt="";

  this.#json.rows.forEach((r, i) => {
    // will only work for numbers, strings, boolean
    //  Will not work for dates, objects, etc...
    txt += ","+JSON.stringify(r)+"\n"
  })

  return " "+ txt.slice(1)  // replace leading comma with a space
}*/
/*
clearRows() {this.#json.rows = [];}  // table_class - client-side
*/

/*
total(  // table_class - client-side
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
*/


/*
select(   // table_class - client-side
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
      app.sfc_dialog.show_error(`table_class.select error=${err}`)
    }
  });
  return a;
}
*/

/*

filter(  // table_class - client-side
  f  // f is boolean function, returns true if we want the row included in the list
) {
  return this.#json.rows.filter(f);
}
*/

/*
format_values( // table_class - client-side
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

*/
} //  end  of // table_class - client-side
