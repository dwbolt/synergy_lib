//import {csvClass  } from '/_lib/db/csv_module.js'     ;
//import {proxy     } from '/_lib/proxy/_.mjs'  ;

export class table_index {  // table_index - client-side

/*

helper class for table.msj 


The inital plan is to dynamical generate indexes as searching happends.  At some point we will save and maintain indexes

support begins with index first

after indexing 
1 david
2 dan

this.index = {
"field1":
{ “d”: {
	“pks” :[1,2]
	“a”: { 
        pks[1,2]
		,”n”: { pks:[2]}
        ,"v":{ pks:[1]
            "i": {pks[1]
                "d" : {pks[1]}
                }
            }
		}
	}
}
    ,..
"fieldN": {...}

}
*/

constructor( // table_index - client-side
    model  // table
){
    this.model = model;  // points to table model
    this.index = {};     // 
}


search(  // table_index - client-side
     field_name    // 
    ,search_value
) {
    if (this.index[field_name] === undefined) {
        // create index for field_name
        this.index[field_name] = this.index(field_name);
    }
    const matches = [];  // pusk all pks that match search_value
    
    return this.index[]
}


index(
    field_name
){
    // add each field value to index
    let index = {pks:[]};
    const pks = this.model.get_PK();  // get a list of all active PK
    for(let i=0; i<pks.length; i++) {
      // all the values of the column
      const pk = pks[i];
      let field_value = this.model.get_value(pk, field_name); 
      let index_ptr = index;  // start at first letter of inedx
      if (typeof(field_value) === "number" ) {field_value = field_value.toString();}
      if ( field_value !== undefined)  {
        // walk all letters in the field_value
        for(let ii=0; ii<field_value.length; ii++) {
            const letter = field_value[ii];
            if ( index_ptr[letter] === undefined) {
                index_ptr[letter] =  {pks:[]};
            }
            index_ptr = index_ptr[letter];
            index_ptr.pks.push(pk);
        } 
      }
    }
    return index;
}


} // table_index - client-side  -- end of class def