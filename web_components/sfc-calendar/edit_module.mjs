import {proxy       } from '/_lib/proxy/_.mjs' ;
import {format      } from '/_lib/format/_.mjs' ;

export class calendar_edit_class {
// works with calendarClass to add/edit/delete events

// used to remember new event date
#year 
#month
#day

constructor(  // calendar_edit_class  client-side
  cal
  ){ 
    // move values in pop up form to graph edge
  this.calendar       = cal;      // point to calander object that we are editing.
  this.table          = this.calendar.table_events  // pointer events
  this.openMonthDates = 0;        // number of selectors visible when monthly repeating option is chosen
  this.formHeight     = "500px"; 
}


async event_create(  // calendarClass  client-side
// user clicked + to add new event on a particular day
data  // "yyyy-m-d"
) {
  // determine if we are on user calendar or
	if ( await app.sfc_login.login_force( this.event_create.bind(this,data) )) {

  await this.form_load();
  this.renderEndDateSelector();  // turn on input files for type of repeat (never, weekly, monthly.....)

  // set member variables for event year month and 
  const data_array = data.split("-") 
  this.#year  = parseInt(data_array[0]);
  this.#month = parseInt(data_array[1]);
  this.#day   = parseInt(data_array[2]);

  // set start date to date clicked on
  this.shadow.getElementById("start_date").value = 
    `${this.#year}-${format.padZero(this.#month,2)}-${format.padZero(this.#day,2)}`

  // set start time to current time
  const currentdate = new Date();
  this.shadow.getElementById("start_time").value = `${format.padZero(currentdate.getHours(),2)}:00`;

  // set duration to 0 hours and 30 minues
  this.shadow.getElementById("duration_hours"  ).value = 0;
  this.shadow.getElementById("duration_minutes").value = 30;
  this.duration_changed();
  
  // Set correct buttons to display for creating new event
  this.shadow.getElementById("saveEventButton"  ).hidden = true;
  this.shadow.getElementById("deleteEventButton").hidden = true;
  let button = this.shadow.getElementById("addEventButton"   ); button.hidden = false; button.addEventListener("click", this.event_add.bind(this));

  app.sfc_dialog.show_modal();    // make popup vissible
  }
}

async form_load(){  // calendarClass  client-side
  app.sfc_dialog.title_set("<b>Edit Calandar Event</b>");
  const html = await proxy.getText("/_lib/web_components/sfc-calendar/editForm.html");
  app.sfc_dialog.body_set(html);
  this.shadow = app.sfc_dialog.shadow;
}


async event_edit(  // calendarClass  client-side
pk  // string
) {
  if (! await app.sfc_login.getStatus()) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }
  this.pk = pk;  // remember of future methods

  // reload popup form
  await this.form_load();

  // show/hide buttons
  this.shadow.getElementById("addEventButton"   ).hidden = true ;     // Hide
  let button = this.shadow.getElementById("saveEventButton"  ); button.hidden = false; button.addEventListener("click", this.save.bind(this));
      button = this.shadow.getElementById("deleteEventButton"); button.hidden = false; button.addEventListener("click", this.event_delete.bind(this));

  app.sfc_dialog.show_modal();   // make popup vissible
  this.data2form(pk);   // load data
}


async event_add(  // calendar_edit_class  client-side
// user click "add" button to save new event on server
) {
  this.pk = undefined;      // create a new pk
  await this.form_save() ;  // move popup form data to edit 
}


get_next_key(  // calendar_edit_class  client-side
  object  // assume keys are string version of numbers
  ) {
  const keys = Object.keys(object);
  let max = -1;  
  
  for(let i=0; i<keys.length; i++){
    // find largest key
    max = (max< parseInt(keys[i]) ? parseInt(keys[i]) : max);
  }
  return (max+1).toString()  // go one past it
}


async event_delete( // calendar_edit_class  client-side
) {
  // dete pk, will not detelet data
  const record = this.table.get_object(this.pk);
  await this.processServerRefresh(record, true);
}


async save(   // calendar_edit_class  client-side
// user clicked edits existing event, and now has clicked saved
) {
  await this.form_save(); // move popup form data to edit 
}


