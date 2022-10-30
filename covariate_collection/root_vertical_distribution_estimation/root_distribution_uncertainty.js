
// var map_name = 'frbnpp_0to30';
var map_name = 'frbnpp_30to100';

var proj_scale = 11131.946;

var palettes = require('users/gena/packages:palettes');
var palette_mean = palettes.kovesi.diverging_rainbow_bgymr_45_85_c67[7];
var palette_unc = palettes.matplotlib.plasma[7];

var img_npp = ee.ImageCollection('MODIS/006/MOD17A3HGF').select('Npp').mean().reproject('EPSG:4326', null, 5000);
var mask = img_npp.gte(10).reproject('EPSG:4326', null, 5000);

var top_or_sub = 'subsoil'  // topsoil or subsoil
var map_folder = 'users/leizhang-geo/soil/soil_turnover/root_distribution/' + top_or_sub + '/bootstrap/';

var num_bootstrap = 10;
var map_first = ee.Image(map_folder + map_name + '_pred_' + 1);
var map_list = ee.List([map_first]);
for(var i = 1+1; i < num_bootstrap+1; i++) {
  var map = ee.Image(map_folder + map_name + '_pred_' + i);
  map_list = map_list.add(map);
}
var map_col = ee.ImageCollection(map_list);
print('map_col', map_col);
print('Bootstrap Iterations Collection', map_col);
print('Number of bootstraps completed:', map_col.size());

var mean_map = ee.ImageCollection(map_col).reduce(ee.Reducer.mean()).rename(map_name + '_mean').mask(mask.gt(0));

var sd_map = ee.ImageCollection(map_col).reduce(ee.Reducer.stdDev()).rename(map_name + '_sd').mask(mask.gt(0));

var unc_map = sd_map.divide(mean_map).rename(map_name + '_unc').mask(mask.gt(0));

var upperLowerCI_map = ee.ImageCollection(map_col).reduce(ee.Reducer.percentile([2.5, 97.5], ['lower', 'upper'])).rename([map_name + '_lower_2_5pct', map_name + '_upper_97_5pct']).mask(mask.gt(0));

var finalImageToExport = ee.Image.cat(
  mean_map,
  sd_map,
  unc_map,
  upperLowerCI_map
);

var vis = {min: 0, max: 1, palette: palette_mean};
Map.addLayer(mean_map, vis, map_name+'_mean');

var vis = {min: 0, max: 1, palette: palette_unc};
Map.addLayer(sd_map, vis, map_name+'_sd');

var vis = {min: 0, max: 0.2, palette: palette_unc};
Map.addLayer(unc_map, vis, map_name+'_uncertainty');

Map.setCenter(8, 20, 3);

var unboundedGeo = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false);

// Export the image
Export.image.toAsset({
	image: mean_map,
	description: map_name + '_mean',
	assetId: 'users/leizhang-geo/soil/soil_turnover/root_distribution/' + top_or_sub + '/' + map_name + '_mean',
	region: unboundedGeo,
	crs: 'EPSG:4326',
	crsTransform: [0.008333333333333333, 0, -180, 0, -0.008333333333333333, 90],
	maxPixels: 1e13,
  scale: proj_scale
});

Export.image.toAsset({
	image: sd_map,
	description: map_name + '_sd',
	assetId: 'users/leizhang-geo/soil/soil_turnover/root_distribution/' + top_or_sub + '/' + map_name + '_sd',
	region: unboundedGeo,
	crs: 'EPSG:4326',
	crsTransform: [0.008333333333333333, 0, -180, 0, -0.008333333333333333, 90],
	maxPixels: 1e13,
  scale: proj_scale
});

Export.image.toAsset({
	image: unc_map,
	description: map_name + '_unc',
	assetId: 'users/leizhang-geo/soil/soil_turnover/root_distribution/' + top_or_sub + '/' + map_name + '_unc',
	region: unboundedGeo,
	crs: 'EPSG:4326',
	crsTransform: [0.008333333333333333, 0, -180, 0, -0.008333333333333333, 90],
	maxPixels: 1e13,
  scale: proj_scale
});

Export.image.toDrive({
  image: mean_map,
  description: 'Export__' + map_name + '_mean',
  fileNamePrefix: map_name + '_mean',
  folder: "soil_turnover",
  // scale: proj_scale,
  region: unboundedGeo,
  maxPixels: 1e13,
  crs: "EPSG:4326",
  scale: proj_scale
});

Export.image.toDrive({
  image: sd_map,
  description: 'Export__' + map_name + '_sd',
  fileNamePrefix: map_name + '_sd',
  folder: "soil_turnover",
  // scale: proj_scale,
  region: unboundedGeo,
  maxPixels: 1e13,
  crs: "EPSG:4326",
  scale: proj_scale
});

Export.image.toDrive({
  image: unc_map,
  description: 'Export__' + map_name + '_unc',
  fileNamePrefix: map_name + '_unc',
  folder: "soil_turnover",
  // scale: proj_scale,
  region: unboundedGeo,
  maxPixels: 1e13,
  crs: "EPSG:4326",
  scale: proj_scale
});
