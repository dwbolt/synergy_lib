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
  this.calendar       = cal;      // point to calander object that we are editing.
  this.openMonthDates = 1;        // number of selectors visible when monthly repeating option is chosen
  this.formHeight     = "500px"; 
}


hidden(  // calendarEditClass  client-side
bool  // true -> hide,  false -> show
) {
  document.getElementById(`popUpForm`).hidden = bool;
  if (!bool) {
    document.getElementById("popUpForm").style.height = this.formHeight; 
  }
}


async createNewEvent(  // calendarClass  client-side
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
  this.renderEndDateSelector();

  // set member variables for event year month and day
  this.#year  = year;
  this.#month = month;
  this.#day   = day;
  this.graph   = this.calendar.graph;

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


async editEvent(  // calendarClass  client-side
edgeName  // string
) {
  if (! await app.login.getStatus()) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }
  this.edgeName = edgeName;  // remember of future methods

  // reload popup form
  document.getElementById("popUpForm").innerHTML = await app.proxy.getText("/_lib/UX/calendarEditForm.html");

  // show/hide buttons
  document.getElementById("addEventButton"   ).hidden = true ;     // Hide
  document.getElementById("saveEventButton"  ).hidden = false;     // show ?
  document.getElementById("deleteEventButton").hidden = false;     // show ?

  this.hidden(false    );   // make popup vissible
  this.graph = this.calendar.graph;
  this.data2form(this.edgeName);   // load data
}


async addNewEvent(  // calendarEditClass  client-side
// user click "add" button to save new event on server
) {
  // create new edge
  if (typeof(this.graph.edgeNext) === "undefined") {
    // make sure the value of this.graph.edgeNext is defined
    this.graph.edgeNext = this.get_next_key(this.graph.edges);
  }
  this.graph.edges[this.graph.edgeNext] = {};  // init new edge with empty object
  this.form2data(this.graph.edgeNext++) ;  // move popup form data to edit 
  const msg = await this.processServerRefresh()
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
  this.form2data(this.edgeName); // move popup form data to edit 
await this.processServerRefresh();
}


async processServerRefresh( // calendarEditClass  client-side
) {
  // save new graph
  const resp = await app.proxy.RESTpost(app.format.obj2string(this.graph),this.calendar.url);
  alert(JSON.stringify(resp));   // was it succussful
  location.reload();
  this.windowActive = false;
  return(resp);
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
document.getElementById(`${DOMname}_time`).value = 
`${app.format.padZero(date[3],2)}:${app.format.padZero(date[4],2)}`;  
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
}


end_time_changed(){ // calendarEditClass  client-side
  let d       = this.getDate("start");                        
  const start = new Date(d[0], d[1]-1, d[2], d[3],d[4]);      // get start
      d       = this.getDate("end");
  const end   = new Date(d[0], d[1]-1, d[2], d[3],d[4]);      // get end

  // set duration
  const diff    =  end.getTime()  - start.getTime();
  const hours   =  Math.floor(diff/       (1000*60*60));
  const minutes =  Math.floor((diff-(hours*1000*60*60))/1000*60);
  document.getElementById("duration_hours"  ).value = hours;
  document.getElementById("duration_minutes").value = minutes;
}


