/*

<sfc-record-relations>  web component - displays relations for one record in table
holds one <sfc-db-table> for each table in the database
hide tables that have not relation


*/

import {sfc_db_tables_class}  from '/_lib/db/sfc-db-tables/_.mjs'              ;  // <sfc-db-tables>

class sfc_record_relations_class extends sfc_db_tables_class { 
/*
creates a <sfc-table> for each table in database to be used to display relations assocaited with a record
*/

constructor() {  // sfc_record_relations_class - client side
	// constructor is called when the element is displayed
	super();
	this.element = document.getElementById("relation_record");  // 
	this.stack   = document.getElementById("stack_record"   );  //
}

db_set( // sfc_record_relations_class - client side
	db  // pointer to database
){
	super.db_set(db);  // call parent class method
  /*this.index = {
    "table1":{
      "pk1":{table1:{pk1: "pk_edge", pk2":"pk_edge"}
            ...
             {pk1: "pk_edge", pk2":"pk_edge"}
      ...
      "pkN":{table1:{pk1: "pk_edge", pk2":"pk_edge"}
     }
    ,"tableN":{...}
  }
*/
  
  this.index = {};
  
  this.relations = app.spa.db.getTable("relations");
  if (this.relations === undefined) {
    return // this database does not have a relation table.
  }
  const pks       = this.relations.get_PK();    // array of PK keys for entire table;
  for(let i=0; i< pks.length; i++) {
    this.pk_index(pks[i]);
  }
}


pk_index(  // sfc_record_relations_class - client side
	pk  // of relation to index
  ) {
	let relation = this.relations.get_object(pk);  // row as a json object
	this.init(pk, relation.table_1, relation.pk_1, relation.table_2, relation.pk_2);
	this.init(pk, relation.table_2, relation.pk_2, relation.table_1, relation.pk_1);
}


init(  // sfc_record_relations_class - client side
	pk                // relation pk
   ,table_name1       // 
   ,table_name_pk1    // 
   ,table_name2       // 
   ,table_name_pk2    // primary key of table
 ){
   if (this.index[table_name1] === undefined) {
	 this.index[table_name1] = {};                                             // create empty object
   }
 
   if (this.index[table_name1][table_name_pk1] === undefined) {
	 this.index[table_name1][table_name_pk1] = {};                              // create empty object
   }
 
   if (this.index[table_name1][table_name_pk1][table_name2] === undefined) {
	 this.index[table_name1][table_name_pk1][table_name2] = {};                 // create empty object
   }
 
   const pk_relation = this.index[table_name1][table_name_pk1][table_name2][table_name_pk2];
   if ( pk_relation === undefined) {
	 this.index[table_name1][table_name_pk1][table_name2][table_name_pk2]  = pk;  // pk for relation
   } else {
	 // it is an error for value to be defined
	 alert(`file="relation_module"
 method="init"
 table_name1   = "${table_name1}"
 table_name_pk1= "${table_name_pk1}"
 table_name2   = "${table_name2}"
 table_name_pk2= "${table_name_pk2}"
 pk_relation   = "${pk_relation}"`)
   }
 }


 edit( // sfc_record_relations_class - client side
	table_1  // from selected record 
	,pk_1   
	) {
	  const body = document.getElementById(`stack_record`).shadow_by_id("body");
	  if (0 === body.innerHTML.length) {
		return; // there is nothing in the stack, so nothing to do;
	  }
	
	  const table_2 = this.stack.table.name ;
	  const pk_2    = this.stack.get_pk();
	
	  // return pk for relation, or undefine if does not exist
	  this.pk = undefined;
	  if (this.index[table_1] && this.index[table_1][pk_1] && this.index[table_1][pk_1][table_2]) {
		this.pk =  this.index[table_1][pk_1][table_2][pk_2]; // may still be undefined
	  }
	
	  // will be relation pk or undefined
	  this.element.set_pk(this.pk);
	  this.element.edit();
	
	  if (this.pk === undefined) {
		// add table1 and table 2 values
		this.element.shadow_by_id("pk_1"   ).value = pk_1 ;  
		this.element.shadow_by_id("table_1").value = table_1;
	
		this.element.shadow_by_id("pk_2"   ).value =  pk_2;
		this.element.shadow_by_id("table_2").value =  table_2
	  }
}

 
show(   // sfc_record_relations_class - client side
	record // <sfc-record>
) { 
	// show relations
	const table_relation = this.index[record.table.name][record.get_pk()]; // all relations attached to table
	if (table_relation != undefined) {
		//relation = table_relation[this.#primary_key_value];  // all the relations connenting displayed object to other objects
	}

	// add hide hide all relation tables
	let table_names = app.spa.db.get_table_names();
	for (let i=0; i<table_names.length; i++) {
		this.shadow.getElementById(table_names[i]).style.display = "none";
	}

	if (table_relation !== undefined) {
		// show tables that have relations
		table_names = Object.keys(table_relation);  // array of tables that object is related to
		// walk the tables
		for(let i=0; i<table_names.length; i++) {
			let table_name = table_names[i];               
			let relations  = table_relation[table_name];
			let pks_table  = Object.keys(relations);
			
			// walk the relations in the table, add to array to display
			let ux = this.shadow.getElementById(table_name);  // ux for table
			ux.style.display = "block";  // show table
			let pks = [];
			for (let ii=0; ii<pks_table.length; ii++) {              
				pks.push(pks_table[ii]);  // pk of the relation
			}
			ux.display(pks);  // display table
		}
	}
}


} // end sfc_db_tables_class


export { sfc_record_relations_class };
customElements.define("sfc-record-relations", sfc_record_relations_class); 
