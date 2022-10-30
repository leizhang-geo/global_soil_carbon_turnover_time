// This is the code for collecting the environmental covariates at soil sample locations.
// The covariate data mainly include four categories: climate, topography, physical and chemical soil properties.

// Load color palette module
var palettes = require('users/gena/packages:palettes');

// ------------------------------------ Soil samples (profiles) ------------------------------------ //

// Soil points (WoSIS 2019 and NCSCD datasets)
var samples = ee.FeatureCollection("users/leizhang-geo/soil/soil_turnover/samples/df_profile_loc");

// samples of root distribution
// var samples = ee.FeatureCollection("users/leizhang-geo/soil/soil_turnover/samples/root_profiles_D50D95");
// var samples = ee.FeatureCollection("users/leizhang-geo/soil/soil_turnover/samples/root_distribution");

print(samples.size());
print(samples.limit(10));


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
print(isric_bdod);
print(isric_cfvo);
print(isric_phh2o);
print(isric_ocs);

var vis_bdod = {min: 0, max: 174};
Map.addLayer(isric_bdod.select('bdod_5-15cm_mean'), vis_bdod, 'isric_bdod_5-15cm_mean');
var vis_soc = {min: 0, max: 4000, palette: palettes.matplotlib.magma[7].reverse()};
Map.addLayer(isric_soc.select('soc_5-15cm_mean'), vis_soc, 'isric_soc_5-15cm_mean');

// Soil moisture profile
var smp = ee.ImageCollection('NASA_USDA/HSL/SMAP10KM_soil_moisture')
            .filter(ee.Filter.date('2017-04-01', '2017-11-30'))
            .select('smp').mean().reproject('EPSG:4326', null, 1000);
var smp_vis = {min: 0.0, max: 1.0, palette: ['0300ff', '418504', 'efff07', 'efff07', 'ff0303']};
Map.addLayer(smp, smp_vis, 'Soil Moisture Profile');


// ------------------------------------ Topography ------------------------------------ //
// Elevation (with slope)
var dataset = ee.Image('USGS/GTOPO30');
var elev = dataset.select('elevation');
var slp = ee.Terrain.slope(elev);
Map.addLayer(slp, {min: 0, max: 0.6, palette: ['black', 'white']}, 'slp');

var cti = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/cti").median().reproject('EPSG:4326', null, 90);
var tri = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/tri").median().reproject('EPSG:4326', null, 90);
var slope = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/slope").median().reproject('EPSG:4326', null, 90);
var vrm = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/vrm").median().reproject('EPSG:4326', null, 90);
var roughness = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/roughness").median().reproject('EPSG:4326', null, 90);
var tpi = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/tpi").median().reproject('EPSG:4326', null, 90);
var spi = ee.ImageCollection("projects/sat-io/open-datasets/Geomorpho90m/spi").median().reproject('EPSG:4326', null, 90);
print(slope);
Map.addLayer(slope, {min: 0, max: 0.6, palette: ['black', 'white']}, 'slope');


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
Map.addLayer(lc, lc_vis, 'Land Cover');

// Biome type
var biome = ee.Image("OpenLandMap/PNV/PNV_BIOME-TYPE_BIOME00K_C/v01").select('biome_type');
var vis_biome = {min: 1.0, max: 32.0,
  palette: [
    "1c5510","659208","ae7d20","000065","bbcb35","009a18",
    "caffca","55eb49","65b2ff","0020ca","8ea228","ff9adf",
    "baff35","ffba9a","ffba35","f7ffca","e7e718","798649",
    "65ff9a","d29e96"]};
Map.addLayer(biome, vis_biome, "Potential distribution of biomes");

var eco_zone = ee.FeatureCollection("users/haozhima95/eco_zone"),
    treemass = ee.Image("users/haozhima95/treemass_20200501");

