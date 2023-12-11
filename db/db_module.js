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


#url       // remember where the database list came from
//#urlList   // directory where database folders are
#json      // list of data bases 


constructor() {   // dbClass - client-side
  this.tables = {};  // init tables to an object.  needed if createing tables in code rather than loading them.
  this.url = "" ; // where the loaded database came from
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
  if(obj.status === 404) {
    alert(`missing url="${this.#url}"
creating from template
file="db_module.js" 
method="load_db_list"`);
this.#json  = 
{
  "meta":{
      "comment":"works with db_module.js"
      ,"databases": {
           "import"   : {"location":"/users/database/import" }
          ,"synergy"  : {"location":"/users/database/synergy"}
          ,"play"     : {"location":"/users/database/play"   }
      }
    }
}
    // now save it
    const msg = await app.proxy.RESTpost(JSON.stringify(this.#json), this.#url);

  } else {
    this.#json  = obj.json; 
  }
  return true;
}


async load(  // dbClass - client-side
  // user selected a database, so load database meta data and tables file from server
  db_name  // name of db to load
  ) {
  this.dir = this.get_database_list_value(db_name,"location");
  this.url = this.dir+"/_.json";
  const msg = await app.proxy.getJSONwithError(this.url);
  if(msg.status === 404){
    //error
    alert(`missing file url="${this.url}"
creating from template
file="db_module.js 
method="load"`);
    this.tablesJson = this.create_template(db_name);
    const msg = await app.proxy.RESTpost(JSON.stringify(this.tablesJson), this.url);  // save it 
  } else {
    this.tablesJson = msg.json;
  }
  

  // walk through table data, load and make the table class objects
  this.tables       = {};
  const table_names = this.get_table_names();
  for (let i=0; i<table_names.length; i++) {
    const table                 = new tableClass();       // create
    this.tables[table_names[i]] = table;  // add table to database
    const table_url             = this.tablesJson.meta.tables[table_names[i]].location;
    await table.load(table_url);          // load
    table.set_db(this);                   // allow tables to get to other tables in the database
    table.set_name(table_names[i]);       // allow table to know it's database name
  }
}

create_template(db_name) {
  switch (db_name) {
    case "synergy":
      return {
        "meta":{
          "tables": {
            "events"      :{"location":"/users/database/synergy/events"      }
            ,"people"     :{"location":"/users/database/synergy/people"      }
            ,"phone"      :{"location":"/users/database/synergy/phone"       }
            ,"relations"  :{"location":"/users/database/synergy/relations"   }
            ,"tasks"      :{"location":"/users/database/synergy/tasks"       }
            } 
          }
        }
  
    default:
      return {
        "meta":{
          "tables": {
            "sample"      :{"location":`/users/database/${db_name}/sample`      }
            } 
          }
        }
  }
}

get_table_names(){
  return Object.keys(this.tablesJson.meta.tables);
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
  this.tables[tableName] = new tableClass(`${this.dir}/${tableName}/_.json`);  
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


async save_table(  // dbClass - client-side
  table) {
  // save table
  const msg = await this.tables[table].save_changes();

  // uppdate and save database meta data if it is a new table
  if ( this.tablesJson.meta.tables[table]  ==  undefined) {
       this.tablesJson.meta.tables[table] = {"location": `${this.dir}/${table}`, comments: "imported table"};
    await app.proxy.RESTpost(JSON.stringify(this.tablesJson), this.url);
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