data2form(  // calendarEditClass  client-side
// fills in pop up form from the JSON data
edgeName
) {
  // load from edge ------------
  const edge = this.graph.edges[edgeName];
  document.getElementById("name"       ).value = edge.name          
  document.getElementById("url"        ).value = edge.url           
  document.getElementById("description").value = edge.description 

  let d = edge.dateStart;
  document.getElementById("start_date").valueAsDate = new Date(d[0],d[1]-1,d[2]); 
  document.getElementById("start_time").value       = `${app.format.padZero(d[3],2)}:${app.format.padZero(d[4],2)}`;
  
  d = edge.dateEnd;
  document.getElementById("end_date").valueAsDate = new Date(d[0],d[1]-1, d[2]);
  document.getElementById("end_time").value       = `${app.format.padZero(d[3],2)}:${app.format.padZero(d[4],2)}`;

  document.querySelector('#timeZone'      ).value   = edge.timeZone;
 
  // fill in duration of event
  const durTimeData = edge.timeDuration.split(":");
  document.getElementById("duration_hours"  ).value = parseInt(durTimeData[0]);
  document.getElementById("duration_minutes").value = parseInt(durTimeData[1]);

  document.getElementById("repeatType"    ).value = edge.repeat;
  this.renderEndDateSelector();  // hide elements not being used

  // fill in what days the event repeats on
  this.data2form_repeat(edge);
}

data2form_repeat(edge){
  this.putDate("repeat_end",  edge.repeat_end_date );

  switch(edge.repeat) {
  case "never":  break; // nothing todo
  case "weekly": 
    this.set_weekly_days(edge);  // not sure what this does
    break;

  case "monthly":
    document.getElementById("monthlyEndDateSelect").value = edge.dateEnd[1]; // fill in end month selector
    for (let i = 0; i < edge.days.length; i++) {
      if (i > 0) this.addNewRepeatMonthy();
      document.getElementById(`monthlyWeekSelect-${i+1}`).value = edge.days[i][1];
      document.getElementById(`monthlyDaySelect-${i+1}` ).value = edge.days[i][0];
    }
    break;

    default:
      alert(`error in calendarEditClass method="data2form" repeat="${edge.repeat}" `);
  }
  /*
  if (typeof(edge.nR) === "string") {
    // load from node  ----------
    document.getElementById("name"       ).value = this.graph.nodes[edge.nR].text[0][2];
    document.getElementById("eventDescription").value = this.graph.nodes[edge.nR].text[1][2];
  } else {
    // load from edge

  }
*/
}


set_weekly_days(  // calendarEditClass  client-side
  // fills in the selector for what days of the week the event repeats on
  edge
) {
  let r = edge.daysOffset;
  let d = new Date( edge.dateStart[0], edge.dateStart[1]-1, edge.dateStart[2]);
  let dayIndex = d.getDay();
  let daysOfWeek = document.getElementsByClassName("repeatCheckbox");
  for (let i = 0; i < r.length; i++) {
    daysOfWeek[(r[i] + dayIndex) % 7].checked = true;
  }
}


closeForm(  // calendarEditClass  client-side
  // closes pop up window
) {
  this.openMonthDates = 1;
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
  const dateString = document.getElementById(`${DOMname}_date`).value;   // "2023-04-05"
  const date       = dateString.split("-")

  const timeString = document.getElementById(`${DOMname}_time`).value;   // "12:20"
  const time       = timeString.split(":"); 

  return [parseInt(date[0]), parseInt(date[1]) , parseInt(date[2]),parseInt(time[0]), parseInt(time[1]) ];  // array[year, month, day, hours, minutes]
}


form2data( // calendarEditClass  client-side
// moves pop up form to edge for this.graph.edge[edge]
    edge // name of edge we are loading
  )   {
  const g = this.graph.edges[edge];

  g.name        = document.getElementById("name"       ).value;
  g.url         = document.getElementById("url"        ).value;
  g.description = document.getElementById("description").value;

  // date_start with time
  g.dateStart       = this.getDate("start");
  g.dateEnd         = this.getDate("end")  
  g.timeZone        = document.getElementById("timeZone"        ).value;  
  g.timeDuration    = document.getElementById("duration_hours"  ).value +":"+ 
                      document.getElementById("duration_minutes").value;

  g.repeat       = document.getElementById("repeatType"    ).value;  // chosen value of how often to repeat even
  this.form2data_repeat(g);  // handle different cases for types of repeating

  // saving form data to the edge
  /*
  const url            = document.getElementById("url"        ).value;       // url of the event
  g.description        = document.getElementById("description").value;       // will be private if url is give, will be displayed if no url is given
  if (url === "") {
    // create a node
    g.nR = 0;
  } else {
    g.nR = {}
    g.nR.text = document.getElementById("name").value;       // name of the event;
    g.nR.url  = url;
  }
  */
}


