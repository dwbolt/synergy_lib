const {sfc_table_class    } = await app.load("db/sfc-table/_.mjs"); //import  {sfc_table_class     } from '/_lib/db/sfc-table/_.mjs'     ;
const {table_class        } = await app.load("db/table_module.js");
const {format             } = await app.load("format/_.mjs");

//const {sfc_event_datetime } = await app.load("web_components/sfc-calendar/sfc-event-datetime/_.mjs");  // preload <sfc-event-datetime>
const {calendar_edit_class} = await app.load("web_components/sfc-calendar/edit_module.mjs");


export class calendar_class extends sfc_table_class {  // calendar_class  client-side
  /*
  open issues -------
test what happends if user is logged in but viewing sfc calender in sfcknox.org

  -----------
   Calendar data is stored in a database.
  
  */
  

constructor( // calendar_class  client-side
  ) {
  super();  // will create this.shadow
  this.table_events = new table_class();  // where mulit year calander and repeating events live will be used generate this.table

  this.css_add(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-calendar/_.css` );// load calendar css
  this.year      = new Date().getFullYear();              // default to current year, can be overriden when main is called.

  this.urlParams    = new URLSearchParams( window.location.search );  // read params send in the URL

  this.timezones = {"ET":-300, "CT":-360, "MT":-420, "PT":-480};  // value is in minutes
  this.GMT           = {}                 // place to store GMT start and end of events

  this.windowActive = false;        // toggle for pop up window

  this.table_urls    = [];
  this.event;         // undefined, where a two dim array first number in month, second number is day of month, hold one year's calendar
}

/*
async connectedCallback() { // calendar_class  client-side
                await super.connectedCallback(     ); // 
//{table_class} = await app.lib("db/table_module.mjs");
const {table_class} = await app.load("db/table_module.js");
this.table_events = new table_class();  // where mulit year calander and repeating events live will be used generate this.table
}
*/

async css_add(path) { // calendar_class  client-side
  //<link rel="stylesheet" href="app.css" />
  const element = document.createElement('link');
  element.href = path;
  element.rel = "stylesheet";
  this.shadow.appendChild(element);
}


async year_change(  // calendar_class  client-side
  event
  ){  
  await this.main(parseInt(event.target.value),);
}



calendar_add(url) {// calendar_class  client-side
  this.table_urls.push(url);  // list of calenders to display at one time, will need to add color code, just support one calender for now
}
  

async init() {  // calendar_class  client-side
  await this.table_events.load(this.table_urls[0]);   // for now just support one calendar
  this.edit         = new calendar_edit_class(this);  // class uses popup in table web component
}


async main( // calendar_class  client-side
year // 
) {
  if (year) {
    this.year = year;  // year of calendar to display - default is current year
  }

  // decide which calendar to load, users or main
  this.event_init(); // will fill out this.events - array for each day of the year 

  // display entire calendar
  this.login_status = await app.sfc_login.getStatus();  // cashe login status for duration of load and build
  //const event = app.urlParams.get('e'); // page to load
  const event = new URLSearchParams( window.location.search ).get('e'); // page to load
  if (event) {
    // display event
    this.event_display(event);
  } else {
    // display calendar
    this.calendar_display();
  }

  // add capther click events in the table div
  this.shadow.getElementById("table").addEventListener("click" , this.click.bind(this));
}


click(event){// calendar_class - client-side
  // user clicked inside the table, see if they clicke on a link
  let data;
  let data_list = ["data-create","data-event_id","data-edit"];
  for(let i=0; i<data_list.length; i++) {
    let attribute=data_list[i];
    data = event.target.getAttribute(attribute);
    if (data !== null) {
      switch (attribute) {
      case "data-create"  : this.edit.event_create(data); break;
      case "data-event_id": this.event_display(    data); break;
      case "data-edit"    : this.edit.event_edit(  data); break;
      default:                                            break;
      }
    } 
  }

  //this.event_display(event.target.dataset.event_id);
}


event_display(  // calendar_class - client-side
  pk // user clicked on calendar event link, pk is for event
){

  let event = this.table_events.get_object(pk);
  let link = "",description="";

  if (event.url !== undefined) {
    link = `<a href="${event.url}" target="_blank">More Info</a>`
  }
  if (event.description !== undefined) {
    description = event.description;
  }

  app.sfc_dialog.title_set(`<b>${event.name}</b>`);
  app.sfc_dialog.body_set(`
  <b>Event ID:</b> ${pk}<br>
  ${this.repeat_display(event)}
  <br>${description}
  <br><br>${link}`);
  app.sfc_dialog.show_modal();
}


repeat_display(  // calendar_class - client-side
  event // object
){
  let html = `<b>Time:</b>  ${this.edit.time2string(event.dateStart)} - ${this.edit.time2string(event.dateEnd)} <b>Duration:</b> ${event.timeDuration}<br><b>Repeats:</b> ${event.repeat}<br>`;
  switch(event.repeat) {
  case "yearly" : 
  case "never"  : break;
  case "weekly" : html += `${format.getDaysOfWeek(event.repeat_details)}<br>`; break;
  case "monthly": 
    for (let i = 0; i < event.repeat_details.length; i++) {
      html += `${event.repeat_details[i][1]} ${format.getDayOfWeek(event.repeat_details[i][0])}<br>`;
    }
    break;
  default       : html += `in calendar_class.repeat_display: repeat=${event.repeat}  pk=${event.pk}<br>`;
  }

  return html + "<br>";  // add blank line between repeat info and description
}


calendar_display(// calendar_class - client-side
) {
  // display calenda
  this.calendar_create();  // convert this.events to a table that can be displayed with web component sfc_table

  this.setStatusLineData( [
    `<button id="todayButton">Today</button>`
    ,`<select id="months" name="months"  ">
    <option value="weeks" selected>Viewing Weeks</option>
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
    ,`<input id="prev" type="button" value="Prev">`
    ,`<input id="next" type="button" value="Next">`
    ,"rows/page"
    ,`Year: <input id="year" type="text" value="${this.year}" size="4"/>`
  ]);  

