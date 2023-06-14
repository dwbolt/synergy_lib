import  {formatClass    }   from '/_lib/format/formatModule.js'  ;
import  {proxyClass     }   from '/_lib/proxy/proxyModule.js'    ;
import  {dbClass        }   from '/_lib/db/dbModule.js'          ;
import  {tableUxClass   }   from '/_lib/UX/tableUxModule.js'     ;
import  {nodes2htmlClass}   from '/_lib/UX/nodes2htmlModule.js'  ;
import  {calendarEditClass} from '/_lib/UX/calendarEditModule.js';

class calendarClass {
  /*
   Calendar data is stored in a graph. Each graph has stores one year.  Edges hold dates and time and time zone.  Edges also hold if repeating information.  IE  weekly, monthly or yearly.
  
  High level methods are:
  
  //////////////////////////////// display methods
  constructor( // calendarClass  client-side
createDate
async loadEvents(
addEvents( 


  -----------
  main() is the starting point
  loadevents() loads the graph data and creates startGMT and endGMT attributes, and adds to this.events[mm][dd]
  buildTable() converts data from this.events[mm][dd] to table <this.db.getTable("weekCal")> for display in the weekly fromat

  displayRow()    converts node to html for displayed
  displayEvent()  // user has clicked on a clalender event, show the details of the
  
  createDate(    // crates starting or endingdate for an event edge
  updatePictures(list)    // walk through each row and display the next picture
  HTMLforNode(  //
   A users will see the events in their timezone.
   This may not only change the time but also the day, month or year for the viewer of the events
  
  */
  
   #appRef 
  
