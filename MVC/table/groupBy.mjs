export class groupByClass {  // groupbeClass.js
/*

provides methods that agreate rows similar to SQL groupBY

*/


constructor() { // groupByClass - client-side
  //this.aggObj = {};  // place to put info from agg call back functions;
  this.table;        // pointer to table object
  //this.groups = {};  // object, each attribute is a group name with an object value with group details,
}


groupBy(  // groupByClass - client-side
  // creates and saves this.groups
   table  // tableClass object
  ,a_g    // array of fields to create a group  similar to SQL GROUP BY ["acount"]
//  ,l = null     // null -> entire table, list of rows to group [3,5, 3 ...]  usually  a subset of the the table
) {
  this.table = table;  // save the table pointer for later methods
  //let j=table.getJSON();  // 

  // walking the columns -- only works for an array with one value for now.
  const ret = {}
  for(var i=0; i<a_g.length; i++){
    let field = table.getJSON().columns[a_g[i]];
    let pk = Object.keys(field);
    // walking values column
    for(var ii=0; ii<pk.length; ii++){
      let value = field[pk[ii]];
      if (ret[value] === undefined) {
        ret[value] = [];
      }
      ret[value].push(pk[ii]);  //  add the PK to array
    }
  }

  return ret;
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

