class sfc_db_tables_class extends HTMLElement { // <sfc-db-tables>  web component
/*
creates a <sfc-table> for each table in database
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

    let html = "";
    Object.keys(this.db.tables).forEach((table, i) => {
        html += `<sfc-table  id="${table}" hidden></sfc-table>` // create a place to disoplay each table in database
    });

    this.shadow.innerHTML = html;
}


show(table_name) {  // sfc_db_tables_class - client side
    this.shadow.querySelectorAll('[hidden=false]').forEach( (element) => {
        element.hidden = true;
    }); // hide visible tables

    let viewer = this.shadow.getElementById(table_name); // get table viewer <sfc-table>
    viewer.display();                                    // put html in viewer
    viewer.hidden = false;                               // show viewer
}


} // end sfc_db_tables_class


export { sfc_db_tables_class };
customElements.define("sfc-db-tables", sfc_db_tables_class); 
