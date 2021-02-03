/**
 * Displays US Census data on the DOM using a geoAlbers projection. Requires {@link https://d3js.org/d3.v4.min.js}
 * 
 * @requires https://d3js.org/d3.v4.min.js
 * @class
 * @property {GeoJson} geodata An object representing features to be displayed as an svg
 * @property {CensusDataJson} censusdata An object representing data to be mapped, where the keymodeler contains a model object of this data. 
 * @property {KeyModeler} keymodeler The object containing a model object of censusdata with the property **selectedvalues** of type array representing the user-selected properties to displayed on the map
 * @property {HTMLElement | string} [container='USCensusMap'] The element to contain the SVG. Map will scale to container element's size.
 * @property {HTMLElement } tooltip Created on renderMap. Access styling with ID #USCensusTooltip. Has #usc-tool-state, #usc-tool-prop, #usc-tool-val as child elements.
 * @property {string} [tooltipShowEventType='mouseenter'] the event to trigger a tooltip move. I.e - click, mouseenter
 * @property {interpolated_Color_scale} scheme a color scale to interpolate @link {"https://github.com/d3/d3-scale-chromatic/blob/v2.0.0/README.md#interpolateBrBG#sequential-multi-hue"}
 */
class USCensusMap {
    constructor(keymodeler,geodata, censusdata, tooltipShowEventType ="mouseenter",tooltipHideEventType="mouseleave",container="USCensusMap") {
        if(container instanceof HTMLElement) {
            this.DOMcontainer = container;
        }
        else {
            this.DOMcontainer = document.getElementById(container);
        }
        this.keymodeler = keymodeler;
        this.geodata = geodata;
        this.censusdata = censusdata;
        this.tooltipShowEventType = tooltipShowEventType;
        this.tooltipHideEventType = tooltipHideEventType;
        this.doesRenderTitle = true;
        this.scheme = d3.interpolateInferno;
        this.renderMap();
        let that = this;
        this.keymodeler.mapListener = () => {
            that.renderData();
        }
    }
    /**
     * Renders the geograph map and tooltip scaled to the width of DOMcontainer. Attaches event listeners to states for the tooltip hover.
     */
    renderMap() {
        let width = this.DOMcontainer.clientWidth;
        let height = width * 2/3;
        while(this.DOMcontainer.firstChild) { //remove all children
            this.DOMcontainer.removeChild(this.DOMcontainer.firstChild)
        }
        //main svg
        let svg = d3.select(this.DOMcontainer)
            .append('svg')
            .attr('id','USCensus-map-svg')
            .attr('width',width)
            .attr('height',height);
        //title SVG - used in renderData
        this.titleSVG = svg.append('text')
            .attr('y',width/35)
            .attr('x',width/35);
        //legend SVG - used in renderData
        this.legendSVG = svg.append('svg')
            .attr('width',width*0.128)
            .attr('height',width*0.244)
            .attr('x',width*0.857)
            .attr('y',width*0.385)
            .attr('fill','red')
            .attr('stroke-width',2)
            .attr('stroke-color','black');
        //div for extrema values
        this.DOMcontainer.style.position = 'relative';
        this.extremaDiv = d3.select(this.DOMcontainer)
            .append('div')
            .style('position','absolute')
            .attr('id','USCensus-extrema-div')
            .style('left',width*0.56 + 'px')
            .style('top',width*0.55 +'px')
            .style('width',width*0.16+'px')
        //tooltip
        this.tooltip = d3.select(this.DOMcontainer.parentNode)
            .append('div')
            .attr('id','USCensusTooltip')
            .style('position','absolute')
            .style('user-select','none')
            .style('pointer-events','none');
        this.tooltip.append('div')
            .attr('id','usc-tool-state');
        this.tooltip.append('div')
            .attr('id','usc-tool-prop');
        this.tooltip.append('div')
            .attr('id','usc-tool-val')
        //projection
        let albers = d3.geoAlbersUsa()
            .scale(width*1.2)
            .translate([width/2,height/2]);
        //paths
        this.pathGroup = svg
            .append("g");
        this.pathGroup.selectAll("path")
            .data(this.geodata.features)
            .enter().append("path")
              .attr("id",(data) => data.properties.NAME)
              .attr("stroke","black")
              .attr("stroke-width",0.5)
              .attr("fill","white")
              .attr("d", d3.geoPath().projection(albers))
              .on(this.tooltipShowEventType, (feature) => {
                    this.tooltipShow(event,feature);
              })
              .on(this.tooltipHideEventType, ()=> {
                  this.tooltipHide();
              })
        this.renderData();
    }
    renderData() {
        if(this.doesRenderTitle) {
            let proptext = this.keymodeler.selectedValues.join(' | ');
            this.titleSVG.text(proptext)
         }
        this.legendSVG.selectAll('*').remove(); //clear old legend
        let data = {};
        let datarange = [];
        let stateKeys = Object.keys(this.censusdata);
        stateKeys.forEach( (key)=> {
            let val = this.keymodeler.getPropVal(this.censusdata[key]);
            datarange.push(+val);
         });
        let dataSize = datarange.length-1;
        let minData = d3.min(datarange);
        let maxData = d3.max(datarange);
        let colorScale = d3.scaleSequential()
            .domain([minData,maxData])
            .interpolator(this.scheme)
            //.range(['white','red'])
        let legendWidth = +this.legendSVG.attr('width');
        let legendHeight = +this.legendSVG.attr('height');
        let padLegBottom = legendHeight*0.05;
        let padLegTop = legendHeight*0.95;
        let legendScale = d3.scaleLinear()
            .domain([minData,maxData])
            .range([padLegBottom, padLegTop]);
        let legendRange = d3.ticks(minData,maxData,dataSize)
        let colorLegendWidth = legendWidth/4
        this.legendSVG.selectAll("g")
            .data(legendRange)
            .enter()
            .append('rect')
            .attr('width', 10)
            .attr('height', 10+legendHeight/dataSize)
            .attr('x',0)
            .attr('y', (d)=> legendScale(d))
            .attr('width',colorLegendWidth)
            .attr('fill',(d)=>colorScale(d));
        let legendAxis = d3.axisRight(legendScale)
            .ticks(10)
        this.legendSVG.append("g")
            .attr('transform','translate(+'+colorLegendWidth+','+padLegBottom/2+')')
            .call(legendAxis)
        this.pathGroup.selectAll("path")
            .attr('fill',(d) => {
                let name = d.properties.NAME;
                let obj = this.censusdata[name];
                let val = +this.keymodeler.getPropVal(obj);
                return colorScale(val);
            });

        //extrema
        this.extremaDiv.selectAll('*').remove();
        let extremaWidth = parseInt(this.extremaDiv.style('width'));
        let extremaHeight = parseInt(this.extremaDiv.style('height'));
        let minIndex = datarange.indexOf(minData);
        let minState = stateKeys[minIndex];
        let maxIndex = datarange.indexOf(maxData);
        let maxState = stateKeys[maxIndex];
        let mindiv = this.extremaDiv.append('div')
            .attr('class','USCensus-extrema')
            .style('display','flex')
            .style('justify-content','space-between')
        mindiv.append('div')
            .style('width',extremaWidth/6+'px')
            .style('min-height','10px')
            .style('background-color',colorScale(minData))
        mindiv.append('div')
            .text(minState)
        mindiv.append('div')
            .text(minData)
        let maxdiv = this.extremaDiv.append('div')
            .attr('class','USCensus-extrema')
            .style('display','flex')
            .style('justify-content','space-between')
        maxdiv.append('div')
            .style('width',extremaWidth/6+'px')
            .style('min-height','10px')
            .style('background-color',colorScale(maxData))
        maxdiv.append('div')
            .text(maxState);
        maxdiv.append('div')
            .text(maxData);
    }
    /**
     * Moves tooltip the point of event and displays data about the feature
     * @listens hoverEvent Mouse hovers over features on the maps
     * @param {MouseEvent} event A hover event over a path
     * @param {Object} feature The hovered over feature
     * @param {HTMLElement} tooltip The tooltip to move
     */
    tooltipShow(event,feature) { 
        let statename = feature.properties.NAME;
        this.tooltip.style('opacity',1)
        this.tooltip.select('#usc-tool-state')
            .text(statename);
        let state = this.censusdata[statename];
        let val = this.keymodeler.getPropVal(state);
        this.tooltip.select('#usc-tool-val')
            .text(val);
        this.tooltip.style('left',event.pageX+15+'px');
        this.tooltip.style('top',event.pageY-25+'px'); 
    }
    /**
     * Sets tooltip opacity to 0
     */
    tooltipHide() {
        this.tooltip.style('opacity',0);
    }
}

/* const features = us.features;

const width = 600;
const height = 400;
    
let svg = d3.select("#us-map")
    .append("svg")
    .attr('width',width)
    .attr('height',height)

let projection = d3.geoMercator()
    .scale(width/1.5)
    .rotate([90,0])
    .center([20,20])
    .translate([width/2,height/2]);

let albers = d3.geoAlbersUsa()
    .scale(width*1.2)
    .translate([width/2,height/2])

let mapgroup = svg
    .append("g");


mapgroup.selectAll("path")
  .data(features)
  .enter().append("path")
    .attr("id",(d) => d.properties.NAME)
    .attr("stroke","black")
    .attr("stroke-width",0.5)
    .attr("fill","white")
    .attr("d", d3.geoPath().projection(albers)) */

