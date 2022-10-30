// This is the code for generating the Random Forest model that linking the soil organic carbon (SOC) turnover time and the relevant environmental variables.
// Then, the fitted model is used for mapping the global distributions of SOC turnover time at top-and subsoil layers.

// Load color palette module
var palettes = require('users/gena/packages:palettes');

// ------------------------------------ Soil samples (profiles) ------------------------------------ //
// Soil points for modelling
var samples = ee.FeatureCollection("users/leizhang-geo/soil/soil_turnover/samples/samples_soil_turnover_0to1m");
print(samples.size());
print(samples.limit(10));
Map.addLayer(samples, {'color': 'red', opacity: 0.1}, 'Soil samples');

var target_varname = 'tovr_0to30_rand';
// var target_varname = 'tovr_30to100_rand';

var feat_names = [
  'bio01', 'bio12',
  'clay_0-30cm', 'sand_0-30cm', 'silt_0-30cm',
  'nitrogen_0-30cm', 'phh2o_0-30cm', 'cec_0-30cm',
  'elevation', 'slope', 'vrm', 'roughness', 'cti', 'tri', 'tpi', 'spi'
];
// var feat_names = [
//   'bio01', 'bio12',
//   'clay_30-100cm', 'sand_30-100cm', 'silt_30-100cm',
//   'nitrogen_30-100cm', 'phh2o_30-100cm', 'cec_30-100cm',
//   'elevation', 'slope', 'vrm', 'roughness', 'cti', 'tri', 'tpi', 'spi'
// ];

var proj_scale = 11131.946;

// ------------------------------------ Soil properties ------------------------------------ //
var isric_bdod = ee.Image("projects/soilgrids-isric/bdod_mean").reproject('EPSG:4326', null, 250);
var isric_cec = ee.Image("projects/soilgrids-isric/cec_mean").reproject('EPSG:4326', null, 250);
var isric_cfvo = ee.Image("projects/soilgrids-isric/cfvo_mean").reproject('EPSG:4326', null, 250);
var isric_clay = ee.Image("projects/soilgrids-isric/clay_mean").reproject('EPSG:4326', null, 250);
var isric_sand = ee.Image("projects/soilgrids-isric/sand_mean").reproject('EPSG:4326', null, 250);
var isric_silt = ee.Image("projects/soilgrids-isric/silt_mean").reproject('EPSG:4326', null, 250);
var isric_nitrogen = ee.Image("projects/soilgrids-isric/nitrogen_mean").reproject('EPSG:4326', null, 250);
var isric_phh2o = ee.Image("projects/soilgrids-isric/phh2o_mean").reproject('EPSG:4326', null, 250);
var isric_soc = ee.Image("projects/soilgrids-isric/soc_mean").reproject('EPSG:4326', null, 250);
var isric_ocd = ee.Image("projects/soilgrids-isric/ocd_mean").reproject('EPSG:4326', null, 250);
var isric_ocs = ee.Image("projects/soilgrids-isric/ocs_mean").reproject('EPSG:4326', null, 250);

function average_topsoil_property(img, varname) {
  var v1 = img.select(varname+"_0-5cm_mean");
  var v2 = img.select(varname+"_5-15cm_mean");
  var v3 = img.select(varname+"_15-30cm_mean");
  var mean_val = img.expression(
   "(v1 * 5 + v2 * 10 + v3 * 15) / 30",
   { "v1": v1, "v2": v2, "v3": v3 }
  );
  return mean_val.rename(varname+'_0-30cm');
}

function average_subsoil_property(img, varname) {
  var v1 = img.select(varname+"_30-60cm_mean");
  var v2 = img.select(varname+"_60-100cm_mean");
  var mean_val = img.expression(
   "(v1 * 30 + v2 * 40) / 70",
   { "v1": v1, "v2": v2 }
  );
  return mean_val.rename(varname+'_30-100cm');
}

var soil_clay_0to30 = average_topsoil_property(isric_clay, 'clay');
var soil_sand_0to30 = average_topsoil_property(isric_sand, 'sand');
var soil_silt_0to30 = average_topsoil_property(isric_silt, 'silt');
var soil_nitrogen_0to30 = average_topsoil_property(isric_nitrogen, 'nitrogen');
var soil_ph_0to30 = average_topsoil_property(isric_phh2o, 'phh2o');
var soil_cec_0to30 = average_topsoil_property(isric_cec, 'cec');

var soil_clay_30to100 = average_subsoil_property(isric_clay, 'clay');
var soil_sand_30to100 = average_subsoil_property(isric_sand, 'sand');
var soil_silt_30to100 = average_subsoil_property(isric_silt, 'silt');
var soil_nitrogen_30to100 = average_subsoil_property(isric_nitrogen, 'nitrogen');
var soil_ph_30to100 = average_subsoil_property(isric_phh2o, 'phh2o');
var soil_cec_30to100 = average_subsoil_property(isric_cec, 'cec');

