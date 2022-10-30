// This is the code for generating the Random Forest model that linking the soil organic carbon (SOC) turnover time and the relevant environmental variables.
// Then, the fitted model is used for mapping the global distributions of SOC turnover time at top-and subsoil layers.

// Load color palette module
var palettes = require('users/gena/packages:palettes');

// samples of root distribution
// var samples = ee.FeatureCollection("users/leizhang-geo/soil/soil_turnover/samples/root_profiles_D50D95");
var samples = ee.FeatureCollection("users/leizhang-geo/soil/soil_turnover/samples/root_distribution");

print(samples.size());
print(samples.limit(10));

var proj_scale = 11131.946;

// ------------------------------------ Topography ------------------------------------ //
// Elevation (with slope)
var dataset = ee.Image('USGS/GTOPO30');
var elev = dataset.select('elevation').reproject('EPSG:4326', null, proj_scale);
// var slp = ee.Terrain.slope(elev);
// Map.addLayer(slp, {min: 0, max: 0.6, palette: ['black', 'white']}, 'slp');

var cti = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/cti").median().rename('cti').reproject('EPSG:4326', null, proj_scale);
var tri = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/tri").median().rename('tri').reproject('EPSG:4326', null, proj_scale);
var slope = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/slope").median().rename('slope').reproject('EPSG:4326', null, proj_scale);
var vrm = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/vrm").median().rename('vrm').reproject('EPSG:4326', null, proj_scale);
var roughness = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/roughness").median().rename('roughness').reproject('EPSG:4326', null, proj_scale);
var tpi = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/tpi").median().rename('tpi').reproject('EPSG:4326', null, proj_scale);
var spi = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/spi").median().rename('spi').reproject('EPSG:4326', null, proj_scale);
// print(slope);
// Map.addLayer(slope, {min: 0, max: 0.6, palette: ['black', 'white']}, 'slope');


// ------------------------------------ Environment ------------------------------------ //
// Land cover
var lc = ee.ImageCollection('MODIS/006/MCD12Q1')
           .filter(ee.Filter.date('2001-01-01', '2001-12-31'))
           .select('LC_Type1').first().rename('lc').reproject('EPSG:4326', null, proj_scale);
var lc_prop = ee.ImageCollection('MODIS/006/MCD12Q1')
           .filter(ee.Filter.date('2001-01-01', '2001-12-31'))
           .select('LC_Prop1').first().reproject('EPSG:4326', null, proj_scale);
var lc_vis = {min: 1.0, max: 17.0,
  palette: [
    '05450a', '086a10', '54a708', '78d203', '009900', 'c6b044', 'dcd159',
    'dade48', 'fbff13', 'b6ff05', '27ff87', 'c24f44', 'a5a5a5', 'ff6d4c',
    '69fff8', 'f9ffa4', '1c0dff']};
// Map.addLayer(lc, lc_vis, 'Land Cover');

// Biome type
var biome = ee.Image("OpenLandMap/PNV/PNV_BIOME-TYPE_BIOME00K_C/v01").select('biome_type').reproject('EPSG:4326', null, proj_scale);
var vis_biome = {min: 1.0, max: 32.0,
  palette: [
    "1c5510","659208","ae7d20","000065","bbcb35","009a18",
    "caffca","55eb49","65b2ff","0020ca","8ea228","ff9adf",
    "baff35","ffba9a","ffba35","f7ffca","e7e718","798649",
    "65ff9a","d29e96"]};
// Map.addLayer(biome, vis_biome, "Potential distribution of biomes");

// NPP
var npp_modis = ee.ImageCollection('MODIS/006/MOD17A3HGF')
                  .filter(ee.Filter.date('2001-01-01', '2020-01-01'))
                  .select('Npp').mean().multiply(0.0001).rename('npp').reproject('EPSG:4326', null, proj_scale);

var vis_npp_modis = {min: 0.0, max: 19000.0*0.0001, palette: ['bbe029', '0a9501', '074b03']};
// Map.addLayer(npp_modis, vis_npp_modis, 'NPP_MODIS');