async processServerRefresh( // calendar_edit_class  client-side
   record          // db record to process
  ,remove=false  // false -> save updateds,  true -> delete record
) {
  // save new graph
  let resp;
  if (remove) {
    resp    = await this.table.delete(record);
  } else {
    resp    = await this.table.save(record);
  }

  if (!resp.success) {
    alert(`Error resp="${JSON.stringify(resp)}"`);
  } else {
    this.windowActive = false;  // what does this do?
    app.page_display_url( app.url_json_get() );  // redisplay data, so we can see changes made on calendar
  }
}
  

weeklyRepeatDays() {
  // When user hits "add event" or "save"
  // Handles the days of week that the event should repeat on
  // Returns array where each item is an index of day of the week starting at 0
  // ex [0,2,4] is [sunday, tuesday, thursday]
  // grab all checkboxes
  let options = this.shadow.getElementById("weekly_repeat").getElementsByClassName("repeatCheckbox");
  let rv = [];

  // go through all the checkboxes for the days and push back the index if they are checked
  for (var i = 0; i < options.length; i++) {
    if (options[i].checked == true) {
      rv.push(i);
    }
  }
  return rv;
}


putDate(// calendar_edit_class  client-side
   DOMname // where to put date data
  ,date    // [year, month,day,hours, minutes]
){
this.shadow.getElementById(`${DOMname}_date`).valueAsDate = new Date(date[0],date[1]-1,date[2]); // "2023-04-05"
 // "12:20"

if (this.shadow.getElementById(`${DOMname}_time`)) {
  // will not exist for DOMname "repeat_end"
  this.shadow.getElementById(`${DOMname}_time`).value = 
  `${format.padZero(date[3],2)}:${format.padZero(date[4],2)}`;  
}

}


duration_changed( // calendar_edit_class  client-side
  ){
    // get duration
    const hours   = parseInt(this.shadow.getElementById(`duration_hours`  ).value);
    const minutes = parseInt(this.shadow.getElementById(`duration_minutes`).value);

    // create end date from start + duration
    const s = this.getDate("start"); // [year,month,day,hour,sec]
    const end = new Date(s[0],s[1]-1,s[2], s[3]+hours, s[4]+minutes);

    // update end_date and end_time
    this.shadow.getElementById("end_date").valueAsDate = end; 
    this.shadow.getElementById("end_time").value       = `${format.padZero(end.getHours(),2)}:${format.padZero(end.getMinutes(),2)}`;

    // if repeat end is displayed, set time po
}


end_time_changed(){ // calendar_edit_class  client-side
  let d       = this.getDate("start");                        
  const start = new Date(d[0], d[1]-1, d[2], d[3],d[4]);      // get start
      d       = this.getDate("end");
  const end   = new Date(d[0], d[1]-1, d[2], d[3],d[4]);      // get end

  // set duration
  const diff    =  end.getTime()  - start.getTime();
  const hours   =  Math.floor(diff/       (1000*60*60));
  const mill    =  diff-(hours*1000*60*60);
  const minutes =  Math.floor(mill/(1000*60));
  this.shadow.getElementById("duration_hours"  ).value = hours;
  this.shadow.getElementById("duration_minutes").value = minutes;
}


data2form(  // calendar_edit_class  client-side
// fills in pop up form from event data
pk
) {
  const record = this.table.get_object(pk);
  this.shadow.getElementById("name"       ).value = (record.name       ? record.name         : "")       
  this.shadow.getElementById("url"        ).value = (record.url         ? record.url         : "")       
  this.shadow.getElementById("description").value = (record.description ? record.description : "")

  let d = record.dateStart;
  this.shadow.getElementById("start_date").valueAsDate = this.array2date(d);
  this.shadow.getElementById("start_time").value       = this.time2string(d);
  
  d = record.dateEnd;
  this.shadow.getElementById("end_date").valueAsDate = this.array2date(d);
  this.shadow.getElementById("end_time").value       =  this.time2string(d);

  this.shadow.getElementById('timeZone').value       = record.timeZone;
 
  // fill in duration of event
  const durTimeData = record.timeDuration.split(":");
  this.shadow.getElementById("duration_hours"  ).value = parseInt(durTimeData[0]);
  this.shadow.getElementById("duration_minutes").value = parseInt(durTimeData[1]);

  this.shadow.getElementById("repeat"    ).value = record.repeat;
  this.shadow.getElementById("repeat_inc").value = record.repeat_inc;
  this.renderEndDateSelector();  // hide elements not being used

  // fill in what days the event repeats on
  this.data2form_repeat(record);
}


