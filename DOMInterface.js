
const keymodeler = new KeyModeler(CENSUS_DATA["Alabama"],'KeyModeler-Selects');
const map = new USCensusMap(keymodeler,US_FEATURES,CENSUS_DATA,"mousemove", "mouseleave", "us-map");