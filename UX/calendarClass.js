class calendarClass {
/*
 Calendar data is stored in a graph. Each graph has stores one year.  Edges hold dates and time and time zone.  Edges also hold if repeating information.  IE  weekly, monthly or yearly.

High level methods are:

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

createDate(
updatePictures(list)    // walk through each row and display the next picture
HTMLforNode(  //
 A users will see the events in their timezone.
 This may not only change the time but also the day, month or year for the viewer of the events
*/


// calendarClass  client-side
constructor(dom) {
    const today = new Date();

    this.year = today.getFullYear();
    // need more though, this is here because calendar class has hardcoded app.format and app.proxy, but I'm using calendarClass is a seperate page too.
    this.DOM        = null; // where we are displaying calendar or event;
  	this.format     = new formatClass();  // format time and dates
  	this.proxy      = new proxyClass();   // loads graph data from server
    this.urlParams  = new URLSearchParams( window.location.search );  // read params send in the URL

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
      ,`<label for="chooseMonth">Month: </label>
        <select name="months" id="months" onChange="app.calendar.chooseMonth()">
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



// calendarClass  client-side
async main(dom) {
  this.DOM  = dom;

  // decide which calendar to load, users or main
  await this.loadEvents( `events/${this.year}/_graph.json` );
  this.buildTable();

  // display event or calendar
  this.edgeName = this.urlParams.get('e');
  if (this.edgeName === null) {
    // display entire calendar
    document.getElementById("heading").innerHTML += ` ${this.year}`;
    this.tableUx.display();
    this.findToday();   // only need to do this is we are displaying the clander
  } else {
    // display event in calendar
    this.displayEvent();
  }
}


// calendarClass  client-side
today(){
  // move beging
  alert("today");


}


// calendarClass  client-side
createDate(
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


// calendarClass  client-side
async loadEvents(
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

  this.edgeToEvents();
}

edgeToEvents() {
  // each edge will generate at least one element in and event list
  Object.keys(this.graph.edges).forEach((k, i) => {
    // generate startGMT, endGMT
    let e = this.graph.edges[k];  // edge we are processing
    e.startGMT = this.createDate(e,false);  // start date time
    e.endGMT   = this.createDate(e,true );  // end   date time
    this.addEvents(k);
  }); // end Object.keys forEach
}

// calendarClass  client-side
addEvents(
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


// calendarClass  client-side
addOneOf(
  k  // this.graph.edges[k] returns the edge
){
  const date=this.graph.edges[k].startGMT
  this.events[date.getMonth()+1][date.getDate()].push(k);  // push key to edge associated with edge
}


// calendarClass  client-side
addMonthly(
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


// calendarClass  client-side
addWeekly(
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


// calendarClass  client-side
buildTable() {   // converts calendar data from graph to a table, uses
//  let date;
  // set header
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
      let m=start.getMonth()+1;
      let d=start.getDate();
      if (start<firstDate) {
        // day is before january 1st of this year
        style = `data-parentAttribute="['style','font-size: 0']"`
      } else if (start.getFullYear()>this.year) {
        // day is after last day of year
        style = `data-parentAttribute="['style','font-size: 0']"`
      } else if (start.getMonth() == today.getMonth() && start.getDate() == today.getDate() && start.getFullYear() == today.getFullYear()) {
        // change how the comparison works because the time of day will not match up from start and today
        // so just see if the month, day, and year are the same to compare
        // set backgroupd color for today
        let dayArg = start.getDate();
        let monthArg = start.getMonth();
        let yearArg = start.getFullYear();
        style = `data-parentAttribute="['class','today']"`  // tableUxClass will put class='past' in the TD tag
      } else if (start<today) {
        // set backgroupd color for past event
        let dayArg = start.getDate();
        let monthArg = start.getMonth();
        let yearArg = start.getFullYear();
        style = `data-parentAttribute="['class','past']"`  // tableUxClass will put class='past' in the TD tag
      } else {
        // set backgroupd color for future date
        let dayArg = start.getDate();
        let monthArg = start.getMonth();
        let yearArg = start.getFullYear();
        style = ``;
      }
      let plusStyle = `
        cursor: pointer;
      `;
      let html = `<h5  ${style}>
                    <a style="${plusStyle}" onClick="app.calendar.createNewEvent(${start.getDate()},${start.getMonth()},${start.getFullYear()}, 1, 0)">+</a>
                    ${m}-${d}
                  </h5>
                  <br>`;   // put MM-DD at top of day

      let eventList = this.events[m][d];
      eventList.forEach((k, i) => {
        // loop for all events for day [m][d]
          let year = start.getFullYear();
          let nodeName = this.graph.edges[k].nR
          if (typeof(nodeName) === "string") {
              // assume node is an interal node
              let user=""  // assume we are on main calendar
              let editButton = "";
              if (this.urlParams.get('u') != null) {
                // we are on a user calendar
                user = "&u=" + this.urlParams.get('u');
                editButton = `
                  <p style="cursor:pointer;" onClick="app.calendar.createNewEvent(${start.getDate()},${start.getMonth()},${start.getFullYear()}, 2, ${nodeName})">
                    ${i+1}
                  
                `;
              }

              html += `${editButton}
                <a  href="/app.html?p=events&e=${k}&d=${app.format.getISO(start)}${user}" target="_blank">${this.graph.nodes[nodeName].text[0][2]}</a>
                </p>`
          } else {
            // assume nodeName is an Object
            html += `<li><a  href="${nodeName.url}" target="_blank">${nodeName.text}</a>`
          }

      });

      row.push(html + "</br>")
      start.setDate( start.getDate() + 1 ); // move to next day
    }
    t.appendRow(row);  // append row to table
  }
}

// fills in pop up form from the JSON data
fillFormFromData(editData) {
  // fill in all selector values

  // fill in start date
  let startDateSelector = document.getElementById("startDate");
  startDateSelector.valueAsDate = new Date(this.graph.edges[editData].dateStart[0], this.graph.edges[editData].dateStart[1]-1, this.graph.edges[editData].dateStart[2]);

  // fill in how event repeats
  let repeatSelector = document.getElementById("repeatType");
  repeatSelector.value = this.graph.edges[editData].repeat;

  // fill in name of event
  let nameSelector = document.getElementById("eventName");
  nameSelector.value = this.graph.edges[editData].comments;

  // fill in time of event
  let startTimeSelector = document.getElementById("eventStartTime");
  let startTimeString = this.graph.edges[editData].startGMT.toISOString(); // turn datetime string to ISO string to parse from there
  startTimeString = startTimeString.split("T"); // get just the time and not date of event
  let startTimeSplit = startTimeString[1].split("."); // remove the trailing text past the time of event
  let startTimeValue; // for parsing the time into parts
  let hour;  // the hour of the event
  if (this.graph.edges[editData].timeZone == "ET") {
    // subtract 4 hours from GMT to get EST
    startTimeValue = startTimeSplit[0].split(":"); // split time into hours and minutes
    hour = parseInt(startTimeValue[0]);
    hour -= 4;
  }
  startTimeSelector.value = `${hour}:${startTimeValue[1]}`;

  // fill in duration of event
  let durTimeData = this.graph.edges[editData].timeDuration;
  durTimeData = durTimeData.split(":");
  let durationHourSelector = document.getElementById("durationHour");
  let durationMinuteSelector = document.getElementById("durationMinute");
  durationHourSelector.value = parseInt(durTimeData[0]);
  durationMinuteSelector.value = parseInt(durTimeData[1]);

  // fill in end date of event
  if (document.getElementById("endDate")) {
    let endDateSelector = document.getElementById("endDate");
    endDateSelector.valueAsDate = new Date(this.graph.edges[editData].dateEnd[0], this.graph.edges[editData].dateEnd[1]-1, this.graph.edges[editData].dateEnd[2]);
  }

  // fill in description of event
  let editDescriptionText = document.getElementById("eventDescription");
  editDescriptionText.innerText = this.graph.nodes[editData].text[1][2];
}

createNewEvent(day, month, year, add, editData) {
  // determine if we are on user calendar or
  if (this.urlParams.get('u') != null) {
    console.log('on user calendar');

    // find date that the form needs to edit the data for


    // add form to the calendar container html
    let calendar = document.getElementById("weeks");
    calendar.style.cssText += `
      display: flex;
      flex-direction: row
    `;

    // pop up html only gets added if a pop up is not already open
    if (this.windowActive == false) {
      let buttonStyle = `
        position: absolute;
        bottom: 10%;
        right: 10%;
        height: 8%;
        width: 35%;
        border-radius: 10px;
        background-color: #E2E2E2;
        border:none;
        cursor: pointer;
      `;

      let submitStyle = `
        position: absolute;
        bottom: 10%;
        left: 10%;
        height: 8%;
        width: 35%;
        border-radius: 10px;
        background-color: #E2E2E2;
        border: none;
        cursor: pointer;
      `;

      let formStyle = `
        width: 100%;
        display: flex;
        flex-direction: column;
      `;

      let labelStyle = `
        margin-right: 3px;
      `;

      let buttons;
      let create;
      let startDate = "";
      let deleteButton = "";

      if (add == 1) {
        // title and buttons for adding an event
        buttons = `
          <input type="button" onClick="app.calendar.addNewEvent(${month},${day},${year})" value="Add Event" style="${submitStyle}"/>
          <button onClick="app.calendar.popUpFormClose(${month},${day},${year})" style="${buttonStyle}">Cancel</button>
        `;
        create = `Create Event for ${month+1}-${day}-${year}`;
      } else if (add == 2) {
        // title and buttons for editing an event
        let deleteStyle = `
          width: 70%;
          height: 7%;
          background-color: #D45A5A;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
        `;
        console.log(this.graph[editData]);
        buttons = `
          <button onClick="app.calendar.editEvent(${month},${day},${year},${editData})" style="${submitStyle}">Save</button>
          <button onClick="app.calendar.popUpFormClose(${month},${day},${year})" style="${buttonStyle}">Cancel</button>
        `;
        create = "Edit Event";
        startDate = `
          <div style="display: flex; justify-content: center; margin: 5px;">
            <label for="startDate" style="${labelStyle}">Start Date: </label>
            <input id="startDate" type="date" />
          </div>
        `;
        deleteButton = `
          <button onClick="app.calendar.deleteEvent(${editData})" style="${deleteStyle}">Delete</button>
        `;
      }

      calendar.innerHTML += `
        <div id="popUpForm-${month+1}-${day}-${year}" style="display: none">
          <p>${create}</p>
          <form style="${formStyle}" id="popUpForm">
            <div style="display: flex; justify-content: center; margin: 5px;">
              <label for="eventName" style="${labelStyle}">Name: </label>
              <input id="eventName" type="text" placeholder="Event Name..." />
            </div>
            ${startDate}
            <div style="display: flex; justify-content: center; margin: 5px;">
              <label for="repeatType" style="${labelStyle}">Repeats: </label>
              <select id="repeatType" onChange="app.calendar.renderEndDateSelector()">
                <option value="never" selected>Never</option>
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div style="display: flex; justify-content: center; margin: 5px;">
              <label for="eventStartTime" style="${labelStyle}">Start Time: </label>
              <input id="eventStartTime" type="time" />
            </div>
            <div>
              <label for="duration" style="${labelStyle}">Duration: </label>
              <input id="durationHour" type="number" min="0" max="8"/>:<input id="durationMinute" type="number" min="0" max="59"/>
            </div>
            <div id="endDateDiv" style="display: flex; justify-content: center; margin: 5px;"></div>
            <div style="display: flex; flex-direction: column; margin-top: 5px; width: 80%; align-items: center;">
              <label for="eventDescription" style="${labelStyle}">Description</label>
              <textarea id="eventDescription" rows="11" cols="30" style="resize: none; border-radius: 5px;"></textarea>
            </div>
            ${deleteButton}
          </form>
          ${buttons}
        </div>
      `;

      // fill in form with existing data if we are editing an event
      if (editData != 0) {
        this.fillFormFromData(editData);
      }

    }
    // make pop up window appear
    let form = document.getElementById(`popUpForm-${month+1}-${day}-${year}`);
    if (this.windowActive == false) {
      form.style.cssText = `
        width: 200px;
        height: 560px;
        background-color: #B5B5B5;
        border-radius: 13px;
        margin-left: 20px;

        position: relative;
        opacity: 60%;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
      this.windowActive = true;
    }
  } else {
    // not on user calendar
    console.log('not on user calendar');
  }
}