// Eco Zone
// var eco_zone = ee.FeatureCollection("users/haozhima95/eco_zone");
// var treemass = ee.Image("users/haozhima95/treemass_20200501");
// // Filter the ecozones. Filter out water and ocean.
// eco_zone = eco_zone.filterMetadata('ECO_ZONE_I', 'not_equals', 13389);
// eco_zone = eco_zone.filterMetadata('GEZ_TERM', 'not_equals', 'Water');
// eco_zone = eco_zone.filterMetadata('GEZ_TERM', 'not_equals', 'No data');
// Map.addLayer(eco_zone, {}, 'eco_zone');

// NPP
var npp_modis = ee.ImageCollection('MODIS/006/MOD17A3HGF')
                  .filter(ee.Filter.date('2001-01-01', '2020-01-01'))
                  .select('Npp').mean().multiply(0.0001).reproject('EPSG:4326', null, 500);

var vis_npp_modis = {min: 0.0, max: 19000.0*0.0001, palette: ['bbe029', '0a9501', '074b03']};
Map.addLayer(npp_modis, vis_npp_modis, 'NPP_MODIS');

// RMF
var rmf = ee.Image('users/haozhima95/rootshootratio/rmf_all_20200521');
var rmf_vis = {min: 0.0, max: 100.0, palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red']};
Map.addLayer(rmf, rmf_vis, 'RMF');

// aboveground and belowground biomass
var agb = ee.ImageCollection("NASA/ORNL/biomass_carbon_density/v1").select('agb').first();
var bgb = ee.ImageCollection("NASA/ORNL/biomass_carbon_density/v1").select('bgb').first();
var agb_unc = ee.ImageCollection("NASA/ORNL/biomass_carbon_density/v1").select('agb_uncertainty').first();
var bgb_unc = ee.ImageCollection("NASA/ORNL/biomass_carbon_density/v1").select('bgb_uncertainty').first();
var vis_biomass = {min: 0.0, max: 100.0, palette: ['d9f0a3', 'addd8e', '78c679', '41ab5d', '238443', '005a32']};
Map.addLayer(agb, vis_biomass, "Aboveground biomass carbon");
Map.addLayer(bgb, vis_biomass, "Belowground biomass carbon");

// WorldClim
var worldclim = ee.Image('WORLDCLIM/V1/BIO');
var vis_bio01 = {min: -230.0, max: 300.0, palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red']};
Map.addLayer(worldclim.select('bio01'), vis_bio01, 'Annual Mean Temperature');

// Aridity index
var aridity_index = ee.Image("projects/sat-io/open-datasets/global_ai_et0");

// Vegetation
var maskQA = function(image) {
  return image.updateMask(image.select("SummaryQA").lte(1));
};
var evi = ee.ImageCollection('MODIS/006/MOD13A1')
                  .filter(ee.Filter.date('2000-01-01', '2021-01-01'))
                  // .map(maskQA)
                  .select('EVI').mean()
                  .reproject('EPSG:4326', null, 500);
var evi_vis = {min: 1000.0, max: 9000.0, palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ]};
Map.addLayer(evi, evi_vis, 'EVI');

// Anthropogenic
var pop = ee.ImageCollection("CIESIN/GPWv411/GPW_Population_Density")
                .filter(ee.Filter.date('2000-01-01', '2021-01-01'))
                .select('population_density').mean().reproject('EPSG:4326', null, 1000);
var pop_vis = {"min": 200.0, "max": 1000.0, "palette": ["ffffe7", "FFc869", "ffac1d", "e17735", "f2552c", "9f0c21"]};
Map.addLayer(pop, pop_vis, 'POP');

// Root distribution
var frbnpp_0to30_mean = ee.Image('users/frank/soil/soil_turnover/root_distribution/topsoil/frbnpp_0to30_mean');
var frbnpp_0to30_sd = ee.Image('users/frank/soil/soil_turnover/root_distribution/topsoil/frbnpp_0to30_sd');
var frbnpp_0to30_unc = ee.Image('users/frank/soil/soil_turnover/root_distribution/topsoil/frbnpp_0to30_unc');

var frbnpp_30to100_mean = ee.Image('users/frank/soil/soil_turnover/root_distribution/subsoil/frbnpp_30to100_mean');
var frbnpp_30to100_sd = ee.Image('users/frank/soil/soil_turnover/root_distribution/subsoil/frbnpp_30to100_sd');
var frbnpp_30to100_unc = ee.Image('users/frank/soil/soil_turnover/root_distribution/subsoil/frbnpp_30to100_unc');

// ------------------------------------ Visualization ------------------------------------ //
Map.addLayer(samples, {'color': 'red', opacity: 0.1}, 'Soil samples');
Map.setCenter(8, 20, 3.5);
// Map.setOptions('HYBRID');


// ------------------------------------ Export data from points ------------------------------------ //
var export_dir = 'soil_turnover';

function sampleRegions_and_export_toDrive(img, samples, var_name) {
  // var sampled_table = img.sampleRegions({
  //   collection: samples,
  //   geometries: false
  // });
  var sampled_table = img.reduceRegions({
    collection: samples,
    reducer: ee.Reducer.mean()
  });
  // print(sampled_table.limit(10));
  Export.table.toDrive({
    collection: sampled_table,
    description: 'ToDrive_Sampled_' + var_name,
    // fileNamePrefix: 'samples_' + var_name,
    fileNamePrefix: 'samples_root_' + var_name, // for root samples
    fileFormat: 'CSV',
    folder: export_dir,
    // selectors: ['profile_id', 'mean']
    selectors: ['index', 'mean'] // for root samples
  });
  return sampled_table;
}

// Export soil property (bdod)
var soil_varname = 'bdod';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_bdod.select(var_name), samples, var_name);
}

