const {table_class        } = await app.load("MVC/table/m.mjs");
const {format             } = await app.load("format/_.mjs");
const {calendar_edit_class} = await app.load("web_components/sfc-calendar/edit_module.mjs");


export class calendar_class extends HTMLElement {  // calendar_class  client-side

/*

open issues -------
test what happends if user is logged in but viewing sfc calender in sfcknox.org

*/
  

constructor( // calendar_class  client-side
  ) {
  super();  // HTMLElement constructor
  this.shadow = this.attachShadow({ mode: "closed" });   // create a shadow dom   
  this.shadow.innerHTML =  `<sfc-table></sfc-table>`;    // display calendar
 
  this.table_view   = this.shadow.querySelector("sfc-table");
  this.table_events = new table_class();  // where mulit year calander and repeating events live will be used generate this.table

  this.year      = new Date().getFullYear();              // default to current year, can be overriden when main is called.
  this.timezones = {"ET":-300, "CT":-360, "MT":-420, "PT":-480};  // value is in minutes
  this.GMT           = {}                 // place to store GMT start and end of events

  this.windowActive = false;        // toggle for pop up window

  this.table_urls    = [];
  this.event;         // undefined, where a two dim array first number in month, second number is day of month, hold one year's calendar
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
  // load calendar table
  const msg = await this.table_events.load(this.table_urls[0],[404]); // for now just support one calendar
  if (msg.status === 200) {
    // calender events loaded
    this.edit = new calendar_edit_class(this)                   ; // class uses popup in table web component
  } else if (msg.status === 404) {
    // user calendar database not found, give user the option to creat it
    alert("do you want to create table")

  } else {
    // error not handled, load method should have done alert
  }
  await  app.web_components.check(this.shadow);  // add web componengs
  this.table_view.callback_add("display_data","end", this.class_apply.bind(this) );   // set class of each day after display
}


async main( // calendar_class  client-side
year // to display calander for
) {
  // load calendar css
  await this.table_view.css_add(`${new URL(import.meta.url).origin}/_lib/web_components/sfc-calendar/_.css` );

  if (year) {
    this.year = year;  // year of calendar to display - default is current year
  }

  // load web_componets
  await  app.web_components.check(this.shadow);

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
  this.table_view.shadow.getElementById("table").addEventListener("click" , this.click.bind(this));
}


click(event){// calendar_class - client-side
  // user clicked inside the table, see if they clicke on a link
  let data,data_parent;
  let data_list = ["data-create","data-event_id","data-edit"];
  for(let i=0; i<data_list.length; i++) {
    let attribute=data_list[i];
    data        = event.target.getAttribute(attribute);
    data_parent = event.target.parentElement.getAttribute(attribute);
    if (data === null) {
      data = data_parent;  // event_create was moved to parent element
    }
    if (data !== null) {
      switch (attribute) {
      case "data-create"  : this.edit.event_create(data); break;
      case "data-event_id": this.event_display(    data); break;
      case "data-edit"    : this.edit.event_edit(  data); break;
      default:                                            break;
      }
    } 
  }
}


event_display(  // calendar_class - client-side
  pk // user clicked on calendar event link, pk is for event
){

  let event = this.table_events.get_object(pk);
  let link = "",description="";

  if (event.url !== undefined) {
    link = `<a href="${event.url}" onclick="app.sfc_dialog.close()" target="_blank">More Info</a> <br>will show in new window/tab <br>will close dialog`
  }
  if (event.description !== undefined) {
    description = event.description;
  }

  app.sfc_dialog.set("title",`<b>${event.name}</b>`);
  app.sfc_dialog.set("body",`
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
  this.table_view.change_number_lines(6);             // should use a method to do this

  this.table_view.setStatusLineData( [
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
  this.table_view.display();  // will display first of year

  // connect dom element to class method
  this.table_view.shadow.getElementById("todayButton").addEventListener("click" , this.today_display.bind(this));
  this.table_view.shadow.getElementById("months"     ).addEventListener("change", this.month_chosen.bind(this));
  this.table_view.shadow.getElementById("prev"       ).addEventListener("click" , this.prev.bind(this));
  this.table_view.shadow.getElementById("next"       ).addEventListener("click" , this.next.bind(this));
  this.table_view.shadow.getElementById("year"       ).addEventListener("change", this.year_change.bind(this));

  let now = new Date();
  if ( this.year === now.getFullYear() ) {
    // if we are displaying current year, jump to today's date
    this.today_display();   // only need to do this is we are displaying the clander
  } else {
    this.moveToDate(new Date(this.year, 0,1));  // first of year
  }
}


next( // calendar_class - client-side
) { //next page
  // next (day, weeks, month, year)
  const selected  = this.table_view.shadow.getElementById("months");  // where the user selects day, weeks, year, a month
  const time_unit = selected.value;
  switch (time_unit) {
    case "weeks":
      if (this.table_view.next() === false) {
        // at end of year, so goto next year
        this.main(++this.year);
      }
      break;
  
    default:
      // assume month, move to next month
      this.month_chosen(1);
      break;
  }
}


async prev( // calendar_class - client-sides
) {
  let selected  = this.table_view.shadow.getElementById("months");  // where the user selects day, weeks, year, a month
  const time_unit = selected.value;
  switch (time_unit) {
    case "weeks":
      if (this.table_view.prev() === false) {
        const rows_per_page = parseInt(this.table_view.shadow.getElementById("rows_per_page").value);  // move value to new year
        await this.main(--this.year); // at start of year, so goto prevous year
        this.table_view.shadow.getElementById("rows_per_page").value = rows_per_page;
        this.table_view.paging.row  = this.table.meta.PK_max -  rows_per_page + 1 ;
        this.table_view.display_data();  // now display last weeks
      }
      break;
  
    default:
      // assume month, move to previous  month
      if (this.month_chosen(-1)=== false) {
        // moving previous year faild, so move to previous year
        await this.main(--this.year);  // move to previous year
        selected  = this.table_view.shadow.getElementById("months");
        selected.value = "11"; // change value to december
        selected.dispatchEvent( new Event("change") );  // simulate user 
      }
      break;
  }
}


month_chosen(  // calendar_class  client-side
  // Goes to page that has first day of chosen month
  change = 0 // maybe an int or an event
) {
  const selected          = this.table_view.shadow.getElementById("months");  // where the user selects day, weeks, year, a month
  if (selected.value === "weeks") {
    // do nothing but change mode for next / prev
    return true;
  }

  if (typeof(change) === "number") {
    selected.selectedIndex += change;
    if ( selected.selectedIndex < 1 || 12 < selected.selectedIndex) {
      // outside of year, so return false;
      return false;
    }
  }

  const month     = parseInt(selected.value);

  const start = new Date(this.year, month  , 1);                                         // first day of month
  const end   = new Date(new Date(this.year, month+1, 1) - 1);                                     // last  day of month 
  this.moveToDate(start);  // move to new month
  
  // set rows/page so that the full month is displayed
  const row_start     = this.events[start.getMonth()+1][start.getDate()].row ;     // row of month start
  const row_end       = this.events[  end.getMonth()+1][  end.getDate()].row ;     // row of month end
  return this.table_view.rows_displayed(row_end - row_start + 1);                                    // show all the weeks in the month
}


createDate(  // calendar_class  client-side
  // returns a starting or ending date for an event event
   event //
  ,type  //  "start" -> start date, "end" -> end time, "repeat" -> end of repeat 
  ,offsets = [0,0,0] // offset from start [yy,mm,dd]
) {
  let offset = this.timezones[event.timeZone] + new Date(0).getTimezoneOffset();  // get offset from event timezone vs user timezone
  let timeDuration = event.timeDuration.split(":");                         // timeDuration[0] is hours  timeDuration[1] is minutes
  switch (type) {
  case "start":
    return new Date(event.dateStart[0] +offsets[0] ,event.dateStart[1]-1 +offsets[1], event.dateStart[2] +offsets[2], event.dateStart[3], event.dateStart[4] - offset);
    break;

  case "end":
    return new Date(event.dateEnd[0]   ,event.dateEnd[1]-1  , event.dateEnd[2]  , event.dateStart[3]+ parseInt(timeDuration[0]) , event.dateStart[4] - offset + parseInt(timeDuration[1]) );
    break;

  case "repeat":
    if (event.repeat_end_date === undefined) {
      return undefined;
    } else {
      let year = event.repeat_end_date[0];
      if (year === null){
    // for some reason JSON.strigify([,1])  -> "[null,1]"
        year = this.year;
      }
      return new Date(year   ,event.repeat_end_date[1]-1  , event.repeat_end_date[2]  , event.repeat_end_date[3]+ parseInt(timeDuration[0]) 
      , event.repeat_end_date[4] - offset + parseInt(parseInt(timeDuration[0][1]) );
    }
    break;

  default:
    // error
    alert(`error, file="calendar_module.js, method="createDate", type="${type}"`)
  }
}
  

async event_init( // calendar_class  client-side
) {
  // init events array, will be used to create calendar table module 
  this.events =[]                  // this.events[1][12] for january 12 a list of event nodes for that day 
  for (let m=1; m<=12; m++) {
    this.events[m]=[]
    for (let d=1; d<=31; d++) {
      this.events[m][d] = {pks:[],row: undefined};
    }
  }

  // each event will generate at least one element in event list
  // the event list is organized by month/day and will be used to generate a table model
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
  } 
  this.GMT[event.pk].repeat_end = this.createDate(event,"repeat" );

