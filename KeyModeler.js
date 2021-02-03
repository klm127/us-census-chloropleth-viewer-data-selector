/**
 * Creates drop down select HTMLElements with options corresponding to a model object's keys and the keys of subobjects contained therein. For use with selecting data to be mapped in some way. 
 * @class
 * @property {HTMLElement} container - The container
 * @property {Object} modelObject - The object whose properties will be mapped onto HTMLSelect Elements.
 * @property {Array} selectElements - An array of HTMLSelectElements aligned with modelObject property depth.
 * @property {Array} selectedValues - updated whenever a select option is changed
 */
class KeyModeler {
/**
 * Constructing creates the first element in the DOM element or ID passed as a parameter
 * @param {Object} modelObject An object whose nested properties are to be displayed in DOMSelect Options
 * @param {(HTMLElement|string)} [container='KeyModeler Graph'] An HTML element or ID
 */
  constructor(modelObject, container='KeyModeler-Graph') {
      if(!(container instanceof HTMLElement)) {
          this.DOMcontainer = document.getElementById(container);
      }
      else {
        this.DOMcontainer = container;
      }
      this.modelObject = modelObject;
      this.selectElements = [];
      this.selectedValues = [];
      this.mapListener = ()=>{};
      this.renderSelect(modelObject);
    }
    /**
     * Renders a new select box on the container with options set to Object.keys and adds listener
     * @param {(Object|string)} subobj - The object whose properties to map
     */
    renderSelect(subobj) {
        let objProps = Object.keys(subobj);
        this.selectedValues.push(objProps[0]);
        let selectElement = document.createElement('select');
        objProps.forEach( (prop)=> {
            let option = document.createElement('option');
            option.text = prop;
            option.value = prop;
            selectElement.appendChild(option);
        });
        selectElement.selIndex = this.selectElements.length;
        this.selectElements.push(selectElement);
        this.DOMcontainer.appendChild(selectElement);
        selectElement.addEventListener("input", (event)=> this.listener(event));
        selectElement.dispatchEvent(new Event("input"));
    }
    /**
     * Listens for input events in select boxes. Slices values array and removes extra select boxes. Gets value of selected and, if it's an object, calls render on that object.
     * @listens InputEvent fired from a property select box
     * @param {E} event An input event
     */
    listener(event) {
        let index = this.selectElements.indexOf(event.target);
        let newvalue = event.target.value;
        this.selectedValues[index] = newvalue;
        this.selectedValues = this.selectedValues.slice(0,index+1);
        let removeSelects = this.selectElements.slice(index+1);
        this.selectElements = this.selectElements.slice(0, index+1);
        removeSelects.forEach( (element) => {
            this.DOMcontainer.removeChild(element);
        });
        let newobj = this.modelObject;
        this.selectedValues.forEach( (property) => {
            newobj = newobj[property];
        });
        if(newobj instanceof Object) {
            this.renderSelect(newobj);
        }
        this.mapListener();
    }
    /**
     * Gets the property value of 
     * @param {*} parallelObject An object with the same schema as this.modelobject
     * @returns The value at that key chain. If there's a problem with object not being parallel to model object, it returns 0.
     */
    getPropVal(parallelObject) {
        this.selectedValues.forEach( (val) => {
            if(parallelObject.hasOwnProperty(val)) {
                parallelObject = parallelObject[val];
            }
        })
        if(!(parallelObject instanceof Object)) {
            return parallelObject;
        }
        else {
            return 0;
        }
    }
    /**
     * Attempts to set the select boxes to the property selections of the array parameter passed
     * @param {Array} propArr An array of properties
     * @returns {boolean} true if succesful, false if not
     */
    setProps(propArr) {
        let ret = true;
        propArr.forEach( (property,index) => {
            if(this.selectElements.length - 1 < index) {
                ret = false;
                return false;
            }
            else {
                let select = this.selectElements[index];
                let optVals = [];
                let opts = select.options;
                for(let i = 0; i < opts.length; i++) {
                    optVals.push(opts[i].value)
                }
                if(optVals.indexOf(property) >= 0) {
                    select.value = property;
                    select.dispatchEvent(new Event("inputevent"))
                }
                else {
                    ret = false;
                    return false;
                }
            }
        })
        return ret;
    }
    //getSelected
    //getPropVal
    //reset

}