// renders the end date selector based on chosen selected value from the repeat selector in pop up form
renderEndDateSelector() {
  let repeatSelector = document.getElementById("repeatType");
  let endDateDiv = document.getElementById("endDateDiv");
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

// Closes pop up window for creating event
popUpFormClose(month, day, year) {
  let popUp = document.getElementById(`popUpForm-${month+1}-${day}-${year}`);
  popUp.remove();
  this.windowActive = false;
}

// reads data in pop up form and creates node for app.calendar.graph data
createEventEdge(month,day,year,edit) { // edit is array where first value is boolean of 0 if we are creating and 1 if we are editing. Second value of edit is the node number to store in edge
  let doesRepeat = false;
  let name = document.getElementById("eventName").value;                 // name of the event
  let startTime = document.getElementById("eventStartTime").value;       // the start time of the event
  let durationHour = document.getElementById("durationHour").value;      // hours portion how the duration
  let durationMinute = document.getElementById("durationMinute").value;  // minutes portion of the duration
  let repeat = document.getElementById("repeatType").value;              // chosen value of how often to repeat event
  let offset = [];                                                       // for repeating events and their offset from first day
  let endDate;
  if (document.getElementById("endDate")) {
    endDate = document.getElementById("endDate").value;
    doesRepeat = true;
  } else {
    endDate = "";
    doesRepeat = false;
  }  // date event should stop repeating

  let startHour = startTime.split(":");
  // let endHour = endTime.split(":");
  while (startHour[0][0] == "0") {
    startHour[0] = startHour[0].substring(1);
  }

  // parse year month day from end date
  let endDateInfo = endDate.split("-");

  let startHourNum = parseInt(startHour[0],10);
  let startHourMin = parseInt(startHour[1],10);

  if (durationMinute.length < 2) durationMinute = "0" + durationMinute;

  let nodeNum
  if (edit[0] == 0) {
    // we are creating new edge
    nodeNum = app.calendar.graph.nodeNext;
  } else if (edit[0] == 1) {
    // we are editing existing edge
    nodeNum = edit[1];
  }


  // handle when to repeat event
  let dateEnd;
  if (repeat == "weekly") {
    console.log("weekly")
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

   let edge = {
     "nR":`${nodeNum}`
     ,"dateStart":[year,month+1,day,startHourNum,startHourMin]
     ,"dateEnd":dateEnd
     ,"timeZone":"ET"
     ,"timeDuration":`${durationHour}:${durationMinute}`
     ,"comments":`${name}`
     ,"repeat": `${repeat}`
     ,"daysOffset":offset
   };

   return edge;

  /* hard code edge
  let edge = {
    "nR":`${nodeNum}`
    ,"dateStart":[2022,7,26,11,0]
    ,"dateEnd":[2022,7,26]
    ,"timeZone":"ET"
    ,"timeDuration":`1:00`
    ,"comments":`test name`
  };
*/

  // let node = {
  //   "text":[
  //     ["h3","",`${name}`]
  //     ,["p","",`${description}`]
  //   ]
  // };
}

// returns a node for app.calendar.graph data
createEventNode() {
  let description = document.getElementById("eventDescription").value;   // description for the event
  let name = document.getElementById("eventName").value;                 // name of the event

  let node = {
    "text":[
      ["h3","",`${name}`]
      ,["p","",`${description}`]
    ]
  };
  return node;
}

async deleteEvent(editData) {
  delete this.graph.edges[editData];
  delete this.graph.nodes[editData];

  await this.processServerRefresh();
}

// edits existing event on the calendar
async editEvent(month,day,year, editData) {
  let edge = this.createEventEdge(month,day,year,[1,editData]);
  let node = this.createEventNode();

  // change start date if needed
  let newStartDate = document.getElementById("startDate").value;
  newStartDate = newStartDate.split('-');
  edge.dateStart[0] = parseInt(newStartDate[0]);
  edge.dateStart[1] = parseInt(newStartDate[1]);
  edge.dateStart[2] = parseInt(newStartDate[2]);

  app.calendar.graph.edges[parseInt(editData)] = edge;
  app.calendar.graph.nodes[parseInt(editData)] = node;

  await this.processServerRefresh();
  // // save new graph
  // const msg = {
  //   "server":"web"
  //  ,"msg":"uploadFile"
  //  ,"path":`/users/myWeb/events/${this.year}`
  //  ,"name":"_graph.json"
  //  ,"data": app.calendar.graph
  //  }

  //  const resp = await app.proxy.postJSON(JSON.stringify(msg));  // save
  //  alert(JSON.stringify(resp));   // was it succussful

  //  // display new calendar graph
  //  this.edgeToEvents();
  //  this.buildTable();
  //  this.tableUx.display();
  //  this.windowActive = false;
}

// adds new event to the calendar
async addNewEvent(month, day, year) {

  // create edges from values in pop up form
  let edge = this.createEventEdge(month,day,year,[0,-1]);
  let node = this.createEventNode();

  // find the numbers for the next node and edge
  let edgeNum = app.calendar.graph.edgeNext; // this should be the number of the edge
  let nodeNum = app.calendar.graph.nodeNext;

  // add and node edge to graph
  app.calendar.graph.edges[edgeNum] = edge;
  app.calendar.graph.nodes[nodeNum] = node;

  // increment edge and node counters
  app.calendar.graph.edgeNext += 1;
  app.calendar.graph.nodeNext += 1;

  await this.processServerRefresh();
  // save new graph
  // const msg = {
  //  "server":"web"
  // ,"msg":"uploadFile"
  // ,"path":`/users/myWeb/events/${this.year}`
  // ,"name":"_graph.json"
  // ,"data": app.calendar.graph
  // }

  // const resp = await app.proxy.postJSON(JSON.stringify(msg));  // save
  // alert(JSON.stringify(resp));   // was it succussful

  // // display new calendar graph
  // this.edgeToEvents();
  // this.buildTable();
  // this.tableUx.display();
  // this.windowActive = false;

  // this.popUpFormClose(month,day,year);
}

async processServerRefresh() {
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

  // display new calendar graph
  // this.edgeToEvents();
  // this.buildTable();
  // this.tableUx.display();
  location.reload();
  this.windowActive = false;
}

// Function to move to -- go from date 'a' to date 'b'
moveToDate(a) {
  const today = new Date();
  let timeBetweenDays;
  let weeksBetweenDays;
  let curDates = document.getElementsByTagName("td");       // grabs the table elements that hold the dates on calendar
  const currMonthDay = curDates[0].textContent.split("-");  // grabs the first date at the top left of calendar table

  // removes all characters that are not numbers
  for (var i = currMonthDay[1].length; i >= 0; i--) {
    if (currMonthDay[1][i] < '0' || currMonthDay[1][i] > '9') {
      currMonthDay[1] = currMonthDay[1].substring(0, currMonthDay[1].length - 1);
    }
  }

  // first date of page we are on at the moment
  var currentDate = new Date(today.getFullYear(), currMonthDay[0]-1, currMonthDay[1]);

  // see if the date is before the beginning of current year
  var isBeforeYear = false;
  if (currentDate.getMonth() == 11) {
    for (var i = 0; i < curDates.length; i++) {
      // console.log(curDates[i].textContent[0]+curDates[i].textContent[1]);
      if (curDates[i].textContent[0] == '1' && curDates[i].textContent[1] == '-') { isBeforeYear = true; break; }
    }
  }
  var curYear = (isBeforeYear) ? (today.getFullYear()-1) : today.getFullYear();
  currentDate.setFullYear(curYear);

  // find difference in time between dates
  timeBetweenDays = a.getTime() - currentDate.getTime(); // time between a and b in milliseconds

  // turn difference in milliseconds to weeks
  weeksBetweenDays = Math.floor(timeBetweenDays / (1000 * (60 * 60) * 24 * 7));

  // change paging row
  this.tableUx.paging.row += weeksBetweenDays;
  this.tableUx.displayData();
}

// Goes to page that has first day of chosen month
chooseMonth() {
  var today = new Date();                                   // get current date
  var myList = document.getElementById("months");           // grabs the month input selector

  // get date we want to jump to
  var targetDate = new Date(today.getFullYear(), myList.selectedIndex-1, 1); // target date to jump to

  this.moveToDate(targetDate);
  myList.selectedIndex = 0;
}

// jumpts to current date from anywhere on calendar
findToday() {
  // get current date (we want to jump to this date)
  var today = new Date();

  this.moveToDate(today);
}


// calendarClass  client-side
updatePictures() {   // walk through each row and display the next picture
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


// calendarClass - client-side
displayEvent() {  // user has clicked on a clalender event, show the details of the event on a seprate page
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


// calendarClass - client-side
HTMLforNode(  //
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


// calendarClass - client-side
displayRow(       // similar to widgetList
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