// RMF
var rmf = ee.Image('users/haozhima95/rootshootratio/rmf_all_20200521').reproject('EPSG:4326', null, proj_scale);
var rmf_vis = {min: 0.0, max: 100.0, palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red']};
// Map.addLayer(rmf, rmf_vis, 'RMF');

// aboveground and belowground biomass
var agb = ee.ImageCollection("NASA/ORNL/biomass_carbon_density/v1").select('agb').first();
var bgb = ee.ImageCollection("NASA/ORNL/biomass_carbon_density/v1").select('bgb').first();
var vis_biomass = {min: 0.0, max: 100.0, palette: ['d9f0a3', 'addd8e', '78c679', '41ab5d', '238443', '005a32']};
// Map.addLayer(agb, vis_biomass, "Aboveground biomass carbon");
// Map.addLayer(bgb, vis_biomass, "Belowground biomass carbon");

// WorldClim
var worldclim = ee.Image('WORLDCLIM/V1/BIO').reproject('EPSG:4326', null, proj_scale);
var vis_bio01 = {min: -230.0, max: 300.0, palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red']};
// Map.addLayer(worldclim.select('bio01'), vis_bio01, 'Annual Mean Temperature');

// Aridity index
// var aridity_index = ee.Image("projects/sat-io/open-datasets/global_ai_et0");

// Vegetation
var maskQA = function(image) {
  return image.updateMask(image.select("SummaryQA").lte(1));
};
var evi = ee.ImageCollection('MODIS/006/MOD13A1')
                  .filter(ee.Filter.date('2000-01-01', '2021-01-01'))
                  // .map(maskQA)
                  .select('EVI').mean()
                  .reproject('EPSG:4326', null, proj_scale);
var evi_vis = {min: 1000.0, max: 9000.0, palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ]};
// Map.addLayer(evi, evi_vis, 'EVI');

// Anthropogenic
// var pop = ee.ImageCollection("CIESIN/GPWv411/GPW_Population_Density")
//                 .filter(ee.Filter.date('2000-01-01', '2021-01-01'))
//                 .select('population_density').mean().reproject('EPSG:4326', null, 1000);
// var pop_vis = {"min": 200.0, "max": 1000.0, "palette": ["ffffe7", "FFc869", "ffac1d", "e17735", "f2552c", "9f0c21"]};
// Map.addLayer(pop, pop_vis, 'POP');

// ------------------------------------ Visualization ------------------------------------ //
Map.addLayer(samples, {'color': 'red', opacity: 0.1}, 'Root samples');
Map.setCenter(8, 20, 3);
// Map.setOptions('HYBRID');


// ------------------------------------ Random forest modelling ------------------------------------ //
// combine images
var img_combined = worldclim
                    .addBands(elev).addBands(slope).addBands(vrm).addBands(roughness).addBands(cti).addBands(tri).addBands(tpi).addBands(spi)
                    .addBands(lc).addBands(npp_modis).addBands(biome).addBands(evi);
print('Combined images:');
print(img_combined);

// var target_varname = 'frbnpp_0to30';
var target_varname = 'frbnpp_30to100';

var data = img_combined.sampleRegions({
    collection: samples,
    properties: [target_varname],
    scale: 100,
  });
print('Combined sample data:');
print(data.limit(10));

var predmap_list = ee.List([]);

function JSsequence(i) {
	return i ? JSsequence(i - 1).concat(i) : []
}
var num_bootstrap = 1;
var seedsForBootstrapping = JSsequence(num_bootstrap);
var strat_var = 'biome_type';
var bootStrap = require('users/devinrouth/toolbox:Stratified_Bootstrap_FeatureCollection.js');

function pad(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

seedsForBootstrapping.map(function(randseed) {
  print('randseed', randseed);
  
  // var boostrapSampleForTraining = bootStrap.makeStratBootStrapFeatureCollection(data, strat_var, 60, randseed);
  print(data.size());
  // print(boostrapSampleForTraining.size());
  // var data_train = boostrapSampleForTraining;
  
  var data_ = data.randomColumn('random', randseed);
  var train_prop = 0.6
  var data_train = data_.filter(ee.Filter.lte('random', train_prop));
  var data_test = data_.filter(ee.Filter.gt('random', train_prop));
  print(data_train.size());
  print(data_train.limit(10));
  
  // RF
  var model = ee.Classifier.smileRandomForest({
  	numberOfTrees: 100,
  // 	variablesPerSplit: 6,
  	minLeafPopulation: 2,
  	bagFraction: 0.632,
  	seed: 314
  }).setOutputMode('REGRESSION');
  print(model);
  
  var feat_names = [
    'bio01', 'bio12',
    // 'bio01', 'bio02', 'bio03', 'bio04', 'bio05', 'bio06', 'bio07', 'bio08', 'bio09', 'bio10', 'bio11', 'bio12', 'bio13', 'bio14', 'bio15', 'bio16', 'bio17', 'bio18', 'bio19',
    'elevation', 'slope',
    'lc', 'npp',
    'biome_type'
  ];
  
  var trained_model = model.train({
    features: data_train,
    classProperty: target_varname,
    inputProperties: feat_names
  });
  print(trained_model);
  
  var train = data_train.classify(trained_model);
  var test = data_test.classify(trained_model);
  print(test.limit(10));
  
  // Accuracy
  var chart_train = ui.Chart.feature.byFeature(train, target_varname, 'classification')
    .setChartType('ScatterChart').setOptions({
      title: 'Predicted vs Observed - Train',
      hAxis: {'title': 'observed'},
      vAxis: {'title': 'predicted'},
      pointSize: 3,
      trendlines: { 0: {showR2: true, visibleInLegend: true} ,
      1: {showR2: true, visibleInLegend: true}}});
  print(chart_train);
  
  var chart_test = ui.Chart.feature.byFeature(test, target_varname, 'classification')
    .setChartType('ScatterChart').setOptions({
      title: 'Predicted vs Observed - Test',
      hAxis: {'title': 'observed'},
      vAxis: {'title': 'predicted'},
      pointSize: 3,
      trendlines: { 0: {showR2: true, visibleInLegend: true} ,
      1: {showR2: true, visibleInLegend: true}}});
  print(chart_test);
  
  // Generate predicted maps
  var map_name = target_varname + '_pred';
  var predicted_map = img_combined.classify(trained_model, map_name);
  // predicted_map = predicted_map.mask(biome);
  print(predicted_map);
  
  // var colors = ['00007F', '0000FF', '0074FF', '0DFFEA', '8CFF41', 'FFDD00', 'FF3700', 'C30000'];
  var palette = palettes.kovesi.diverging_rainbow_bgymr_45_85_c67[7];
  var vis = {min: 0, max: 1, palette: palette};
  Map.addLayer(predicted_map, vis, map_name);
  
  var unboundedGeo = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false);
  Export.image.toAsset({
    image: predicted_map,
    description: 'toAsset__' + map_name + '_' + randseed,
    // assetId: 'users/leizhang-geo/soil/soil_turnover/root_distribution/topsoil/bootstrap/' + map_name + '_' + randseed,
    assetId: 'users/leizhang-geo/soil/soil_turnover/root_distribution/subsoil/bootstrap/' + map_name + '_' + randseed,
    crs: 'EPSG:4326',
    region: unboundedGeo,
    crsTransform: [0.008333333333333333,0,-180,0,-0.008333333333333333,90],
  	maxPixels: 1e13,
  	scale: proj_scale
  });
  
  // Export.image.toDrive({
  //       image: predicted_map,
  //       description: 'predicted_map',
  //       fileNamePrefix: map_name,
  //       folder: "soil_turnover",
  //       scale: 50000,
  //       maxPixels: 1e13,
  //       crs: "EPSG:4326"
  //   });
});
