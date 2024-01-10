class calendarEditClass {
// works with calendarClass to add/edit/delete events

// used to remember new event date
#year 
#month
#day

constructor(  // calendarEditClass  client-side
  cal
  ){ 
    // move values in pop up form to graph edge
  this.calendar       = cal;              // point to calander object that we are editing.
  this.openMonthDates = 0;        // number of selectors visible when monthly repeating option is chosen
  this.formHeight     = "500px"; 
}


hidden(  // calendarEditClass  client-side
bool  // true -> hide,  false -> show
) {
  if (bool) {
    document.getElementById(`popUpForm`).style.display = "none";
  } else {
    document.getElementById(`popUpForm`).style.display = "block";
  }
}


async event_create(  // calendarClass  client-side
// user clicked + to add new event on a particular day
 year
,month
,day          //
) {
  // determine if we are on user calendar or
  if (!await app.login.getStatus()) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }

  // reload popup form
  document.getElementById("popUpForm").innerHTML = await app.proxy.getText("/_lib/UX/calendarEditForm.html");
  this.renderEndDateSelector();  // turn on input files for type of repeat (never, weekly, monthly.....)

  // set member variables for event year month and day
  this.#year  = year;
  this.#month = month;
  this.#day   = day;
 // this.graph   = this.calendar.graph;

  // set start date to date clicked on
  document.getElementById("start_date").value = 
    `${this.#year}-${app.format.padZero(this.#month,2)}-${app.format.padZero(this.#day,2)}`

  // set start time to current time
  const currentdate = new Date();
  document.getElementById("start_time").value = `${app.format.padZero(currentdate.getHours(),2)}:00`;

  // set duration to 0 hours and 30 minues
  document.getElementById("duration_hours"  ).value = 0;
  document.getElementById("duration_minutes").value = 30;
  this.duration_changed();
  
  // Set correct buttons to display for creating new event
  document.getElementById("saveEventButton"  ).hidden = true;
  document.getElementById("deleteEventButton").hidden = true;
  document.getElementById("addEventButton"   ).hidden = false;

  // make popup vissible
  this.hidden(false);

}


async event_edit(  // calendarClass  client-side
pk  // string
) {
  if (! await app.login.getStatus()) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }
  this.pk = pk;  // remember of future methods

  // reload popup form
  document.getElementById("popUpForm").innerHTML = await app.proxy.getText("/_lib/UX/calendarEditForm.html");

  // show/hide buttons
  document.getElementById("addEventButton"   ).hidden = true ;     // Hide
  document.getElementById("saveEventButton"  ).hidden = false;     // show ?
  document.getElementById("deleteEventButton").hidden = false;     // show ?

  this.hidden(false    );   // make popup vissible
  //this.graph = this.calendar.graph;
  this.data2form(pk);   // load data
}


async event_add(  // calendarEditClass  client-side
// user click "add" button to save new event on server
) {
  this.pk = undefined;      // create a new pk
  await this.form_save() ;  // move popup form data to edit 
}


