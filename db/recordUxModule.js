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
  document.getElementById(this.tableUX.DOMid + "_record_buttons").innerHTML =
  `
  <input hidden type='button' value='New'       onclick='${this.globalName}.new()'>
  <input hidden type='button' value='Add'       onclick='${this.globalName}.add()'>
  <input hidden type='button' value='Duplicate' onclick='${this.globalName}.duplicate()'>

  <input hidden type='button' value='Edit'       onclick='${this.globalName}.edit(true)'> 
  <input hidden type='button' value='Delete'     onclick='${this.globalName}.delete()'> 
  <input hidden type='button' value='Save'       onclick='${this.globalName}.save()'>

  <input hidden type='button' value='Cancel'    onclick='${this.globalName}.cancel()'>
`
}

show(  // client side dbUXClass - for a page
  element // dom element
){
  // recordShow
  const table             = this.tableUX.getModel()  // get tableClass being displayed
  let html = `<b>Table: ${this.tableUX.tableName}</b><br><table>`;
  if (element) {
    // user clicked on elemnt, remember primary key for other record methodes
    //this.#primary_key_value = parseInt(element.innerText,10); 
    this.#primary_key_value = parseInt(element.parentElement.getAttribute("data-row"),10); 
  }
 // const  row = table.PK_get(this.#primary_key_value); 
  const  select = table.meta_get("select");
  const  fields = table.meta_get("fields");
  let rowValue,location;
  for(var i=0; i<select.length; i++) {
    rowValue = table.get_value(this.#primary_key_value, select[i]);
/*
location = table.get_field(i,"location");
    switch(location) {
      case "row":
        rowValue = row[i];
        break;
      case "column":
        rowValue = table.get_column(this.#primary_key_value,i);
        break;
      case "multi":
        rowValue = "";
        let multi = table.get_multi(this.#primary_key_value, i);
        for(let ii=0; ii<multi.length; ii++){
          rowValue += `${multi[ii][0]}:${multi[ii][1]} - ${multi[ii][2]} <br>`;
        }
        break;
      default:
        // error
        alert(`error class="dbUXClass" method="recordShow"`);
    }
*/
    if (typeof(rowValue) === "undefined") {
      rowValue = "";
    }
    html += `<tr><td>${i+1}</td> <td>${fields[select[i]].header}</td> <td>${rowValue}</td></tr>`
  }
  html += "</table>"
  document.getElementById(this.tableUX.DOMid + "_record").innerHTML = html;

  // show buttons
  this.buttonsShow("New Duplicate Edit  Delete Cancel");

  // show relations
  // need to set filters to only things connected to record
  app.spa.display_relations("tableUXRelations");
}


buttonsShow( // client side dbUXClass - for a page
  // "New Add  Edit Duplicate Delete Save  Cancel"
  s_values   // walk through id=Buttons and show all in the list   
){  // client side dbUXClass - for a page
  let button = document.getElementById(this.tableUX.DOMid + "_record_buttons").firstElementChild;
  while(button) {
    button.hidden = (s_values.includes(button.value) ? 
      false  // show button
    : true  )// hide button
    button = button.nextSibling;
  }
}

/* old row based edit
edit(  // client side dbUXClass
  edit_type // true -> edit table record    false -> edit buffer record
){// client side dbUXClass - for a page
  this.#edit_type = edit_type;
  let html = "<table>";
  const table  = this.tableUX.getModel();  // get tableClass being displayed
  const row    = (this.#edit_type ? 
    table.PK_get(this.#primary_key_value) :
    table.bufferGet(0));  // hard code for one record case 
  const header = table.getHeader();
  let multi_value,location,type;
  for(var i=0; i<header.length; i++) {
    location = table.get_field(i,"location");
    type     = table.get_field(i,"type");
    if (type === "PK") {
      // do not allow editing of primary key
      html += `<tr><td>${header[i]}</td> <td>${row[table.get_field(i,"param")]}</td></tr>`
      this.#primary_key_value = row[i];
    } else {
      let value;  
      switch(location) {
        case "multi":
          // multi value
          let multi = table.get_multi(this.#primary_key_value, i);
          html += `<tr><td>${header[i]}</td> <td>`;
          for(let ii=0; ii<multi.length; ii++){
            html += 
            `<input id='edit-${type}-label-${ii}'   type='text' value='${multi[ii][0]}'></input>
            <input id='edit-${type}-value-${ii}'   type='text' value='${multi[ii][1]}'></input>
            <input id='edit-${type}-comment-${ii}' type='text' value='${multi[ii][2]}'></input><br>
            `
          }
          html += "</td></tr>";
          break;
        case "row":
          // single value
          value = row[table.get_field(i,"param")];
          if (typeof(value) === "undefined") {
            value="";  // assume string, code neeed to init default type.
          }
          html += `<tr><td>${header[i]}</td> <td><input id='edit-${i}' type='text' value='${value}'></td></tr>`
          break;
        case "column":
          // single value
          value = table.get_column(this.#primary_key_value,i);
          html += `<tr><td>${header[i]}</td> <td><input id='edit-${i}' type='text' value='${value}'></td></tr>`
          break;
        default:
          // 
      }
      
    }
  }
  html += "</table>";
  document.getElementById("record").innerHTML = html;
  this.buttonsShow("Save Cancel");
}
*/

edit(  // client side dbUXClass
  edit_type // true -> edit table record    false -> edit new record
){// client side dbUXClass - for a page
  this.#edit_type = edit_type;
  let html = "<table>";
  const table  = this.tableUX.getModel();  // get tableClass being displayed
  const select = table.meta_get("select"); // array of fields to work with
  const header = table.getHeader();
  
  let multi_value,location,type,field;
  for(var i=0; i<select.length; i++) {
    field    = select[i];
    location = table.get_field(i,"location");
    type     = table.get_field(i,"type");
    if (type === "PK") {
      // do not allow editing of primary key
      html += `<tr><td>${header[i]}</td> <td>${row[table.get_field(i,"param")]}</td></tr>`
      this.#primary_key_value = row[i];
    } else {
      let value;  
      switch(location) {
        case "multi":
          // multi value
          let multi = table.get_multi(this.#primary_key_value, i);
          html += `<tr><td>${header[i]}</td> <td>`;
          for(let ii=0; ii<multi.length; ii++){
            html += 
            `<input id='edit-${type}-label-${ii}'   type='text' value='${multi[ii][0]}'></input>
            <input id='edit-${type}-value-${ii}'   type='text' value='${multi[ii][1]}'></input>
            <input id='edit-${type}-comment-${ii}' type='text' value='${multi[ii][2]}'></input><br>
            `
          }
          html += "</td></tr>";
          break;
        case "row":
          // single value
          value = row[table.get_field(i,"param")];
          if (typeof(value) === "undefined") {
            value="";  // assume string, code neeed to init default type.
          }
          html += `<tr><td>${header[i]}</td> <td><input id='edit-${i}' type='text' value='${value}'></td></tr>`
          break;
        case "column":
          // single value
          value = table.get_column(this.#primary_key_value,i);
          html += `<tr><td>${header[i]}</td> <td><input id='edit-${i}' type='text' value='${value}'></td></tr>`
          break;
        default:
          // 
      }
      
    }
  }
  html += "</table>";
  document.getElementById("record").innerHTML = html;
  this.buttonsShow("Save Cancel");
}

save(){  // client side dbUXClass - for a page
  // save to memory
  const table     = this.tableUX.getModel();  // get tableClass being displayed
  const row       = table.PK_get(this.#primary_key_value);    
  const rowEdited = [];

  // fill rowEdited with values from edit form
  const header = table.getHeader();
  for(var i=0; i<header.length; i++)  {
    // walk the form 
    let location = table.get_field(i,"location");   
    if (typeof(location) === "number") {
      // single value
      let edit = document.getElementById(`edit-${i}`);
      if (edit) {
        // value input
        rowEdited[i] = edit.value;
      }
    } else {
      // multi value
      let type     = table.get_field(i,"type"); // PK, string, number, phone, url
      rowEdited[i] = [];                        // start empty, build from form
      let ii=0;
      let label = document.getElementById(`edit-${type}-label-${0}`);
      while (label) {
        let value   = document.getElementById(`edit-${type}-value-${ii}`  );
        let comment = document.getElementById(`edit-${type}-comment-${ii}`);
        rowEdited[i].push([label.value, value.value, comment.value]);
        ii++;
        label = document.getElementById(`edit-${type}-label-${ii}`  );
      }
    }
  }

  table.save2memory(this.#primary_key_value, rowEdited);
  this.show_changes();
  this.recordShow();
}


new(){// client side dbUXClass - for a page
  //
  const table = this.tableUX.getModel();  // get tableClass being displayed
  //table.bufferCreateEmpty(1);
  this.edit(false);
  this.buttonsShow("Add Cancel");
}


add(){// client side dbUXClass - for a page
  // similar to save, move data from buffer to memory, then save
  const table = this.tableUX.getModel();  // get tableClass being displayed

  table.bufferAppend();       // move buffer data to table
  this.recordSave();          // update table data from form
  this.tableUX.display(table.PK_get() );  // redisplay data
  this.show_changes();                    // show changes
}


cancel(){// client side dbUXClass - for a page
  // similar to save, move data from buffer to memory, then save
  document.getElementById("record").innerHTML = "";
  this.buttonsShow("New");
}

recordDuplicate(){// client side dbUXClass - for a page
  alert("recordDuplicate from memery, not implemented yet")
}


delete(){// client side dbUXClass - for a page
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