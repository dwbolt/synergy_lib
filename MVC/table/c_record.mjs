// <sfc-record> web component.  Displays one table record. allows add,edit,delete and moveing to stack

export class sfc_record_class extends HTMLElement { // sfc_record_class - client-side

#primary_key_value  // can these be moved from tableUxClass


constructor( // sfc_record_class - client-side
) {
  super();  // call parent constructor 

  this.id         = this.getAttribute("id"); // dom id  assume of the form "table_tableName_record"
  this.setAttribute("class","border");

  this.shadow = this.attachShadow({ mode: "closed" });  
  this.shadow.innerHTML =  `
  <p id="title"></p>

  <div id="body" style="display: grid; column-gap: 10px; grid-template-columns: max-content max-content 300px;"></div>
  
  <div id='buttons'> 
  <button>New</button>
  <button>Add</button>
  <button>Duplicate</button> &nbsp - &nbsp
  
  <button>Edit</button> 
  <button>Delete</button> 
  <button>Save</button>  &nbsp - &nbsp

  <button>JSON</button>
  <button>Stack</button> &nbsp - &nbsp
  
  <button>Clear</button>
  <button>Cancel</button>
  </div>`

 this. buttonsShow(" New "); // hide all the buttons

  this.shadow.getElementById("buttons").addEventListener('click', this.click.bind(this));
}


table_viewer_set(  // sfc_record_class - client-side
  viewer
){
  this.table_viewer = viewer;               // remember table viewer
  this.table        = viewer.model;         // remember model with table viewer
}


table_set(  // sfc_record_class - client-side
  model // table class where data lives
){
  this.table = model;
}


click(  // sfc_record_class - client-side
  event // 
){
  // user clicked on a button,  lower case of button name is method to execute
  const method = event.target.innerHTML.toLowerCase();
  if (" new duplicate edit delete save clear cancel json".includes(method) ) {
    this[method]();
  } else if (method==="add") {
    this.save(); // add and save use the same code, the value pk=undefined for add
  } else if (method==="stack") {
     app.page.stack_push(this); // hardcoded do not like this, stack should not be an part of this component
  } else {
    app.sfc_dialog.show_error(`case not handled<br> method=${method} `)
  }
}


shadow_by_id( // sfc_record_class - client-side
  id  // id of shadow elemnt
){
  return this.shadow.getElementById(id);
}


async json(){  // client side sfc_record_class - for a page
  // put json form of record in user clipboard so it can be pased elsewhere

  let obj = "{\n";  // start json 
  let delimiter = ""
  for(let i=0; i<this.select.length; i++) {
    const field_name = this.select[i];
    let value = this.table.get_value(this.#primary_key_value, field_name) ;

    if (value !== undefined) {        // only add for defined values
      // convert value to construct json representation
      switch ( typeof(value) ) {
        case "number": 
        case "boolean": 
        break;
      
        default: value = `"${value}"`; break;
      }

      obj += `${delimiter}"${field_name}":`; // add field name
      obj +=  value + "\n"; // add field value & new line
      if (delimiter === "") {
        // justed add first value, need to add , to seperate more values
        delimiter += ","; //
      }
    }
  }

  obj += "}\n"  // end json
  await navigator.clipboard.writeText(obj);  // copy json string to clipboard
  debugger
}


show(  // client side sfc_record_class - for a page
  pk // primary key to show
){
  // show buttons for record
  if (pk === undefined && this.dom_id === "relation_record") {
    // what case is this?
    this.buttonsShow("Add Clear");
  } else if (pk !== undefined) {
    // user clicked on elemnt, remember primary key for other record methodes
    this.#primary_key_value = pk; 
    // show buttons
    this.buttonsShow("New Duplicate Edit Delete JSON Stack Clear");
  } else {
    // added a new record
    this.buttonsShow("Edit New Clear");
  }

  // create shell
  if (this.select === undefined) {
    this.select = this.table.meta_get("select");     // get list of field name to display  from model, get arround bug
  }

  const body   = this.shadow.getElementById("body");
  const fields = this.table.meta_get("fields");

  body.innerHTML = "";  // start over, edit maybe showing
  this.value = [];
  for (let i=0; i<this.select.length; i++) {
    let d;
    // dispaly line number
    d = document.createElement("div"); body.appendChild(d);  d.innerHTML   = i+1;
    d.setAttribute("style"  , "text-align:right; margin-right:10px;");

    // display header name
    d = document.createElement("div"); body.appendChild(d);  d.innerHTML   = fields[this.select[i]].header;

    // create space for and rember location of value
    d = document.createElement("div"); body.appendChild(d);  this.value[i] = d;
  }

  // recordShow Fields
  this.shadow.getElementById("title").innerHTML = `<div><b>Table:</b>  ${this.table.name} <b>PK:</b> ${this.#primary_key_value}</div>`;
  for(var i=0; i<this.select.length; i++) {
    this.table_viewer.display_format(this.value[i], this.#primary_key_value, this.select[i]);
  }

  for (let i=0; i<this.show_custom.length; i++) {
    this.show_custom[i](this);   // process custom code
  }
}


buttonsShow( // client side sfc_record_class - for a page
  // "New Add  Edit Duplicate Delete Save  Cancel"
  s_values   // walk through id=Buttons and show all in the list   
){ 
  let button = this.shadow.getElementById("buttons").firstElementChild;
  while(button) {
    if (button.nodeName === "BUTTON") {
      button.hidden = (s_values.includes(button.innerHTML) ? 
      false  // show button
    : true  )// hide button
    }
    button = button.nextSibling;
  }
}


form_create( // client side sfc_record_class - for a page
   element // id 
  ,fields_meta
){
  // add html
  let html = ``;
  for(let i=0; i<this.select.length; i++) {
      html += this.form_add(fields_meta, this.select[i],i);
  }
  element.innerHTML = html;

  //add validation
/*
onfocusout="app.money_validate(this)"> 
onfocusout="app.integer_validate(this)"
onfocusout="app.float_validate(  this)"
*/
}


form_add( // client side sfc_record_class - for a page
   fields_meta
  ,field_name
  ,i
){
  const field=fields_meta[field_name]
  let html = `<div>${i}</div> <div>${field.header}</div>`
  switch (field.type) {

  case "pk"       : return `${html} <div><input    id="${field_name}" type="text" readonly></div>`;
  case "text"     : return `${html} <div><input    id="${field_name}" type="text">    </div>`;
  case "json"     : 
  case "html"     :
  case "textarea" : return `${html} <div><textarea id="${field_name}" rows="5"></textarea>  </div>`;
  case "money"    : return `${html} <div><input    id="${field_name}" type="number"  > </div>`;
  case "integer"  : return `${html} <div><input    id="${field_name}" type="number"  > </div>`;
  case "float"    : return `${html} <div><input    id="${field_name}" type="number"  > </div>`;
  case "date"     : return `${html} <div><input    id="${field_name}" type="date"    > </div>`;
  case "date-time": return `${html} <div><input    id="${field_name}" type="date"    > <input id="${field_name}_time" type="time"> </div>`;
  case "boolean"  : return `${html} <div><input    id="${field_name}" type="checkbox"></div>`;
  case "relation" : return `${html} <div><relation needs work`;

  default         :  return `${html} <div>field.type=${field.type} field_name="${field_name} not handeld in sfc-record </div>`;
  }
}

money_validate(
  element) {
  
}


form_write(  // client side sfc_record_class - for a page
    obj
    ,fields_meta
){
  for(let i=0; i<this.select.length; i++) {
    let field_name = this.select[i];
    let value = obj?.[field_name];
    let type = fields_meta[field_name].type;
    
    if (value!==undefined) {
      switch (type) {
      case "pk"       :
      case "float"    :
      case "integer"  : 
      case "text"     :
      case "json"     :
      case "html"     :
      case "money"    :
      case "textarea" : this.shadow.getElementById(field_name).value       =  value                                 ; break;
      case "boolean"  : this.shadow.getElementById(field_name).checked     =  value                                 ; break;
      case "date"     : this.shadow.getElementById(field_name).valueAsDate =  new Date(value[0],value[1]-1,value[2]); break;
      case "date-time": this.shadow.getElementById(field_name).valueAsDate =  new Date(value[0],value[1]-1,value[2]); 
                        this.shadow.getElementById(`${field_name}_time`).value  =  
                                              `${app.format.padZero(value[3],2)}:${app.format.padZero(value[4],2)}`; break;
      default        : app.sfc_dialog.show_error(`case not handled<br> type="${type}"<br> field_name="${field_name}"`);
    }
  }}
}


edit(){ // client side sfc_record_class - for a page
  const element    = this.shadow.getElementById("body");
  const fields     = this.table.meta_get("fields");
  if (this.select === undefined) {
    this.select = this.table.meta_get("select");
  }

  this.form_create(element, fields);  // create empty form
  const obj = this.table.get_object(this.#primary_key_value);  // get object from table
  this.form_write(obj,      fields);  // load form with values

  if (this.#primary_key_value  === undefined ) {
    this.buttonsShow("Add Cancel");  // adding new record
  } else {
    this.buttonsShow("Save Cancel"); // edit record
  }
}


async save( // client side sfc_record_class - for a page
) {
  // user clicked save or add record
  // save to change file
  const obj    = this.form_read();    // move data from form to obj

  const prior_key = this.#primary_key_value;
  const msg = await this.table.save(obj);
  if (msg.success) {
    this.#primary_key_value = obj.pk;
    if (prior_key != this.#primary_key_value) {
      // added a new record, update tableUX PK list
      this.table_viewer && this.table_viewer.display(); // will update pk display list
      if (this.dom_id === "relation_record") {
        // update relation index
        app.page.relation.pk_index(obj.pk);
      }
    } else {
      // updated an existing record
      this.table_viewer && this.table_viewer.display_data();
    }
    this.show();          // display record with new data
  } else {
    // error
    app.sfc_dialog.show_error(`case not handled<br> msg.message="${msg.message}"`);
  }
}


form_read( // client side sfc_record_class - for a page
){
  const obj         = {};
  const fields_list = this.table.meta_get("select");
  const fields_meta = this.table.meta_get("fields");

  for(let i=0; i<fields_list.length; i++) {
      let field_name = fields_list[i]
      obj[fields_list[i]] = this.form_value(field_name, fields_meta, field_name);
      if (obj[fields_list[i]] === undefined){
          delete obj[fields_list[i]];  // do not save undevined attributes
      }
  }

  return obj;
}


form_value( // client side sfc_record_class
  dom // id 
  ,fields_meta
  ,fields_name
){
  let date,time,value;
  const field = fields_meta[fields_name];
  value = this.shadow.getElementById(`${dom}`)?.value;
  if (value === "" ) {
    return undefined;
  }

  switch (field.type) {
  case "pk": case "text" : case "html" :
  case "textarea": break;

  case "integer" : 
  case "money"   : value = Number.parseInt(  value); break;
  case "float"   : value = Number.parseFloat(value); break;

  case "date"    : 
      date = value.split("-");
      if (date[0] === "" && date.length === 1) {
        return undefined;
      } else {
        value = [parseInt(date[0]), parseInt(date[1]), parseInt(date[2]) ];
      }
      break;

  case "date-time"    : 
      date = value.split("-");
      time = this.shadow.getElementById(`${dom}_time`).value.split(":");
      if (date[0] === "" && date.length === 1 && time[0] === "" && time.length === 1) {
        return undefined;;
      } else {
        value = [ parseInt(date[0]), parseInt(date[1]), parseInt(date[2]), parseInt(time[0]), parseInt(time[1])];
      }
      break;

  case "json"    : value = JSON.parse(value);break;
  case "boolean" : value = document.getElementById(`${dom}`).checked          ; break;

  default        : app.sfc_dialog.show_errort(`case not handled<br> field.type="${field.type}"<br> fields_name="${fields_name}"`);
  }

  return value;
}


new(){// client side sfc_record_class - for a page
  this.#primary_key_value = undefined;   // will cause edit to create new record on this.save()
  this.edit();
}



get_pk() {  // client side sfc_record_class - for a page
  return this.#primary_key_value;
}

set_pk(value) {  // client side sfc_record_class - for a page
 this.#primary_key_value = value;
}


clear(){  // client side sfc_record_class - for a page
  this.shadow.getElementById(`title`).innerHTML = "";
  this.shadow.getElementById(`body`).innerHTML = "";
  this.buttonsShow("New");
}


cancel(){ // client side sfc_record_class - for a page
  // similar to save, move data from buffer to memory, then save
  if (typeof(this.#primary_key_value) === "string") {
        this.show(this.#primary_key_value);   // cancled from edit
  } else {
    this.clear();  // cancled from new
  }
}


duplicate(){// client side sfc_record_class - for a page
  // new record, copy values from existing record. add a new record with same values expect pk, enter edit mode
  
  
  const dup    = this.table.get_object(this.#primary_key_value); // get values of record to duplicate

  const fields = Object.keys(dup);                               // get array of field_names
  this.new();

  for(let i=0; i<fields.length;  i++){
    const field_name = fields[i];
    if ( ["pk","_relations"].find( (element) => element === field_name ) === undefined) {  
      // skip dup for pk,  need to change pk to a meta data field _pk.  then just not dup any meta data
      this.shadow.getElementById(field_name).value = dup[field_name];  // copy value
    }
  }
}


delete(){// client side sfc_record_class - for a page
  this.table.delete({"pk": this.#primary_key_value});  // delete row from data
  this.table_viewer.display();                              // redisplay data
  this.clear();                                        // hide record form since it record is delted
}


} // sfc_record_class - client-side //  end

customElements.define("sfc-record", sfc_record_class);  // tie class to custom web component