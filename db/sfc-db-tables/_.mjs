export class sfc_db_tables_class extends HTMLElement { // <sfc-db-tables>  web component
/*
<sfc-db-tables>  web component

contains on <sfc-table> for each table in database

*/


constructor() {  // sfc_db_tables_class - client side
	// constructor is called when the element is displayed
	super();
	this.shadow = this.attachShadow({ mode: "closed" });  
}


db_set(  // sfc_db_tables_class - client side
    db  // pointer to database
){
    this.db = db;  // remember database we are working with

    // add <sfc-table> for each table in the database
    let html = "";
    Object.keys(this.db.tables).forEach((table_name, i) => {
        html += `<sfc-table  id="${table_name}" hidden></sfc-table>` // create a place to display each table in database
    });
    this.shadow.innerHTML = html;  // add to shadowdom

    //  <sfc-table> attach model for
    Object.keys(this.db.tables).forEach((table_name, i) => {
        let model  = this.db.getTable(table_name);
        this.shadow.getElementById(table_name).set_model(model,table_name) // let <sfc-table> know the model it is a viewer for
    });
}


show(table_name) {  // sfc_db_tables_class - client side
    // hide all tables except the one we are going to display
    for(let i=0; i< this.shadow.children.length; i++)  {
        let child = this.shadow.children[i];
        child.hidden = ! (child.id === table_name);
    } 

    this.shadow.getElementById(table_name).display(); // display <sfc-table>
}


} // end sfc_db_tables_class

customElements.define("sfc-db-tables", sfc_db_tables_class); 