// Export soil property (cfvo)
var soil_varname = 'cfvo';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_cfvo.select(var_name), samples, var_name);
}

// Export soil property (soc)
var soil_varname = 'soc';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_soc.select(var_name), samples, var_name);
}

// Export soil property (cec)
var soil_varname = 'cec';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_cec.select(var_name), samples, var_name);
}

// Export soil property (clay)
var soil_varname = 'clay';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_clay.select(var_name), samples, var_name);
}

// Export soil property (sand)
var soil_varname = 'sand';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_sand.select(var_name), samples, var_name);
}

// Export soil property (silt)
var soil_varname = 'silt';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_silt.select(var_name), samples, var_name);
}

// Export soil property (nitrogen)
var soil_varname = 'nitrogen';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_nitrogen.select(var_name), samples, var_name);
}

// Export soil property (phh2o)
var soil_varname = 'phh2o';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_phh2o.select(var_name), samples, var_name);
}

// Export soil property (ocd)
var soil_varname = 'ocd';
var var_name_list = [soil_varname+'_0-5cm_mean', soil_varname+'_5-15cm_mean', soil_varname+'_15-30cm_mean', soil_varname+'_30-60cm_mean', soil_varname+'_60-100cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_ocd.select(var_name), samples, var_name);
}

// Export soil property (ocs)
var soil_varname = 'ocs';  // only 0-30 cm
var var_name_list = [soil_varname+'_0-30cm_mean'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(isric_ocs.select(var_name), samples, var_name);
}

// Export topography
var var_name = 'elev';
var sampled_table = sampleRegions_and_export_toDrive(elev, samples, var_name);

// var var_name = 'slp';
// var sampled_table = sampleRegions_and_export_toDrive(slp, samples, var_name);

var var_name = 'cti';
var sampled_table = sampleRegions_and_export_toDrive(cti, samples, var_name);

var var_name = 'tri';
var sampled_table = sampleRegions_and_export_toDrive(tri, samples, var_name);

var var_name = 'slp';
var sampled_table = sampleRegions_and_export_toDrive(slope, samples, var_name);

