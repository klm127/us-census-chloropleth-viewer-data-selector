
const keymodeler = new KeyModeler(CENSUS_DATA["Alabama"],'KeyModeler-Selects');
const map = new USCensusMap(keymodeler,US_FEATURES,CENSUS_DATA,"us-map","mousemove", "mouseleave",d3.interpolatePlasma,true, false);