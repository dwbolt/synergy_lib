
class hello_world_class extends HTMLElement {

constructor() {
  // call parent constructor
  super();   
  
  // create a shadow dom
  const shadow = this.attachShadow({ mode: "closed" });

 // add content to shadow dom
  shadow.innerHTML = "Hello World";
}


}

export {hello_world_class}