var var_name = 'vrm';
var sampled_table = sampleRegions_and_export_toDrive(vrm, samples, var_name);

var var_name = 'roughness';
var sampled_table = sampleRegions_and_export_toDrive(roughness, samples, var_name);

var var_name = 'tpi';
var sampled_table = sampleRegions_and_export_toDrive(tpi, samples, var_name);

var var_name = 'spi';
var sampled_table = sampleRegions_and_export_toDrive(spi, samples, var_name);


// Export soil moisture profile
var var_name = 'smp';
var sampled_table = sampleRegions_and_export_toDrive(smp, samples, var_name);

// Export land cover
var var_name = 'landcover';
var sampled_table = sampleRegions_and_export_toDrive(lc, samples, var_name);
var var_name = 'landcover_prop';
var sampled_table = sampleRegions_and_export_toDrive(lc_prop, samples, var_name);

// Biome type
var var_name = 'biome';
var sampled_table = sampleRegions_and_export_toDrive(biome, samples, var_name);

// Export NPP
var var_name = 'npp_modis';
var sampled_table = sampleRegions_and_export_toDrive(npp_modis, samples, var_name);

// RMF
var var_name = 'rmf';
var sampled_table = sampleRegions_and_export_toDrive(rmf, samples, var_name);

// Aboveground and belowground biomass
var var_name = 'agb';
var sampled_table = sampleRegions_and_export_toDrive(agb, samples, var_name);
var var_name = 'bgb';
var sampled_table = sampleRegions_and_export_toDrive(bgb, samples, var_name);

var var_name = 'agb_unc';
var sampled_table = sampleRegions_and_export_toDrive(agb_unc, samples, var_name);
var var_name = 'bgb_unc';
var sampled_table = sampleRegions_and_export_toDrive(bgb_unc, samples, var_name);

// WordClim
// var var_name_list = ['bio01', 'bio12'];
var var_name_list = ['bio01', 'bio02', 'bio03', 'bio04', 'bio05', 'bio06', 'bio07', 'bio08', 'bio09', 'bio10',
                     'bio11', 'bio12', 'bio13', 'bio14', 'bio15', 'bio16', 'bio17', 'bio18', 'bio19'];
for (var i in var_name_list) {
  var var_name = var_name_list[i];
  print(var_name);
  var sampled_table = sampleRegions_and_export_toDrive(worldclim.select(var_name), samples, var_name);
}

// Aridity_index
var var_name = 'aridity';
var sampled_table = sampleRegions_and_export_toDrive(aridity_index, samples, var_name);

// Vegetation
var var_name = 'evi';
var sampled_table = sampleRegions_and_export_toDrive(evi, samples, var_name);

// Anthropogenic
var var_name = 'pop';
var sampled_table = sampleRegions_and_export_toDrive(pop, samples, var_name);

// Root distribution
// var var_name = 'frbnpp_0to30_mean';
// var sampled_table = sampleRegions_and_export_toDrive(frbnpp_0to30_mean, samples, var_name);
// var var_name = 'frbnpp_0to30_sd';
// var sampled_table = sampleRegions_and_export_toDrive(frbnpp_0to30_sd, samples, var_name);
// var var_name = 'frbnpp_0to30_unc';
// var sampled_table = sampleRegions_and_export_toDrive(frbnpp_0to30_unc, samples, var_name);

// var var_name = 'frbnpp_30to100_mean';
// var sampled_table = sampleRegions_and_export_toDrive(frbnpp_30to100_mean, samples, var_name);
// var var_name = 'frbnpp_30to100_sd';
// var sampled_table = sampleRegions_and_export_toDrive(frbnpp_30to100_sd, samples, var_name);
// var var_name = 'frbnpp_30to100_unc';
// var sampled_table = sampleRegions_and_export_toDrive(frbnpp_30to100_unc, samples, var_name);
