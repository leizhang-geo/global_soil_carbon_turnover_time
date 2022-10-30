// This is the code for analyze the uncertainty of the predicted maps and generating the map of prediction uncertainty of the global SOC turnover time

var palettes = require('users/gena/packages:palettes');
var palette_mean = palettes.kovesi.diverging_rainbow_bgymr_45_85_c67[7];
var palette_unc = palettes.matplotlib.plasma[7];

var img_npp = ee.ImageCollection('MODIS/006/MOD17A3HGF').select('Npp').mean().reproject('EPSG:4326', null, 5000);
var mask = img_npp.gte(10).reproject('EPSG:4326', null, 5000);

var map_name = 'tovr_0to30';
// var map_name = 'tovr_30to100';

var proj_scale = 11131.946;
var bootstrap_cnt = 100;

var map_first = ee.Image('users/leizhang-geo/soil/soil_turnover/results/tovr_maps/bootstrap/' + map_name + '_rand' + '_pred' + '_' + 1);
var map_list = ee.List([map_first]);
for(var i = 1+1; i < bootstrap_cnt+1; i++) {
  var map = ee.Image('users/leizhang-geo/soil/soil_turnover/results/tovr_maps/bootstrap/' + map_name + '_rand' + '_pred' + '_' + i);
  map_list = map_list.add(map);
}
var map_col = ee.ImageCollection(map_list);
print('map_col', map_col);

var map_std = map_col.reduce(ee.Reducer.stdDev()).rename(map_name+'_sd').mask(mask.gt(0));
var map_mean = map_col.reduce(ee.Reducer.mean()).rename(map_name+'_mean').mask(mask.gt(0));
var map_unc = map_std.divide(map_mean).rename(map_name+'_unc').mask(mask.gt(0));
var global_bou = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false);
print('Mean turnover time Range:',
      map_mean.reduceRegion({reducer: ee.Reducer.min(), geometry: global_bou, scale: proj_scale}),
      map_mean.reduceRegion({reducer: ee.Reducer.max(), geometry: global_bou, scale: proj_scale}));
print('Uncertainty Range:',
      map_unc.reduceRegion({reducer: ee.Reducer.min(), geometry: global_bou, scale: proj_scale}),
      map_unc.reduceRegion({reducer: ee.Reducer.max(), geometry: global_bou, scale: proj_scale}));

var output_name_mean = map_name + '_mean';
var vis = {min: 0, max: 200, palette: palette_mean};
// var vis = {min: 0, max: 4000, palette: palette_mean};

var map_mean_rescaled = map_mean.reproject('EPSG:4326', null, proj_scale);
Map.addLayer(map_mean, vis, output_name_mean);
print('Map mean', map_mean);

var output_name_unc = map_name + '_unc';
// var vis = {min: 0, max: 1, palette: palette_unc};
var vis = {min: 0, max: 0.5, palette: palette_unc};

var map_unc_rescaled = map_unc.reproject('EPSG:4326', null, proj_scale);
Map.addLayer(map_unc, vis, output_name_unc);
print('Map unc', map_unc);
Map.setCenter(8, 20, 3);

// toDrive
var unboundedGeo = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false);
Export.image.toDrive({
      image: map_mean,
      description: 'Export__' + output_name_mean,
      fileNamePrefix: output_name_mean,
      folder: "soil_turnover",
      scale: proj_scale,
      region: unboundedGeo,
      maxPixels: 1e13,
      crs: "EPSG:4326"
  });
Export.image.toDrive({
      image: map_unc,
      description: 'Export__' + output_name_unc,
      fileNamePrefix: output_name_unc,
      folder: "soil_turnover",
      scale: proj_scale,
      region: unboundedGeo,
      maxPixels: 1e13,
      crs: "EPSG:4326"
  });

// toAsset
Export.image.toAsset({
  image: map_mean,
  description: 'toAsset__' + output_name_mean,
  assetId: 'users/leizhang-geo/soil/soil_turnover/results/tovr_maps/' + output_name_mean,
  crs: 'EPSG:4326',
  region: unboundedGeo,
  crsTransform: [0.008333333333333333,0,-180,0,-0.008333333333333333,90],
	maxPixels: 1e13
});
Export.image.toAsset({
  image: map_unc,
  description: 'toAsset__' + output_name_unc,
  assetId: 'users/leizhang-geo/soil/soil_turnover/results/tovr_maps/' + output_name_unc,
  crs: 'EPSG:4326',
  region: unboundedGeo,
  crsTransform: [0.008333333333333333,0,-180,0,-0.008333333333333333,90],
	maxPixels: 1e13
});
