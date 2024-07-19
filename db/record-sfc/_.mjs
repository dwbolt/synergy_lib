// web compont - viewer for a table record

class record_sfc_class extends HTMLElement { // record_sfc_class - client-side

  //////////////////////////////////////////////////////
  /*

  User Experince for things that have can have table display.

  */

#primary_key_value  // can these be moved from tableUxClass


constructor( // record_sfc_class - client-side
 //  tableUX       // where table will be displayed
) {
  super();  // call parent constructor 
  this.dom_id         ; //  root 
  this.dom_id_data    ; // data
  this.dom_id_buttons ; // buttons

  this.tableUX    ;                       
  this.globalName ;
  this.table      ; // 
  
  this.shadow = this.attachShadow({ mode: "closed" });  
 this.shadow.innerHTML =  `
  <div id="title"></div>

  <div id="body"></div>
  
  <div id='buttons'> 
  <button>New</button>
  <button>Add</button>
  <button>Duplicate</button> &nbsp - &nbsp
  
  <button>Edit</button> 
  <button>Delete</button> 
  <button>Save</button>
  &nbsp - &nbsp
  <button>Stack<button> &nbsp - &nbsp
  
  <button>Clear</button>
  <button>Cancel</button>
  </div>`


/*
   if (tableUX) {
    this.tableUX    = tableUX;                       
    this.globalName = tableUX.globalName + ".recordUX";
    //this.table      = tableUX.getModel();               need to convert 
    this.dom_ids_set(tableUX.DOMid+"_record");
  }
  */
}

/*

html_create(){ // client side record_sfc_class - for a page
  const dom = document.getElementById(this.dom_id);
  if(0<dom.innerHTML.length) {
    // allready created, no work todo
    return;
  }

  // first time UX is used, so make space for data, and add buttons
  dom.innerHTML = `<div id='${this.dom_id_data}' class="record"></div>
  <div id='${this.dom_id_buttons}'> 
  <input hidden type='button' value='New'       onclick="${this.globalName}.new()">
  <input hidden type='button' value='Add'       onclick="${this.globalName}.save()">
  <input hidden type='button' value='Duplicate' onclick="${this.globalName}.duplicate()">
  &nbsp - &nbsp
  <input hidden type='button' value='Edit'      onclick="${this.globalName}.edit()"> 
  <input hidden type='button' value='Delete'    onclick="${this.globalName}.delete()"> 
  <input hidden type='button' value='Save'      onclick="${this.globalName}.save()">
  &nbsp - &nbsp
  <input hidden type='button' value='Stack'  onclick="app.spa.stack.push()">
  &nbsp - &nbsp
  <input hidden type='button' value='Clear'     onclick="${this.globalName}.clear()">
  <input hidden type='button' value='Cancel'    onclick="${this.globalName}.cancel()">
  </div>`
  this.buttonsShow("New");
}
*/

dom_ids_set(root){ // record_sfc_class - client-side
  this.dom_id          =  root             ;
  this.dom_id_data     =  root + "_data"   ;
  this.dom_id_buttons  =  root + "_buttons";
}


globalName_set( // record_sfc_class - client-side
  value
) {
  this.globalName = value;
}


show(  // client side record_sfc_class - for a page
  pk // primary key to show
){
  // show buttons for record
  if (pk === undefined && this.dom_id === "relation_record") {
    this.buttonsShow("Add Clear");
  } else if (pk !== undefined) {
    // user clicked on elemnt, remember primary key for other record methodes
    this.#primary_key_value = pk; 
    // show buttons
    this.buttonsShow("New Duplicate Edit Delete Stack Clear");
  } else {
    // adding a new record
  }

  // recordShow Fields
  let      html = `<div></div> <div></div> <div><b>Table:</b>  ${this.table.name} <b>PK:</b> ${this.#primary_key_value}</div>`;
  const  select = this.table.meta_get("select");
  const  fields = this.table.meta_get("fields");
  let rowValue;
  for(var i=0; i<select.length; i++) {
    rowValue = this.table.get_value_relation(this.#primary_key_value, select[i]);
    if (fields[select[i]].type === "textarea") {
      rowValue = `<textarea rows="5" cols="40" readonly>${rowValue}</textarea>`
    }
    html += `<div>${i+1}</div> <div>${fields[select[i]].header}</div> <div>${rowValue}</div>`
  }

  let dom = document.getElementById(this.dom_id_data);
  dom.innerHTML = html;
  dom.display = "block";


  if (this.dom_id === "relation_record") {
    // just displayed relation between stack_record and the table record, no need to do more
    if (pk === undefined) {
      // put in tables and pk for add.
    } 
    return;
  }

  app.spa.relation.edit(this.table.name, this.#primary_key_value);

  // show relations
  const table_relation = app.spa.relation.index[this.table.name]; // all relations attached to table
  let relation;
  if (table_relation != undefined) {
    relation = table_relation[this.#primary_key_value];  // all the relations connenting displayed object to other objects
  }

  // add hide hide all relations
  let table_names = app.spa.db.get_table_names();
  for (let i=0; i<table_names.length; i++) {
    app.spa.id_hide(`tableUX_${table_names[i]}_rel`);
  }
  
  if (relation !== undefined) {
    // show tables that have relations
    table_names = Object.keys(relation);  // array of tables that object is related to
    // walk the tables
    for(i=0; i<table_names.length; i++) {
      let table_name = table_names[i];               
      let relations  = relation[table_name];
      let pks_table  = Object.keys(relations);
      
      // walk the relations in the table, add to array to display
      let ux = app.spa.tableUX_rel[table_name];  // ux for table
      app.spa.id_show(`tableUX_${table_name}_rel`);
      let pks = [];
      for (let ii=0; ii<pks_table.length; ii++) {
          let pk          = pks_table[ii];                            // pk of the relation
          //let record      = app.spa.db.tables[table].get_object(pk);  // relation 
          //let pk_relation = relation[table][pk];
          pks.push(pk)
      }
      ux.display(pks);  // display table
    }
  }
}


buttonsShow( // client side record_sfc_class - for a page
  // "New Add  Edit Duplicate Delete Save  Cancel"
  s_values   // walk through id=Buttons and show all in the list   
){ 
  let button = this.shadow.getElementById(this.dom_id_buttons).firstElementChild;
  while(button) {
    button.hidden = (s_values.includes(button.value) ? 
      false  // show button
    : true  )// hide button
    button = button.nextSibling;
  }
}


form_create( // client side record_sfc_class - for a page
  dom // id 
  ,fields_meta
  ,fields_list
){
  let html = ``;
  for(let i=0; i<fields_list.length; i++) {
      html += this.form_add(dom, fields_meta, fields_list[i],i);
  }
  document.getElementById(dom).innerHTML = html;
}


form_add( // client side record_sfc_class - for a page
  dom
  ,fields_meta
  ,field_name
  ,i
){
  const field=fields_meta[field_name]
  let html = `<div>${i}</div> <div>${field.header}</div>`
  switch (field.type) {

  case "pk"       : return `${html} <div><input    id="${dom}_${field_name}" type="text" readonly></div>`;
  case "text"     : return `${html} <div><input    id="${dom}_${field_name}" type="text">    </div>`;
  case "json"     :
  case "textarea" : return `${html} <div><textarea id="${dom}_${field_name}" rows="5" cols="80"></textarea>     </div>`;
  case "integer"  : return `${html} <div><input    id="${dom}_${field_name}" type="number" onfocusout="app.integer_validate(this)">  </div>`;
  case "float"    : return `${html} <div><input    id="${dom}_${field_name}" type="number" onfocusout="app.float_validate(  this)">  </div>`;
  case "date"     : return `${html} <div><input    id="${dom}_${field_name}" type="date">    </div>`;
  case "date-time": return `${html} <div><input    id="${dom}_${field_name}" type="date"> <input id="${dom}_${field_name}_time" type="time"> </div>`;
  case "boolean"  : return `${html} <div><input    id="${dom}_${field_name}" type="checkbox"></div>`;
  case "relation" : return `${html} <div><relation needs work`;

  default        :  return `${html} <div>field.type=${field.type} field_name="${field_name} not handeld</div>`;
  }
}


form_write(  // client side record_sfc_class - for a page
    obj
    ,dom // id 
    ,fields_meta
    ,fields_list
){
    for(let i=0; i<fields_list.length; i++) {
        let field_name = fields_list[i];
        let value = obj[field_name];
        let type = fields_meta[field_name].type;
        
        if (value!==undefined) {
        switch (type) {
        case "pk"       :
        case "float"    :
        case "integer"  : 
        case "text"     :
        case "json"     :
        case "textarea" : document.getElementById(`${dom}_${field_name}`).value       =  value                                 ; break;
        case "boolean"  : document.getElementById(`${dom}_${field_name}`).checked     =  value                                 ; break;
        case "date"     : document.getElementById(`${dom}_${field_name}`).valueAsDate =  new Date(value[0],value[1]-1,value[2]); break;
        case "date-time": document.getElementById(`${dom}_${field_name}`).valueAsDate =  new Date(value[0],value[1]-1,value[2]); 
                          document.getElementById(`${dom}_${field_name}_time`).value  =  
                                               `${app.format.padZero(value[3],2)}:${app.format.padZero(value[4],2)}`           ; break;
        default        : alert(`
file="db/record-sfc/_.mjs"
method="form_write"
field_name=${field_name}
type="${type}"
no case for type
`);
        }}
    }
}


edit(){ // client side record_sfc_class - for a page
  const dom        = `${this.dom_id_data}`;
  const fields     = this.table.meta_get("fields");
  const field_list = this.table.meta_get("select");

  this.form_create(          dom, fields, field_list  );  // create empty form
  const obj = this.table.get_object(this.#primary_key_value);  // get object from table
  this.form_write(obj,       dom, fields, field_list  );  // load form with values

  if (this.#primary_key_value  === undefined ) {
    this.buttonsShow("Add Cancel");  // adding new record
  } else {
    this.buttonsShow("Save Cancel"); // edit record
  }
}


async save( // client side record_sfc_class - for a page
) {
  // user clicked save or add record
  // save to change file
  const obj    = this.form_read(this.table);    // move data from form to obj

  const prior_key = this.#primary_key_value;
  const msg = await this.table.save(obj);
  if (msg.success) {
    this.#primary_key_value = obj.pk;
    if (prior_key != this.#primary_key_value) {
      // added a new record, update tableUX PK list
      this.tableUX.display(); // will update pk display list
      if (this.dom_id === "relation_record") {
        // update relation index
        app.spa.relation.pk_index(obj.pk);
      }
    } else {
      // updated an existing record
      this.tableUX.displayData();
    }
    this.show();          // display record with new data
    } else {
      // error
      alert(`file="db/record-sfc/_.mjs"
method="save"
msg.message="${msg.message}"`);
    }
  }


form_read( // client side record_sfc_class - for a page
    table  // 
){
  const obj         = {};
  const fields_list = table.meta_get("select");
  const fields_meta = table.meta_get("fields");

  for(let i=0; i<fields_list.length; i++) {
      let field_name = fields_list[i]
      obj[fields_list[i]] = this.form_value(`${this.dom_id_data}_${field_name}`, fields_meta, field_name);
      if (obj[fields_list[i]] === undefined){
          delete obj[fields_list[i]];  // do not save undevined attributes
      }
  }

  return obj;
}


form_value( // client side record_sfc_class
  dom // id 
  ,fields_meta
  ,fields_name
){
  let date,time,value;
  const field = fields_meta[fields_name];
  switch (field.type) {
  case "pk":
  case "float":
  case "integer" :
  case "text"    :
  case "textarea": value = document.getElementById(`${dom}`).value; break;
  case "date"    : 
      date = document.getElementById(`${dom}`).value.split("-");
      if (date[0] === "" && date.length === 1) {
          value = "";
      } else {
          value = [parseInt(date[0]), parseInt(date[1]), parseInt(date[2]) ];
      }
      break;

  case "date-time"    : 
      date = document.getElementById(`${dom}`).value.split("-");
      time = document.getElementById(`${dom}_time`).value.split(":");
      if (date[0] === "" && date.length === 1 && time[0] === "" && time.length === 1) {
          value = "";
      } else {
          value = [ parseInt(date[0]), parseInt(date[1]), parseInt(date[2]), parseInt(time[0]), parseInt(time[1])];
      }
      break;
  case "json"    : 
    value = document.getElementById(`${dom}`).value;
    if ( !(value === "") ) {
      value = JSON.parse(value);
    }
     break;
  case "boolean" : value = document.getElementById(`${dom}`).checked          ; break;
  case "relation" : value = ""; break;

  default        : alert(`file="db/record-sfc/_.mjs"
methed="form_value"
field.type="${field.type}"
fields_name="${fields_name}"
case not handled`);
  }

  if (value === "" ) {
    return undefined;
  } else {
    return value;
  }
}


new(){// client side record_sfc_class - for a page
  this.#primary_key_value = undefined;   // will cause edit to create new record on this.save()
  this.edit();
}



get_pk() {  // client side record_sfc_class - for a page
  return this.#primary_key_value;
}

set_pk(value) {  // client side record_sfc_class - for a page
 this.#primary_key_value = value;
}


clear(){  // client side record_sfc_class - for a page
  document.getElementById(`${this.tableUX.DOMid}_record_data`).innerHTML = "";
  this.buttonsShow("New");
}


cancel(){ // client side record_sfc_class - for a page
  // similar to save, move data from buffer to memory, then save
  if (this.#primary_key_value === null ) {
    // cancled from new
    this.clear();
  } else {
    // cancled from edit
    this.show();
  }
}


recordDuplicate(){// client side record_sfc_class - for a page
  alert("recordDuplicate from memery, not implemented yet")
}


delete(){// client side record_sfc_class - for a page
  this.table.delete({"pk": this.#primary_key_value});  // delete row from data
  this.tableUX.display();                              // redisplay data
  this.clear();                                        // hide record form since it record is delted
}


} // record_sfc_class - client-side //  end


export {record_sfc_class};
customElements.define("record-sfc", record_sfc_class); 