  switch(event.repeat) {
  case "weekly":
    this.weekly_add(event)
    break;
  case "monthly":
    try {
      this.monthly_add(event)
    } catch (error) {
      alert(error + new Error().stack);
    }

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
  if (this.year === e.dateStart[0]) {
    // make sure event is this year
    const date =  this.GMT[e.pk].start;  //e.start
    this.events[date.getMonth()+1][date.getDate()].pks.push(e.pk);  // push key to edge associated with edge
  }
}


weekly_add( // calendar_class  client-side
  event  // event
) {
  if (this.year < event.dateStart[0] ) {
    // this event starts after this.year so nothing to do
    return;
  }

  // walk the daysOffset, first entry should be 0;  we assume
  // repeat_details [0->sunday,2->tuesday ...] document structure ?
  const gmt = this.GMT[event.pk];
  let date;
  event.repeat_details.forEach((day,i) => {  // walk each day in the week we are repeating
    if (event.dateStart[0] === this.year) {
      // event starts in this year
      date =  new Date(this.year, gmt.start.getMonth(), gmt.start.getDate(),gmt.start.getHours(),gmt.start.getMinutes());  // create a copy of start date, for caleneder year
    } else {
      // event started in previous year, so start january 1, 
      date =  new Date(this.year, 0, 1, gmt.start.getHours(),gmt.start.getMinutes());  // create a copy of start date, for caleneder year
    }

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
) {            // year, month, day, hour, minue, seconds, millisec
  const year_start = new Date(this.year, 0, 1, 0, 0 ,0 ,0);  // start of year we are creating calendar for
  const year_end   = new Date(new Date(this.year+1,0)-1  );  // end of the year of the callander we are displaying
  if (this.GMT[event.pk].end < year_start    ) {return    ;} // event ended before start of year, event not part of this.year calendar
  if (year_end < this.GMT[event.pk].row_start) {return    ;} // event starts after this year    , event not part of this.year calendar     

  // event has some days in this year
  const event_start = this.GMT[event.pk].start;
  // walk to months to the end of the year
  for ( let months = 0; months<12; months++) {
    const month_start =          new Date(this.year, months  , 1)    ; // start of month
    const month_end   = new Date(new Date(this.year, months+1, 1) -1); // end   of month
    if (month_end                     < event_start) {continue ;}      // no events in this month, so skip to next
    if (this.GMT[event.pk].repeat_end < month_start) {return   ;}      // no more events in this year, now more work

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

    // event may be 1st and 3rd wedsday of month, walk each repeat of month
    for(let i=0; i<event.repeat_details.length; i++){
      let event_day;
      const day = event.repeat_details[i];
      if (day[0] === 31) {
        // repeat on a day
        if (0<day[1]) {
          // start at beggining of month
          event_day = day[1];
        } else {
          // day[1] is a negative number, start at end of month
          let d = new Date(this.year, months+1, day[1]+1)        // goto next month and backup day[1] days
          event_day = d.getDate();
        }
      } else  if ( -1 < day[0] && day[0] < 7 ) {
        // repeat on a week
        // find first target day of week in the the month
        if        (     0 < day[1]) {
          // counting from start of month
          let offset = day[0] - month_start.getDay(); // day[0] is the target day of week - day of the week month starts on
          if (offset<0) {offset += 7;}                // target day of week in the prior week, so add 7 days
          offset += 7*(day[1]-1);                     // and number weeks foward
          event_day = 1 + offset;
        } else if (day[1] < 0     ) {
          // counting from start of next month, backward
          offset = month_end.getDay(); // day[0] is the target day of week - day of the week month starts on
          if (offset<0) {offset -= 7;}          // target day of week in in the next week, so add 7 days
          offset += 7*(day[1]-1);     
          event_day = month_end.getDate() + offset // convert offset in days to milli seconds and to first day of month
        } else {
          // error day[1] = 0;  default to end of month or first of month
        }
       } 
      this.events[months+1][event_day].pks.push(event.pk);  // push key to event associated with event
    }
  }
}


calendar_create(  // calendar_class  client-side
) {   // convert this.events to a table that can be displayed with tableUX
  this.table         = new table_class();  // where calender will be stored 
  this.table_view.setSearchVisible(false);            // hide search
  this.table_view.setLineNumberVisible(false);        // hide row line numbers
  this.table_view.setRowNumberVisible(false);         // hide row numbers

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
        add =`<a class="pointer">+</a><br>`
      }
      let html = `<b data-create="${app.format.getISO(start)}">${m}-${d} ${add}</b><br>`;

      // loop for all events for day [m][d]
      let eventList = this.events[m][d].pks.sort(this.sort.bind(this));   // list of pks
      for(let i=0;  i<eventList.length; i++ ) {
        let pk   = eventList[i];                        // get primary key
        let event = this.table_events.get_object(pk);    // get event at primary key
        let editButton = format.timeFormat(this.GMT[event.pk].start);
        if (this.login_status) {
          // we are on a user calendar
          editButton = `<a data-edit="${pk}" class="pointer">${editButton}</a> `;
        }
        
        let repeat_class = ""; 
               if(event.repeat == "weekly" ) {repeat_class = "repeat_weekly" ;
        } else if(event.repeat == "monthly") {repeat_class = "repeat_monthly";
        } else if(event.repeat == "yearly" ) {repeat_class = "repeat_yearly" ;}

          html += `${editButton} <a href="javascript:void(0)" data-event_id="${event.pk}" class="${repeat_class} pointer">${event.name}</a><br>`
      }

  
      // only add events for current year
      t.add_column_value(x.toString(),y.toString(), html);
      }
      
      start.setDate( start.getDate() + 1 ); // move to next day
    }
  }

  this.table_view.set_model( this.table, "weekCal");    
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
  

