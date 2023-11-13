import  {tableClass   }   from '/_lib/db/table_module.js'    ;

class dbClass {  
/* db - database classes

class dbClass       - more than one table can be in a json file
class tableClass    -
class groupByClass  -

a Database is a collection of tables stored in a json file.  The entire file is held client side once loaded

load from file,
load for server
display
edit
save local file download
save to server

*/


#url       // remember where the file came from
//#urlList   // directory where database folders are
#json      // list of data bases 


constructor() {   // dbClass - client-side
  this.tables = {};  // init tables to an object.  needed if createing tables in code rather than loading them.
 }


 get_database_list(){   // dbClass - client-side
  return Object.keys(this.#json.meta.databases);
 }


 get_database_list_value(
   // dbClass - client-side
    database
   ,attribute
   ){
  return this.#json.meta.databases[database][attribute];
 }


async load_db_list(  // dbClass - client-side
  // load list of databases 
  url  // location
  ) {
  this.#url     = url;

  // load list of tables in database
  const obj = await app.proxy.getJSONwithError(this.#url);   // get list of tables;
  if(obj.json === null) {
    alert(`db_module.js method="load_meta" missing or bad file="${this.#url}"`);
    return false;
  }
  this.#json  = obj.json; 
  return true;
}


async load(  // dbClass - client-side
  // load database meta data and tables file from server
  db_name  // name of db to load
  ) {
  const url = this.get_database_list_value(db_name,"location");
  const msg  = await app.proxy.getJSONwithError(url);
  if(msg.json === null){
    //error
    alert(`error, file=""_.js method="load" url="${url}"`);
    return;
  }
  this.#json = msg.json;

  // walk through table data, load and make the table class objects
  this.tables = {};
  const table_names = this.get_table_names();
  for (let i=0; i<table_names.length; i++) {
    const table = new tableClass();       // create
    this.tables[table_names[i]] = table;  // add table to database
    const table_url = msg.json.meta.tables[table_names[i]].location;
    await table.load(table_url);          // load
    table.set_db(this);                   // allow tables to get to other tables in the database
    table.set_name(table_names[i]);       // allow table to know it's database name
  }
}

get_table_names(){
  return Object.keys(this.#json.meta.tables);
}

loadLocal( // dbClass - client-side   -- should be able to share code here
  buffer
  ) {
  // load json table file
//  this.url = url;
//  this.#json = await app.proxy.getJSON(url);
  this.#json = JSON.parse(buffer);
  // walk through table data, and make the table class objects
  Object.entries(this.#json).forEach((item, i) => {
    // covern raw json data to a table class
    const t = new tableClass();
    t.setJSON(item[1]);      // add loaded table attributes to constructor defaults
    this.tables[item[0]] = t;  // change plan data to a tableClasse
    t.field();  // init the field attribute from fieldA array
  });

  // top level attributes are table names
}


getJSON(){return this.#json;}  // dbClass - client-side


tableAdd(tableName) { // dbClass - client-side
  // create empty table and add to database
  //this.tables[tableName] = new tableClass(`${this.#urlList}/${tableName}/_.json`);
  this.tables[tableName] = new tableClass(`${tableName}/_.json`);  // bad url - rethink 

  return this.tables[tableName]
}


getTable( // dbClass - client-side
  s_tableName
  ) {  
  return this.tables[s_tableName];  // return instance of tableClass
}


clearData( // dbClass - client-side
) {  // ? not sure when this is called
  this.#json = null;
  this.url = null;
}


async save(  // dbClass - client-side
  // save changed loaded tables to disk
) {
  let save_new_meta  = false
  const keys = Object.keys(this.tables);  // keys to loaded tables
  // walking all tables in database to see if they have canged or or new
  for(var i=0; i< keys.length; i++) {
    // save all loaded tables that have changed
    await this.tables[keys[i]].save2file();  // will return quickly if no changes
    if ( typeof(this.#json.meta.tables[keys[i]]) ===  "undefined") {
      this.#json.meta.tables[keys[i]] = {"location": keys[i], comments: "imported table"}
      save_new_meta = true;
    }
  }

  if (save_new_meta) {
    // have a new table or tables, add it to meta data
    await app.proxy.RESTpost(
      `{
        "meta":{
          "tables": ${JSON.stringify(this.#json.meta.tables)}
        }
      }`, this.#url);
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