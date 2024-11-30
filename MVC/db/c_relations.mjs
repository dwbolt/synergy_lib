/*

<sfc-record-relations>  web component

contains one <sfc-table> for each table in the database

displays relations for one record in table
hide tables that are not part of relation

*/

import {sfc_db_tables_class}  from '/_lib/MVC/db/c.mjs'              ;  // <sfc-db-tables>

export class sfc_record_relations_class extends sfc_db_tables_class { 
/*
creates a <sfc-table> for each table in database to be used to display relations assocaited with a record
*/

constructor() {  // sfc_record_relations_class - client side
	// constructor is called when the element is displayed
	super();
	this.element = document.getElementById("relation_record");  // in main DOM
	this.stack   = document.getElementById("stack_record"   );  // in main DOM
}

db_set( // sfc_record_relations_class - client side
	db  // pointer to database
){
	super.db_set(db);  // call parent class method

	// trun off search in all the tables
	const tables =this.shadow.children;
	for(let i=0; i<tables.length; i++){
		tables[i].searchVisible  = false;
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
	// hide hide all relation tables
	let table_names = app.page.db.get_table_names();
	for (let i=0; i<table_names.length; i++) {
		this.shadow.getElementById(table_names[i]).style.display = "none";
	}
	
	const pk         = record.get_pk();
	const _relations = record.table.get_value(pk,"_relations")?.tables;
	if (_relations === undefined) {
		return; // not relations, nothing to show;
	}

	// show tables that have relations
	table_names = Object.keys(_relations);  // array of tables that object is related to
	// walk the tables
	for(let i=0; i<table_names.length; i++) {
		const table_name = table_names[i];               
		const ux = this.shadow.getElementById(table_name);  // ux for table
		ux.style.display = "block";                         // show table

		// walk the relations in the table, add to array to display
		let pks = [];
		let relations  = Object.keys(_relations[table_name]);
		for (let ii=0; ii<relations.length; ii++) {              
			pks.push(relations[ii]);  // pk of the relation
		}
		ux.display(pks);  // display table
	}
}


} // end sfc_db_tables_class

customElements.define("sfc-record-relations", sfc_record_relations_class); // tie class to custom web component