time2string( // calendar_edit_class  client-side
  d // date array [yyyy,mmm,dd, hh,mm]
){
  return  `${format.padZero(d[3],2)}:${format.padZero(d[4],2)}`;
}


array2date( // calendar_edit_class  client-side
  d // date array [yyyy,mmm,dd,hh,mm]
){
  return new Date(d[0],d[1]-1,d[2]);
}


data2form_repeat(   // calendar_edit_class  client-side
  record   //
  ){

  switch(record.repeat) {
  case "never":  
//     edge.repeat_end = edge.dateEnd;
     break;

  case "weekly": 
    this.set_weekly_days(record);  // not sure what this does
    break;

  case "monthly":
    while ( this.openMonthDates < record.repeat_details.length){
      this.addNewRepeatMonthy();  // create place
    }
    for (let i = 0; i < record.repeat_details.length; i++) {
      this.shadow.getElementById(`monthlyDaySelect-${i+1}` ).value = record.repeat_details[i][0];

      if (0<record.repeat_details[i][1]) {
        // start at begining of month
        this.shadow.getElementById(`monthly_week_select-${i+1}`).value               =  record.repeat_details[i][1];
        this.shadow.getElementById(`direction-${this.openMonthDates}`).selectedIndex = 0;
      } else {
        // start at end of month
        this.shadow.getElementById(`monthly_week_select-${i+1}`).value               = -record.repeat_details[i][1];
        this.shadow.getElementById(`direction-${this.openMonthDates}`).selectedIndex = 1;
      }
   
    }
    break;

  case "yearly":
    break;

  default:
    alert(`error in calendar_edit_class method="data2form" repeat="${edge.repeat}" `);
  }

  // set repeat end data, use time from dateEnd
  let r=record.repeat_end_date;
  if (r) {
    this.shadow.getElementById('repeat_end_date').value = `${r[0]}-${format.padZero(r[1],2)}-${format.padZero(r[2],2)}`
  }

}


set_weekly_days(  // calendar_edit_class  client-side
  // fills in the selector for what days of the week the event repeats on
  record
) {
  let days = record.repeat_details; // arrays of day to repeat, 0->sunday 1-monday..
  let daysOfWeek = this.shadow.getElementById("weekly_repeat").getElementsByClassName("repeatCheckbox");
  for (let i = 0; i < days.length; i++) {
    daysOfWeek[days[i]].checked = true;
  }
}


validateForm(
    // This function makes sure that all the necessary fields of pop up form are filled in before the user can submit or save data
  ) {
  if (this.shadow.getElementById("name").value == "") {
    alert('Name of event not filled in');
    this.setCanSubmit(false);
  }

  if ((this.shadow.getElementById("repeat").value == "monthly" || this.shadow.getElementById("repeat").value == "weekly") && this.shadow.getElementById("endDateInput").value == "") {
    alert('End date of event not filled in');
    this.setCanSubmit(false);
  }

  this.setCanSubmit(true);
}
  

getDate(// calendar_edit_class  client-side
  DOMname // 
){
  let dateString = this.shadow.getElementById(`${DOMname}_date`).value;   // "2023-04-05"
  let date = [];
  if (dateString === "") {
    // date not specified
    date[0] = undefined;  // will be recurrent every year
    date[1] = 12;
    date[2] = 31;
  } else {
    date    = dateString.split("-");
    date[0] = parseInt(date[0]);
    date[1] = parseInt(date[1]);
    date[2] = parseInt(date[2]);
  }

  if (this.shadow.getElementById(`${DOMname}_time`)) {
     const timeString = this.shadow.getElementById(`${DOMname}_time`).value;   // "12:20"
     const time       = timeString.split(":"); 
     date[3] = parseInt(time[0]);
     date[4] = parseInt(time[1]);  
  } else {
    date[3] = 0;
    date[4] = 0;
  }

  return [date[0], date[1] , date[2], date[3], date[4]];  // array[year, month, day, hours, minutes]
}


