import  {formatClass    }   from '/_lib/format/format_module.js'  ;
import  {proxyClass     }   from '/_lib/proxy/proxy_module.js'    ;
import  {tableClass     }   from '/_lib/db/table_module.js'       ;
import  {tableUxClass   }   from '/_lib/db/tableUx_module.js'     ;
import  {nodes2htmlClass}   from '/_lib/UX/nodes2html_module.js'  ;
import  {calendarEditClass} from '/_lib/UX/calendarEdit_module.js';

class calendarClass {
  /*
   Calendar data is stored in a database.
  
  High level methods are:
  
  //////////////////////////////// display methods
  constructor( // calendarClass  client-side
createDate
addEvents( 


  -----------
  main() is the starting point
  table_build() converts data from this.events[mm][dd] to table for display in the weekly fromat

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
  this.canSubmit = false;  // determines whether or not the form is ready to submit

  this.GMT           = {}                 // place to store GMT start and end of events
  this.table_events  = new tableClass();  // where mulit year calander and repeating events live will be used generate this.table
  this.tableUx = new tableUxClass(dom,`${this.#appRef}.tableUx`); // create way to display table
  this.tableUx.paging.lines = 3;    // should use a method to do this
  this.windowActive = false;        // toggle for pop up window
  this.tableUx.setSearchVisible(false);                 // hide search
  this.tableUx.setLineNumberVisible(false);             // hide row line numbers
  this.tableUx.setRowNumberVisible(false);              // hide row numbers

  this.weeks2display = 2;                              // display 4 weeks of data at a time
  this.n_pic         = 0;
  this.table_urls    = [];

  // init every day with empty array
  this.events = undefined;
}

async year_change(dom){  // calendarClass  client-side
  await this.main(parseInt(dom.value),);
}

calender_add(url) {// calendarClass  client-side
  this.table_urls.push(url);  // list of calenders to display at one time, will need to add color code, just support one calender for now
}
  
// Mutators
setEventMonth(    val) {this.eventMonth  = val;   } // calendarClass  client-side
setEventYear(     val) {this.eventYear   = val;   }// calendarClass  client-side
setEventDay(      val) {this.eventDay    = val;   }// calendarClass  client-side
setPopUpHeight(   val) {this.popUpHeight = val;   }// calendarClass  client-side
setCanSubmit(     val) {this.canSubmmit = val;    }// calendarClass  client-side
  
// accessors
getEventMonth(    ) {return this.eventMonth ;   }// calendarClass  client-side
getEventYear(     ) {return this.eventYear  ;   }// calendarClass  client-side
getEventDay(      ) {return this.eventDay   ;   }// calendarClass  client-side
getPopUpHeight(   ) {return this.popUpHeight;   }// calendarClass  client-side
getCanSubmit(     ) {return this.canSubmit;     }// calendarClass  client-sid


async main( // calendarClass  client-side
year // 
) {
  this.year = year;  // year of calendar to display


  // decide which calendar to load, users or main
  await this.events_load(); // will fill out this.events - array for each day of the year 

  // display entire calendar
  await this.table_build();  // convert this.events to a table that can be displayed with tableUX

  // create a text month list
  // concatenate the month to the display
  const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  if (document.getElementById("heading")) {
    document.getElementById("heading").innerHTML += ` ${this.year}` + ` ${month[this.month]}`;
  } else {
    // assume it is the main page
    //document.getElementById("heading1").innerHTML += ` ${this.year}`;
  }

  this.tableUx.setStatusLineData( [
    `<input type="button" id="todayButton" onClick="${this.#appRef}.findToday()" value="Today" />`
    ,`<select name="months" id="months" onChange="${this.#appRef}.month_chosen()">
    <option value="nullMonth" selected>Viewing Weeks</option>
    <option value="0">01 January</option>
    <option value="1">02 February</option>
    <option value="2">03 March</option>
    <option value="3">04 April</option>
    <option value="4">05 May</option>
    <option value="5">06 June</option>
    <option value="6">07 July</option>
    <option value="7">08 August</option>
    <option value="8">09 September</option>
    <option value="9">10 October</option>
    <option value="10">11 November</option>
    <option value="11">12 December</option>
     </select>`
    ,"nextPrev"
    ,"rows/page"
    ,`Year: <input type="text" value="${this.year}" size="4" onchange="${this.#appRef}.year_change(this)"/>`
    //`Year: <input type="number" value="${this.year}" oninput="${this.#appRef}.year_change(this)"/>`
  ]);  // ,"tableName","rows","rows/page","download","tags", "firstLast"

  for(let i=0; i<7; i++) {
    this.tableUx.setColumnFormat(i,`class="day"`);  // set class of each day
  }

  this.tableUx.display();
  this.tableUx.statusLine();  
  this.findToday();   // only need to do this is we are displaying the clander

    // display event in calendar
    //this.edgeName = this.urlParams.get('e');
    //await this.displayEvent();

}


createDate(  // calendarClass  client-side
  // returns a starting or ending date for an event edge
    edge  //
  ,type  //  "start" -> start date, "end" -> end time, "repeat" -> end of repeat 
  ,offsets = [0,0,0] // offset from start [yy,mm,dd]
) {
  let offset = this.timezones[edge.timeZone] + new Date(0).getTimezoneOffset();  // get offset from event timezone vs user timezone
  let timeDuration = edge.timeDuration.split(":");                         // timeDuration[0] is hours  timeDuration[1] is minutes
  switch (type) {
  case "start":
    return new Date(edge.dateStart[0] +offsets[0] ,edge.dateStart[1]-1 +offsets[1], edge.dateStart[2] +offsets[2], edge.dateStart[3], edge.dateStart[4] - offset);
    break;

  case "end":
    return new Date(edge.dateEnd[0]   ,edge.dateEnd[1]-1  , edge.dateEnd[2]  , edge.dateStart[3]+ parseInt(timeDuration[0]) , edge.dateStart[4] - offset + parseInt(timeDuration[1]) );
    break;

  case "repeat":
    return new Date(edge.repeat_end_date[0]   ,edge.repeat_end_date[1]-1  , edge.repeat_end_date[2]  , edge.repeat_end_date[3]+ parseInt(timeDuration[0]) , edge.repeat_end_date[4] - offset + parseInt(timeDuration[1]) );
    break;

  default:
    // error
    alert(`error, file="calendar_module.js, method="createDate", type="${type}"`)
  }
}
  

async events_load( // calendarClass  client-side
//table_url
) {
  this.events =[]                  // this.events[1][12] for january 12 a list of event nodes for that day - expanded from graph
  for (let m=1; m<=12; m++) {
    this.events[m]=[]
    for (let d=1; d<=31; d++) {
      this.events[m][d] = {pks:[],row: undefined};
    }
  }

  await this.table_events.load(this.table_urls[0]);   // for now just support one calendar

  // each edge will generate at least one element in and event list
  let pks =  this.table_events.get_PK()
  for (let i=0; i<pks.length; i++ ) {
    // generate GMT
    let pk = pks[i];
    let e = this.table_events.get_object(pk);
    this.GMT[pk]={};
    this.GMT[pk].start = this.createDate(e,"start");  // start date time  
    this.GMT[pk].end   = this.createDate(e,"end" );   // end   date time  
    this.addEvents(e);   // will fill out this.events[[][]...] one array for each day of week for the year
  }
}


addEvents(  // calendarClass  client-side
e  // event
) {
  
  if (e.repeat === "never") {
    this.addOneOf(e);
    return;
  }

  let a = e.repeat_end_date;
  if (a === undefined) {
    // year not set, so set to end of current year
    a    = [this.year,12,31];
  }
  this.GMT[e.pk].end_repeat = new Date(a[0],a[1]-1,a[2],this.GMT[e.pk].end.getHours(), this.GMT[e.pk].end.getMinutes()); 

  switch(e.repeat) {
  case "weekly":
    this.addWeekly(e)
    break;
  case "monthly":
    this.addMonthly(e)
    break;
  case "yearly":
    this.addOneOf(e);
    break;
  default:
      alert(`in calendarClass.addEvents: repeat=${e.repeat}  pk=${e.CTpk}`);
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
  e  // this.graph.edges[k] returns the edge
){
  const date =  this.GMT[e.pk].start;  //e.start
  this.events[date.getMonth()+1][date.getDate()].pks.push(e.pk);  // push key to edge associated with edge
}


addWeekly( // calendarClass  client-side
  edge  // event
) {
  // walk the daysOffset, first entry should be 0;  we assume
  edge.weekdays.forEach((day,i) => {  // walk each day in the week we are repeating
    let date =  new Date(this.GMT[edge.pk].start.getTime());  // create a copy of start date
    if (day < date.getDay()) {
      date.setDate(date.getDate() + 7 - date.getDay());   // add days to date to get to Sunday
    }

    if (date.getDay()< day ) {
      date.setDate(date.getDate() + day - date.getDay()); // add days to get to correct day of week
    }

    while (date < this.GMT[edge.pk].end_repeat && date.getFullYear() === this.year) {
      this.events[date.getMonth()+1][date.getDate()].pks.push(edge.pk);  // push key to edge associated with edge
      date.setDate(date.getDate() + 7);   // get next week
    }
  }); 
}


addMonthly(  // calendarClass  client-side
edge// 
) {
  // walk the days, first entry should be 0;
  //const edge = this.graph.edges[k];
  const start = this.GMT[edge.pk].start;
  let monthOffset = 0;
  // walk to monthes to the end of the year
  for (let month = new Date(start.getFullYear(), start.getMonth()               , 1,1,1) ;
       month < edge.endGMT_repeat && edge.endGMT_repeat.getFullYear() === this.year;  
       // add an hour and 1 minute for the case month starts in daylight savings and the date is after daylight savings ends.
        month = new Date(start.getFullYear(), start.getMonth()+ ++monthOffset, 1,1,1)) {
    
    // walk weeks in month
    edge.days.forEach((day, ii) => {  // day=[day number, week number] day number 0 -> sunday     :  [1,2] -> second monday of month
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
      if (eventDate<edge.endGMT_repeat) {
        // eventData is less than the repeat end end date
        this.events[eventDate.getMonth()+1][eventDate.getDate()].pks.push(edge.pk);  // push key to edge associated with edge
      }
    });
  }
}


async table_build(  // calendarClass  client-side
) {   // converts calendar data from graph to a table
  this.table         = new tableClass();  // where calender will be displayed
  this.tableUx.set_model( this.table, "weekCal");     

  const t      = this.table;  // t -> table we will put event data in to display
  // init metadata for table
  const fields = t.meta_get("fields");
  fields["0"]  = {"header":"Sunday"   ,"location": "column"};
  fields["1"]  = {"header":"Monday"   ,"location": "column"};
  fields["2"]  = {"header":"Tuesday"  ,"location": "column"};
  fields["3"]  = {"header":"Wednesday","location": "column"};
  fields["4"]  = {"header":"Thursday" ,"location": "column"};
  fields["5"]  = {"header":"Friday"   ,"location": "column"};
  fields["6"]  = {"header":"Saturday" ,"location": "column"};

  t.set_select(["0","1","2","3","4","5","6"]);  // select all the fields

  const today     = new Date();
  const start     = new Date(this.year, 0, 1);   // current date/time
  const firstDate = new Date(this.year, 0, 1);
  const year      = start.getFullYear();
  start.setDate( start.getDate()  - start.getDay() ); // move start to Sunday, year could change if it is the first week of the yearedit

  // build weeks data to end of year
  let style;
  this.login_status = await app.login.getStatus();  // cashe login status for duration of load and build

  for (let x=0; start.getFullYear()<=year ;x++) {  // x is week of year
    for (let y=0; y<=6; y++) {                     // y is day of week
      if (start.getFullYear() === this.year) {
      // add days for week
      let m = start.getMonth()+1;
      let d = start.getDate();
      this.events[m][d].row = x;   // remember what row a date is on so we can quickly move to that date

      let add="";
      if ( this.login_status) {
        // user calendar
        add =`<a onClick="${this.#appRef}.edit.createNewEvent(${start.getFullYear()}, ${m}, ${d})">+</a> `
      }
      style = this.style_get(start, firstDate, today);  // set style of day depending on not part of current year, past, today, future,
      let html = `<p ${style}><b>${m}-${d} ${add}</b></p>`;

      // loop for all events for day [m][d]
      let eventList = this.events[m][d].pks.sort(this.sort.bind(this));   // list of pks
      for(let i=0;  i<eventList.length; i++ ) {
        let pk   = eventList[i];                        // get primary key
        let edge = this.table_events.get_object(pk);    // get event at primary key
        let editButton = app.format.timeFormat(this.GMT[edge.pk].start);
        if (this.login_status) {
          // we are on a user calendar
          //user = "&u=" + this.urlParams.get('u');
          editButton = `<a onClick="${this.#appRef}.editEvent(${pk})">${editButton}</a> `;
        }
        
        let repeat_class = ""; 
               if(edge.repeat == "weekly" ) {repeat_class = "repeat_weekly" ;
        } else if(edge.repeat == "monthly") {repeat_class = "repeat_monthly";
        } else if(edge.repeat == "yearly" ) {repeat_class = "repeat_yearly" ;}

        html += `${editButton} <a href="${edge.url}" target="_blank" class="${repeat_class}">${edge.name}</a><br>`
      }

  
      // only add events for current year
      t.add_column_value(x.toString(),y.toString(), html + "</br>")
      }
      
      start.setDate( start.getDate() + 1 ); // move to next day
    }
  }
}


sort(// calendarClass  client-side
// sort events for the day by time
   a // edge id
  ,b // edge id
  ){
  // sort by time
  const edge_A = this.GMT[a].start;
  const edge_B = this.GMT[b].start;
  const diffh  = edge_A.getHours() - edge_B.getHours();
  if (diffh === 0) {
    // same hour so look at minutes
    return edge_A.getMinutes() - edge_B.getMinutes()
  } else {
    return diffh;
  }
}
  

style_get(start, firstDate, today) {  // calendarClass  client-side
  if (start<firstDate || start.getFullYear()>this.year) {
    // day is before january 1st of this year  or     // day is after last day of year
    return `data-parentAttribute="['class','notYear']"`
  } else if (start.getMonth() == today.getMonth() && start.getDate() == today.getDate() && start.getFullYear() == today.getFullYear()) {
    return `data-parentAttribute="['class','today']"`  // tableUxClass will put class='past' in the TD tag
  } else if (start<today) {
    return `data-parentAttribute="['class','past']"`  // tableUxClass will put class='past' in the TD tag
  } else {
    return `data-parentAttribute="['class','future']"` 
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
  // change paging row
  this.tableUx.paging.row = this.events[newDate.getMonth()+1][newDate.getDate()].row ;
  this.tableUx.displayData();
}
  
  
month_chosen(  // calendarClass  client-side
  // Goes to page that has first day of chosen month
) {
  const myList = document.getElementById("months");           // grabs the month input selector
  this.moveToDate(new Date(this.year, myList.value, 1));
  //myList.selectedIndex = 0;
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
  const startTime = new Date(this.GMT[edges.pk].start);  // Create new date object with the event start time
  
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
  

} // calendarClass  client-side  -end class


export { calendarClass };