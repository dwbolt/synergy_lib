import {table_class } from '/_lib/MVC/table/m.mjs'  ; 
import {proxy       } from '/_lib/proxy/_.mjs'         ;


class dbClass {  
/* db - database classes

class dbClass       - more than one table can be in a json file
class table_class    -
class groupByClass  -

a Database is a collection of tables stored in a json file.  The entire file is held client side once loaded

load from file,
load for server
display
edit
save local file download
save to server

*/

#json      // list of data bases - deprecate


constructor() {   // dbClass - client-side
  this.dir      = undefined ;  // where the loaded database came from
  this.url_meta = undefined ;  // location of meta data
  this.meta     = undefined ;  // loaded meta data
 }


async load(  // dbClass - client-side
  // user selected a database, so load database meta data and tables file from server
  dir  // directory of db to load
  ) {
  this.dir      = dir;
  this.url_meta = this.dir+"/_meta.json";
  this.tables   = {};  // init tables to an object.  needed if createing tables in code rather than loading them.
  const msg     = await proxy.getJSONwithError(this.url_meta);
  if(msg.status === 404){
    //error
    app.sfc_dialog.show_error(`missing file<br> url="${this.url_meta}"`);
    return;
  } else {
    this.meta = msg.json;
  }
  

  // walk through table data, load and make the table class objects
  const table_names = Object.keys(this.meta.tables);
  for (let i=0; i<table_names.length; i++) {
    const table                 = new table_class();       // create
    this.tables[table_names[i]] = table;  // add table to database
    const table_url             = this.meta.tables[table_names[i]].location;
    await table.load(table_url);          // load
    table.set_db(this);                   // allow tables to get to other tables in the database
    table.set_name(table_names[i]);       // allow table to know it's database name
  }
}


async delete(){  // dbClass - client-side  
  // delete database files from server
  let msg = await proxy.RESTdelete(this.dir);
}


async table_delete(table_name){
  // delete the table from disk
  const table = this.getTable(table_name);
  let msg     = await table.delete();

  delete this.meta.tables[table_name];  // delete table from meta data
  await this.meta_save()                // save updated meta data
}


async new(  // dbClass - client-side  
  url // to database
  ){
  this.dir      = url;

  // add relations table to database  meta data
  this.url_meta = this.dir+"/_meta.json";
  this.meta   = 
  {
    "comment":"Meta data for Database"
   ,"tables":{
       "relations":{"location": `${url}/relations`}
       }
   }
  let msg = await this.meta_save();
  
  // save relations table
  if (msg.success) {
    const table = new table_class(`${url}/relations`);
    msg = await table.create("relations","relations");                   // create & save meta data
    if (msg.success) {
      return await table.merge();                            // save columns.json and changes.csv
    }
  }
}


async meta_save(){  // dbClass - client-side  
  let    msg = await proxy.RESTpost(JSON.stringify(this.meta), this.url_meta );
  if (!msg.success) {
    app.sfc_dialog.show_error(`save failed<br> this.url_meta="${this.url_meta}"`);
  }
  return msg;
}


loadLocal( // dbClass - client-side   -- should be able to share code here
  buffer
  ) {
  // load json table file
//  this.url = url;
  this.#json = JSON.parse(buffer);
  // walk through table data, and make the table class objects
  Object.entries(this.#json).forEach((item, i) => {
    // covern raw json data to a table class
    const t = new table_class();
    t.setJSON(item[1]);      // add loaded table attributes to constructor defaults
    this.tables[item[0]] = t;  // change plan data to a table_classe
    t.field();  // init the field attribute from fieldA array
  });

  // top level attributes are table names
}


getJSON(){return this.#json;}  // dbClass - client-side


tableAdd(tableName) { // dbClass - client-side
  // create empty table and add to database
  const table = new table_class(`${this.dir}/${tableName}`)  // create empty table
  this.tables[tableName] = table;                           // add it the tables obect
  table.set_db(this);                                       // let table know the database it belongs to
  this.meta.tables[tableName] = {"location": `${this.dir}/${tableName}`}// update db meta data to know about table
  return table
}


getTable( // dbClass - client-side
  s_tableName
  ) {  
  return this.tables[s_tableName];  // return instance of table_class
}

get_table_names(){
  return Object.keys(this.meta.tables);
}


clearData( // dbClass - client-side
) {  // ? not sure when this is called
  this.#json = null;
  this.url = null;
}

/*
async save_all(  // dbClass - client-side
  // save changed loaded tables to disk
) {
  const keys = Object.keys(this.tables);  // keys to loaded tables
  // walking all tables in database to see if they have canged or or new
  for(var i=0; i< keys.length; i++) {
    // save all loaded tables that have changed
    this.save_table(this.tables[keys[i]]);
  }
}
*/


async table_merge(      // dbClass - client-side
  table_name   //
) {
  // save table
  let msg = await this.tables[table_name].merge();
  if (!msg.success) {
    app.sfc_dialog.show_error("save failed table_merge")
  }
  // uppdate and save database meta data if it is a new table
/*  if ( this.meta.tables[table_name]  ==  undefined) {
    this.meta.tables[table_name] = {"location": `${this.dir}/${table}`, comments: "imported table"};
  }*/
  msg = await proxy.RESTpost(JSON.stringify(this.meta), `${this.dir}/_meta.json`);
  if (!msg.success) {
    app.sfc_dialog.show_error("save faild table_merge")
  }
}


displaySummery( // dbClass - clien-side
//display summery of db loaded
  s_domID) {
  let html = "<p><b>Summery of Data loaded</b></p>";

  Object.entries(this.#json).forEach((item, i) => {
    // covern raw json data to a table class
    let t = item[1];
    html += `<br>${item[0]} - rows=${item[1].json.rows.length}`
  });

  document.getElementById(s_domID).innerHTML = html;
}


displayTable( // dbClass - client-side
  e){
  // get value drop down list
  const table = e.value;
  this.gettable(e.value).display('tableDisplay',"app.page.table");

}


} // dbClass - client-side // end /////////////////////////////////////////////////////////////////////////////

export {dbClass};