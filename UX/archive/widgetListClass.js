class widgetListClass {

/* /_lib/widgetList.js

used to display the wix equivalant of strips - most pages are based on this class
must create one instance for each DOM element on page that widgetClass will be used

methods:

---------public
constructor(idDOM)  // create object instance
setJSON(obj)        // let the instance know the json date that the page will be based on

async displayList(listName, html=""){  // widgetListClass - client-side
async displayNode(nodeName, html=""){ // widgetListClass - client-side
async displayButton(   // widgetListClass - client-side

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


setJSON(  // widgetListClass - client-side
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
      let htmlPre;
      if (item.htmlPre) {htmlPre = item.htmlPre;} else {htmlPre="";}
      buttons+=`${htmlPre}<input class="button" type="button" value="${item.button}" id="${item.id}" onclick="${item.onclick}")>`;
    });
  }

    // fill in document
    document.getElementById("headTitle").innerHTML = this.json.headTitle;
    document.getElementById("heading1" ).innerHTML = this.json.heading1;
    document.getElementById("updated"  ).innerHTML = "updated " + this.json.updated;
    document.getElementById("buttons"  ).innerHTML = buttons;
}


async displayList(listName, html=""){  // widgetListClass - client-side
  return await this.nodes2html.displayList(this.json.lists[listName], html="");
}


async displayNode(nodeName, html=""){ // widgetListClass - client-side
  return await this.nodes2html.HTMLforNode(0,nodeName);
}


async displayButton(   // widgetListClass - client-side
   // called from button on page
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
  await this.nodes2html.displayList(this.json.lists[dom.id], html);
}


} // end widgetListClass