get_next_key(  // calendarEditClass  client-side
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


async deleteEvent( // calendarEditClass  client-side
) {
  delete this.graph.edges[this.edgeName];
  //delete this.graph.nodes[editData]; can only delete this if it is an orphan

  await this.processServerRefresh();
}


async save(   // calendarEditClass  client-side
// user clicked edits existing event, and now has clicked saved
) {
  await this.form_save(); // move popup form data to edit 
}


async processServerRefresh( // calendarEditClass  client-side
record
) {
  // save new graph
  this.table  = this.calendar.table_events  // pointer events
  let resp    = await this.table.save(record);

  if (!resp.success) {
    alert(`Error resp="${JSON.stringify(resp)}"`);
  }
  this.windowActive = false;
  location.reload();               // will reload page, need to just reload data and refresh page

}
  

weeklyRepeatDays() {
  // When user hits "add event" or "save"
  // Handles the days of week that the event should repeat on
  // Returns array where each item is an index of day of the week starting at 0
  // ex [0,2,4] is [sunday, tuesday, thursday]
  // grab all checkboxes
  let options = document.getElementsByClassName("repeatCheckbox");
  let rv = [];

  // go through all the checkboxes for the days and push back the index if they are checked
  for (var i = 0; i < options.length; i++) {
    if (options[i].checked == true) {
      rv.push(i);
    }
  }
  return rv;
}


putDate(// calendarEditClass  client-side
   DOMname // where to put date data
  ,date    // [year, month,day,hours, minutes]
){
document.getElementById(`${DOMname}_date`).valueAsDate = new Date(date[0],date[1]-1,date[2]); // "2023-04-05"
 // "12:20"

if (document.getElementById(`${DOMname}_time`)) {
  // will not exist for DOMname "repeat_end"
  document.getElementById(`${DOMname}_time`).value = 
  `${app.format.padZero(date[3],2)}:${app.format.padZero(date[4],2)}`;  
}

}


duration_changed( // calendarEditClass  client-side
  ){
    // get duration
    const hours   = parseInt(document.getElementById(`duration_hours`  ).value);
    const minutes = parseInt(document.getElementById(`duration_minutes`).value);

    // create end date from start + duration
    const s = this.getDate("start"); // [year,month,day,hour,sec]
    const end = new Date(s[0],s[1]-1,s[2], s[3]+hours, s[4]+minutes);

    // update end_date and end_time
    document.getElementById("end_date").valueAsDate = end; 
    document.getElementById("end_time").value       = `${app.format.padZero(end.getHours(),2)}:${app.format.padZero(end.getMinutes(),2)}`;

    // if repeat end is displayed, set time po
}


end_time_changed(){ // calendarEditClass  client-side
  let d       = this.getDate("start");                        
  const start = new Date(d[0], d[1]-1, d[2], d[3],d[4]);      // get start
      d       = this.getDate("end");
  const end   = new Date(d[0], d[1]-1, d[2], d[3],d[4]);      // get end

  // set duration
  const diff    =  end.getTime()  - start.getTime();
  const hours   =  Math.floor(diff/       (1000*60*60));
  const mill    =  diff-(hours*1000*60*60);
  const minutes =  Math.floor(mill/(1000*60));
  document.getElementById("duration_hours"  ).value = hours;
  document.getElementById("duration_minutes").value = minutes;
}


data2form(  // calendarEditClass  client-side
// fills in pop up form from event data
pk
) {
  this.table          = this.calendar.table_events  // pointer events
  const record = this.table.get_object(pk);
  document.getElementById("name"       ).value = (record.name       ? record.name         : "")       
  document.getElementById("url"        ).value = (record.url         ? record.url         : "")       
  document.getElementById("description").value = (record.description ? record.description : "")

  let d = record.dateStart;
  document.getElementById("start_date").valueAsDate = new Date(d[0],d[1]-1,d[2]); 
  document.getElementById("start_time").value       = `${app.format.padZero(d[3],2)}:${app.format.padZero(d[4],2)}`;
  
  d = record.dateEnd;
  document.getElementById("end_date").valueAsDate = new Date(d[0],d[1]-1, d[2]);
  document.getElementById("end_time").value       = `${app.format.padZero(d[3],2)}:${app.format.padZero(d[4],2)}`;

  document.getElementById('timeZone').value       = record.timeZone;
 
  // fill in duration of event
  const durTimeData = record.timeDuration.split(":");
  document.getElementById("duration_hours"  ).value = parseInt(durTimeData[0]);
  document.getElementById("duration_minutes").value = parseInt(durTimeData[1]);

  document.getElementById("repeatType"    ).value = record.repeat;
  document.getElementById("increment"     ).value = record.repeat_details.inc;
  this.renderEndDateSelector();  // hide elements not being used

  // fill in what days the event repeats on
  this.data2form_repeat(record);
}


data2form_repeat(   // calendarEditClass  client-side
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
    while ( this.openMonthDates < record.days.length){
      this.addNewRepeatMonthy();  // create place
    }
    for (let i = 0; i < record.days.length; i++) {
      document.getElementById(`monthlyWeekSelect-${i+1}`).value = record.days[i][1];
      document.getElementById(`monthlyDaySelect-${i+1}` ).value = record.days[i][0];
    }
    break;

  case "yearly":
    break;

  default:
    alert(`error in calendarEditClass method="data2form" repeat="${edge.repeat}" `);
  }

  // set repeat end data, use time from dateEnd
  let r=record.repeat_end;
  document.getElementById('repeat_end_date').value = `${r[0]}-${app.format.padZero(r[1],2)}-${app.format.padZero(r[2],2)}`
}


