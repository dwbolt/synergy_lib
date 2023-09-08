class groupByClass {  // groupbeClass.js
/*

provides methods that agreate rows similar to SQL groupBY

*/


constructor() { // groupByClass - client-side
  this.aggObj = {};  // place to put info from agg call back functions;
  this.table;        // pointer to table object
  this.groups = {};  // object, each attribute is a group name with an object value with group details,
}


groupBy(  // groupByClass - client-side
  // creates and saves this.groups
   table  // tableClass object
  ,a_g    // array of fields to create a group  similar to SQL GROUP BY ["acount"]
//  ,l = null     // null -> entire table, list of rows to group [3,5, 3 ...]  usually  a subset of the the table
) {
  this.table = table;  // save the table pointer for later methods
  let j=table.json;

  // covert array of string field names to array of index values
  /*
  const a_gv = [];
  a_g.forEach((fieldName, i) => {
    a_gv.push(j.field[fieldName]);
  });
*/

  let field = j.field;
  // walk through table list
  table.json.rows.forEach((row, i) => {
    // now see if there is alreay a GROUP
    let attributeName = "";
    a_gv.forEach((fieldIndex) => {
      attributeName += `-+-${row[fieldIndex]}`;  // -+- is a delimiter between fields
    });
    attributeName = attributeName.slice(3); // remove leading -+-

    // see if group exists
    if (typeof(this.groups[attributeName]) ==="undefined") {
      // create new group
      this.groups[attributeName] = {};
      this.groups[attributeName].aggObj = {};
      this.groups[attributeName].rowIndex = [i];
    } else {
      // add rowindex to existing group
      this.groups[attributeName].rowIndex.push(i);
    }
  });
}


aggregate(  // groupByClass - client-side
  f  // a function that aggregate a table row.  It could, sum, min, max, or something else
) {
  // walk groups
  let j=this.table.json;
  Object.keys(this.groups).forEach((attributeName, i) => {
    f("init",this.groups[attributeName].aggObj);  // init accumiltor

    // walk table rows in group
    this.groups[attributeName].rowIndex.forEach((rowIndex, i) => {
      // walk fields in rows
      f("agg", this.groups[attributeName].aggObj, j.rows[rowIndex]);
    });

    // make any last changes
    f("finish",this.groups[attributeName].aggObj);
    //g.agg = o;   // save result
  });
}


}  //  end  groupByClass - client-side

export {groupByClass}