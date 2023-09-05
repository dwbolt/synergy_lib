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


getTable( // dbClass - client-side
  s_tableName
  ) {  
  return this.json[s_tableName];  // return instance of tableClass
}


clearData( // dbClass - client-side
) {  // ? not sure when this is called
  this.json = null;
  this.url = null;
}


save(  // dbClass - client-side
// if s_DOMid is undefined, return the string
// convert this.json into a string that can be saved or display
  s_DOMid
  ) {
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


async load(  // dbClass - client-side
  url
  ) {
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


loadLocal( // dbClass - client-side
  buffer
  ) {
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


displayMenu( // dbClass - client-side
  // create menu of tables to display
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


displayTable( // dbClass - client-side
  e){
  // get value drop down list
  const table = e.options[e.selectedIndex].value;
  this.json[table].display('tableDisplay',"app.page.table");

}


} // dbClass - client-side // end /////////////////////////////////////////////////////////////////////////////