set_weekly_days(  // calendarEditClass  client-side
  // fills in the selector for what days of the week the event repeats on
  record
) {
  let days = record.repeat_details.days; // arrays of day to repeat, 0->sunday 1-monday..
  let daysOfWeek = document.getElementsByClassName("repeatCheckbox");
  for (let i = 0; i < days.length; i++) {
    daysOfWeek[days[i]].checked = true;
  }
}


closeForm(  // calendarEditClass  client-side
  // closes pop up window
) {
  this.openMonthDates = 0;
  this.hidden(true);
}


validateForm(
    // This function makes sure that all the necessary fields of pop up form are filled in before the user can submit or save data
  ) {
  if (document.getElementById("name").value == "") {
    alert('Name of event not filled in');
    this.setCanSubmit(false);
  }

  if ((document.getElementById("repeatType").value == "monthly" || document.getElementById("repeatType").value == "weekly") && document.getElementById("endDateInput").value == "") {
    alert('End date of event not filled in');
    this.setCanSubmit(false);
  }

  this.setCanSubmit(true);
}
  

getDate(// calendarEditClass  client-side
  DOMname // 
){
  let dateString = document.getElementById(`${DOMname}_date`).value;   // "2023-04-05"
  let date = [];
  if (dateString === "") {
    // date not specified
    date[0] = null;
    date[1] = 12;
    date[2] = 31;
  } else {
    date    = dateString.split("-");
    date[0] = parseInt(date[0]);
    date[1] = parseInt(date[1]);
    date[2] = parseInt(date[2]);
  }

  if (document.getElementById(`${DOMname}_time`)) {
     const timeString = document.getElementById(`${DOMname}_time`).value;   // "12:20"
     const time       = timeString.split(":"); 
     date[3] = parseInt(time[0]);
     date[4] = parseInt(time[1]);  
  } else {
    date[3] = 0;
    date[4] = 0;
  }

  return [date[0], date[1] , date[2], date[3], date[4]];  // array[year, month, day, hours, minutes]
}


async form_save( // calendarEditClass  client-side
/// moves pop up form to edge for this.graph.edge[edge]
 //   edge // name of edge we are loading
  )   {
  const record = {};
  
  record.pk          = (this.pk ? this.pk.toString() : undefined);
  record.name        = document.getElementById("name"       ).value;
  record.url         = document.getElementById("url"        ).value;
  record.description = document.getElementById("description").value;
  record.dateStart   = this.getDate("start");
  record.dateEnd     = this.getDate("end"  );
  record.timeZone    = document.getElementById("timeZone"        ).value;  

  record.timeDuration = document.getElementById("duration_hours"  ).value +":"+ 
                      document.getElementById("duration_minutes").value;

  record.repeat     = document.getElementById("repeatType"    ).value;  // chosen value of how often to repeat even
  this.form2data_repeat(record);  // handle different cases for types of repeating
  await this.processServerRefresh(record);
}