  // add new status line to dom
  this.statusLine();

  for(let i=0; i<7; i++) {
    this.setColumnFormat(i,`class="day"`);  // set class of each day
  }

  this.display();
  let now = new Date();
  if ( this.year === now.getFullYear() ) {
    // if we are displaying current year, jump to today's date
    this.today_display();   // only need to do this is we are displaying the clander
  }
}


statusLine() {
  super.statusLine();  // display and addEventLisenter

    // connect dom element to class method
    this.shadow.getElementById("todayButton").addEventListener("click" , this.today_display.bind(this));
    this.shadow.getElementById("months"     ).addEventListener("change", this.month_chosen.bind(this));
    this.shadow.getElementById("prev"       ).addEventListener("click" , this.prev.bind(this));
    this.shadow.getElementById("next"       ).addEventListener("click" , this.next.bind(this));
    this.shadow.getElementById("year"       ).addEventListener("change", this.year_change.bind(this));
}

next( // calendar_class - client-side
) { //next page
  // next (day, weeks, month, year)
  const selected  = this.shadow.getElementById("months");  // where the user selects day, weeks, year, a month
  const time_unit = selected.value;
  switch (time_unit) {
    case "weeks":
      super.next();
      break;
  
    default:
      // assume month, move to next month
      this.month_chosen(1);
      break;
  }
}


prev( // calendar_class - client-side
) { //next page
  // next (day, weeks, month, year)
  const selected  = this.shadow.getElementById("months");  // where the user selects day, weeks, year, a month
  const time_unit = selected.value;
  switch (time_unit) {
    case "weeks":
      super.prev();
      break;
  
    default:
      // assume month, move to next month
      this.month_chosen(-1);
      break;
  }
}


month_chosen(  // calendar_class  client-side
  // Goes to page that has first day of chosen month
  change = 0 // maybe an int or an event
) {
  const selected          = this.shadow.getElementById("months");  // where the user selects day, weeks, year, a month
  if (selected.value === "weeks") {
    // do nothing but change mode for next / prev
    return;
  }

  if (typeof(change) === "number") {
    selected.selectedIndex += change;
  }

  const month     = parseInt(selected.value);

  const start = new Date(this.year, month  , 1);                                         // first day of month
  const end   = new Date(new Date(this.year, month+1, 1) - 1);                                     // last  day of month 
  this.moveToDate(start);  // move to new month
  
  // set rows/page so that the full month is displayed
  const row_start     = this.events[start.getMonth()+1][start.getDate()].row ;     // row of month start
  const row_end       = this.events[  end.getMonth()+1][  end.getDate()].row ;     // row of month end
  this.rows_displayed(row_end - row_start + 1);                                    // show all the weeks in the month
}


