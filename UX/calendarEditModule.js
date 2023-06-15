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
  this.formHeight     = "680px";  // not sure why this is needed
  this.openMonthDates = 1;        // number of selectors visible when monthly repeating option is chosen
}


hidden(  // calendarEditClass  client-side
bool  // true -> hide,  false -> show
) {
  document.getElementById(`popUpForm`).hidden = bool;
  //document.getElementById(`popUpForm`).style.display = bool ? 'block' : 'none';
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

  // set member variables for event year month and day
  this.#year  = year;
  this.#month = month;
  this.#day   = day;
  this.graph   = this.calendar.graph;

  // Set correct buttons to display for creating new event
  document.getElementById("saveEventButton"  ).style.display  = "none";
  document.getElementById("deleteEventButton").style.display  = "none";;
  document.getElementById("addEventButton"   ).style.display  = "inline-block";

  // make popup vissible
  this.hidden(false);

  // make form blank
  this.createBlankForm();
}


async editEvent(  // calendarClass  client-side
edgeName  // string
) {
  if (! await app.login.getStatus()) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }

  // save for other methods
  this.setEventDay(   this.graph.edges[edgeName].dateStart[2]     );
  this.setEventMonth( this.graph.edges[edgeName].dateStart[1]-1     );
  this.setEventYear(  this.graph.edges[edgeName].dateStart[0]     );
  this.setEventEdge(  edgeName                                    );
  console.log(this.eventDay);
  console.log(this.eventMonth);
  console.log(this.eventYear);


  // show/hide buttons
  this.graph          = this.calendar.graph;
  document.getElementById("addEventButton"   ).style.display = "none";             // Hide
  document.getElementById("saveEventButton"  ).style.display = "inline-block";     // show ?
  document.getElementById("deleteEventButton").style.display = "inline-block";     // show ?

  this.hide(false    );   // make popup vissible
  this.fillFormFromData(edgeName);   // load data
}


async addNewEvent(  // calendarEditClass  client-side
// user click "add" button to save new event on server
) {
  // create new edge
  this.edgekey                   = this.get_next_key(this.graph.edges);
  this.graph.edges[this.edgekey] = {};  // init new edge with empty object
  this.loadEventEdge(this.edgekey);

  await this.processServerRefresh();  // save the updated calendar
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
  delete this.graph.edges[this.getEventEdge()];
  //delete this.graph.nodes[editData]; can only delete this if it is an orphan

  await this.processServerRefresh();
}


async save(   // calendarEditClass  client-side
// user clicked edits existing event, and now has clicked saved
) {
  this.loadEventEdge(this.getEventEdge());

  const edge      = this.graph.edges[this.getEventEdge()];
  const node      = this.graph.nodes[edge.nR]
  node.text[0][2] = document.getElementById("eventName"       ).value;
  node.text[1][2] = document.getElementById("eventDescription").value;

await this.processServerRefresh();
}


