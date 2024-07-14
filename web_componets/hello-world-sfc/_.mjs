class hello_world_class extends HTMLElement {

constructor() {
  super();                                                         // call parent constructor
  this.shadow           = this.attachShadow({ mode: "closed" });   // create a shadow dom that has sepreate id scope from other main dom and other shadow doms
  this.shadow.innerHTML = "Hello World";                           // add content to shadow dom
}

}  // end hello_world_class 

export {hello_world_class}
customElements.define("hello-world", hello_world_class);   // attach hello_world_class to  "hello-world" web-component