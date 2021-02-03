/**
 * Displays US Census data on the DOM using a geoAlbers projection. Requires {@link https://d3js.org/d3.v4.min.js d3}. 
 * 
 * See {@link https://github.com/klm127/census-csv-parser census-csv-parser} for a library built for parsing census data .csvs
 * 
 * @requires https://d3js.org/d3.v4.min.js
 * @class
 * @property {Object.<GeoJson>} geodata An object representing features to be displayed as an svg map with a US centric projection
 * @property {Object} censusdata An object representing data to be mapped, where the keymodeler contains a model object of this same data.
 * @property {KeyModeler} keymodeler An object which helps a user select values to display and interacts with USCensusMap
 * @property {HTMLElement | string} DOMcontainer The element to contain the SVG. Map will scale to container element's size.
 * @property {HTMLElement } tooltip Created on map render. Access styling with ID #USCensusTooltip. Has #usc-tool-state, #usc-tool-prop, #usc-tool-val as child elements.
 * @property {HTMLElement} extremaDiv Created on map render. Access styling to the min and max areas with #USCensus-extrema-div
 * @property {string} [tooltipShowEventType='mouseenter touchstart'] the event to trigger a tooltip move. I.e - click, mouseenter
 * @property {string} [tooltipHideEventType='mouseleave touchend'] the event to trigger tooltip hiding
 * @property {interpolatedColorScheme} [scheme=d3.interpolateInferno] a color scale to interpolate. Default is d3.interpolateInferno. See d3 for other options: {@link https://github.com/d3/d3-scale-chromatic/blob/v2.0.0/README.md#user-content-sequential-multi-hue sequential multi hue interpolator}
 * @property {boolean} [doesRenderTitle=true] Whether a generated title made from selected properties should be displayed
 */
class USCensusMap {
    /**
     * 
     * @param {KeyModeler} keymodeler KeyModeler object for selecting data to be paired with this map
     * @param {Object.<GeoJson>} geodata Data in GeoJson format. Other formats (topo json) will probably not work, as this class uses projections
     * @param {Object} censusdata Data to be referenced for coloring map. Must be the same structure as that mapped by the KeyModeler object.
     * @param {(string|HTMLElement)} container The HTML element or ID of the element which will contain the map. Map size will be scaled to that element's width.
     * @param {string} [tooltipShowEventType="mouseenter touchstart"] Event triggering tooltip display
     * @param {string} [tooltipHideEventType="mouseleave touchend"] Event triggering tooltip hide
     * @param {d3.<Interpolator>} [sequentialmultihue=d3.interpolateInferno] Sets the default d3 sequential interpolator to color the map. {@link https://github.com/d3/d3-scale-chromatic/blob/v2.0.0/README.md#user-content-sequential-multi-hue sequential multi hue interpolator}
     * @param {boolean} [guessFormatting=true] If set to true, will attempt to guess formatting of number data. Large numbers will be given commas. Ranges where the max is less than 100 will be given % signs.
     * @param {boolean} [resize=true] If true, will attach eventlistener to window and re-render itself when size changes
     */
    constructor(keymodeler,geodata, censusdata, container, tooltipShowEventType ="mouseenter touchstart",tooltipHideEventType="mouseleave touchend", sequentialmultihue=d3.interpolateInferno, guessFormatting=true,resize=true ) {
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
        this.scheme = sequentialmultihue;
        this.guessFormatting = guessFormatting
        this.renderMap();
        let that = this;
        this.keymodeler.mapListener = () => {
            that.renderData();
        }
        if(resize) {
            window.addEventListener('resize', (e)=> this.renderMap());
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
            .style('display','grid')
            .style('grid-template-columns','auto auto auto');
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
              .attr("state-name",(data) => data.properties.NAME)
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
    /**
     * Renders the data to be displayed, coloring features, creating a new legend, and creating the min and max extrema area
     */
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
        this.extremaDiv.append('div')
            .attr('id','extrema-min-color')
            .style('width',extremaWidth/6+'px')
            .style('min-height','10px')
            .style('background-color',colorScale(minData));
        this.extremaDiv.append('div')
            .attr('id','extrema-min-state')
            .text(minState);
        this.extremaDiv.append('div')
            .attr('id','extrema-min-val')
            .text((this.guessFormatting) ? this.formatVal(minData) : minData);
        this.extremaDiv.append('div')
            .attr('id','extrema-max-color')
            .style('width',extremaWidth/6+'px')
            .style('min-height','10px')
            .style('background-color',colorScale(maxData));
        this.extremaDiv.append('div')
            .attr('id','extrema-max-state')
            .text(maxState);
        this.extremaDiv.append('div')
            .attr('id','extrema-max-val')
            .text((this.guessFormatting) ? this.formatVal(maxData) :maxData);
    }
    /**
     * @private
     * @param {@} val A number whose formatting to guess
     */
    formatVal(val) {
        let test = parseFloat(val);
        if(isNaN(test)) {
            return val;
        }
        else {
            if(Math.abs(+val) > 100) {
                return val.toString().replace(/,/g,"").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            else {
                return val + '%';
            }
        }
    }
    /**
     * Moves tooltip the point of event and displays data about the feature. Attached to features.
     * @listens MouseEvent By default, listens for mouse hover
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
            .text( (this.formatVal) ? this.formatVal(val) : val);
        this.tooltip.style('left',event.pageX+15+'px');
        this.tooltip.style('top',event.pageY-25+'px'); 
    }
    /**
     * @listens MouseEvent By default, listens for mouse exit. Attached to features.
     * Sets tooltip opacity to 0.
     */
    tooltipHide() {
        this.tooltip.style('opacity',0);
    }
}

