class nodes2htmlClass {

/* node2html.js

used to display the wix equivalant of strips - widely used.
must create one instance for each DOM element on page that class will be used

methods:

---------public
constructor()  // create object instance
displayList()

---------privite
HTMLfor(list)       // display items in lists
display(idDOM)      // called from button on pages
setJSON(obj)        // display page
buttonURL()         // will goto url with current button selected, allow cut/paste of url with will display page
                       with current button selected
timeFormat(dateStr)


displayRow(i,r,urls) - customize for each data structure
updatePictures()
//async getJSON(url)  - may need to replace with lib
*/


//                                  ---------public---------------
constructor( // nodes2htmlClass - client-side
  nodes
  ,idDom
  ,edge=null  // this is to support calendar data structure, needs to go away at some point
) {
    this.nodes  = nodes;   // will load from data
    this.idDOM  = idDom;   // my not need this
    this.edge   = edge;    // used for calddar events date details // will go away when date info is moved to node

    this.a_eval    = [];     // ?
    this.n_pic     = 0;      // incremented every 2 seconds and change picture
    this.timer;              // ?
    this.list ;              // ?
    this.selected;           // remember the button selected
}

async displayList(list, html=""){  // nodes2htmlClass - client-side
  this.list   = list;  // assume buttion id is same as list node name
  html += await this.HTMLfor(list);

  document.getElementById(this.idDOM).innerHTML = html;
  this.updatePictures();
  if (!this.timer) {
    // only want to setInterval once per page load
    this.timer = setInterval(this.updatePictures.bind(this), 2000);  // refress pictures every 2 seconds
  }
  this.a_eval.forEach((item, i) => {
    eval(item);  // this seems like there maybe races conditions.
  });
}


async HTMLfor(// nodes2htmlClass - client-side
  list  // attribute name with value array of section names to be displayed
) {
  let html="";

  //this.json.lists[list].forEach((nodeName, i) => {  can not use foreach with await
  for(let i=0; i<list.length; i++) {
    // build html for links like FaceBook, Ets, etc
    html += await this.HTMLforNode(i,list[i]);
  };
  return html;
}


async HTMLforNode(  // nodes2htmlClass - client-side
  i
  ,nodeName //  node name
) {
  let html="";
  let r = this.nodes[nodeName];
  if (r) {
    // the node exists
    //  create list of urls
    let urls="";
    if (r.u_urls != undefined && Array.isArray( r.u_urls ) ) {
      r.u_urls.forEach((item, i) => {
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
    html += await this.displayRow(i,r,urls,nodeName);
  } else {
    // the node does not exists, display place holder if viewing non-production
    if (localStorage.getItem('production')  === "false") {
      // only show in non production
      html += `<div class="row"><div><h3>add entry for ${a_name}</h3></div></div>`;
    }
  }

  return html;
}


async displayRow(  // nodes2htmlClass - client-side
  i      // row index
  ,r     // row object
  ,urls  // urls to be displayed
  ,a_name // name of node attribut we are displaying
  ) {

  // css class rows start with 1, array index start with 0
  let text = "";
  let updated="";
  let day,time;
  const urlParams = new URLSearchParams( window.location.search );
  let page = urlParams.get('p')

  // walk the list of lines in text
  for(let i=0; i<r.text.length ;i++) {  // can not use await in forEach(
    let line = r.text[i];
    if (r.date) {
      // see if date is with node
      this.edge = r.date;
    }

    text += await this.convertLine(line);
  }

  if (localStorage.getItem('production')  === "false") {
      // only show if production = false
      updated =`updated ${r.updated} <a href="/app.html?p=comment&pc=${page}&node=${encodeURI(a_name)}">add comment</a>`;
  }

  let pictures="";
  if(r.u_pictures !=undefined && 0<r.u_pictures.length) {
    // only put picture div in if there are pictures to display
    pictures=`<div id="pic_${this.idDOM}_${i}" style="float:right;width:320px; height:200px;"></div>`;
  }

  // gets the number of colors used in file
  // determines background color based off of point in array
  const numColors = app.css.rowColors.length;
  var rowColor = "";
  var color = (i % numColors) + 1;
  rowColor = app.css.rowColors[color-1];

  const html =`
  <div class="row" style="background-color: ${rowColor}">
  ${pictures}
  ${text}
  <p>${urls}<p>
  <p>${updated}</p>
  </div>

  </div>
  `;   // table cell for piture

  return html;
}


async convertLine(  // nodes2htmlClass - client-side
  line  // ["command","data","data"] from _.json file that html is generated from
  ) {  // nodes2htmlClass - client-side
  switch (line[0]) {
    case "date" :
      return  this.dateNode(this.edge);
    case "monthly":
      return  this.dateNode([this.edge]);  // just so old data will not break
    case "weekly":
      return  this.dateNode([this.edge])   // just so old data will not break
    case "yearly":
      return  this.dateNode([this.edge])   // just so old data will not break
    case "eval":
      // save javascript code to execute in aray, run it after the DOM is loaded
      this.a_eval.push(line[2]);
      return "";
    case "load":
      // load external html
      return await app.proxy.getText(line[2]);
    case "redirect":
      // redirect to another page
      window.location.replace(line[2]);
    case "script":
      // load external js
      const el = document.body.querySelector(
        "style[type='text/javascript'], src:not([type])"
      );
      if ( true ) {  // need test if already loaded
        const element = document.createElement('script');
        element.src = line[2];
        element.type = "module";
        document.head.appendChild(element);
     }
      return "";
    case "":
      // assume all HTML tags are included in line[2]
      return line[2];
    default:
      // assume line[0] is a html tag and surround with open close tags
      return `<${line[0]}>${line[2]}</${line[0]}>`;
  }
}


dateNode(  // nodes2htmlClass - client-side
  a_date   // array of date generators
) {
  let text = "",start,end;
  const now = new Date();

  a_date.forEach((date, i) => {
    start =    app.page.createDate(date);
    end   =    app.page.createDate(date,true);
    if (start<now && now<end) { // current date is in between start and end
      if        (date.repeat === "monthly") {
        let day   =    app.format.getDayOfWeek(date.days[0][0]);
        let time  = `${app.format.timeRange(start, end)}`;
        text +=  `<p><b>Day:</b> ${app.format.weekNumber(date.days[0][1])} ${day} <br/><b>Time:</b> ${time}</p>`
      } else if (date.repeat === "weekly") {
        // format date for weely event
        let days  =  app.format.getDaysOfWeek(start, date.daysOffset);
        let time  = `${app.format.timeRange(start, end)}`;
        text +=  `<p><b>Day: </b>${days} <br/><b>Time:</b> ${time}</p>`
      } else if (date.repeat === "yearly") {
        let time  = `${app.format.timeRange(start, end)}`;
        text += `<p><b>Date:</b> ${app.format.getISO(start)} <br/><b>Day:</b> ${app.format.getDayOfWeek(start.getDay())} <br/><b>Time: </b>${time}</p>`
      }}
  });

  return text;
}


// nodes2htmlClass - client-side
updatePictures() {
  // walk through each row and display the next picture
  this.list.forEach((a_name, i) => {
    let r = this.nodes[a_name];
    if (r && r.u_pictures && 0<r.u_pictures.length) {
      // if the the array has urls of pictures, display one
      let pic = this.n_pic % r.u_pictures.length;
      document.getElementById(`pic_${this.idDOM}_${i}`).innerHTML =
      `<img style="object-fit:contain; width:320px; height:200px;"  src="${"/synergyData/"+ r.u_pictures[pic][1]}">`
    }
  });
  this.n_pic++;
}


} // end nodes2htmlClass
