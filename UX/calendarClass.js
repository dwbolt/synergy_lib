class calendarClass {
/*
 Calendar data is stored in a graph. Each graph has stores one year.  Edges hold dates and time and time zone.  Edges also hold if repeating information.  IE  weekly, monthly or yearly.

High level methods are:

//////////////////////////////// display methods
main() is the starting point
loadevents() loads the graph data and creates startGMT and endGMT attributes, and adds to this.events[mm][dd]
buildTable() converts data from this.events[mm][dd] to table <this.db.getTable("weekCal")> for display in the weekly fromat
addEvents()  creates all the repeating and non repeating events from the edge data.
  addWeekly(
  addMonthly(
  addOneOf(
display()    dislays the several weeks of the calendar or and events
displayRow()   converts node to html for displayed
displayEvent()  // user has clicked on a clalender event, show the details of the

createDate(    // crates starting or endingdate for an event edge
updatePictures(list)    // walk through each row and display the next picture
HTMLforNode(  //
 A users will see the events in their timezone.
 This may not only change the time but also the day, month or year for the viewer of the events

 ///////////////////////////////////// edit methods
 createNewEvent  -> addNewEvent(

 editEvent -> save(
  fillFormFromData  // move data from graph.json to form

popUpFormVisible
 createEditForm
*/


constructor( // calendarClass  client-side
  dom
) {
    const today = new Date();

    this.year = today.getFullYear();
    // need more though, this is here because calendar class has hardcoded app.format and app.proxy, but I'm using calendarClass is a seperate page too.
    this.DOM        = null; // where we are displaying calendar or event;
  	this.format     = new formatClass();  // format time and dates
  	this.proxy      = new proxyClass();   // loads graph data from server
    this.urlParams  = new URLSearchParams( window.location.search );  // read params send in the URL
 
    this.eventYear;          // year of event to edit or add
    this.eventMonth;         // month of event to edit or add
    this.eventDay;           // day of event to edit or add
    this.eventData;          // number to access node or edge in data
    this.popUpHeight;        // holds the height of the pop up form
    this.numMonthDates = 4;  // holds number of dates a monthly repeating date can repeat on per month
    this.openMonthDates = 1; // number of selectors visible when monthly repeating option is chosen

    // need for both sfc web site and the stand alone page
    this.db      = new dbClass();       // create empty database
    this.db.tableAdd("weekCal");        // create empty table in database, is where events for calendar will be displayed.

    // tableUxClass("calendar"  is hardcoded, change at some point
    this.tableUx = new tableUxClass(dom,"app.calendar.tableUx"); // create way to display table
    this.tableUx.setModel( this.db, "weekCal");                  // associate data with disply widget
    this.tableUx.paging.lines = 3;    // should use a method to do this
    this.windowActive = false;        // toggle for pop up window
    this.tableUx.setStatusLineData( [
      `<input type="button" id="todayButton" onClick="app.calendar.findToday()" value="Today" />`
      ,"nextPrev"
      ,`<select name="months" id="months" onChange="app.calendar.chooseMonth()">
          <option value="nullMonth" selected>Choose Month</option>
          <option value="january">January</option>
          <option value="february">February</option>
          <option value="march">March</option>
          <option value="april">April</option>
          <option value="may">May</option>
          <option value="june">June</option>
          <option value="july">July</option>
          <option value="august">August</option>
          <option value="september">September</option>
          <option value="october">October</option>
          <option value="november">November</option>
          <option value="december">December</option>
        </select>`
      ,"rows/page"


    ]);  // ,"tableName","rows","rows/page","download","tags", "firstLast"

    this.tableUx.setSearchVisible(false);                 // hide search
    this.tableUx.setLineNumberVisible(false);             // hide row line numbers
    this.tableUx.setRowNumberVisible(false);              // hide row numbers

    this.weeks2display = 2;                              // display 4 weeks of data at a time
    this.graph=null;                         // where the events are stored in compact form
    this.n_pic = 0;

    // init every day with empty array
    this.events = []                  // this.events[1][12] for january 12 a list of event nodes for that day - expanded from graph
    for (let m=1; m<=12; m++) {
      this.events[m]=[]
      for (let d=1; d<=31; d++) {
        this.events[m][d] = [];
      }
    }
}


// Mutators
setEventMonth( val) {this.eventMonth  = val;}
setEventYear(  val) {this.eventYear   = val;}
setEventDay(   val) {this.eventDay    = val;}
setEventEdge(  val) {this.eventEdge   = val;}
setPopUpHeight(val) {this.popUpHeight = val;}
setNumMonthDates(val) {this.numMonthDates = val;}
setOpenMonthDates(val) {this.openMonthDates = val;}


// accessors
getEventMonth( ) {return this.eventMonth ;}
getEventYear(  ) {return this.eventYear  ;}
getEventDay(   ) {return this.eventDay   ;}
getEventEdge(  ) {return this.eventEdge  ;}
getPopUpHeight() {return this.popUpHeight;}
getNumMonthDates() {return this.numMonthDates;}
getOpenMonthDates() {return this.openMonthDates;}


async main( // calendarClass  client-side
  dom
) {
  this.DOM  = dom;

  // decide which calendar to load, users or main
  await this.loadEvents( `events/${this.year}/_graph.json` );
  this.buildTable();

  // display event or calendar
  this.edgeName = this.urlParams.get('e');
  if (this.edgeName === null) {
    // display entire calendar
    if (document.getElementById("heading")) {
      document.getElementById("heading").innerHTML += ` ${this.year}`;
    } else {
      // assume it is the main page
      document.getElementById("heading1").innerHTML += ` ${this.year}`;
    }

    this.tableUx.display();
    this.findToday();   // only need to do this is we are displaying the clander
    this.createEditForm();
  } else {
    // display event in calendar
    this.displayEvent();
  }
}


createDate(  // calendarClass  client-side
  // returns a date  a starting or endingdate for an event edge
   edge  //
  ,end  //  true -> end time, add duration to start
  ,offsets = [0,0,0] // offset from start [yy,mm,dd]
) {
  const timeZone ={"ET":-300, "CT":-360, "MT":-420, "PT":-480}             // have not put all the possible timezones in
  let offset = timeZone[edge.timeZone] + new Date(0).getTimezoneOffset();  // get offset from event timezone vs user timezone
  let timeDuration = edge.timeDuration.split(":");                         // timeDuration[0] is hours  timeDuration[1] is minutes
  if (end) {
    // date that events ends
    return new Date(edge.dateEnd[0]   ,edge.dateEnd[1]-1  , edge.dateEnd[2]  , edge.dateStart[3]+ parseInt(timeDuration[0]) , edge.dateStart[4] - offset + parseInt(timeDuration[1]) );
  } else {
    // date that events starts
    return new Date(edge.dateStart[0] +offsets[0] ,edge.dateStart[1]-1 +offsets[1], edge.dateStart[2] +offsets[2], edge.dateStart[3], edge.dateStart[4] - offset);
  }
}


async loadEvents( // calendarClass  client-side
  url
) {
  // load calendar data
  let dir,user=app.urlParams.get('u');
  if ( user === null) {
    dir = "synergyData/"; // display SFC calendar
  } else {
    dir = `users/myWeb/`; // display user calendar
  }
  this.graph = await app.proxy.getJSON(dir+url);

  // each edge will generate at least one element in and event list
  Object.keys(this.graph.edges).forEach((k, i) => {
    // generate startGMT, endGMT
    let e = this.graph.edges[k];  // edge we are processing
    e.startGMT = this.createDate(e,false);  // start date time
    e.endGMT   = this.createDate(e,true );  // end   date time
    this.addEvents(k);
  }); // end Object.keys forEach
}


addEvents(  // calendarClass  client-side
  k  // this.graph.edges[k] returns the edge
) {
  switch(this.graph.edges[k].repeat) {
    case "weekly":
      this.addWeekly(k)
      break;
    case "monthly":
      this.addMonthly(k)
      break;
    case "yearly":
      this.addOneOf(k);
      break;
    case "never":
      this.addOneOf(k);
      break;
    default:
      if (typeof(this.graph.edges[k].repeat) === "undefined") {
        // does not repeat
        this.addOneOf(k);
      } else {
        // error
        alert(`in calendarClass.addEvents: repeat=${this.graph.edges[k].repeat}  k=${k}`);
      }

  }
}


addOneOf(  // calendarClass  client-side
  k  // this.graph.edges[k] returns the edge
){
  const date=this.graph.edges[k].startGMT
  this.events[date.getMonth()+1][date.getDate()].push(k);  // push key to edge associated with edge
}


addMonthly(  // calendarClass  client-side
  k  // this.graph.edges[k] returns the edge
) {
  // walk the daysOffset, first entry should be 0;
  const edge=this.graph.edges[k];
  let i=0;
  for ( let month = new Date(edge.startGMT.getTime()); month < edge.endGMT;  ) {
    // chang
    edge.days.forEach((day, i) => {  // day=[day number, week number] day number 0 -> sunday     :  [1,2] -> second monday of month
      // find first target day of week in the the month
      let offset = day[0] - month.getDay(); // day[0] is the target day of week
      if (offset<0) {offset += 7;}          // target day of week in in the next week
      offset += 7*(day[1]-1);               // move to correct on ie 1st, 2st, 3rd... day of week of the month
      let eventDate = new Date(month.getTime() + offset*1000*60*60*24);
      this.events[eventDate.getMonth()+1][eventDate.getDate()].push(k);  // push key to edge associated with edge
    });
    // goto next month
    month=this.createDate(edge,false,[0,++i,0]);
  }
}



addWeekly( // calendarClass  client-side
  k  // this.graph.edges[k] returns the edge
) {
  // walk the daysOffset, first entry should be 0;  we assume
  const edge = this.graph.edges[k];
  edge.daysOffset.forEach((day, i) => {  // day=0 -> sunday
     let walk = new Date(edge.startGMT.getTime() + day*1000*60*60*24);
     while (walk <= edge.endGMT) {
        this.events[walk.getMonth()+1][walk.getDate()].push(k);  // push key to edge associated with edge
        walk.setDate(walk.getDate() + 7);                        // add seven days, goto the next week
     }
  });
}


buildTable(  // calendarClass  client-side
) {   // converts calendar data from graph to a table
  const t        = this.db.getTable("weekCal");  // t -> table we will put event data in to display
  t.clearRows();
  t.setHeader( ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday "] );

  const today = new Date();
  const start = new Date(this.year, 0, 1);   // current date/time
  const firstDate = new Date(this.year, 0, 1);
  const year = start.getFullYear();
  start.setDate( start.getDate()  - start.getDay() ); // move start to Sunday, year could change if it is the first week of the year

  // build weeks data to end of year
  let style;
  for (let x=0; start.getFullYear()<=year ;x++) {
    let row = []; // init week
    for (let y=0; y<=6; y++) {
      // add days for week
      let m = start.getMonth()+1;
      let d = start.getDate();

      // set style of day depending on not part of current year, past, today, future,
      if (start<firstDate) {
        // day is before january 1st of this year
        style = `data-parentAttribute="['class','notYear']"`
      } else if (start.getFullYear()>this.year) {
        // day is after last day of year
        style = `data-parentAttribute="['class','notYear']"`
      } else if (start.getMonth() == today.getMonth() && start.getDate() == today.getDate() && start.getFullYear() == today.getFullYear()) {
        // change how the comparison works because the time of day will not match up from start and today
        // so just see if the month, day, and year are the same to compare
        // set backgroupd color for today
        let dayArg   = start.getDate();
        let monthArg = start.getMonth();
        let yearArg  = start.getFullYear();
        style = `data-parentAttribute="['class','today']"`  // tableUxClass will put class='past' in the TD tag
      } else if (start<today) {
        // set backgroupd color for past event
        let dayArg   = start.getDate();
        let monthArg = start.getMonth();
        let yearArg  = start.getFullYear();
        style = `data-parentAttribute="['class','past']"`  // tableUxClass will put class='past' in the TD tag
      } else {
        // set backgroupd color for future date
        let dayArg   = start.getDate();
        let monthArg = start.getMonth();
        let yearArg  = start.getFullYear();
        style = ''
      }

      let add="";
      if (this.urlParams.get('u') != null) {
        add =`<a onClick="app.calendar.createNewEvent(${start.getFullYear()}, ${start.getMonth()}, ${start.getDate()})">+</a> `
      }
      let html = `<h5 ${style}>${m}-${d} ${add}</h5>`;

      let eventList = this.events[m][d];
      eventList.forEach((edgeName, i) => {
        // loop for all events for day [m][d]
          let year = start.getFullYear();
          let nodeName = this.graph.edges[edgeName].nR
          if (typeof(nodeName) === "string") {
              // assume node is an interal node
              let user=""  // assume we are on main calendar
              let editButton = `${i+1} `;
              if (this.urlParams.get('u') != null) {
                // we are on a user calendar
                user = "&u=" + this.urlParams.get('u');
                editButton = `<a onClick="app.calendar.editEvent(${edgeName})">${i+1}</a> `;
              }

              html += `<p>${editButton}<a  href="/app.html?p=events&e=${edgeName}&d=${app.format.getISO(start)}${user}" target="_blank">${this.graph.nodes[nodeName].text[0][2]}</a></p>`
          } else {
            // assume nodeName is an Object
            html += `<p>${i+1} <a  href="${nodeName.url}" target="_blank">${nodeName.text}</a></p>`
          }

      });

      row.push(html + "</br>")
      start.setDate( start.getDate() + 1 ); // move to next day
    }
    t.appendRow(row);  // append row to table
  }
}


fillFormFromData(  // calendarClass  client-side
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

  // load from node  ----------
  document.getElementById("eventName"       ).value     = this.graph.nodes[edge.nR].text[0][2];
  document.getElementById("eventDescription").innerText = this.graph.nodes[edge.nR].text[1][2];
}

fillRepeatdays(
  // fills in the selector for what days of the week the event repeats on
) {
  let edgeName = this.getEventEdge();
  // the edge exists already
  let d = new Date(
     this.graph.edges[edgeName].dateStart[0]
    ,this.graph.edges[edgeName].dateStart[1]-1
    ,this.graph.edges[edgeName].dateStart[2]
  );
  let dayIndex = d.getDay();
  let r = this.graph.edges[edgeName].daysOffset;
  let daysOfWeek = document.getElementsByClassName("repeatCheckbox");
  for (let i = 0; i < r.length; i++) {
    daysOfWeek[(r[i] + dayIndex) % 7].checked = true;
  }
}

createEditForm( // calendarClass  client-side
){
  const calendar = document.getElementById("weeks");
  calendar.style = "display: flex;"
  calendar.innerHTML += `
  <div class="popUpForm" id="popUpForm">
    <p id="popUpForm-add-edit"></p>

    <div style="display: flex; justify-content: center; margin: 5px;">
      <label for="eventName" class="popUpLabel">Name: </label>
      <input id="eventName" type="text" placeholder="Event Name..." />
    </div>

    <div style="display: flex; flex-direction: column; margin-top: 5px; width: 80%; align-items: center;">
      <label for="eventDescription" class="popUpLabel">Description</label>
      <textarea id="eventDescription" rows="11" cols="30" style="resize: none; border-radius: 5px;"></textarea>
    </div>

    <div style="display: flex; justify-content: center; margin: 5px;">
      <label for="eventStartDate" class="popUpLabel">Start Date: </label>
      <input id="eventStartDate" type="date" />
    </div>

    <div style="display: flex; justify-content: center; margin: 5px;">
      <label for="eventStartTime" class="popUpLabel">Start Time: </label>
      <input id="eventStartTime" type="time" />
    </div>

    <div style="display: flex; justify-content: center; margin: 5px;">
      <label for="timeZone" class="popUpLabel">Time Zone: </label>
      <select id="timeZone">
      <option value="ET">Eastern</option>
      <option value="CT">Centeral</option>
      <option value="MT">Mountain</option>
      <option value="PT">Pacific</option>
      </select>
    </div>

    <div>
      <label for="duration" class="popUpLabel">Duration: </label>
      <input id="durationHour" type="number" min="0" max="8"/>:<input id="durationMinute" type="number" min="0" max="59"/>
    </div>

    <div style="display: flex; justify-content: center; margin: 5px;">
      <label for="repeatType" class="popUpLabel">Repeats: </label>
      <select id="repeatType" onChange="app.calendar.renderEndDateSelector()">
        <option value="never" selected>Never</option>
        <option value="yearly">Yearly</option>
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
      </select>
    </div>

    <div id="endDateDiv" style="display: flex; justify-content: center; margin: 5px;">
      <div id="yearlyEndDate">
        <label id="endDateLabel" for="endDate" style="margin-right: 3px;">End Date: </label>
        <input id="yearlyEndDateInput" type="number" min="2022" max="2030" value="${this.year+1}"/>
      </div>
      <div id="weeklyMonthlyEndDate">
        <label id="endDateLabel" for="endDate" style="margin-right: 3px;">End Date: </label>
        <input id="endDateInput" type="date" />
      </div>
    </div>
    <div id="monthlyEndDate" style="display: flex; justify-content: center; margin: 5px; flex-direction: column;"> 
      <div class="monthlyRepeatsLabel">
        <label>Repeats On:</label>
        <a class="addNewRepeatMonthly" onClick="app.calendar.addNewRepeatMonthy()">+</a>
      </div>
      <div class="monthlyRepeatInput">
        <select id="monthlyWeekSelect-1">
          <option value="1" selected>1st</option>
          <option value="2">2nd</option>
          <option value="3">3rd</option>
          <option value="4">4th</option>
          <option value="5">5th</option>
        </select>
        <select id="monthlyDaySelect-1">
          <option value="0" selected> Sunday   </option>
          <option value="1">          Monday   </option>
          <option value="2">           Tuesday  </option>
          <option value="3">          Wednesday</option>
          <option value="4">          Thursday </option>
          <option value="5">          Friday   </option>
          <option value="6">          Saturday </option>
        </select>
      </div>
      <div class="monthlyRepeatInput" id="monthlyRepeatInput-2" style="display: none">
        <select id="monthlyWeekSelect-2">
          <option value="1" selected>1st</option>
          <option value="2">2nd</option>
          <option value="3">3rd</option>
          <option value="4">4th</option>
          <option value="5">5th</option>
        </select>
        <select id="monthlyDaySelect-2">
          <option value="0" selected> Sunday   </option>
          <option value="1">          Monday   </option>
          <option value="2">          Tuesday  </option>
          <option value="3">          Wednesday</option>
          <option value="4">          Thursday </option>
          <option value="5">          Friday   </option>
          <option value="6">          Saturday </option>
        </select>
        <a class="removeMonthlySelectorButton" onCLick="app.calendar.removeMonthlySelector(2)">-</a>
      </div>
      <div class="monthlyRepeatInput" id="monthlyRepeatInput-3" style="display: none">
        <select id="monthlyWeekSelect-3">
          <option value="1" selected>1st</option>
          <option value="2">2nd</option>
          <option value="3">3rd</option>
          <option value="4">4th</option>
          <option value="5">5th</option>
        </select>
        <select id="monthlyDaySelect-3">
          <option value="0" selected> Sunday   </option>
          <option value="1">          Monday   </option>
          <option value="2">          Tuesday  </option>
          <option value="3">          Wednesday</option>
          <option value="4">          Thursday </option>
          <option value="5">          Friday   </option>
          <option value="6">          Saturday </option>
        </select>
        <a class="removeMonthlySelectorButton" onCLick="app.calendar.removeMonthlySelector(3)">-</a>
      </div>
      <div class="monthlyRepeatInput" id="monthlyRepeatInput-4" style="display: none">
        <select id="monthlyWeekSelect-4">
          <option value="1" selected>1st</option>
          <option value="2">2nd</option>
          <option value="3">3rd</option>
          <option value="4">4th</option>
          <option value="5">5th</option>
        </select>
        <select id="monthlyDaySelect-4">
          <option value="0" selected> Sunday   </option>
          <option value="1">          Monday   </option>
          <option value="2">          Tuesday  </option>
          <option value="3">          Wednesday</option>
          <option value="4">          Thursday </option>
          <option value="5">          Friday   </option>
          <option value="6">          Saturday </option>
        </select>
        <a class="removeMonthlySelectorButton" onCLick="app.calendar.removeMonthlySelector(4)">-</a>
      </div>
    </div>
    <div id="repeatDiv">
      <div id="daysOfWeekSelector">
        <div id="repeatSelectorTitle">Repeats on</div>
        <div class="dayPicker">
          <label class="pickDayContainer">
            <input type="checkbox" value="sunday" class="repeatCheckbox" id="sunCheck">
            <span class="checkmark">Su</span>
          </label>
          <label class="pickDayContainer">
            <input type="checkbox" value="monday"class="repeatCheckbox" id="monCheck">
            <span class="checkmark">Mo</span>
          </label>
          <label class="pickDayContainer">
            <input type="checkbox" value="tuesday" class="repeatCheckbox" id="tueCheck">
            <span class="checkmark">Tu</span>
          </label>
          <label class="pickDayContainer">
            <input type="checkbox" value="wednesday" class="repeatCheckbox" id="wedCheck">
            <span class="checkmark">We</span>
          </label>
          <label class="pickDayContainer">
            <input type="checkbox" value="thursday" class="repeatCheckbox" id="thurCheck">
            <span class="checkmark">Tr</span>
          </label>
          <label class="pickDayContainer">
            <input type="checkbox" value="friday" class="repeatCheckbox" id="friCheck">
            <span class="checkmark">Fr</span>
          </label>
          <label class="pickDayContainer">
            <input type="checkbox" value="saturday" class="repeatCheckbox" id="satCheck">
            <span class="checkmark">Sa</span>
          </label>
        </div>
      </div>
    </div>

    <button onClick="app.calendar.addNewEvent()"            class="addSaveButton"       id="addEventButton"   > Add Event </button>
    <button onClick="app.calendar.save()"                   class="addSaveButton"       id="saveEventButton"  > Save      </button>
    <button onClick="app.calendar.popUpFormVisible(false)"  class="cancelEventButton"   id="cancelEventButton"> Cancel    </button>
    <button onClick="app.calendar.deleteEvent()"    class="deleteEventButton"   id="deleteEventButton"> Delete    </button>

  </div>`;
}

addNewRepeatMonthy(
  // This function is the onClick function for the '+' button on popupform when the 'monthly' repeating option is chosen
  // This adds a new day in the month that the event can repeat on
  // Currently maxing it at 3 dates it can repeat on
) {
  // Make sure we are not at maximum amount of dates
  console.log(this.getOpenMonthDates());
  if (this.getOpenMonthDates() <= 3){
    // We need to expand how large the total pop up is to fit the new items
    document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight + 35}px`;

    // Append new selector to repeat on
    document.getElementById(`monthlyRepeatInput-${this.getOpenMonthDates()+1}`).style.display = "block";
    this.setOpenMonthDates(this.getOpenMonthDates()+1);
  } else {
    console.log("Maximum amount of dates");
  }
}

removeMonthlySelector(
  // This function is the onclick for the '-' that appears next to the selectors when user is choosing the monthly repeat option
  // This removes the selector that it is attached to and resizes the pop up window
  index
) {
  document.getElementById(`monthlyRepeatInput-${index}`).style.display = "none";
  document.getElementById("popUpForm").style.height = `${document.getElementById("popUpForm").clientHeight - 35}px`;
  this.setOpenMonthDates(this.getOpenMonthDates() - 1);
}


createNewEvent(  // calendarClass  client-side
  // user clicked + to add new event on a particular day
   year
  ,month
  ,day          //
) {
  // determine if we are on user calendar or
  if (this.urlParams.get('u') === null) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }

  // set member variables for event year month and day
  this.setEventYear(year);
  this.setEventMonth(month);
  this.setEventDay(day);

  // Set correct buttons to display for creating new event
  document.getElementById("saveEventButton"  ).style.display  = "none";
  document.getElementById("deleteEventButton").style.display  = "none";;
  document.getElementById("addEventButton"   ).style.display  = "inline-block";

  // make form blank
  this.createBlankForm();

  // make popup vissible
  this.popUpFormVisible(true);
}

// sets all input fields in pop up form to be default
createBlankForm() {
  // fill in all selector values

  // ensure pop up form has original height
  document.getElementById("popUpForm").style.height = "630px";

  // Ensure no monthly date selectors are open
  for (let i = 2; i <= this.getOpenMonthDates(); i++) {
    document.getElementById(`monthlyRepeatInput-${i}`).style.display = "none";
  }
  this.setOpenMonthDates(1);

  // default repeat to 'never'
  document.getElementById("repeatType").value = "never";
  this.renderEndDateSelector();
  for (let i = 0; i < document.getElementsByClassName("repeatCheckbox").length; i++) {
    document.getElementsByClassName("repeatCheckbox")[i].checked = false;
  }

  // load with date they clicked on
  let date = new Date(this.getEventYear(),this.getEventMonth(),this.getEventDay());
  document.getElementById('eventStartDate').value = date.toISOString().substring(0,10);

  // load time with current time
  date = new Date();
  document.getElementById('eventStartTime').value = date.toISOString().substring(11,16);

  // empty name field
  document.getElementById("eventName").value = "";

  // set default duration to one hour
  document.getElementById("durationHour"  ).value = 1;
  document.getElementById("durationMinute").value = 0;

  // fill the day in the month for monthly repeating events
  let d = this.findDayInMonth(
    new Date(
       this.getEventYear()
      ,this.getEventMonth()
      ,this.getEventDay() 
    )
  );
  document.getElementById("monthlyWeekSelect-1").value = `${d[1]}`;
  document.getElementById("monthlyDaySelect-1").selectedIndex = d[0];

  // empty description field
  document.getElementById("eventDescription").innerText = "";
}


editEvent(  // calendarClass  client-side
  edgeName  // string
) {
  if (this.urlParams.get('u') === null) {
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
  document.getElementById("addEventButton"   ).style.display = "none";             // Hide
  document.getElementById("saveEventButton"  ).style.display = "inline-block";     // show ?
  document.getElementById("deleteEventButton").style.display = "inline-block";     // show ?

  this.fillFormFromData(edgeName);   // load data
  this.popUpFormVisible(true    );   // make popup vissible
}


popUpFormVisible(  // calendarClass  client-side
  bool  // true =show it,  false -> hide it
) {
  document.getElementById(`popUpForm`).style.display = bool ? 'block' : 'none';
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
    document.getElementById("weeklyMonthlyEndDate"  ).style.display = 'inline';
    document.getElementById("monthlyEndDate"        ).style.display = 'flex';
    document.getElementById("daysOfWeekSelector"    ).style.display = 'none';
  }
}


loadEventEdge( // calendarClass  client-side
               // moves pop up form to edge for this.graph.edge[edge]
  edge // name of edge we are loading
)   {
  // move data from form to variables
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
  while (startHour[0][0] == "0") {
    startHour[0] = startHour[0].substring(1);
  }

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
    dateEnd = [parseInt(endDateInfo[0],10),parseInt(endDateInfo[1],10),parseInt(endDateInfo[2],10)];
    
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
  //g.nR           = `${app.calendar.graph.nodeNext}`;
  g.dateStart    = startDate;
  g.dateEnd      = dateEnd;

  let e          = document.getElementById("timeZone");
  g.timeZone     = e.options[e.selectedIndex].value;
  g.days         = days;
  g.timeDuration = `${durationHour}:${durationMinute}`;
  g.repeat       = repeat;
  g.daysOffset   = offset;
}

findDayInMonth(
  // This funciton returns an array with the first day being the index of the day in a week -- ex 0 for sunday and 1 for monday
  // The second element in array is the index of week in the month -- ex 1 for first week 2 for second week
  // EX: [2,4] would mean that the day is the 4th tuesday of the month
  date
) {
  
  let dayIndex = date.getDay();
  let weekIndex = Math.ceil(date.getDate() / 7); 
  return [dayIndex , weekIndex];
}


async deleteEvent( // calendarClass  client-side
) {
  delete this.graph.edges[this.getEventEdge()];
  //delete this.graph.nodes[editData]; can only delete this if it is an orphan

  await this.processServerRefresh();
}

// When user hits "add event" or "save"
// Handles the days of week that the event should repeat on
// Returns array where each item is an index of day of the week starting at 0
// ex [0,2,4] is [sunday, tuesday, thursday]
weeklyRepeatDays() {
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


async addNewEvent(  // calendarClass  client-side
  // user click + to add a new event and now has click "add" button to save new event on server
  ) {
  // move values in pop up form to graph edge
  const edge = this.graph.edges[this.graph.edgeNext] = {};  // create new edge
  edge.nR    = this.graph.nodeNext.toString();
  this.loadEventEdge(this.graph.edgeNext);

  const node = this.graph.nodes[this.graph.nodeNext] = {};  // create new node
  node.text  = [
     ["h3","",`${document.getElementById("eventName"       ).value}`]
    ,["p" ,"",`${document.getElementById("eventDescription").value}`]
  ];

  // increment edge and node counters
  app.calendar.graph.edgeNext += 1;
  app.calendar.graph.nodeNext += 1;

  await this.processServerRefresh();  // save the updated calendar
}

async processServerRefresh( // calendarClass  client-side

) {
  // save new graph
  const msg = {
  "server":"web"
  ,"msg":"uploadFile"
  ,"path":`/users/myWeb/events/${this.year}`
  ,"name":"_graph.json"
  ,"data": app.calendar.graph
  }

  const resp = await app.proxy.postJSON(JSON.stringify(msg));  // save
  alert(JSON.stringify(resp));   // was it succussful
  location.reload();
  this.windowActive = false;
}


moveToDate( // calendarClass  client-side
   newDate // move to newDate from current date displayed on calendar
) {
  let timeBetweenDays;  // in milliseconds from newDate to first date displayed in first row
  let weeksBetweenDays; // number of rows need to move to make the newDate displayed in first row of calendar
  const firstDayTD    = document.getElementsByTagName("td")[0];      // grabs the table elements that hold the dates on calendar
  const firstMonthDay = firstDayTD.firstChild.innerText.split("-");  // grabs the first date at the top left of calendar table

  // convert strings to integers
  const firstMonth = parseInt(firstMonthDay[0]);
  const firstDay   = parseInt(firstMonthDay[1])

  // first date of page we are on at the moment
  const firstYear = (this.tableUx.paging.row ===0 && firstDayTD.className === "notYear") ? (this.year-1) : this.year;
  const firstDate = new Date(firstYear, firstMonth-1, firstDay);

  // find difference in time between dates
  timeBetweenDays = newDate.getTime() - firstDate.getTime(); // time between a and b in milliseconds

  // turn difference in milliseconds to weeks
  weeksBetweenDays = Math.floor(timeBetweenDays / (1000 * (60 * 60) * 24 * 7));

  // change paging row
  this.tableUx.paging.row += weeksBetweenDays;
  this.tableUx.displayData();
}


chooseMonth(  // calendarClass  client-side
  // Goes to page that has first day of chosen month
) {
  const myList = document.getElementById("months");           // grabs the month input selector
  this.moveToDate(new Date(this.year, myList.selectedIndex-1, 1));
  myList.selectedIndex = 0;
}


findToday( // calendarClass  client-side
// jumpts to current date from anywhere on calendar
) {
  // get current date (we want to jump to this date)
  var today = new Date();

  this.moveToDate(today);
}


updatePictures( // calendarClass  client-side

) {   // walk through each row and display the next picture
  this.list.forEach((a_name, i) => {
    let r = this.graph.nodes[a_name];
    if (r && r.u_pictures && 0<r.u_pictures.length) {
      // if the the array has urls of pictures, display one
      let pic = this.n_pic % r.u_pictures.length;
      document.getElementById(`pic_${this.idDOM}_${i}`).innerHTML =
      `<img style="object-fit:contain; width:320px; height:200px;"  src="${"/synergyData/"+ r.u_pictures[pic][1]}">`
    }
  });
  this.n_pic++;
}


displayEvent(  // calendarClass - client-side

) {  // user has clicked on a clalender event, show the details of the event on a seprate page
  let html="";
  const list     = [];                                 // will contain list of nodes to display
  const nodeName = this.graph.edges[this.edgeName].nR; // get the main nodeName or object
  const date     = this.urlParams.get('d')             // get YYYY-MM-DD from the URL
  const script   = [];                                 // will hold any nodes script. will execute after all nodes are displayed

  list.push(nodeName+date);    // push node for this date, display it first, this nodeName may not exist
  list.push(nodeName);         // push the main node to display

  list.forEach((node, i) => {
    // build html for links like FaceBook, Ets, etc
    html += this.HTMLforNode(i,node);
    script.push(node.script);
  });

  // add date to heading
  document.getElementById('heading1').innerHTML = "SFC Event On: " + date ;

  // add main event info
  document.getElementById(this.DOM).innerHTML = html;
  this.list = list;
  this.updatePictures();

  if (!this.timer) {
    // only want to setInterval once per page load
    this.timer = setInterval(this.updatePictures.bind(this), 2000);  // refress pictures every 2 seconds
  }
  // now run script
}


HTMLforNode(  // calendarClass - client-side
  i  // to get row color
  ,nodeName  // nodeName to display
) {


  let html="";
  const node  = this.graph.nodes[nodeName];
  if (node) {
    // the node exists
    //  create list of urls
    let urls="";
    if (typeof(node.u_urls) != "undefined" && Array.isArray( node.u_urls ) ) {
      // there are URL that are part of the row to be displayed
      node.u_urls.forEach((item, i) => {
        let target="_top";   // assume we want the link to stay on the same page
        if (item[1].substr(0,8) === "https://"
         || item[1].substr(0,7) === "http://") {
          // assume urls that start with https:// or http:// are on other sites and create a new tab or window for them
          target="_blank";
        }
        urls += `<a href='${item[1]}' target='${target}'>${item[0]}</a> &nbsp;&nbsp;&nbsp; `
      });
    }

    // build html for row
    html += this.displayRow(i,node,urls,);
  } else {
    // the node does not exists, display place holder if viewing non-production
    if (localStorage.getItem('production')  === "false") {
      // only show in non production
      html += `<div class="row"><div><h3>add entry for ${a_name}</h3></div></div>`;
    }
  }

  return html;
}


displayRow(      // calendarClass - client-side
  // similar to widgetList
  i       // row index, needed for color
  ,node   // edge name has pointers to everything we need to display
  ,urls   // urls to be displayed
  ) {

  // css class rows start with 1, array index start with 0
  const color = (i % 4) + 1; // row1 row2 row3 row4 in css, this should be coming out of an array
  let text = "";
  let updated="";
  let day,time;
  const urlParams = new URLSearchParams( window.location.search );
  let page = urlParams.get('p')

  // walk the list of lines in text
  const edge = this.graph.edges[this.edgeName]      ;  // had time data, points to node
  node.text.forEach((line, i) => {
    if        (line[0] === "monthly") {
      let day  =  app.format.getDayOfWeek(edge.days[0][0]);
      let start =  this.createDate(edge,false);
      let end   =  this.createDate(edge,true);
      let time  = `${app.format.timeRange(start, end)}`;
      text +=  `<p><b>Day:</b> ${app.format.weekNumber(edge.days[0][1])} ${day} <br/><b>Time:</b> ${time}</p>`
    } else if (line[0] === "weekly") {
      // format date for weely event
      let start =  this.createDate(edge,false);
      let end   =  this.createDate(edge,true);
      let days  =  app.format.getDaysOfWeek(start, edge.daysOffset);
      let time  = `${app.format.timeRange(start, end)}`;
      text +=  `<p><b>Day: </b>${days} <br/><b>Time:</b> ${time}</p>`
    } else if (line[0] === "yearly") {
      //
      let start =  this.createDate(edge,false);
      let end   =  this.createDate(edge,true);
      let time  = `${app.format.timeRange(start, end)}`;
      text += `<p><b>Date:</b> ${app.format.getISO(start)} <br/><b>Day:</b> ${app.format.getDayOfWeek(start.getDay())} <br/><b>Time: </b>${time}</p>`
    } else if (line[0] === "eval") {  // depricate eval
      // save javascript code to execute in array, run it after the DOM is loaded
      this.a_eval.push(line[2]);
    } else if(line[0] === "") {
      // assume all HTML tags are included in line[2]
      text += line[2];
    } else {
      // assume line[0] is a html tag and surround with open close tags
      text += `<${line[0]}>${line[2]}</${line[0]}>`;
    }
  });

  // create updated
  if (!page) {
    // on homepage
    page="event/2022";
  }

  if (localStorage.getItem('production')  === "false") {
      // only show if production = false
      updated =`updated ${r.updated} <a href="/app.html?p=comment&pc=${page}&node=${encodeURI(a_name)}">add comment</a>`;
  }


  let pictures="";
  if(typeof(node.u_pictures) !="undefined" && 0<node.u_pictures.length) {
    // only put picture div in if there are pictures to display
    pictures=`<div id="pic_${this.idDOM}_${i}" style="float:right;width:320px; height:200px;"></div>`;
  }



  const html =`
  <div class="row row${color}">
  ${pictures}
  ${text}
  <p>${urls}<p>
  <p>${updated}</p>
  </div>


  </div>
  `;   // table cell for piture


  return html;
}


// calendarClass  client-side
} // end class
