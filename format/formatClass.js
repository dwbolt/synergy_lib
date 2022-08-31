class formatClass {

/* class to format input and output data

*/



// formatClass - client-side
constructor() {
    this.days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
}


// formatClass - client-side
weekNumber(
  number   // 1 -> 1st   2->2nd
){
    const str=["1st", "2nd", "3rd", "4th", "5th"]
    return str[number-1];
}

padZero(    // formatClass - client-side
   number  // number to convert to string with leading zeros
  ,length  // total length of string
) {
  let str = number.toString();
  while (str.length<length) {
    str = "0" + str;
  }
  return str;
}


getDayOfWeek( // formatClass - client-side
  numberDay   // 0->Sunday
){
  return( this.days[numberDay] );
}

// formatClass - client-side
getISO(  // return YYYY-MM-DD
  date  // Date object
){
  let day = date.getDate().toString()  //1-31
  if (day.length === 1){day = "0"+day;} // and leading 0

  let month = (date.getMonth()+1).toString();
  if (month.length===1) {month = "0"+month}
  return `${date.getFullYear()}-${month}-${day}`
}



// formatClass - client-side
// i_money is in penneys
// returns a string in dollars with $ , , and decmal point
//  123   ->  $1.23
money(i_money) {
  let s_money = Math.abs(i_money).toString();
  let f_money = "";  // formated string to return

  if (i_money ===  0) return "";

  // walk backward over string and add "," and ","
  var i;
  for ( i=s_money.length-1; 0<=i; i-- ) {
    if (  ((f_money.length-6) %4 ) === 0 ) {f_money = "," + f_money;}

    // add the digit
    f_money = s_money[i] + f_money;

    if ( f_money.length             === 2) {f_money = "." + f_money;}
  }

  switch (f_money.length) {
    case 1:
      f_money = "0.0"+f_money;
      break;
    case 3:
      f_money = "0"+f_money;
      break;
  }

  // add negaitve sign if needed
  if (i_money<0) {f_money = "-"+ f_money}
  return "$"+f_money
}


// formatClass - client-side
// s_string is an arbitry string that will be stored in a json value
// return s_string and replace all new lines with \n
escStringForJson(s_string) {
  return s_string
  .replace(/\"/g, '\\"')   // " ->\ "
  .replace(/\n/g, '\\n');   // newline -> \n
}

/*
https://stackoverflow.com/questions/4253367/how-to-escape-a-json-string-containing-newline-characters-using-javascript
  String.prototype.escapeSpecialChars = function() {
    return this.replace(/\\n/g, "\\n")
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\\&/g, "\\&")
               .replace(/\\r/g, "\\r")
               .replace(/\\t/g, "\\t")
               .replace(/\\b/g, "\\b")
               .replace(/\\f/g, "\\f");
};
*/


// formatClass - client-side
timeFormat(
  date  // date object
) {
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

// formatClass - client-side
timeRange(
  start  // date
  ,end   // date
){
  return `${this.timeFormat(start)} - ${this.timeFormat(end)}`;
}


// formatClass - client-side
getDaysOfWeek(
   d           // date object
  ,dayOffsets  // array of day off sets from day object
) {
  let str = "";
  // walk array and add day strings
   for (let i=0; i< dayOffsets.length; i++) {
     str +=   ", " + this.days[d.getDay()+ dayOffsets[i]];
   }

  return str.slice(2);  // trim leading ", "
}

obj2string( // formatClass - client-side
  obj,level=0  // to convert to string with each attribute on a newline - will make debugging saved json easy to read, each new attribute is on a seperate line, with intetion
){
  let str,pad;

  try {
    if        (typeof(obj) === "string") {
      str = `"${obj}"`;
    } else if (typeof(obj) === "number") {
      str = obj.toString();
    } else if (Array.isArray(obj)) {                  // code assume array has no gaps   a[0]=""   a[2]=""  has gap of a[]1
      str = "";  // add new line for object
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        pad = "";    // init pad spacing
        str += "\n" + `,${pad.padStart(level*3, " ")}  ${this.obj2string(obj[key],level+1)}`
      });
      str ="[\n " + str.substring(2) + "\n]";  // replace leading \n, with \n
    } else if (typeof(obj) === "object") {
      str = "";  // add new line for object
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        pad = "";    // init pad spacing
        str += "\n" + `,${pad.padStart(level*3, " ")}"${key}" : ${this.obj2string(obj[key],level+1)}`
      });

      str ="{\n " + str.substring(2) + "}\n";  // replace leading \n, with \n
    } else {
      alert(`error: formatClass.obj2string() - typeof(obj)=${typeof(obj)}`);
      str = obj.toString();
    }
  }  catch(err) {
    alert(`error: formatClass.obj2string() - error=${err},level=${level}, obj=${obj}`)
  }

  return str;
}


// formatClass - client-side
}  // end
