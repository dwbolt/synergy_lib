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

displayRow()    converts node to html for displayed
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

    this.eventYear;  // year of event to edit or add
    this.eventMonth; // month of event to edit or add
    this.eventDay;   // day of event to edit or add
    this.eventData;  // number to access node or edge in data

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
setEventMonth(val) {this.eventMonth = val;}  // calendarClass  client-side
setEventYear( val) {this.eventYear  = val;}  // calendarClass  client-side
setEventDay(  val) {this.eventDay   = val;}  // calendarClass  client-side
setEventEdge( val) {this.eventEdge  = val;}  // calendarClass  client-side


// accessors
getEventMonth() {return this.eventMonth;}  // calendarClass  client-side
getEventYear( ) {return this.eventYear ;}  // calendarClass  client-side
getEventDay(  ) {return this.eventDay  ;}  // calendarClass  client-side
getEventEdge( ) {return this.eventEdge ;}  // calendarClass  client-side


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
                editButton = `<a onClick="app.calendar.editEvent(${start.getFullYear()},${start.getMonth()},${start.getDate()},${edgeName})">${i+1}</a> `;
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
  edgeName  //
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
  if (document.getElementById("endDate")) {
      document.getElementById("endDate").valueAsDate = new Date(
        edge.dateEnd[0], edge.dateEnd[1]-1, edge.dateEnd[2] );
  }

  // load from node  ----------
  document.getElementById("eventName"       ).value     = this.graph.nodes[edge.nR].text[0][2];
  document.getElementById("eventDescription").innerText = this.graph.nodes[edge.nR].text[1][2];
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

    <div id="endDateDiv" style="display: flex; justify-content: center; margin: 5px;"></div>

    <button onClick="app.calendar.addNewEvent()"            class="addSaveButton"       id="addEventButton"   > Add Event </button>
    <button onClick="app.calendar.save()"                   class="addSaveButton"       id="saveEventButton"  > Save      </button>
    <button onClick="app.calendar.popUpFormVisible(false)"  class="cancelEventButton"   id="cancelEventButton"> Cancel    </button>
    <button onClick="app.calendar.deleteEvent()"    class="deleteEventButton"   id="deleteEventButton"> Delete    </button>

  </div>`;
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
  // default repeat to 'never'
  document.getElementById("repeatType").value = "never";

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

  // empty description field
  document.getElementById("eventDescription").innerText = "";
}


editEvent(  // calendarClass  client-side
    year     // number
   ,month    // number
   ,day      // number
  ,edgeName  // string
) {
  if (this.urlParams.get('u') === null) {
    // not on user calendar
    alert('Error, not on user calendar');
    return;
  }

  // save for other methods
  this.setEventDay(  day     );
  this.setEventMonth(month   );
  this.setEventYear( year    );
  this.setEventEdge( edgeName);

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
  let endDateDiv     = document.getElementById("endDateDiv");
  if (repeatSelector.value == "never") {
    // do not display any selector when event does not repeat
    endDateDiv = document.getElementById("endDateDiv");
    endDateDiv.innerHTML = "";
  } else if (repeatSelector.value == "yearly") {
    // display only a number when selecting a year
    let endDate = `
      <label id="endDateLabel" for="endDate" style="margin-right: 3px;">End Date: </label>
      <input id="endDate" type="number" min="2022" max="2030" value="${this.year+1}"/>
    `;
    endDateDiv.innerHTML = endDate;
  } else {
    // weekly or monthly option is selected so we should display selector for end date
    let endDate = `
      <label id="endDateLabel" for="endDate" style="margin-right: 3px;">End Date: </label>
      <input id="endDate" type="date" />
    `;
    endDateDiv.innerHTML = endDate;
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

  let endDate     = "";
  let doesRepeat  = false
  if (document.getElementById("endDate")) {
    endDate    = document.getElementById("endDate").value;
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

  // handle repeat events
  let offset         = [];   // for repeating events and their offset from first day
  let dateEnd;
  let year  = this.getEventYear();
  let month = this.getEventMonth();
  let day   = this.getEventDay();
  if (repeat == "weekly") {
    offset[0] = 0;
    dateEnd = [parseInt(endDateInfo[0],10),parseInt(endDateInfo[1],10),parseInt(endDateInfo[2],10)];
  } else if (repeat == "monthly") {
    offset = [0];
    dateEnd = [parseInt(endDateInfo[0],10),parseInt(endDateInfo[1],10),parseInt(endDateInfo[2],10)];
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
  g.dateStart    = [year,month+1,day,startHourNum,startHourMin];
  g.dateEnd      = dateEnd;

  let e          = document.getElementById("timeZone");
  g.timeZone     = e.options[e.selectedIndex].value;

  g.timeDuration = `${durationHour}:${durationMinute}`;
  g.repeat       = repeat;
  g.daysOffset   = offset;
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

//------------------------------------------------  can split all methods below off to display node class.
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

// calendarClass  client-side
} // end class