async processServerRefresh( // calendarEditClass  client-side
) {
  // save new graph
  const resp = await app.proxy.RESTpost(this.graph,this.calendar.url);
 // const resp = await app.proxy.RESTpost(app.format.obj2string(this.graph),this.calendar.url);
  alert(JSON.stringify(resp));   // was it succussful
  location.reload();
  this.windowActive = false;
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


fillFormFromData(  // calendarEditClass  client-side
// fills in pop up form from the JSON data
edgeName
) {
  // load from edge ------------
  const edge = this.graph.edges[edgeName];
  const dateStart = edge.dateStart;
  document.getElementById("eventStartDate").value =
      `${dateStart[0]}-${app.format.padZero(dateStart[1],2)}-${app.format.padZero(dateStart[2],2)}`
  document.getElementById("eventStartTime").value = `${app.format.padZero(dateStart[3],2)}:${app.format.padZero(dateStart[4],2)}`;

  document.getElementById("repeatType"    ).value = edge.repeat;

  document.querySelector('#timeZone').value = edge.timeZone;

  // fill in duration of event
  const durTimeData = edge.timeDuration.split(":");
  document.getElementById("durationHour"  ).value = parseInt(durTimeData[0]);
  document.getElementById("durationMinute").value = parseInt(durTimeData[1]);

  // fill in end date of event
  this.renderEndDateSelector();
  document.getElementById("endDateInput").valueAsDate = new Date(
      edge.dateEnd[0]
      ,edge.dateEnd[1]-1
      ,edge.dateEnd[2]
    );

  // fill in what days the event repeats on
  this.fillRepeatdays();

  // fill in days monthly events repeat on
  if (edge.repeat == "monthly") {
    document.getElementById("monthlyEndDateSelect").value = edge.dateEnd[1]; // fill in end month selector
    for (let i = 0; i < edge.days.length; i++) {
      if (i > 0) this.addNewRepeatMonthy();
      document.getElementById(`monthlyWeekSelect-${i+1}`).value = edge.days[i][1];
      document.getElementById(`monthlyDaySelect-${i+1}` ).value = edge.days[i][0];
    }
  }

  // load from node  ----------
  document.getElementById("eventName"       ).value = this.graph.nodes[edge.nR].text[0][2];
  document.getElementById("eventDescription").value = this.graph.nodes[edge.nR].text[1][2];
}


closeForm(  // calendarEditClass  client-side
  // closes pop up window
) {

  // ensure all monthly repeat selectors are deleted
  // so that when it is reopened there is no overlap
  document.getElementById("popUpForm").style.height = this.formHeight;  // ensure pop up form has original height
  let monthlySelectors = document.getElementsByClassName("monthlyRepeatInput");
  for (let i = monthlySelectors.length; i > 1; i--) {
    document.getElementById(`monthlyRepeatInput-${i}`).remove();
  }
  this.openMonthDates = 1;

  this.hidden(true);
}


validateForm(
    // This function makes sure that all the necessary fields of pop up form are filled in before the user can submit or save data
  ) {
  if (document.getElementById("eventName").value == "") {
    alert('Name of event not filled in');
    this.setCanSubmit(false);
    console.log("name");
  }

  if ((document.getElementById("repeatType").value == "monthly" || document.getElementById("repeatType").value == "weekly") && document.getElementById("endDateInput").value == "") {
    alert('End date of event not filled in');
    this.setCanSubmit(false);
    console.log("date");
  }

  this.setCanSubmit(true);
}
  

loadEventEdge( // calendarEditClass  client-side
// moves pop up form to edge for this.graph.edge[edge]
    edge // name of edge we are loading
  )   {
  const g = this.graph.edges[edge];

  // move data from form to variables
  g.text = document.getElementById("eventName"       ).value;       // name of the event

  // start
  const eventStartDateS = document.getElementById("eventStartDate").value;   // "2023-04-05"
  const eventStartDate  = eventStartDateS.split("-");                        // ["2023","04","05"]
  const startTimeS      = document.getElementById("eventStartTime").value;   // "12:20"
  const startTime       = startTimeS.split(":");                             // ["12","20"]

  g.dateStart    = [parseInt(eventStartDate[0]), parseInt(eventStartDate[1]) , parseInt(eventStartDate[2]), parseInt(startTime[0]), parseInt(startTime[1]) ];
  g.dateEnd      = [g.dateStart[0]             , g.dateStart[1]              , g.dateStart[2] ];   // assume no repeat
  g.timeZone     = document.getElementById("timeZone"    ).value;  
  g.timeDuration = document.getElementById("durationHour").value +":"+ document.getElementById("durationMinute").value;

  g.repeat       = document.getElementById("repeatType"    ).value;  // chosen value of how often to repeat even
  this.repeat(g);  // handle different cases for types of repeating

  // saving form data to the edge
  const url            = document.getElementById("eventURL"        ).value;       // url of the event
  const description    = document.getElementById("eventDescription").value;       // will be private if url is give, will be displayed if no url is given
  if (url == "") {
    // create a node
  } else {
    let nR = {};
    //nR.text = name;
    nR.url = url;
    g.nR = nR;
    g.days         = days;
    g.daysOffset   = offset;
  }
}


repeat(g){  // calendarEditClass  client-side
  // set repeating enddate
  /*
  let endDate     = "";
  let doesRepeat  = false
  if (document.getElementById("endDateInput")) {
    endDate    = document.getElementById("endDateInput").value;
    doesRepeat = true;
  }
  */

  // handle repeat events
  g.offset  = [];   // for repeating events and their offset from first day
  g.days    = [];

  switch(g.repeat) {
  case "weekly":
    // code block
          // repeats weekly
    // find offset for desired days
    let d = new Date(this.year, this.month, this.day);
    let dayIndex = d.getDay();
    let repeatingDays = this.weeklyRepeatDays();
    for (let i = 0; i < repeatingDays.length; i++) {
      // walk through the days chosen to repeat on, and find distance between start day and chosen day
      let dif = repeatingDays[i] - dayIndex;
      if (dif < 0) {
        // day should repeat on day that happens before chosen day but only after chosen day
        // ex repeats on monday wednesday friday, but the event starts on wednesday, so first monday is after the first wednesday
        repeatingDays[i] += 7;
        offset.push(repeatingDays[i]-dayIndex);
      } else {
        // push the difference between indices into the offset
        offset.push(dif);
      }
    }
    if (repeatingDays.length == 0) {
      // if user did not choose days to repeat on, assume that it will repeat on same day every week
      offset = [0];
    }
    dateEnd = [parseInt(endDateInfo[0],10),parseInt(endDateInfo[1],10),parseInt(endDateInfo[2],10)];
    if (!document.getElementById("endDateInput").value) {
      // if end date field is left empty, then assume event ends one week after start
      dateEnd = [this.year, this.month+1, this.day+7];
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
  }
}

  
createBlankForm(  // calendarEditClass  client-side
  // sets all input fields in pop up form to be default
  ) {
  // fill in all selector values
  // empty name field
  document.getElementById("eventName").value = "";

  // empty URL field
  document.getElementById("eventURL").value = "";

  // empty description field
  document.getElementById("eventDescription").innerText = "";

  // set start date to the chosen day they clicked on
  let date = new Date(this.#year, this.#month, this.#day);
  document.getElementById('eventStartDate').value = date.toISOString().substring(0,10);

  // load time with current time
  date = new Date();
  document.getElementById('eventStartTime').value = date.toISOString().substring(11,16);

  // set default time zone
  let timezone = new Date(0).getTimezoneOffset(); // find timezone offset from GMT
  let keys = Object.keys(this.calendar.timezones); // create array of the keys which are the timezones we account for
  keys.forEach((key, index) => { // walk through array of timezones and if it matches then we set the default value to it
    if (this.calendar.timezones[key] === -timezone) {
      document.getElementById("timeZone").value = key;
    }
  });

  // ensure pop up form has original height
  document.getElementById("popUpForm").style.height = this.formHeight;

  // Ensure no monthly date selectors are open
  let monthlySelectors = document.getElementsByClassName("monthlyRepeatInput");
  for (let i = monthlySelectors.length; i > 1; i--) {
    document.getElementById(`monthlyRepeatInput-${i}`).remove();
  }
  this.openMonthDates = 1;
  //document.getElementById("monthlyEndDateSelect").value = this.getEventMonth()+2; // default the month the event will end on to the month after the one selected

  // Defaults event repeat type to 'never' repeating
  document.getElementById("repeatType").value = "never"; // default repeat to 'never'
  this.renderEndDateSelector(); // render details for type of repeating

  // set default for weekly repeating
  for (let i = 0; i < document.getElementsByClassName("repeatCheckbox").length; i++) {
    // clear the checkboxes for weekly repeating events
    document.getElementsByClassName("repeatCheckbox")[i].checked = false;
  }

  // set default monthly repeating
  // ex -- 4th wednesday
  let d = this.calendar.findDayInMonth( new Date( this.year, this.month, this.day));
  document.getElementById("monthlyWeekSelect-1").value = `${d[1]}`;
  document.getElementById("monthlyDaySelect-1").selectedIndex = d[0];

  // set default yearly repeating
  document.getElementById("yearlyEndDateInput").value = `${this.year + 1}`;

  // set default duration to one hour
  document.getElementById("durationHour"  ).value = 1;
  document.getElementById("durationMinute").value = 0;
}


renderEndDateSelector(  // calendarEditClass  client-side
  // renders the end date selector based on chosen selected value from the repeat selector in pop up form
  ) {
  let repeatSelector = document.getElementById("repeatType");
  switch(epeatSelector.value ) {
  case "never":
    document.getElementById("yearlyEndDate"         ).style.display = 'none';
    document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'none';
    document.getElementById("monthlyEndDate"        ).style.display = 'none';
    document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
    break;

  case "yearly":
    // display only a number when selecting a year
    document.getElementById("yearlyEndDate"         ).style.display = 'inline';
    document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'none';
    document.getElementById("monthlyEndDate"        ).style.display = 'none';
    document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
    break;

  case "weekly":
    // weekly option is selected so we should display selector for end date
    // add options for what days to repeat on every week
    document.getElementById("yearlyEndDate"         ).style.display = 'none';
    document.getElementById("monthlyEndDate"        ).style.display = 'none';
    document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'inline';
    document.getElementById("daysOfWeekSelector"    ).style.display = 'inline';
    break;

  case "monthly":
    document.getElementById("yearlyEndDate"         ).style.display = 'none';
    document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'none';
    document.getElementById("monthlyEndDate"        ).style.display = 'flex';
    document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
    break;
  }
}

addNewRepeatMonthy(  // calendarEditClass  client-side
    // This function is the onClick function for the '+' button on popupform when the 'monthly' repeating option is chosen
    // This adds a new day in the month that the event can repeat on
    // Currently maxing it at 3 dates it can repeat on
  ) {
  // Make sure we are not at maximum amount of dates
  if (this.openMonthDates <= 3){
    // We need to expand how large the total pop up is to fit the new items
    document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight + 35}px`;

    // Append new selector to repeat on
    // document.getElementById(`monthlyRepeatInput-${this.openMonthDates+1}`).style.display = "block";
    let weekValues = ['1st','2nd','3rd','4th','5th'];
    let dayValues = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    let fragment = document.createDocumentFragment();
    let container = document.createElement('div');
    container.className = "monthlyRepeatInput";
    container.id = `monthlyRepeatInput-${this.openMonthDates+1}`;
    let label = document.createElement('a');
    label.textContent = `${this.openMonthDates+1}`;
    let weekSelector = document.createElement('select');
    for (let i = 0; i < weekValues.length; i++) { // walk through week array and create option tags for the weekSelector select tag and insert it
      let option = document.createElement('option');
      option.value = `${i+1}`;
      option.innerText = weekValues[i];
      weekSelector.appendChild(option);
    }
    weekSelector.id = `monthlyWeekSelect-${this.openMonthDates+1}`;
    let daySelector = document.createElement('select');
    for (let i = 0; i < dayValues.length; i++) { // walk through array of days of week and fill daySelector with them
      let option = document.createElement('option');
      option.value = `${i}`;
      option.innerText = dayValues[i];
      daySelector.appendChild(option);
    }
    daySelector.id = `monthlyDaySelect-${this.openMonthDates+1}`;
    let removeButton = document.createElement('a');
    // removeButton.setAttribute('onclick', `${this.#appRef}.removeMonthlySelector(${this.openMonthDates+1})`)
    alert("calendarEditModule.js method=addNewRepeatMonthy  review code, commened out line above")
    removeButton.className = 'removeMonthlySelectorButton';
    removeButton.innerText = '-';
    container.appendChild(label);
    container.appendChild(weekSelector);
    container.appendChild(daySelector);
    container.appendChild(removeButton);
    fragment.appendChild(container);

    document.getElementById("monthlyEndDate").appendChild(fragment);

    this.openMonthDates++;
  } 
}


removeMonthlySelector(  // calendarEditClass  client-side
  // This function is the onclick for the '-' that appears next to the selectors when user is choosing the monthly repeat option
  // This removes the selector that it is attached to and resizes the pop up window
  index
) {
  // document.getElementById(`monthlyRepeatInput-${index}`).style.display = "none";
  document.getElementById(`monthlyRepeatInput-${index}`).remove();
  document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight - 35}px`;
  this.openMonthDates--;
  console.log(this.openMonthDates);
}

} // calendarEditClass client-side  -end class

export {calendarEditClass} 