async form_save( // calendar_edit_class  client-side
/// moves pop up form to edge for this.graph.edge[edge]
 //   edge // name of edge we are loading
  )   {
  const record = {};
  
  record.pk          = (this.pk ? this.pk.toString() : undefined);
  record.name        = this.shadow.getElementById("name"       ).value;
  record.url         = this.shadow.getElementById("url"        ).value;
  record.description = this.shadow.getElementById("description").value;
  record.dateStart   = this.getDate("start");
  record.dateEnd     = this.getDate("end"  );
  record.timeZone    = this.shadow.getElementById("timeZone"        ).value;  

  record.timeDuration = this.shadow.getElementById("duration_hours"  ).value +":"+ 
                      this.shadow.getElementById("duration_minutes").value;

  record.repeat     = this.shadow.getElementById("repeat"   ).value;  // chosen value of how often to repeat even
  record.repeat_inc = this.shadow.getElementById("repeat_inc"    ).value;  // chosen value of how often to repeat even
  this.form2data_repeat(record);  // handle different cases for types of repeating
  await this.processServerRefresh(record);
}


form2data_repeat(g){  // calendar_edit_class  client-side
  // called by form2date, handle repeating data
  if (g.repeat !== "never"){
    // only need this attrebute for repeading data
    g.repeat_end_date = this.getDate("repeat_end");
  }

  switch(g.repeat) {
  case "weekly":
    // find offset for desired days
    g.repeat_details = this.weeklyRepeatDays();    // returns array of days repeating  [0,2]  would be Sunday Tuesday repeating days
    break;

  case "monthly":
    // event is repeating monthly
    g.repeat_details = [];
    // read input from the drop down boxes
    for (let i = 1; i <= this.openMonthDates; i++) {
      let sign;
      if (this.shadow.getElementById(`direction-${i}`).value === "end" ) {
        sign = -1; // move back from last day
      } else {
        sign = 1;  // 
      }
      g.repeat_details.push([
                parseInt(this.shadow.getElementById(`monthlyDaySelect-${i}`   ).value)
        ,sign * parseInt(this.shadow.getElementById(`monthly_week_select-${i}`).value)
      ]);
    }
    break;

  case "yearly":
    break;

  case "never":
    // was already init for this case
    break;

  default:
    // error
    alert(`file="calendarEdit_module.js"
method="form2data_repeat"
repeat="${g.repeat}"`);
  }
}


renderEndDateSelector(  // calendar_edit_class  client-side
  // renders the end date selector based on chosen selected value from the repeat selector in pop up form
  ) {
  let repeat = this.shadow.getElementById("repeat").value;
  switch( repeat ) {
  case "never":
    this.shadow.getElementById("end_repeat"    ).hidden = true;
    this.shadow.getElementById("weekly_repeat" ).hidden = true;
    this.shadow.getElementById("monthly_repeat").hidden = true;
    break;

  case "weekly":
    this.shadow.getElementById("end_repeat"    ).hidden = false;
    this.shadow.getElementById("weekly_repeat" ).hidden = false;
    this.shadow.getElementById("monthly_repeat").hidden = true;
    break;
    
  case "monthly":
    if (this.openMonthDates === 0) {
      // no places to select day or week, so add one
      this.addNewRepeatMonthy();
    }
    this.shadow.getElementById("end_repeat"    ).hidden = false;
    this.shadow.getElementById("weekly_repeat" ).hidden = true;
    this.shadow.getElementById("monthly_repeat").hidden = false;
    break;

  case "yearly":
    // display only a number when selecting a year
    this.shadow.getElementById("end_repeat"    ).hidden = false;
    this.shadow.getElementById("weekly_repeat" ).hidden = true;
    this.shadow.getElementById("monthly_repeat").hidden = true;
    break;

  default:
    // error
    alert(`error case not handeled in calendarEditModuel.js method=renderEndDateSelector repeat=${repeat}`);
  }
}


