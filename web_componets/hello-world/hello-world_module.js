
class hello_world_class extends HTMLElement {
  constructor() {
    // constructor is called when the element is displayed
    super();                                                // call parent constructor
    const shadow = this.attachShadow({ mode: "closed" });   // create a shadow dom
    shadow.innerHTML = "Hello World";                       // add content to shadow dom
    app["hello-world"].push(this);

  }
}

export {hello_world_class}