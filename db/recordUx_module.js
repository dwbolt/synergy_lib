class recordUxClass { // recordUxClass - client-side

  //////////////////////////////////////////////////////
  /*

  User Experince for things that have can have table display.

  */

#primary_key_value  // can these be moved from tableUxClass


constructor( // recordUxClass - client-side
   tableUX       // where table will be displayed
) {
  this.tableUX    = tableUX;                       
  this.globalName = tableUX.globalName + ".recordUX";
}


show(  // client side recordUxClass - for a page
  pk // primary key to show
){
  if (!(pk === undefined)) {
    // user clicked on elemnt, remember primary key for other record methodes
    this.#primary_key_value = pk; 
  }

  // recordShow Fields
  const table   = this.tableUX.getModel()  // get tableClass being displayed
  let      html = `<b>Table:</b>  ${this.tableUX.tableName}&nbsp <b>PK:</b> ${this.#primary_key_value}<br><table>`;
  const  select = table.meta_get("select");
  const  fields = table.meta_get("fields");
  let rowValue;
  for(var i=0; i<select.length; i++) {
    rowValue = table.get_value_relation(this.#primary_key_value, select[i]);
    if (rowValue === undefined) {
      rowValue = "";
    }
    html += `<tr><td>${i+1}</td> <td>${fields[select[i]].header}</td> <td>${rowValue}</td></tr>`
  }

  // show relations
  const table_relation = app.spa.relation_index[this.tableUX.tableName]; // all relations attached to table
  let relation;
  if (table_relation != undefined) {
    relation = table_relation[this.#primary_key_value];  // all the relations connenting displayed object to other objects
  }

  if (relation != undefined) {
    html += `<tr><td></td> <td><b>--- Relations ---</b></td> <td></td></tr>`
    // there are relations to display
    const tables = Object.keys(relation);  // array of tables that object is related to
    // walk the tables
    for(i=0; i<tables.length; i++) {
      let table     = tables[i];
      let relations = relation[table];
      let pks_table = Object.keys(relations);
      
      // walk the links
      html += `<tr><td></td> <td><b>${table}</b></td> <td></td></tr>`
      for (let ii=0; ii<pks_table.length; ii++) {
          let pk          = pks_table[ii];
          let record      = app.spa.db.tables[table].get_object(pk);
          let pk_relation = relation[table][pk];
          html += this.relation_display(ii+1,record,table,pk_relation);
      }
    }
  }

  
  html += "</table>"
  let dom = document.getElementById(this.tableUX.DOMid + "_record_data")
  dom.innerHTML = html;
  dom.display = "block";

  // show buttons
  this.buttonsShow("New Duplicate Edit Delete Relation-T1 Relation-T2 Clear");

  // show relations
  // need to set filters to only things connected to record
  //app.spa.display_relations("tableUXRelations");
}

relation_display( // client side recordUxClass - for a page
  i             // count 
  ,record       // object
  ,table_name   // table
  ,pk_relation  
){
  const relation = app.spa.db.getTable("relations").get_object(pk_relation);
  switch (table_name) {
    case "phone":
      return `<tr><td>${i}</td> <td>${record.label}</td> <td>${record.display}</td></tr>`
      
    case "people":
      return `<tr><td>${i}</td> <td>${record.name_last},${record.name_first}</td> <td>${relation.direction} ${relation.relation}</td></tr>`  

    default:
      return `<tr><td>${i}</td> <td>${JSON.stringify(record)}</td> <td>${relation.direction} ${relation.relation} - default case</td></tr>`  
  }

}


buttonsShow( // client side recordUxClass - for a page
  // "New Add  Edit Duplicate Delete Save  Cancel"
  s_values   // walk through id=Buttons and show all in the list   
){  // client side recordUxClass - for a page
  let button = document.getElementById(this.tableUX.DOMid + "_record_buttons").firstElementChild;
  while(button) {
    button.hidden = (s_values.includes(button.value) ? 
      false  // show button
    : true  )// hide button
    button = button.nextSibling;
  }
}


edit(  // client side dbUXClass
 //    this.#primary_key_value === null -> edit new record
){// client side recordUxClass - for a page
  let html = "<table>";
  const table  = this.tableUX.getModel();  // get tableClass being displayed
  const select = table.meta_get("select"); // array of fields to work with
  const fields = table.meta_get("fields");
  let multi_value,location,type,field,value,readonly;

  for(var i=0; i<select.length; i++) {
    // walk the fields and creat edit html
    field    = select[i];
    location = table.get_field(i,"location");
    type     = table.get_field(i,"type");

    switch(location) {
      case "relation":
        // multi value
        //let multi = table.get_value(this.#primary_key_value, field);   // get array of edes
        html += `<tr><td>${fields[field].header}</td> 
                 <td>${table.get_value_relation(this.#primary_key_value,field)}</td></tr>`;
        break;
      default:
        // single value- column or row
        if (type === "pk") {
          // do not allow editing of primary key
          readonly = "readonly";
        } else {
          readonly = "";
        }
        if (this.#primary_key_value === undefined) {
          value = "";  // new record, no previous value
        } else {
          value = table.get_value(this.#primary_key_value,field);
          if (!value) {
            // undifined, null
            value = "";
          }
        }

        html += `<tr><td>${fields[field].header}</td> <td><input ${readonly} id='edit-${i}' type='text' value='${value}'> ${readonly}</td></tr>`
    }
  }

  html += "</table>";
  document.getElementById(this.tableUX.DOMid + "_record_data").innerHTML = html;
  if (this.#primary_key_value  === undefined ) {
    this.buttonsShow("Add Cancel");  // adding new record
  } else {
    this.buttonsShow("Save Cancel"); // edit record
  }
}


async save( // client side recordUxClass - for a page
) {
  // user clicked save or add record
  // save to change file
  const table  = this.tableUX.getModel();  // get tableClass being displayed

  // create object from edit form
  const select = table.meta_get("select");  // get array of fields to work with
  const obj    = {}                      ;  // move data from form to obj
  let field_name;
  for(var i=0; i<select.length; i++) {
    // walk the form 
    field_name      = select[i];
    let edit = document.getElementById(`edit-${i}`); 
//    if (edit && 0<edit.value.length) {
    if (edit) {
      obj[field_name] = edit.value;
    }
  }

  // value of this.#primary_key_value determines add or update
  const prior_key = this.#primary_key_value;
  this.#primary_key_value = await table.save(this.#primary_key_value, obj); 
  if (prior_key != this.#primary_key_value) {
    // added a new record, update tableUX PK list
    this.tableUX.display(); // will update pk display list
  } else {
    this.tableUX.displayData()
  }
  this.show();          // display record with new data
}


new(){// client side recordUxClass - for a page
  this.#primary_key_value = undefined;   // will cause edit to create new record on this.save()
  this.edit();
}


createUX(){ // client side recordUxClass - for a page
  const dom = document.getElementById(this.tableUX.DOMid + "_record");
  if(0<dom.innerHTML.length) {
    // allready created, no work todo
    return;
  }
    // first time UX is used, so make space for data, and add buttons
  dom.innerHTML = `<div id='${this.tableUX.DOMid}_record_data'></div>
  <div id='${this.tableUX.DOMid}_record_buttons'> 
  <input hidden type='button' value='New'       onclick="${this.globalName}.new()">
  <input hidden type='button' value='Add'       onclick="${this.globalName}.save()">
  <input hidden type='button' value='Duplicate' onclick="${this.globalName}.duplicate()">
  &nbsp - &nbsp
  <input hidden type='button' value='Edit'      onclick="${this.globalName}.edit()"> 
  <input hidden type='button' value='Delete'    onclick="${this.globalName}.delete()"> 
  <input hidden type='button' value='Save'      onclick="${this.globalName}.save()">
  &nbsp - &nbsp
  <input hidden type='button' value='Relation-T1'  onclick="app.spa.copy2record('1')">
  <input hidden type='button' value='Relation-T2'  onclick="app.spa.copy2record('2')">
  &nbsp - &nbsp
  <input hidden type='button' value='Clear'     onclick="${this.globalName}.clear()">
  <input hidden type='button' value='Cancel'    onclick="${this.globalName}.cancel()">
  </div>`
  this.buttonsShow("New");
}


get_pk() {  // client side recordUxClass - for a page
  return this.#primary_key_value;
}

clear(){  // client side recordUxClass - for a page
  document.getElementById(`${this.tableUX.DOMid}_record_data`).innerHTML = "";
  this.buttonsShow("New");
}


cancel(){ // client side recordUxClass - for a page
  // similar to save, move data from buffer to memory, then save
  if (this.#primary_key_value === null ) {
    // cancled from new
    this.clear();
  } else {
    // cancled from edit
    this.show();
  }
}


recordDuplicate(){// client side recordUxClass - for a page
  alert("recordDuplicate from memery, not implemented yet")
}


delete(){// client side recordUxClass - for a page
  //alert("recordDelete from memery, not implemented yet")
  //return;
  const table = this.tableUX.getModel();  // get tableClass being displayed
  table.delete(this.#primary_key_value);  // delete row from data
  this.tableUX.display(table.PK_get() );  // redisplay data
  this.recordCancel();                    // hide record form
  //this.show_changes();                    // show changes
}



} // recordUxClass - client-side //  end


export {recordUxClass};