addNewRepeatMonthy(  // calendar_edit_class  client-side
  // This function is the onClick function for the '+' button on popupform when the 'monthly' repeating option is chosen
  // This adds a new day in the month that the event can repeat on
  // Currently maxing it at 3 dates it can repeat on
) {
  if (3 < this.openMonthDates) return;    // Make sure we are not at maximum amount of dates
  this.openMonthDates++;
  // We need to expand how large the total pop up is to fit the new items
  //const dialog = this.shadow.getElementById("dialog"); 
  //dialog.style.height = `${dialog.clientHeight + 35}px`;
  this.shadow.getElementById("monthly_repeat").innerHTML += 
  `<div><details>
  <summary>
  <select id = "monthlyDaySelect-${this.openMonthDates}">
    <option value="0" selected> Sunday   </option>
    <option value="1">          Monday   </option>
    <option value="2">          Tuesday  </option>
    <option value="3">          Wednesday</option>
    <option value="4">          Thursday </option>
    <option value="5">          Friday   </option>
    <option value="6">          Saturday </option>
    <option value="31">         On Day</option>
  </select>

  <select id = "monthly_week_select-${this.openMonthDates}">
    <option value="1" selected>1st</option>
    <option value="2">2nd</option>
    <option value="3">3rd</option>
    <option value="4">4th</option>
    <option value="5">Last</option>
  </select>

  <select id = "monthly_day_select-${this.openMonthDates}" style="display: none">
  </select>
  Starting From 
   <select id = "direction-${this.openMonthDates}">
      <option value="begining" selected>begining</option>
      <option value="end"           >End</option>
   </details></select>


  <button id="delete">delete</button>
</summary>

<p><b>If want to repeat on the 2nd Tuesday of each month.</b><br>
Select 'Tuesday' in the first box, '2nd' in the sencod box, and 'Begining' in the third box.</p>

<p><b>If want to repeat on the next to last Tuesday of each month.</b><br>
Do the same as above but select 'End' in the third box.  

<p><b>If want to repeat on 5th day of each month.</b><br>
Select 'On Day' in the first box, select '5' in the second box, select 'Begining' in the third box.
</p>

<p><b>If want to repeat on 5 days before the end of each month.</b><br>
Do the same as above but select 'End' in the third box.</p>

<p><b>multiple repeats for the month</b><br>
Set the first repeat as descripted above.  Set the second by pressing the '+' next to the 'Repeats'</p>
</details></div>
`

this.shadow.getElementById("delete"                                 ).addEventListener( 'click' , this.removeMonthlySelector.bind(this) );
this.shadow.getElementById(`monthlyDaySelect-${this.openMonthDates}`).addEventListener( 'change', this.monthly_day_select_change.bind(this) );
}


removeMonthlySelector(  // calendar_edit_class  client-side
  // This function is the onclick for the '-' that appears next to the selectors when user is choosing the monthly repeat option
  // This removes the selector that it is attached to and resizes the pop up window
  element
) {
  element.parentElement.remove();
  this.openMonthDates--;
}

monthly_day_select_change(
  event  // 
){
const element    = event.target;
const parse_name = element.id.split("-");  // parse_name[1] can be used to get 

if (element.value === "31") {
  //monthly selected

  // hide monthly_week_select
  this.shadow.getElementById(`monthly_week_select-${parse_name[1]}`).style.display = "none"  ;  // hide
  this.shadow.getElementById(`monthly_day_select-${parse_name[1]}` ).style.display = "inline";  // show

  // populate with days of month
  let html = "";
  for (let i=1; i<31; i++) {
    html += `<option>${i}</option>`;
  }
  this.shadow.getElementById(`monthly_day_select-${parse_name[1]}`).innerHTML = html;  // add all days of month;
} else {
  // day of week selected
  this.shadow.getElementById(`monthly_week_select-${parse_name[1]}`).style.display = "inline";  // show
  this.shadow.getElementById(`monthly_day_select-${parse_name[1]}` ).style.display = "none"  ;  // hide
}

}

} // calendar_edit_class client-side  -end class