form2data_repeat(g){  // calendarEditClass  client-side
  // called by form2date, handle repeating data
  // set repeating enddate

  // handle repeat events
  //g.offset  = [];   // for repeating events and their offset from first day
  //g.days    = [];

  g.repeat_end_date = this.getDate("repeat_end");

  switch(g.repeat) {
  case "weekly":
    // find offset for desired days
    const now           = new Date();
    const dayIndex      = now.getDay();               // 0-> Sunday   1->Monday
    const repeatingDays = this.weeklyRepeatDays();    // returns array of days repeating  [0,2]  would be Sunday Tuesday repeating days
    g.daysOffset =[] ;
    for (let i = 0; i < repeatingDays.length; i++) {
      // walk through the days chosen to repeat on, and find distance between start day and chosen day
      let dif = repeatingDays[i] - dayIndex;
      if (dif < 0) {
        // day should repeat on day that happens before chosen day but only after chosen day
        // ex repeats on monday wednesday friday, but the event starts on wednesday, so first monday is after the first wednesday
        repeatingDays[i] += 7;
        g.daysOffset.push(repeatingDays[i]-dayIndex);
      } else {
        // push the difference between indices into the offset
        g.daysOffset.push(dif);
      }
    }

    if (repeatingDays.length == 0) {
      // if user did not choose days to repeat on, assume that it will repeat on same day every week
      g.daysOffset = [0];
    }
    break;

  case "monthly":
    // event is repeating monthly
    g.offset = [0];
    let endMonth = document.getElementById("monthlyEndDateSelect").value;
    g.dateEnd = [this.getEventYear(), parseInt(endMonth), 1];

    // read input from the drop down boxes
    for (let i = 0; i < this.getNumMonthDates(); i++) {
      if (document.getElementById(`monthlyDaySelect-${i}`)) {
        days.push([document.getElementById(`monthlyDaySelect-${i}`).value,document.getElementById(`monthlyWeekSelect-${i}`).value]);
      }
    }
    g.startDate[2] = 1;
    break;

  case "yearly":
    g.offset = [];
    g.dateEnd = [parseInt(endDate,10), this.month+1, this.day];
    break;

  case "never":
    // was already init for this case
    break;

  default:
    // error
    alert(`error in "calendarEditModule.js" method="repeat" repeat="${g.repeat}"`);
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
    document.getElementById("end_repeat"    ).hidden = false;
    document.getElementById("weekly_repeat" ).hidden = true;
    document.getElementById("monthly_repeat").hidden = false;
    break;

  case "yearly":
  // display only a number when selecting a year
  document.getElementById("end_repeat"    ).hidden        = false;
  document.getElementById("weekly_repeat" ).style.display = 'none';
  document.getElementById("monthly_repeat").style.display = 'none';
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

  // We need to expand how large the total pop up is to fit the new items
  document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight + 35}px`;
  document.getElementById("monthly_repeat").innerHTML += 
  `<div>
  <select>
    <option value="1" selected>1st</option>
    <option value="2">2nd</option>
    <option value="3">3rd</option>
    <option value="4">4th</option>
    <option value="5">Last</option>
  </select>
  <select>
    <option value="0" selected> Sunday   </option>
    <option value="1">          Monday   </option>
    <option value="2">          Tuesday  </option>
    <option value="3">          Wednesday</option>
    <option value="4">          Thursday </option>
    <option value="5">          Friday   </option>
    <option value="6">          Saturday </option>
  </select>
  <a onclick="app.calendar.edit.removeMonthlySelector(this)" class="removeMonthlySelectorButton">-</a>
</div>
`
  this.openMonthDates++;
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