class_apply(
   div_data  // div_data[0][1] is first day of week row one
  ) {
  const rows = this.table_view.paging.lines // weeks to display

  for(let r=0; r<rows; r++) {
   for (let c=0; c<7; c++) {   // columns are 0 to 7 where 0 is sunday
    const div  = div_data[c].data[r];
    const a    = div.querySelector("b");  // is the first element for event data
    if (a) { 
      // found <a> tag
    const date = a.getAttribute("data-create");  // <a data-create="2024-10-27" class="pointer">+</a>
    this.class_set(div, date);
    }
   }
  }
}


class_set(div,date) {  // calendar_class  client-side
  const date_a = date.split("-");  //  "yyyy-mm-dd"
  const now = app.format.getISO( new Date() );
  const year = now.slice(0,4);
  let className ;
  if (this.year.toString() !== date_a[0]) {
    // day is not in year of calander being displayed
    className = "notYear"  // will scrink font to 0 so the day does not show up
  } else if (date === now) {
    className =  "today"  // 
  } else if (date < now) {
    className = "past"  // 
  } else {
    className = "future" 
  }

  div.className = className;

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
  this.table_view.paging.row = this.events[newDate.getMonth()+1][newDate.getDate()].row ;
  this.table_view.display_data();
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


customElements.define("sfc-calendar", calendar_class); // tie class to custom web component