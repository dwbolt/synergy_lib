
import  {hello_world_class}    from '/_lib/web_componets/hello-world/_.mjs';

class hello_world2_class extends hello_world_class {

  constructor() {
    // call parent constructor
    super();   
   // add content to shadow dom
    this.shadow.innerHTML = "Hello World2";
  }
}
  
export {hello_world2_class}
customElements.define("hello-world2", hello_world2_class);  