class dbClass {  ///////////////////////////////////////////////////////////////////////
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


// dbClass - client-side
constructor() {
  this.json = {}; // data loaded from json file
  this.url;       // remember where the file came from
}


/////////////////////////////   database methods
// dbClass - client-side
tableAdd(tableName) {  // create empty table and add to database
  this.json[tableName] = new tableClass(tableName);
  return this.json[tableName]
}


// dbClass - client-side
getTable(s_tableName) {  // return instance of tableClass
  return this.json[s_tableName];
}


// dbClass - client-side
clearData() {  // ? not sure when this is called
  this.json = null;
  this.url = null;
}


// dbClass - client-side
// if s_DOMid is undefined, return the string
// convert this.json into a string that can be saved or displayed
save(s_DOMid) {
  let file="{";
  let com = " ";
  Object.entries(this.json).forEach((item, i) => {
    file += "\n"+com + this.getTable(item[0]).genTable(item[0]);
    com = ",";
  });
  file += "}"

  if (typeof(s_DOMid) === "undefined") {
    // no dom, return the string
    return file;
  } else {
      // display in DOM
      document.getElementById(s_DOMid).value = file;
  }
}


// dbClass - client-side
async load(url) {
  // load json table file
  this.url = url;
  this.json = await app.proxy.getJSON(url);

  // walk through table data, and make the table class objects
  Object.entries(this.json).forEach((item, i) => {
    // covern raw json data to a table class
    const t = new tableClass();
    t.setJSON(item[1]);      // add loaded table attributes to constructor defaults
    this.json[item[0]] = t;  // change plan data to a tableClasse
    t.field();  // init the field attribute from fieldA array
  });

  // top level attributes are table names
}


// dbClass - client-side
loadLocal(buffer) {
  // load json table file
//  this.url = url;
//  this.json = await app.proxy.getJSON(url);
  this.json = JSON.parse(buffer);
  // walk through table data, and make the table class objects
  Object.entries(this.json).forEach((item, i) => {
    // covern raw json data to a table class
    const t = new tableClass();
    t.setJSON(item[1]);      // add loaded table attributes to constructor defaults
    this.json[item[0]] = t;  // change plan data to a tableClasse
    t.field();  // init the field attribute from fieldA array
  });

  // top level attributes are table names
}


// dbClass - client-side
//display summery of db loaded
displaySummery(s_domID) {
  let html = "<p><b>Summery of Data loaded</b></p>";

  Object.entries(this.json).forEach((item, i) => {
    // covern raw json data to a table class
    let t = item[1];
    html += `<br>${item[0]} - rows=${item[1].json.rows.length}`
  });

  document.getElementById(s_domID).innerHTML = html;
}


// dbClass - client-side
// create menu of tables to display
displayMenu(
   domID        // where to output menu
  ,selectTable  // onchange function to execute
  ,exportF      //
) {
  // build menu list
  let html = `<h4>Select Table to Display</h4><select size="4" onclick="${selectTable}">`;

  Object.entries(this.json).forEach((table, i) => {
    html += `<option value="${table[0]}">${table[0]}</option>`;
  });
  html += `
  </select>`;

  document.getElementById(domID).innerHTML = html;
}



// dbClass - client-side
displayTable(e){
  // get value drop down list
  const table = e.options[e.selectedIndex].value;
  this.json[table].display('tableDisplay',"app.page.table");

}


// dbClass - client-side
} // end /////////////////////////////////////////////////////////////////////////////




// dbClass - client-side
/* commened out by dwb 2022-03-11 does not seem to be used
updateColumn(){
  // hard coded json update  special use
  let f = this.json.journal.field;
  this.json.journal.rows.forEach((r) => {
    r[f.n_credit] = Math.trunc( r[f.n_credit] * 100 );
    r[f.n_debit]  = Math.trunc( r[f.n_debit]  * 100 );
  });

  this.display('journal');
//  x=document.getElementById("t1-0")
//  x.childNodes[3]
}
*/
