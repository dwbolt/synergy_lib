class widgetListClass {

/* widgetList.js

used to display the wix equivalant of strips - widely used.
must create one instance for each DOM element on page that widgetClass will be used

methods:

---------public
constructor(idDOM)  // create object instance
HTMLfor(list)       // display items in lists
display(idDOM)      // called from button on pages
setJSON(obj)        // display page
buttonURL()         // will goto url with current button selected, allow cut/paste of url with will display page
                       with current button selected
timeFormat(dateStr)

---------privite
displayRow(i,r,urls) - customize for each data structure
updatePictures()
//async getJSON(url)  - may need to replace with lib
*/


//                                  ---------public---------------
// widgetListClass - client-side
constructor(
  idDOM   // DOM id location to put the list
) {
    this.idDOM     = idDOM;
    this.a_eval    = [];     // ?
    this.json      = {};     // will load from data
    this.nodes      ;
    this.list       ;

    this.n_pic     = 0;      // incremented every 2 seconds and change picture
    this.timer;              // ?
    this.list ;              // ?
    this.selected;           // remember the button selected
    this.nodes2html;         // = new nodes2htmlClass();
}


// widgetListClass - client-side
async displayButton(    // called from button on page
  dom  // DOM of button that was pushed
  ) {
  this.a_eval = [];  // aray of evals to do after dom is updated,
  let html=`<h3 id="heading">${dom.value}</h3>`  // make heading the same as button name

  // set the of all sibbling buttons to mot selected
  if (dom) {
    let e=dom.parentNode.firstChild;
    do {
      e.className="button";
    } while (e=e.nextSibling)
    dom.className = "selected";  //  set class to selected so we can see the button that is slected
    this.selected = dom;         // rememvber the selected button
  }
  //await this.displayList(this.json.lists[dom.id], html);
  await this.nodes2html.displayList(this.json.lists[dom.id], html);
}


// widgetListClass - client-side
setJSON(
  // load json file to display
  obj     //
) {
  this.json       = obj;
  this.nodes      = this.json.node;
  this.nodes2html = new nodes2htmlClass(this.nodes, this.idDOM);

  // build button lists
  let buttons="";
  if(Array.isArray(this.json.buttons)) {
    this.json.buttons.forEach((item, i) => {
      buttons+=`<input class="button" type="button" value="${item.button}" id="${item.id}" onclick="${item.onclick}")>`;
    });
    if (localStorage.getItem('production')  === "false") {
      // add extra buttons if not production
      buttons+=`<input class="button" type="button" value="goto Button URL" id="display URL" onclick="app.buttonURL();")>`
    }
  }

    // fill in document
    document.getElementById("headTitle").innerHTML = this.json.headTitle;
    document.getElementById("heading1" ).innerHTML = this.json.heading1;
    document.getElementById("updated"  ).innerHTML = "updated " + this.json.updated;
    document.getElementById("buttons"  ).innerHTML = buttons;
}


//                                  --------- private ---------------
buttonURL() {  // widgetListClass - client-side
  // goto url that will have the current button selected
  const urlParams = new URLSearchParams( window.location.search );
  let page="";
  if (urlParams.get('p') != null) {
    page =  "p=" +urlParams.get('p')+ "&";
  }

  window.location.href = encodeURI(`${window.location.origin}/app.html?${page}b=${this.selected.value}`);
}


timeFormat( // widgetListClass - client-side
  d  // date string
) {
  const date = new Date(d);

  // get date, return am pm timeout
  let ampm    = "am";
  let hours   = date.getHours();
  let minutes = date.getMinutes();

  // adjust hour for 12 hour time and add leading 0
  if (12    <= hours) {ampm  = "pm";}
  if (12    <  hours) {hours = hours - 12;}
  if (hours < 10)     {hours = "0"+ hours;}

  // add leading 0 to minutes if needed
  if (minutes < 10)  {minutes = "0" + minutes;}

  return hours + ":" + minutes + " " + ampm;
}

async displayList(listName, html=""){
  return await this.nodes2html.displayList(this.json.lists[listName], html="");
}

async displayNode(nodeName, html=""){
  return await this.nodes2html.displayList([this.json.node[nodeName]], html="");
}

//------------------------------------------------------- split off


/*

async HTMLfor(// widgetListClass - client-side
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


async HTMLforNode(  // widgetListClass - client-side
  i
  ,nodeName //  node name
) {
  let html="";
  let r = this.nodes[nodeName];
  if (r) {
    // the node exists
    //  create list of urls
    let urls="";
    if (typeof(r.u_urls) != "undefined" && Array.isArray( r.u_urls ) ) {
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


async displayRow(  // widgetListClass - client-side
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
  // r.text.forEach((line, i) => {  // can not use await in forEach(
  for(let i=0; i<r.text.length ;i++) {
    let line = r.text[i];
    if        (line[0] === "monthly") {
      //
      day =`${r.date.week} ${r.date.day}`;
      time=`<br>${this.timeFormat(r.date.start)} - ${this.timeFormat(r.date.end)}`;
      text +=  `<p>${day}${time}</p>`
    } else if (line[0] === "weekly") {
      // format date for weely event
      day=`${r.date.daysOfWeek}`;
			time=`<br>${this.timeFormat(r.date.start)} - ${this.timeFormat(r.date.end)}`;
      text +=  `<p>${day}${time}</p>`
    } else if (line[0] === "yearly") {
      //
      let d = new Date(r.date.start);
      time = `<br>${this.timeFormat(r.date.start)} - ${this.timeFormat(r.date.end)}`;
      text += `<p>${d.toDateString()} ${time}</p>`
    } else if (line[0] === "eval") {
      // save javascript code to execute in array, run it after the DOM is loaded
      this.a_eval.push(line[2]);
    } else if(line[0] === "load") {
      // load external html
      text += await app.proxy.getText(line[2]);
    } else if(line[0] === "") {
      // assume all HTML tags are included in line[2]
      text += line[2];
    } else {
      // assume line[0] is a html tag and surround with open close tags
      text += `<${line[0]}>${line[2]}</${line[0]}>`;
    }
  }

  // create updated
  if (!page) {
    // on homepage
    page="event/2020";
  }

  if (localStorage.getItem('production')  === "false") {
      // only show if production = false
      updated =`updated ${r.updated} <a href="/app.html?p=comment&pc=${page}&node=${encodeURI(a_name)}">add comment</a>`;
  }


  let pictures="";
  if(typeof(r.u_pictures) !="undefined" && 0<r.u_pictures.length) {
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


// widgetListClass - client-side
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
*/

} // end widgetListClass