createDate(  // calendar_class  client-side
  // returns a starting or ending date for an event event
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
    if (edge.repeat_end === undefined) {
      return undefined;
    } else {
      return new Date(edge.repeat_end[0]   ,edge.repeat_end[1]-1  , edge.repeat_end[2]  , edge.repeat_end[3]+ parseInt(timeDuration[0]) , edge.repeat_end[4] - offset + parseInt(timeDuration[1]) );
    }
    break;

  default:
    // error
    alert(`error, file="calendar_module.js, method="createDate", type="${type}"`)
  }
}
  

async event_init( // calendar_class  client-side
) {
  // init events
  this.events =[]                  // this.events[1][12] for january 12 a list of event nodes for that day 
  for (let m=1; m<=12; m++) {
    this.events[m]=[]
    for (let d=1; d<=31; d++) {
      this.events[m][d] = {pks:[],row: undefined};
    }
  }

  // each event will generate at least one element in event list
  let pks =  this.table_events.get_PK()
  for (let i=0; i<pks.length; i++ ) {
    // generate GMT
    let pk = pks[i];
    let event = this.table_events.get_object(pk);
    this.GMT[pk]={};
    this.GMT[pk].start      = this.createDate(event,"start");  // start date time  
    this.GMT[pk].end        = this.createDate(event,"end" );   // end   date time  
    this.event_add(event);   // will fill out this.events[[][]...] one array for each day of week for the year
  }
}


event_add(  // calendar_class  client-side
event
) {
  
  if (event.repeat === "never") {
    this.one_add(event);
    return;
  }

  let a = event.repeat_end_date;
  if (a === undefined || a === null) {   
    // year not set, so set to end of current year
    a    = [this.year,12,31];
  } else if (a[0]=== null){
    // for some reason JSON.strigify([,1])  -> "[null,1]"
    a[0] = this.year;
  }
  //this.GMT[pk].repeat_end = this.createDate(event,"repeat" )
  this.GMT[event.pk].repeat_end = new Date(a[0],a[1]-1,a[2],this.GMT[event.pk].end.getHours(), this.GMT[event.pk].end.getMinutes()); 

  switch(event.repeat) {
  case "weekly":
    this.weekly_add(event)
    break;
  case "monthly":
    this.monthly_add (event)
    break;
  case "yearly":
    this.one_add(event);
    break;
  default:
      alert(`in calendar_class.event_add: repeat=${event.repeat}  pk=${event.pk}`);
  }
}


findDayInWeek( // calendar_class  client-side
  // Returns a Date object of the first instance of day of week in a month
  // ex -- returns the first tuesday in january
  month,
  day
) {
  var d = new Date(this.year,month,1); // set day for first day in month

  // walk until we find first instance of day of week in the month
  while (d.getDay() != day) {
    d.setDate(d.getDate() + 1);
  }

  return d;
}

  
one_add(  // calendar_class  client-side
  e  //
){
  const date =  this.GMT[e.pk].start;  //e.start
  this.events[date.getMonth()+1][date.getDate()].pks.push(e.pk);  // push key to edge associated with edge
}


weekly_add( // calendar_class  client-side
  event  // event
) {
  // walk the daysOffset, first entry should be 0;  we assume
  // repeat_details [0->sunday,2->tuesday ...] document structure ?
  const gmt = this.GMT[event.pk];
  event.repeat_details.forEach((day,i) => {  // walk each day in the week we are repeating
    let date =  new Date(this.year, gmt.start.getMonth(), gmt.start.getDate(),gmt.start.getHours(),gmt.start.getMinutes());  // create a copy of start date, for caleneder year
    if (day < date.getDay()) {
      date.setDate(date.getDate() + 7 - date.getDay());   // add days to date to get to Sunday
    }

    if (date.getDay()< day ) {
      date.setDate(date.getDate() + day - date.getDay()); // add days to get to correct day of week
    }

    while (date < gmt.repeat_end && date.getFullYear() === this.year) {  // walk each week in the year
      if (date<gmt.start) {
        // date is less that start date
        date.setDate(date.getDate() + 7);           // goto next week
      } else {
        this.events[date.getMonth()+1][date.getDate()].pks.push(event.pk);  // push key to event associated with event
        date.setDate(date.getDate() + (event.repeat_inc*7));                // get next week
      }
    }
  }); 
}


