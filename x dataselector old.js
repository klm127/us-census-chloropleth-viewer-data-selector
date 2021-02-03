//mockup for data selector idea
const parentElId = "data-selector-div";
const data = data_small;

document.addEventListener("DOMContentLoaded", (el) => {
    render();
})

var modelObject = {};
var selectedKeys = [];
var selectElements = [];

function render() {
    let parentEl = document.getElementById(parentElId);
    // get the first object of the data as an example of the key structure
    let parentKeys = Object.keys(data);
    let exampleSubObject = data[parentKeys[0]];
    console.log(exampleSubObject);
    appendInput(parentEl, ["alpha",0,"bravo"], 0);
    appendInput(parentEl, ["alpha",0,"bravo"], 1);
}
//only run once on init
function traverseForKeys(dataArray) {
    //get the first object of the data as an example of the key structure
    let parentKeys = Object.keys(data);
    let exampleSubObj = dataArray[parentKeys[0]];

}

function appendInput(parentElement, dataArray, argumentIndex) {
    let newSelectDropdown = document.createElement('select');
    newSelectDropdown.id = 'data-key-select-'+argumentIndex;
    dataArray.forEach( (key) => {
        let newOption = document.createElement('option');
        newOption.value = key;
        newOption.text = key;
        newSelectDropdown.appendChild(newOption);
    })
    selectElements.push(newSelectDropdown);
    parentElement.appendChild(newSelectDropdown);
}









function oldlistener(event) {
    
    console.log('new event listener event', 'green')
    let selectElement = event.target;
    console.log('the event target is');
    console.log(selectElement);
    let targindex = this.selectElements.indexOf(selectElement);
    let removed = this.selectElements.slice(targindex+1); //will remove subsequent
    this.selectElements = this.selectElements.slice(0,targindex+1);
    this.selectedValues = this.selectedValues.slice(0,targindex+1);
    console.log(`selected Value index is ${targindex} which we will set to ${selectElement.value}`);
    console.log(`selected values were ${this.selectedValues}`);
    this.selectedValues[targindex] = selectElement.value;
    console.log(`selected values are now ${this.selectedValues}`);
    removed.map((oldkeySelect)=> {
        this.DOMcontainer.removeChild(oldkeySelect);
    });
    let newobj = this.modelObject;
    this.selectedValues.forEach( (key) => { //traverse the object properties
        console.log(`checking:`)
        console.log(newobj)
        console.log(`for ${key}`)
        newobj = newobj[key];
    });
    console.log('newobject is now');
    console.log(newobj)
    if(newobj instanceof Object) {
        this.renderSelect(newobj);
    }
}