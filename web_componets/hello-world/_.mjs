
class hello_world_class extends HTMLElement {

constructor() {
  // call parent constructor
  super();   
  // create a shadow dom
  this.shadow = this.attachShadow({ mode: "closed" });
 // add content to shadow dom
  this.shadow.innerHTML = "Hello World";
}}

export {hello_world_class}
customElements.define("hello-world", hello_world_class);  