print(isric_sand);
print(soil_sand_0to30);
print(soil_sand_30to100);

var vis_sand = {min: 0, max: 800, palette: palettes.colorbrewer.YlOrBr[9]};
// Map.addLayer(soil_sand_0to30, vis_sand, 'isric_sand_0-30cm_mean');
// Map.addLayer(soil_sand_30to100, vis_sand, 'isric_sand_30-100cm_mean');

// ------------------------------------ Topography ------------------------------------ //
// Elevation (with slope)
var dataset = ee.Image('USGS/GTOPO30');
var elev = dataset.select('elevation');
var cti = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/cti").median().rename('cti').reproject('EPSG:4326', null, 90);
var tri = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/tri").median().rename('tri').reproject('EPSG:4326', null, 90);
var slope = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/slope").median().rename('slope').reproject('EPSG:4326', null, 90);
var vrm = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/vrm").median().rename('vrm').reproject('EPSG:4326', null, 90);
var roughness = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/roughness").median().rename('roughness').reproject('EPSG:4326', null, 90);
var tpi = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/tpi").median().rename('tpi').reproject('EPSG:4326', null, 90);
var spi = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/spi").median().rename('spi').reproject('EPSG:4326', null, 90);
// print(slope);
// Map.addLayer(slope, {min: 0, max: 0.6, palette: ['black', 'white']}, 'slope');

// ------------------------------------ Environment ------------------------------------ //
// Land cover
var lc = ee.ImageCollection('MODIS/006/MCD12Q1')
           .filter(ee.Filter.date('2001-01-01', '2001-12-31'))
           .select('LC_Type1').first();
var lc_prop = ee.ImageCollection('MODIS/006/MCD12Q1')
           .filter(ee.Filter.date('2001-01-01', '2001-12-31'))
           .select('LC_Prop1').first();
var lc_vis = {min: 1.0, max: 17.0,
  palette: [
    '05450a', '086a10', '54a708', '78d203', '009900', 'c6b044', 'dcd159',
    'dade48', 'fbff13', 'b6ff05', '27ff87', 'c24f44', 'a5a5a5', 'ff6d4c',
    '69fff8', 'f9ffa4', '1c0dff']};
// Map.addLayer(lc, lc_vis, 'Land Cover');

// WorldClim
var worldclim = ee.Image('WORLDCLIM/V1/BIO');
var vis_bio01 = {min: -230.0, max: 300.0, palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red']};
// Map.addLayer(worldclim.select('bio01'), vis_bio01, 'Annual Mean Temperature');

// boundary vectors for sampling
var poly8 = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-105.40799217460426, 49.19551536964747],
          [-105.40799217460426, 29.630041436140456],
          [-81.15017967460425, 29.630041436140456],
          [-81.15017967460425, 49.19551536964747]]], null, false),
    poly2_5 = 
    /* color: #98ff00 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      },
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.MultiPolygon(
        [[[[-141.43136847429778, 57.878451139759925],
           [-141.43136847429778, 24.54478743918241],
           [-64.3952356617978, 24.54478743918241],
           [-64.3952356617978, 57.878451139759925]]],
         [[[111.28506800279911, -23.149620174046436],
           [111.28506800279911, -44.00005922619266],
           [154.37344690904922, -44.00005922619266],
           [154.37344690904922, -23.149620174046436]]]], null, false),
    poly1 = 
    /* color: #0b4a8b */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      },
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.MultiPolygon(
        [[[[-74.6605200782272, 6.03154446971479],
           [-74.6605200782272, -30.467411496814478],
           [-30.759152890727194, -30.467411496814478],
           [-30.759152890727194, 6.03154446971479]]],
         [[[-112.43141270958836, 31.061802748626878],
           [-112.43141270958836, 6.587587700290685],
           [-82.19703770958836, 6.587587700290685],
           [-82.19703770958836, 31.061802748626878]]]], null, false);
// Map.addLayer(poly8, {'color': 'black', opacity: 0.5}, 'poly8');
// Map.addLayer(poly2_5, {'color': 'black', opacity: 0.5}, 'poly2_5');
// Map.addLayer(poly1, {'color': 'black', opacity: 0.5}, 'poly1');