  constructor( // calendarClass  client-side
    dom
    ,appRef    // how ui calls this class
  ) {
      this.DOM     = dom;
      this.#appRef = appRef;

      const today  = new Date();
      this.year  = today.getFullYear();
      this.month = today.getMonth();

      this.graph = {};                         // where the events are stored in compact form
      this.edit  = new calendarEditClass(this);
      // need more though, this is here because calendar class has hardcoded this.format and app.proxy, but I'm using calendarClass is a seperate page too.

      this.format     = new formatClass();  // format time and dates
      this.proxy      = new proxyClass();   // loads graph data from server
      this.urlParams  = new URLSearchParams( window.location.search );  // read params send in the URL
  
      this.timezones = {"ET":-300, "CT":-360, "MT":-420, "PT":-480};
  
      this.eventYear;          // year of event to edit or add
      this.eventMonth;         // month of event to edit or add
      this.eventDay;           // day of event to edit or add
      this.eventData;          // number to access node or edge in data
      this.popUpHeight;        // holds the height of the pop up form
      this.numMonthDates = 4;  // holds number of dates a monthly repeating date can repeat on per month
      this.canSubmit = false;  // determines whether or not the form is ready to submit

  
      // need for both sfc web site and the stand alone page
      this.db      = new dbClass();       // create empty database
      this.db.tableAdd("weekCal");        // create empty table in database, is where events for calendar will be displayed.
  
      // tableUxClass("calendar"  is hardcoded, change at some point
      this.tableUx = new tableUxClass(dom,`${this.#appRef}.tableUx`); // create way to display table
      this.tableUx.setModel( this.db, "weekCal");                  // associate data with disply widget
      this.tableUx.paging.lines = 3;    // should use a method to do this
      this.windowActive = false;        // toggle for pop up window
      this.tableUx.setStatusLineData( [
        `<input type="button" id="todayButton" onClick="${this.#appRef}.findToday()" value="Today" />`
        ,"nextPrev"
        ,`<select name="months" id="months" onChange="${this.#appRef}.chooseMonth()">
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
        ,`rows/page: <input type="number" min="1" max="10" size=3 value="${this.tableUx.paging.lines}" onchange="${this.#appRef}.tableUx.changePageSize(this)"/>`
  
  
      ]);  // ,"tableName","rows","rows/page","download","tags", "firstLast"
  
      this.tableUx.setSearchVisible(false);                 // hide search
      this.tableUx.setLineNumberVisible(false);             // hide row line numbers
      this.tableUx.setRowNumberVisible(false);              // hide row numbers
  
      this.weeks2display = 2;                              // display 4 weeks of data at a time
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
setEventMonth(    val) {this.eventMonth  = val;   } // calendarClass  client-side
setEventYear(     val) {this.eventYear   = val;   }// calendarClass  client-side
setEventDay(      val) {this.eventDay    = val;   }// calendarClass  client-side
setPopUpHeight(   val) {this.popUpHeight = val;   }// calendarClass  client-side
setNumMonthDates( val) {this.numMonthDates = val; }// calendarClass  client-side
setCanSubmit(     val) {this.canSubmmit = val;    }// calendarClass  client-side
  
// accessors
getEventMonth(    ) {return this.eventMonth ;   }// calendarClass  client-side
getEventYear(     ) {return this.eventYear  ;   }// calendarClass  client-side
getEventDay(      ) {return this.eventDay   ;   }// calendarClass  client-side
getPopUpHeight(   ) {return this.popUpHeight;   }// calendarClass  client-side
getNumMonthDates( ) {return this.numMonthDates; }// calendarClass  client-side
getCanSubmit(     ) {return this.canSubmit;     }// calendarClass  client-side
  

async main( // calendarClass  client-side
url
) {
  // decide which calendar to load, users or main
  await this.loadEvents(url); // will fill out this.events - array for each day of the year 

  // display event or calendar
  this.edgeName = this.urlParams.get('e');
  if (this.edgeName === null) {
    // display entire calendar
    await this.buildTable();  // convert this.events to a table that can be displayed with tableUX

    // create a text month list
    // concatenate the month to the display
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    if (document.getElementById("heading")) {
      document.getElementById("heading").innerHTML += ` ${this.year}` + ` ${month[this.month]}`;
    } else {
      // assume it is the main page
      document.getElementById("heading1").innerHTML += ` ${this.year}`;
    }

    this.tableUx.display();
    this.findToday();   // only need to do this is we are displaying the clander
    document.getElementById("weeks").innerHTML += await app.proxy.getText("/_lib/UX/calendarEditForm.html");
  } else {
    // display event in calendar
    await this.displayEvent();
  }
}
  
  
createDate(  // calendarClass  client-side
  // returns a starting or ending date for an event edge
    edge  //
  ,end  //  true -> end time, add duration to start
  ,offsets = [0,0,0] // offset from start [yy,mm,dd]
) {
  let offset = this.timezones[edge.timeZone] + new Date(0).getTimezoneOffset();  // get offset from event timezone vs user timezone
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
  url   // pointer to graph event data
) {
  this.url   = url;
  this.graph = await app.proxy.getJSON(this.url);  

  // each edge will generate at least one element in and event list
  Object.keys(this.graph.edges).forEach((k, i) => {
    // generate startGMT, endGMT
    let e = this.graph.edges[k];  // edge we are processing
    e.startGMT = this.createDate(e,false);  // start date time
    e.endGMT   = this.createDate(e,true );  // end   date time
    this.addEvents(k);   // will fill out this.events[[][]...] one array for each day of week for the year
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


findDayInWeek( // calendarClass  client-side
  // Returns a Date object of the first instance of day of week in a month
  // ex -- returns the first tuesday in january
  month,
  day
) {
  var d = new Date(this.year,month,1); // set day for first day in month

  // walk until we find first instance of day of week in the month
  while (d.getDay() != day) {
    console.log('day ' + d.getDay());
    d.setDate(d.getDate() + 1);
  }

  return d;
}
  
  
addOneOf(  // calendarClass  client-side
  k  // this.graph.edges[k] returns the edge
){
  const date=this.graph.edges[k].startGMT
  this.events[date.getMonth()+1][date.getDate()].push(k);  // push key to edge associated with edge
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
      if (day[1] != 5) {
        offset += 7*(day[1]-1);               // move to correct on ie 1st, 2st, 3rd... day of week of the month
      } else {
        // day repeats on last day of the month
        // day is either on the 4th or 5th day for each month
        let d = this.findDayInWeek(month.getMonth()+1,day[0]); // find the first day of the week of the next month
        d.setDate(d.getDate() - 7);                            // subtract a week to get last day of week of this month
        let n = this.findDayInMonth(d);                        // find if it is the 4th of 5th instance of day of the week in the month
        offset += 7*(n[1]-1);                                  // calculate offset
      }
      let eventDate = new Date(month.getTime() + offset*1000*60*60*24);
      this.events[eventDate.getMonth()+1][eventDate.getDate()].push(k);  // push key to edge associated with edge
    });
    // goto next month
    month=this.createDate(edge,false,[0,++i,0]);
  }
}
  
async buildTable(  // calendarClass  client-side
) {   // converts calendar data from graph to a table
  const t        = this.db.getTable("weekCal");  // t -> table we will put event data in to display
  t.clearRows();
  t.setHeader( ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday "] );

  const today     = new Date();
  const start     = new Date(this.year, 0, 1);   // current date/time
  const firstDate = new Date(this.year, 0, 1);
  const year      = start.getFullYear();
  start.setDate( start.getDate()  - start.getDay() ); // move start to Sunday, year could change if it is the first week of the yearedit

  // build weeks data to end of year
  let style;
  this.login_status = await app.login.getStatus();  // cashe login status for duration of load and buil

  for (let x=0; start.getFullYear()<=year ;x++) {
    let row = []; // init week
    for (let y=0; y<=6; y++) {
      // add days for week
      let m = start.getMonth()+1;
      let d = start.getDate();

      let add="";
      if ( this.login_status) {
        // user calendar
        add =`<a onClick="${this.#appRef}.createNewEvent(${start.getFullYear()}, ${start.getMonth()}, ${start.getDate()})">+</a> `
      }
      style = this.style_get(start, firstDate, today);  // set style of day depending on not part of current year, past, today, future,
      let html = `<h5 ${style}>${m}-${d} ${add}</h5>`;

      // loop for all events for day [m][d]
      let eventList = this.events[m][d];
      for(let i=0;  i<eventList.length; i++ ) {
        let editButton = `${i+1} `;
        let edgeName = eventList[i];
        if (await this.login_status) {
          // we are on a user calendar
          //user = "&u=" + this.urlParams.get('u');
          editButton = `<a onClick="${this.#appRef}.editEvent(${edgeName})">${i+1}</a> `;
        }
        
        let repeat_class = ""; 
               if(this.graph.edges[edgeName].repeat == "weekly" ) {repeat_class = "repeat_weekly" ;
        } else if(this.graph.edges[edgeName].repeat == "monthly") {repeat_class = "repeat_monthly";
        } else if(this.graph.edges[edgeName].repeat == "yearly" ) {repeat_class = "repeat_yearly" ;}

        let nodeName = this.graph.edges[edgeName].nR
        if (typeof(nodeName) === "string") {
          // node is an interal node
          let user=""  // assume we are on main calendar
          html += `<p>${editButton}<a  href="/app.html?p=${app.page}&e=${edgeName}&d=${this.format.getISO(start)}${user}" target="_blank" class="${repeat_class}">${this.graph.nodes[nodeName].text[0][2]}</a></p>`
        } else {
          // external link
          html += `<p>${editButton}<a  href="${nodeName.url}"   target="_blank" class="${repeat_class}">${nodeName.text}</a></p>`
        }
      }

      row.push(html + "</br>")
      start.setDate( start.getDate() + 1 ); // move to next day
    }
    t.appendRow(row);  // append row to table
  }
}
  

style_get(start, firstDate,today) {  // calendarClass  client-side
  if (start<firstDate || start.getFullYear()>this.year) {
    // day is before january 1st of this year  or     // day is after last day of year
    return `data-parentAttribute="['class','notYear']"`
  } else if (start.getMonth() == today.getMonth() && start.getDate() == today.getDate() && start.getFullYear() == today.getFullYear()) {
    return `data-parentAttribute="['class','today']"`  // tableUxClass will put class='past' in the TD tag
  } else if (start<today) {
    return `data-parentAttribute="['class','past']"`  // tableUxClass will put class='past' in the TD tag
  } else {
    return  ''
  }
}


fillRepeatdays(  // calendarClass  client-side
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

  
createNewEvent(  // calendarClass  client-side
  // user clicked + to add new event on a particular day
    year
  ,month
  ,day          //
) {
  this.edit.createNewEvent(year,month,day);
}

  
editEvent(  // calendarClass  client-side
  edgeName  // string
) {
  this.edit.editEvent(edgeName);
}


findDayInMonth(  // calendarClass  client-sid
  // This funciton returns an array with the first day being the index of the day in a week -- ex 0 for sunday and 1 for monday
  // The second element in array is the index of week in the month -- ex 1 for first week 2 for second week
  // EX: [2,4] would mean that the day is the 4th tuesday of the month
  date
) {

  let dayIndex = date.getDay();
  let weekIndex = Math.ceil(date.getDate() / 7);
  return [dayIndex , weekIndex];
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
  
  
async displayEvent()  // calendarClass - client-side
{
  // display single event
  const list     = [];         // will contain list of nodes to display
  const nodeName = this.graph.edges[this.edgeName].nR; // get the main nodeName or object
  const date     = this.urlParams.get('d')             // get YYYY-MM-DD from the URL
  const startTime = new Date(this.graph.edges[this.edgeName].startGMT);  // Create new date object with the event start time
  
  // Create a formatted version of the start time using the formatClass
  const formattedStartTime = `<p>Start Time: ${this.format.timeFormat(startTime)} </p>`;

  list.push(nodeName+date);    // push node for this date, display it first, this nodeName may not exist
  list.push(nodeName);         // push the main node to display

  const nodes2html = new nodes2htmlClass(this.graph.nodes, this.DOM, this.graph.edges[this.edgeName]);
  await nodes2html.displayList(list);

  // add date to heading & formatted start time below the description
  document.getElementById('heading1').innerHTML  = "SFC Event On: " + date;
  document.getElementById('main'    ).innerHTML += formattedStartTime;
}
  

validateMinuteDuration(  // calendarClass - client-side
  // Validates the entered minute value within the popup 
  e
  ) {
    // Check the value is greater than 59 or less than 0
    if (e.value > 59) {
      e.value = 59;
    } else if (e.value < 0) {
      e.value = 0;
    }
}
  

} // calendarClass  client-side  -end class


export { calendarClass };