import  {tableClass   }   from '/_lib/db/tableModule.js'    ;

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
#json      // data loaded from json file
#urlList   // directory where database folders are
#jsonList  //
#url       // remember where the file came from
// dbClass - client-side
constructor() {
  this.#json = {tables:{} };
}


async load(  // dbClass - client-side
  // load database tables file from server
  url  // location
  ) {
  // load json table file
  this.#url          = url;
  this.#json = await app.proxy.getJSON(this.#url);  // loading database file, points to tables
  this.#urlList = url.slice(1,url.length-7);  // may break if _.json changes

  // walk through table data, load and make the table class objects
  const tables_meta = this.#json.meta.tables;        //
  const table_names = Object.keys(tables_meta);
  for (let i=0; i<table_names.length; i++) {
    const table = new tableClass();
    await table.load(`${this.#urlList}/${table_names[i]}/_.json`);
    this.#json.tables[table_names[i]] = table;  // add table to database
  }
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
    this.#json.tables[item[0]] = t;  // change plan data to a tableClasse
    t.field();  // init the field attribute from fieldA array
  });

  // top level attributes are table names
}


displayMenu( // dbClass - client-side
  // create menu of tables to display
   domID        // where to output menu
  ,selectTable  // onchange function to execute
) {
  // build menu list
  let html = `<select size="4" onclick="${selectTable}">`;

  Object.entries(this.#json.tables).forEach((table, i) => {
    html += `<option value="${table[0]}">${table[0]}</option>`;
  });
  html += `
  </select>`;

  document.getElementById(domID).innerHTML = html;
}


getJSON(){return this.#json;}


tableAdd(tableName) { // dbClass - client-side
  // create empty table and add to database
  this.#json.tables[tableName] = new tableClass(`${this.#urlList}/${tableName}/_.json`);

  return this.#json.tables[tableName]
}


getTable( // dbClass - client-side
  s_tableName
  ) {  
  return this.#json.tables[s_tableName];  // return instance of tableClass
}


clearData( // dbClass - client-side
) {  // ? not sure when this is called
  this.#json = null;
  this.url = null;
}


async save(  // dbClass - client-side
  // save changed loaded tables to disk
) {
  const keys = Object.keys(this.#json.tables);  // keys to loaded tables
  let save_meta = false;

  // tr
  for(var i=0; i< keys.length; i++) {
    // save all loaded tables that have changed
    await this.#json.tables[keys[i]].save2file();
    if ( typeof(this.#json.meta.tables[keys[i]]) ===  "undefined") {
      // have a new table, add it to meta data
      this.#json.meta.tables[keys[i]] = {"location": keys[i], comments: "imported table"}
      save_meta = true;
    }
  }

  if (save_meta) {
      // database meta data
    
    await app.proxy.RESTpost(
`{
  "meta":{
    "tables": ${JSON.stringify(this.#json.meta.tables)}
  }
  ,"tables":{
  }
}`
    , this.#url);
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