monthly_add (  // calendar_class  client-side
event // event record from calendar table
) {
  // walk the days, first entry should be 0;
  const start = this.GMT[event.pk].start;
  let monthOffset = 0;
  // walk to monthes to the end of the year
  for (let month = new Date(this.year, start.getMonth()               , 1,1,1) ;
           month < this.GMT[event.pk].repeat_end && month.getFullYear() === this.year;  
       // add an hour and 1 minute for the case month starts in daylight savings and the date is after daylight savings ends.
      month = new Date(this.year, start.getMonth()+ ++monthOffset, 1,1,1)) {
    
    /* walk weeks in month
    repeat_details [[0 throught 6 -> day number  31->on day, offset],[]...]
    [0,2] -> second Sunday of month
    [1,3] -> third Monday of month
    [1,-1] -> last Monday of month
    [1,-2] -> Next to last monday of month
    [31,1] -> 1st of the month
    [31,-1] -> last day of month
    [31,-10] -> 10 days before the end of the month
    */

    let eventDate;
    event.repeat_details.forEach((day, ii) => {  
      // day=[day number, week number] a positive week number measn 
        // day number 0 -> sunday & 6-> Saturday & 31 -> on day     : 
        //  [1,2] -> second monday of month
      if (day[0] === 31) {
        // repeat on a day
        if (0<day[1]) {
          // start at beggining of month
          debugger;
          eventDate = new Date(month.getTime() + offset*1000*60*60*24);
          this.events[eventDate.getMonth()+1][eventDate.getDate()].pks.push(event.pk);  // push key to event associated with event
        } else {
          // start at end of month
          debugger
          eventDate = new Date(this.year, start.getMonth()+monthOffset+1, day[1] ,1,1)        // goto next month and backup one day
          this.events[eventDate.getMonth()+1][eventDate.getDate()].pks.push(event.pk);  // push key to event associated with event
        }
      } else  if ( -1 < day[0] && day[0] < 7 ) {
        //repeat on a week
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
        eventDate = new Date(month.getTime() + offset*1000*60*60*24);
        if ( this.GMT[event.pk].start < eventDate && eventDate < this.GMT[event.pk].repeat_end) {
          this.events[eventDate.getMonth()+1][eventDate.getDate()].pks.push(event.pk);  // push key to event associated with event
        }
      } else {
        // error
        alert("error");
      }
    });
  }
}