form2data_repeat(g){  // calendarEditClass  client-side
  // called by form2date, handle repeating data
  if (g.repeat !== "never"){
    // only need this attrebute for repeading data
    g.repeat_end = this.getDate("repeat_end");
  }

  switch(g.repeat) {
  case "weekly":
    // find offset for desired days
    g.repeat_details = {"inc":1, "days" : this.weeklyRepeatDays()};    // returns array of days repeating  [0,2]  would be Sunday Tuesday repeating days
    break;

  case "monthly":
    // event is repeating monthly
    g.days = [];
    // read input from the drop down boxes
    for (let i = 1; i <= this.openMonthDates; i++) {
        g.days.push([parseInt(document.getElementById(`monthlyDaySelect-${i}` ).value),
                     parseInt(document.getElementById(`monthlyWeekSelect-${i}`).value)]);
    }
    //g.startDate[2] = 1;
    break;

  case "yearly":
    break;

  case "never":
    // was already init for this case
    break;

  default:
    // error
    alert(`error in "calendarEdit_module.js" method="repeat" repeat="${g.repeat}"`);
  }
}


renderEndDateSelector(  // calendarEditClass  client-side
  // renders the end date selector based on chosen selected value from the repeat selector in pop up form
  ) {
  let repeat = document.getElementById("repeatType").value;
  switch( repeat ) {
  case "never":
    document.getElementById("end_repeat"    ).hidden = true;
    document.getElementById("weekly_repeat" ).hidden = true;
    document.getElementById("monthly_repeat").hidden = true;
    break;

  case "weekly":
    document.getElementById("end_repeat"    ).hidden = false;
    document.getElementById("weekly_repeat" ).hidden = false;
    document.getElementById("monthly_repeat").hidden = true;
    break;
    
  case "monthly":
    if (this.openMonthDates === 0) {
      // no places to select day or week, so add one
      this.addNewRepeatMonthy();
    }
    document.getElementById("end_repeat"    ).hidden = false;
    document.getElementById("weekly_repeat" ).hidden = true;
    document.getElementById("monthly_repeat").hidden = false;
    break;

  case "yearly":
    // display only a number when selecting a year
    document.getElementById("end_repeat"    ).hidden = false;
    document.getElementById("weekly_repeat" ).hidden = true;
    document.getElementById("monthly_repeat").hidden = true;
    break;

  default:
    // error
    alert(`error case not handeled in calendarEditModuel.js method=renderEndDateSelector repeat=${repeat}`);
  }
}


addNewRepeatMonthy(  // calendarEditClass  client-side
  // This function is the onClick function for the '+' button on popupform when the 'monthly' repeating option is chosen
  // This adds a new day in the month that the event can repeat on
  // Currently maxing it at 3 dates it can repeat on
) {
  if (3 < this.openMonthDates) return;    // Make sure we are not at maximum amount of dates
  this.openMonthDates++;
  // We need to expand how large the total pop up is to fit the new items
  document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight + 35}px`;
  document.getElementById("monthly_repeat").innerHTML += 
  `<div>
  <select id = "monthlyWeekSelect-${this.openMonthDates}">
    <option value="1" selected>1st</option>
    <option value="2">2nd</option>
    <option value="3">3rd</option>
    <option value="4">4th</option>
    <option value="5">Last</option>
  </select>
  <select id = "monthlyDaySelect-${this.openMonthDates}">
    <option value="0" selected> Sunday   </option>
    <option value="1">          Monday   </option>
    <option value="2">          Tuesday  </option>
    <option value="3">          Wednesday</option>
    <option value="4">          Thursday </option>
    <option value="5">          Friday   </option>
    <option value="6">          Saturday </option>
  </select>
  <a onclick="app.page.edit.removeMonthlySelector(this)" class="removeMonthlySelectorButton">-</a>
</div>
`
}


removeMonthlySelector(  // calendarEditClass  client-side
  // This function is the onclick for the '-' that appears next to the selectors when user is choosing the monthly repeat option
  // This removes the selector that it is attached to and resizes the pop up window
  element
) {
  element.parentElement.remove();
  document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight - 35}px`;
  this.openMonthDates--;
}

} // calendarEditClass client-side  -end class

export {calendarEditClass} 