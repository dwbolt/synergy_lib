class calendarEditClass {

/*
  

*/

constructor(){ // calendarEditClass  client-side

}

  

async addNewEvent(  // calendarClass  client-side
// user click + to add a new event and now has click "add" button to save new event on server
) {

// move values in pop up form to graph edge
const edge = this.graph.edges[this.graph.edgeNext] = {};  // create new edge
edge.nR    = this.graph.nodeNext.toString();
this.loadEventEdge(this.graph.edgeNext);

const node = this.graph.nodes[this.graph.nodeNext] = {};  // create new node

// Changed node text to JSON style string
node.text  = [
  ["h3","",JSON.stringify(`${document.getElementById("eventName"       ).value}`)]
  ,["p" ,"",JSON.stringify(`${document.getElementById("eventDescription"       ).value}`)]
];

this.graph.edgeNext += 1;
this.graph.nodeNext += 1;

await this.processServerRefresh();  // save the updated calendar
}


async deleteEvent( // calendarClass  client-side
) {
  delete this.graph.edges[this.getEventEdge()];
  //delete this.graph.nodes[editData]; can only delete this if it is an orphan

  await this.processServerRefresh();
}

  

async save(   // calendarClass  client-side
// user clicked edits existing event, and now has clicked saved
) {
this.loadEventEdge(this.getEventEdge());

const edge      = this.graph.edges[this.getEventEdge()];
const node      = this.graph.nodes[edge.nR]
node.text[0][2] = document.getElementById("eventName"       ).value;
node.text[1][2] = document.getElementById("eventDescription").value;

await this.processServerRefresh();
}


async processServerRefresh( // calendarClass  client-side
) {
  // save new graph
  //const resp = await this.proxy.RESTpost(this.graph,this.url);
  const resp = await this.proxy.RESTpost(this.format.obj2string(this.graph),this.url);
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


fillFormFromData(  // calendarClass  client-side
// fills in pop up form from the JSON data
edgeName
) {
// load from edge ------------
const edge = this.graph.edges[edgeName];
const dateStart = edge.dateStart;
document.getElementById("eventStartDate").value =
     `${dateStart[0]}-${this.format.padZero(dateStart[1],2)}-${this.format.padZero(dateStart[2],2)}`
document.getElementById("eventStartTime").value = `${this.format.padZero(dateStart[3],2)}:${this.format.padZero(dateStart[4],2)}`;

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
document.getElementById("eventName"       ).value     = this.graph.nodes[edge.nR].text[0][2];
document.getElementById("eventDescription").value = this.graph.nodes[edge.nR].text[1][2];
}


closeForm(  // calendarEditClass  client-side
  // closes pop up window
) {

  // ensure all monthly repeat selectors are deleted
  // so that when it is reopened there is no overlap
  document.getElementById("popUpForm").style.height = this.getFormHeight();  // ensure pop up form has original height
  let monthlySelectors = document.getElementsByClassName("monthlyRepeatInput");
  for (let i = monthlySelectors.length; i > 1; i--) {
    document.getElementById(`monthlyRepeatInput-${i}`).remove();
  }
  this.setOpenMonthDates(1);

  this.popUpFormVisible(false);
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
  
loadEventEdge( // calendarClass  client-side
// moves pop up form to edge for this.graph.edge[edge]
    edge // name of edge we are loading
  )   {
    // move data from form to variables
    const url           = document.getElementById("eventURL").value;         // url of the event
    const name           = document.getElementById("eventName").value;       // name of the event
  
  
    let   durationHour   = document.getElementById("durationHour"  ).value;  // hours portion how the duration
    let   durationMinute = document.getElementById("durationMinute").value;  // minutes portion of the duration
    const repeat         = document.getElementById("repeatType"    ).value;  // chosen value of how often to repeat event
  
    let year  = this.getEventYear();
    let month = this.getEventMonth();
    let day   = this.getEventDay();
  
    let endDate     = "";
    let doesRepeat  = false
    if (document.getElementById("endDateInput")) {
      endDate    = document.getElementById("endDateInput").value;
      doesRepeat = true;
    }
  
    const startTime  = document.getElementById("eventStartTime").value;  // the start time of the event
    let startHour   = startTime.split(":");
    // while (startHour[0][0] == "0") {
    //   startHour[0] = startHour[0].substring(1);
    // }
  
    // parse year month day from end date
    let endDateInfo  = endDate.split("-");
    let startHourNum = parseInt(startHour[0],10);
    let startHourMin = parseInt(startHour[1],10);
  
    // init duration
    if (durationMinute.length < 2                ) {durationMinute = "0" + durationMinute;}
    if (durationHour == "0" || durationHour == "") {durationHour = "1";}
  
    let startDate = [year, month+1, day, startHourNum,startHourMin];
  
    // handle repeat events
    let offset         = [];   // for repeating events and their offset from first day
    let days           = [];
    let dateEnd;
  
    // handle different cases for types of repeating
    if (repeat == "weekly") {
      // repeats weekly
      // find offset for desired days
      let d = new Date(year,month,day);
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
        dateEnd = [year,month+1,day+7];
      }
    } else if (repeat == "monthly") {
      // event is repeating monthly
      offset = [0];
      // dateEnd = [parseInt(endDateInfo[0],10),parseInt(endDateInfo[1],10),parseInt(endDateInfo[2],10)];
      let endMonth = document.getElementById("monthlyEndDateSelect").value;
      dateEnd = [this.getEventYear(), parseInt(endMonth), 1];
  
      // read input from the drop down boxes
      for (let i = 0; i < this.getNumMonthDates(); i++) {
        if (document.getElementById(`monthlyDaySelect-${i}`)) {
          days.push([document.getElementById(`monthlyDaySelect-${i}`).value,document.getElementById(`monthlyWeekSelect-${i}`).value]);
        }
      }
      startDate[2] = 1;
    } else if (repeat == "yearly") {
      offset = [];
      dateEnd = [parseInt(endDate,10),month+1,day];
    } else if (repeat == "never") {
      offset = [];
      dateEnd = [year,month+1,day];
    }
  
    // saving form data to the edge
    let g = this.graph.edges[edge];
    if (url == "") {
      g.dateStart    = startDate;
      g.dateEnd      = dateEnd;
  
      let e          = document.getElementById("timeZone");
      g.timeZone     = e.options[e.selectedIndex].value;
      g.days         = days;
      g.timeDuration = `${durationHour}:${durationMinute}`;
      g.repeat       = repeat;
      g.daysOffset   = offset;
    } else {
      let nR = {};
      nR.text = name;
      nR.url = url;
      g.nR = nR;
      g.dateStart    = startDate;
      g.dateEnd      = dateEnd;
  
      let e          = document.getElementById("timeZone");
      g.timeZone     = e.options[e.selectedIndex].value;
      g.days         = days;
      g.timeDuration = `${durationHour}:${durationMinute}`;
      g.repeat       = repeat;
      g.daysOffset   = offset;
    }
  }

  
    
  
  createBlankForm(  // calendarClass  client-side
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
    let date = new Date(this.getEventYear(),this.getEventMonth(),this.getEventDay());
    document.getElementById('eventStartDate').value = date.toISOString().substring(0,10);
  
    // load time with current time
    date = new Date();
    document.getElementById('eventStartTime').value = date.toISOString().substring(11,16);
  
    // set default time zone
    let timezone = new Date(0).getTimezoneOffset(); // find timezone offset from GMT
    let keys = Object.keys(this.timezones); // create array of the keys which are the timezones we account for
    keys.forEach((key, index) => { // walk through array of timezones and if it matches then we set the default value to it
      if (this.timezones[key] === -timezone) {
        document.getElementById("timeZone").value = key;
      }
    });
  
    // ensure pop up form has original height
    document.getElementById("popUpForm").style.height = this.getFormHeight();
  
    // Ensure no monthly date selectors are open
    let monthlySelectors = document.getElementsByClassName("monthlyRepeatInput");
    for (let i = monthlySelectors.length; i > 1; i--) {
      document.getElementById(`monthlyRepeatInput-${i}`).remove();
    }
    this.setOpenMonthDates(1);
    document.getElementById("monthlyEndDateSelect").value = this.getEventMonth()+2; // default the month the event will end on to the month after the one selected
  
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
    let d = this.findDayInMonth(
      new Date(
         this.getEventYear()
        ,this.getEventMonth()
        ,this.getEventDay()
      )
    );
    document.getElementById("monthlyWeekSelect-1").value = `${d[1]}`;
    document.getElementById("monthlyDaySelect-1").selectedIndex = d[0];
  
    // set default yearly repeating
    document.getElementById("yearlyEndDateInput").value = `${this.year + 1}`;
  
    // set default duration to one hour
    document.getElementById("durationHour"  ).value = 1;
    document.getElementById("durationMinute").value = 0;
  }


  renderEndDateSelector(  // calendarClass  client-side
  // renders the end date selector based on chosen selected value from the repeat selector in pop up form
  ) {
    let repeatSelector = document.getElementById("repeatType");
  
    if (repeatSelector.value == "never") {
      // do not display any selector when event does not repeat
      document.getElementById("yearlyEndDate"         ).style.display = 'none';
      document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'none';
      document.getElementById("monthlyEndDate"        ).style.display = 'none';
      document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
  
    } else if (repeatSelector.value == "yearly") {
      // display only a number when selecting a year
      document.getElementById("yearlyEndDate"         ).style.display = 'inline';
      document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'none';
      document.getElementById("monthlyEndDate"        ).style.display = 'none';
      document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
  
    } else if (repeatSelector.value == "weekly") {
      // weekly option is selected so we should display selector for end date
      // add options for what days to repeat on every week
      document.getElementById("yearlyEndDate"         ).style.display = 'none';
      document.getElementById("monthlyEndDate"        ).style.display = 'none';
      document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'inline';
      document.getElementById("daysOfWeekSelector"    ).style.display = 'inline';
  
    } else if (repeatSelector.value == "monthly") {
      // monthly option is chosen to repeat
      document.getElementById("yearlyEndDate"         ).style.display = 'none';
      document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'none';
      document.getElementById("monthlyEndDate"        ).style.display = 'flex';
      document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
  
    }
  }

  addNewRepeatMonthy(  // calendarClass  client-side
    // This function is the onClick function for the '+' button on popupform when the 'monthly' repeating option is chosen
    // This adds a new day in the month that the event can repeat on
    // Currently maxing it at 3 dates it can repeat on
  ) {
    // Make sure we are not at maximum amount of dates
    if (this.getOpenMonthDates() <= 3){
      // We need to expand how large the total pop up is to fit the new items
      document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight + 35}px`;
  
      // Append new selector to repeat on
      // document.getElementById(`monthlyRepeatInput-${this.getOpenMonthDates()+1}`).style.display = "block";
      let weekValues = [
         '1st'
        ,'2nd'
        ,'3rd'
        ,'4th'
        ,'5th'
      ];
      let dayValues = [
         'Sunday'
        ,'Monday'
        ,'Tuesday'
        ,'Wednesday'
        ,'Thursday'
        ,'Friday'
        ,'Saturday'
      ];
  
      let fragment = document.createDocumentFragment();
      let container = document.createElement('div');
      container.className = "monthlyRepeatInput";
      container.id = `monthlyRepeatInput-${this.getOpenMonthDates()+1}`;
      let label = document.createElement('a');
      label.textContent = `${this.getOpenMonthDates()+1}`;
      let weekSelector = document.createElement('select');
      for (let i = 0; i < weekValues.length; i++) { // walk through week array and create option tags for the weekSelector select tag and insert it
        let option = document.createElement('option');
        option.value = `${i+1}`;
        option.innerText = weekValues[i];
        weekSelector.appendChild(option);
      }
      weekSelector.id = `monthlyWeekSelect-${this.getOpenMonthDates()+1}`;
      let daySelector = document.createElement('select');
      for (let i = 0; i < dayValues.length; i++) { // walk through array of days of week and fill daySelector with them
        let option = document.createElement('option');
        option.value = `${i}`;
        option.innerText = dayValues[i];
        daySelector.appendChild(option);
      }
      daySelector.id = `monthlyDaySelect-${this.getOpenMonthDates()+1}`;
      let removeButton = document.createElement('a');
      removeButton.setAttribute('onclick', `${this.#appRef}.removeMonthlySelector(${this.getOpenMonthDates()+1})`)
      removeButton.className = 'removeMonthlySelectorButton';
      removeButton.innerText = '-';
      container.appendChild(label);
      container.appendChild(weekSelector);
      container.appendChild(daySelector);
      container.appendChild(removeButton);
      fragment.appendChild(container);
  
      document.getElementById("monthlyEndDate").appendChild(fragment);
  
      this.setOpenMonthDates(this.getOpenMonthDates()+1);
    } else {
      console.log("Maximum amount of dates");
    }
    console.log(this.getOpenMonthDates());
  }

  
  removeMonthlySelector(  // calendarClass  client-side
    // This function is the onclick for the '-' that appears next to the selectors when user is choosing the monthly repeat option
    // This removes the selector that it is attached to and resizes the pop up window
    index
  ) {
    // document.getElementById(`monthlyRepeatInput-${index}`).style.display = "none";
    document.getElementById(`monthlyRepeatInput-${index}`).remove();
    document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight - 35}px`;
    this.setOpenMonthDates(this.getOpenMonthDates() - 1);
    console.log(this.getOpenMonthDates());
  }

} // calendarEditClass client-side  -end class