calendar_create(  // calendar_class  client-side
) {   // convert this.events to a table that can be displayed with tableUX
  this.table         = new table_class();  // where calender will be stored 
  this.setSearchVisible(false);            // hide search
  this.setLineNumberVisible(false);        // hide row line numbers
  this.setRowNumberVisible(false);         // hide row numbers
  this.paging.lines = 3;                   // should use a method to do this

  const t      = this.table;  // t -> table we will put event data in to display
  // init metadata for table
  const fields = t.meta_get("fields");
  fields["0"]  = {"type":"html", "location": "column", "header":"Sunday"   };
  fields["1"]  = {"type":"html", "location": "column", "header":"Monday"   };
  fields["2"]  = {"type":"html", "location": "column", "header":"Tuesday"  };
  fields["3"]  = {"type":"html", "location": "column", "header":"Wednesday"};
  fields["4"]  = {"type":"html", "location": "column", "header":"Thursday" };
  fields["5"]  = {"type":"html", "location": "column", "header":"Friday"   };
  fields["6"]  = {"type":"html", "location": "column", "header":"Saturday" };

  t.set_select(["0","1","2","3","4","5","6"]);  // select all the fields

  const today     = new Date();
  const start     = new Date(this.year, 0, 1);   // current date/time
  const firstDate = new Date(this.year, 0, 1);
  const year      = start.getFullYear();
  start.setDate( start.getDate()  - start.getDay() ); // move start to Sunday, year could change if it is the first week of the yearedit

  // build weeks data to end of year
  let style;
  for (let x=0; start.getFullYear()<=year ;x++) {  // x is week of year
    for (let y=0; y<=6; y++) {                     // y is day of week
      if (start.getFullYear() === this.year) {
      // add days for week
      let m = start.getMonth()+1;
      let d = start.getDate();
      this.events[m][d].row = x;   // remember what row a date is on so we can quickly move to that date
      let add="";
      if ( this.login_status) {
        // user calendar, so allow adding new event
        add =`<a data-create="${start.getFullYear()}-${m}-${d}" class="pointer">+</a><br>`
      }
      style    = this.style_get(start, firstDate, today);  // set style of day depending on not part of current year, past, today, future,
      let html = `<div class="${style}"><b>${m}-${d} ${add}</b><br>`;

      // loop for all events for day [m][d]
      let eventList = this.events[m][d].pks.sort(this.sort.bind(this));   // list of pks
      for(let i=0;  i<eventList.length; i++ ) {
        let pk   = eventList[i];                        // get primary key
        let event = this.table_events.get_object(pk);    // get event at primary key
        let editButton = format.timeFormat(this.GMT[event.pk].start);
        if (this.login_status) {
          // we are on a user calendar
          //user = "&u=" + this.urlParams.get('u');
          editButton = `<a data-edit="${pk}" class="pointer">${editButton}</a> `;
        }
        
        let repeat_class = ""; 
               if(event.repeat == "weekly" ) {repeat_class = "repeat_weekly" ;
        } else if(event.repeat == "monthly") {repeat_class = "repeat_monthly";
        } else if(event.repeat == "yearly" ) {repeat_class = "repeat_yearly" ;}

          html += `${editButton} <a href="javascript:void(0)" data-event_id="${event.pk}" class="${repeat_class} pointer">${event.name}</a><br>`
      }

  
      // only add events for current year
      t.add_column_value(x.toString(),y.toString(), html + "</div>")
      }
      
      start.setDate( start.getDate() + 1 ); // move to next day
    }
  }

  this.set_model( this.table, "weekCal");    
}


sort(// calendar_class  client-side
// sort events for the day by time
   a // event id
  ,b // event id
  ){
  // sort by time
  const event_A = this.GMT[a].start;
  const event_B = this.GMT[b].start;
  const diffh  = event_A.getHours() - event_B.getHours();
  if (diffh === 0) {
    // same hour so look at minutes
    return event_A.getMinutes() - event_B.getMinutes()
  } else {
    return diffh;
  }
}
  

style_get(start, firstDate, today) {  // calendar_class  client-side
  if (start<firstDate || start.getFullYear()>this.year) {
    // day is before january 1st of this year  or     // day is after last day of year
    return "notYear"
  } else if (start.getMonth() == today.getMonth() && start.getDate() == today.getDate() && start.getFullYear() == today.getFullYear()) {
    return "today"  // tableUxClass will put class='past' in the TD tag
  } else if (start<today) {
    return "past"  // tableUxClass will put class='past' in the TD tag
  } else {
    return "future" 
  }
}


findDayInMonth(  // calendar_class  client-sid
  // This funciton returns an array with the first day being the index of the day in a week -- ex 0 for sunday and 1 for monday
  // The second element in array is the index of week in the month -- ex 1 for first week 2 for second week
  // EX: [2,4] would mean that the day is the 4th tuesday of the month
  date
) {

  let dayIndex = date.getDay();
  let weekIndex = Math.ceil(date.getDate() / 7);
  return [dayIndex , weekIndex];
}
  
  
async moveToDate( // calendar_class  client-side
    newDate // move to newDate from current date displayed on calendar
) {
  // see if we need to change year
  const year = newDate.getFullYear();
  if (this.year !== year) {
    await this.main(year);
  }
  // change paging row
  this.paging.row = this.events[newDate.getMonth()+1][newDate.getDate()].row ;
  this.displayData();
}
  
  
today_display( // calendar_class  client-side
// jumpts to current date from anywhere on calendar
) {
  // get current date (we want to jump to this date)
  const today = new Date();
  const year  = today.getFullYear();
  if (this.year === year) {
    // today is in the current calendar
    this.moveToDate(today);
  } else {
    // must change year to get there
    this.main(year)
  }
}
  

} // calendar_class  client-side  -end class



customElements.define("sfc-calendar", calendar_class);