// ------------------------------------ Random forest modelling ------------------------------------ //
// Combine images
var img_combined = worldclim
                    .addBands(elev).addBands(slope).addBands(vrm).addBands(roughness).addBands(cti).addBands(tri).addBands(tpi).addBands(spi)
                    .addBands(soil_clay_0to30).addBands(soil_sand_0to30).addBands(soil_silt_0to30).addBands(soil_clay_30to100).addBands(soil_sand_30to100).addBands(soil_silt_30to100)
                    .addBands(soil_nitrogen_0to30).addBands(soil_ph_0to30).addBands(soil_cec_0to30).addBands(soil_nitrogen_30to100).addBands(soil_ph_30to100).addBands(soil_cec_30to100);
print('Combined images:');
print(img_combined);

// Start bootstrap modelling using random forest model
var num_bootstrap_start = 1;
var num_bootstrap_end = 5;
var seedsForBootstrapping = ee.List.sequence(num_bootstrap_start, num_bootstrap_end);

seedsForBootstrapping.getInfo().map(function(randseed) {
  print('randseed', randseed);

  // Resample to balance distribution of points by biome types
  var sample1 = samples.filter(ee.Filter.eq('biome_type', 1));
  // Map.addLayer(sample1, {'color': '#DC143C', opacity: 0.1}, 'Tropical forests');
  print(sample1.size());
  var sample1_in = sample1.filterBounds(poly1).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  var sample1_out = sample1.filter(ee.Filter.bounds(poly1).not());
  var sample1 = sample1_in.merge(sample1_out);
  print(sample1.size());
  print(sample1.limit(10));
  
  var sample2 = samples.filter(ee.Filter.eq('biome_type', 2));
  // Map.addLayer(sample2, {'color': '#1E90FF', opacity: 0.1}, 'Temperate forests');
  print(sample2.size());
  var sample2_in = sample2.filterBounds(poly2_5).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  var sample2_out = sample2.filter(ee.Filter.bounds(poly2_5).not());
  var sample2 = sample2_in.merge(sample2_out);
  print(sample2.size());
  print(sample2.limit(10));
  
  var sample3 = samples.filter(ee.Filter.eq('biome_type', 3)).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  // Map.addLayer(sample3, {'color': '#A000FF', opacity: 0.1}, 'Boreal forests');
  print(sample3.size());
  print(sample3.limit(10));
  
  var sample4 = samples.filter(ee.Filter.eq('biome_type', 4)).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  // Map.addLayer(sample4, {'color': '#228B22', opacity: 0.1}, 'Tropical savannahs and grasslands');
  print(sample4.size());
  print(sample4.limit(10));
  
  var sample5 = samples.filter(ee.Filter.eq('biome_type', 5));
  // Map.addLayer(sample5, {'color': '#9ACD32', opacity: 0.1}, 'Temperate grasslands and shrublands');
  print(sample5.size());
  var sample5_in = sample5.filterBounds(poly2_5).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  var sample5_out = sample5.filter(ee.Filter.bounds(poly2_5).not());
  var sample5 = sample5_in.merge(sample5_out);
  print(sample5.size());
  print(sample5.limit(10));
  
  var sample6 = samples.filter(ee.Filter.eq('biome_type', 6)).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  // Map.addLayer(sample6, {'color': '#FA9418', opacity: 0.1}, 'Deserts');
  print(sample6.size());
  print(sample6.limit(10));
  
  var sample7 = samples.filter(ee.Filter.eq('biome_type', 7)).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.6));
  // Map.addLayer(sample7, {'color': '#2FFFDA', opacity: 0.1}, 'Tundra');
  print(sample7.size());
  print(sample7.limit(10));
  
  var sample8 = samples.filter(ee.Filter.eq('biome_type', 8));
  // Map.addLayer(sample8, {'color': '#FF69B4', opacity: 0.1}, 'Croplands');
  print(sample8.size());
  var sample8_in = sample8.filterBounds(poly8).randomColumn('random', randseed).filter(ee.Filter.lessThan('random', 0.5));
  var sample8_out = sample8.filter(ee.Filter.bounds(poly8).not());
  var sample8 = sample8_in.merge(sample8_out);
  print(sample8.size());
  print(sample8.limit(10));
  
  var sample_all = sample1.merge(sample2).merge(sample3).merge(sample4).merge(sample5).merge(sample6).merge(sample7).merge(sample8);
  print(sample_all.size());
  print(sample_all.limit(10));
  
  sample_all = sample_all.randomColumn('rand_number', randseed, 'normal');
  sample_all = sample_all.map(function(feat) {
    feat = ee.Feature(feat);
    var shift_0to30 = ee.Number(feat.get('rand_number')).multiply(ee.Number(feat.get('tovr_0to30_sd')));
    var tovr_0to30_rand = ee.Number(feat.get('tovr_0to30')).add(ee.Number(shift_0to30));
    var shift_30to100 = ee.Number(feat.get('rand_number')).multiply(ee.Number(feat.get('tovr_30to100_sd')));
    var tovr_30to100_rand = ee.Number(feat.get('tovr_30to100')).add(ee.Number(shift_30to100));
    var feat_new = feat
                      .set({'shift_0to30': shift_0to30}).set({'tovr_0to30_rand': tovr_0to30_rand})
                      .set({'shift_30to100': shift_30to100}).set({'tovr_30to100_rand': tovr_30to100_rand});
    return feat_new;
  });
  
  var data = img_combined.sampleRegions({
      collection: sample_all,
      properties: [target_varname],
      scale: 90
    }).randomColumn('random', randseed);
  print(data.size());
  print(data.limit(10));
  
  var data_train = data.filter(ee.Filter.lte('random', 1));
  var data_test = data.filter(ee.Filter.gt('random', 0.9));
  print('sample size (before bootstrap)  : ', samples.size());
  print('bootstrapped sample size (all)  : ', data.size());
  print('bootstrapped sample size (train): ', data_train.size());
  print(data_train.limit(10));
  print(data_test.size());
  print(data_test.limit(10));
  
  // Initialize a RF model
  var model = ee.Classifier.smileRandomForest({
  	numberOfTrees: 100,
  	variablesPerSplit: 10,
  	minLeafPopulation: 2,
  	bagFraction: 0.632,
  	seed: randseed,
  }).setOutputMode('REGRESSION');
  print(model);
  
  // Train the model
  var trained_model = model.train({
    features: data,
    classProperty: target_varname,
    inputProperties: feat_names
  });
  print(trained_model);
  print(trained_model.explain());
  
  var trained = data.classify(trained_model);
  print(trained.limit(10));
  
  var train_model = model.train({
    features: data_train,
    classProperty: target_varname,
    inputProperties: feat_names
  });
  
  // Test the model performance
  var test = data_test.classify(train_model);
  print(test.limit(10));
  /*
  //var mean_tovr_0to30_log = data.aggregate_mean('tovr_0to30_log');
  //print('mean_tovr_0to30_log = ', mean_tovr_0to30_log);
  var mean_tovr_30to100_log = data.aggregate_mean('tovr_30to100_log');
  print('mean_tovr_30to100_log = ', mean_tovr_30to100_log);
  
  var diff = function(feature) {
    var pred = ee.Number.parse(feature.get('classification'));
    var obse = ee.Number.parse(feature.get('tovr_30to100_log'));
    var diff1 = pred.subtract(ee.Number.parse(obse));
    var diff2 = obse.subtract(ee.Number.parse(mean_tovr_30to100_log));
    return feature.set('diff1_sq', diff1.pow(2)).set('diff2_sq', diff2.pow(2));
  };
  var trained = trained.map(diff);
  var diff1_sq_sum = trained.aggregate_sum('diff1_sq');
  print(diff1_sq_sum);
  var diff2_sq_sum = trained.aggregate_sum('diff2_sq');
  print(diff2_sq_sum);
  var r2 = diff1_sq_sum.divide(diff2_sq_sum);
  print('r2 = ', r2);
  */
  
  var chart = ui.Chart.feature.byFeature(test, target_varname, 'classification')
      .setChartType('ScatterChart').setOptions({
          title: 'Predicted vs Observed - Test',
          hAxis: {'title': 'observed'},
          vAxis: {'title': 'predicted'},
          pointSize: 3,
          trendlines: { 0: {showR2: true, visibleInLegend: true} ,
          1: {showR2: true, visibleInLegend: true}}});
  print(chart);
  
  
  // Generate predicted maps
  var map_name = target_varname + '_pred';
  var predicted_map = img_combined.classify(trained_model, map_name);
  // predicted_map = predicted_map.reproject('EPSG:4326', null, proj_scale);
  print(predicted_map);
  
  var palette = palettes.kovesi.diverging_rainbow_bgymr_45_85_c67[7];
  var vis = {min: 10, max: 250, palette: palette};
  // Map.addLayer(predicted_map, vis, map_name);
  Map.setCenter(8, 20, 3);
  
  var unboundedGeo = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false);
  Export.image.toAsset({
    image:predicted_map,
    description: 'ToAsset__' + map_name + '_' + randseed,
    assetId: 'users/leizhang-geo/soil/soil_turnover/results/tovr_maps/bootstrap/' + map_name + '_' + randseed,
    crs: 'EPSG:4326',
    region: unboundedGeo,
    crsTransform: [0.008333333333333333,0,-180,0,-0.008333333333333333,90],
    maxPixels: 1e13,
    // scale: proj_scale
  });

});
