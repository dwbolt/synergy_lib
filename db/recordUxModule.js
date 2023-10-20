class recordUxClass { // recordUxClass - client-side

  //////////////////////////////////////////////////////
  /*

  User Experince for things that have can have table display.

  */

#primary_key_value  // can these be moved from tableUxClass?
#edit_type

constructor( // recordUxClass - client-side
   tableUX       // where table will be displayed
) {
  this.tableUX    = tableUX;
  this.globalName = tableUX.globalName + ".recordUX";

  // create buttons
  let dombuttons = document.getElementById(this.tableUX.DOMid + "_record_buttons");
  if (dombuttons) {
    // if dombuttons is null, assume no UX for records will be needed
    dombuttons.innerHTML =
    `
    <input hidden type='button' value='New'       onclick='${this.globalName}.new()'>
    <input hidden type='button' value='Add'       onclick='${this.globalName}.add()'>
    <input hidden type='button' value='Duplicate' onclick='${this.globalName}.duplicate()'>
  
    <input hidden type='button' value='Edit'       onclick='${this.globalName}.edit(true)'> 
    <input hidden type='button' value='Delete'     onclick='${this.globalName}.delete()'> 
    <input hidden type='button' value='Save'       onclick='${this.globalName}.save()'>
  
    <input hidden type='button' value='Cancel'    onclick='${this.globalName}.cancel()'>
    <input hidden type='button' value='Clear'     onclick='${this.globalName}.clear()'>
  `
  }
}

show(  // client side recordUxClass - for a page
  element=null // dom element
){
  // recordShow
  const table             = this.tableUX.getModel()  // get tableClass being displayed
  let html = `<b>Table: ${this.tableUX.tableName}</b><br><table>`;
  if (element) {
    // user clicked on elemnt, remember primary key for other record methodes
    this.#primary_key_value = parseInt(element.parentElement.getAttribute("data-row"),10); 
  }

  const  select = table.meta_get("select");
  const  fields = table.meta_get("fields");
  let rowValue;
  for(var i=0; i<select.length; i++) {
    rowValue = table.get_value(this.#primary_key_value, select[i]);
    if (typeof(rowValue) === "undefined") {
      rowValue = "";
    }
    if (fields[select[i]].location === "relation") {
      html += `<tr><td>${i+1}</td> <td>${fields[select[i]].header}</td><td>`;
      for(var ii=0; ii<rowValue.length; ii++) {
        let row = rowValue[ii];
        for(var iii=0; iii<row.length; iii++) {
          html += `${row[iii]} `;
        }
        html += "<br>";
      }
      html += "</td></tr>";
    } else {
      html += `<tr><td>${i+1}</td> <td>${fields[select[i]].header}</td> <td>${rowValue}</td></tr>`
    }
  }
  html += "</table>"
  document.getElementById(this.tableUX.DOMid + "_record").innerHTML = html;

  // show buttons
  this.buttonsShow("New Duplicate Edit  Delete Clear");

  // show relations
  // need to set filters to only things connected to record
  app.spa.display_relations("tableUXRelations");
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
  edit_type // true -> edit table record    false -> edit new record
){// client side recordUxClass - for a page
  this.#edit_type = edit_type;
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
        let multi = table.get_value(this.#primary_key_value, field);
        html += `<tr><td>${fields[field].header}</td> <td>`;
        for(let ii=0; ii<multi.length; ii++){
          html += 
          `<input id='edit-${type}-label-${ii}'   type='text' value='${multi[ii][0]}'></input>
          <input id='edit-${type}-value-${ii}'   type='text' value='${multi[ii][1]}'></input>
          <input id='edit-${type}-comment-${ii}' type='text' value='${multi[ii][2]}'></input><br>
          `
        }
        html += "</td></tr>";
        break;
      default:
        // single value- column or row
        if (type === "PK") {
          // do not allow editing of primary key
          value = edit_type ? table.get_value(this.#primary_key_value,field) : "New Record" ;
          readonly = "readonly";
        } else {
          value = edit_type ? table.get_value(this.#primary_key_value,field) : "";
          readonly = "";
        }
        if (!value) {
          // undifined, null
          value = "";
        }
        html += `<tr><td>${fields[field].header}</td> <td>
          <input ${readonly} id='edit-${i}' type='text' value='${value}'> ${readonly}</td></tr>`
    }
  }

  html += "</table>";
  document.getElementById(this.tableUX.DOMid + "_record").innerHTML = html;
  if (edit_type) {
    this.buttonsShow("Save Cancel");
  } else {
    this.buttonsShow("Add Cancel");
  }
}


save( // client side recordUxClass - for a page
) {  
  // save to memory
  const table  = this.tableUX.getModel();  // get tableClass being displayed
  const obj    = {}                     ;  // move data from from to obj

  // fill rowEdited with values from edit form
  const  select = table.meta_get("select");  // get array of fields to work with
  let field_name;
  for(var i=0; i<select.length; i++) {
    // walk the form 
    field_name      = select[i];
    obj[field_name] = document.getElementById(`edit-${i}`).value;
  }
  table.save2memory(this.#primary_key_value, obj);
  this.show_changes();
  this.show();
}


new(){// client side recordUxClass - for a page
  this.edit(false);
}


add(){ // client side recordUxClass - for a page
  // similar to save, move data from buffer to memory, then save
  const table = this.tableUX.getModel();  // get tableClass being displayed

  //table.bufferAppend();       // move buffer data to table
  this.save();          // update table data from form
  this.tableUX.display(table.PK_get() );  // redisplay data
  this.show_changes();                    // show changes
}


clear(){ // client side recordUxClass - for a page
  document.getElementById(this.tableUX.DOMid + "_record").innerHTML = "";
  this.buttonsShow("New");
}


cancel(){// client side recordUxClass - for a page
  // similar to save, move data from buffer to memory, then save
  this.show();

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
  this.show_changes();                    // show changes
}



} // recordUxClass - client-side //  end


export {recordUxClass};