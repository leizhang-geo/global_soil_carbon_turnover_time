// This is the GEE code used for sharing and visualzing our global maps to anyone interested in 
// our paper: "Zhang et al. Global patterns of top- and subsoil organic carbon turnover times".

var palettes = require('users/gena/packages:palettes');
var palette_mean = palettes.kovesi.diverging_rainbow_bgymr_45_85_c67[7].reverse();
var palette_unc = palettes.matplotlib.plasma[7];

var map_tovr_top_mean = ee.Image('users/frank/soil/soil_turnover/tovr_maps/tovr_0to30_mean');
Map.addLayer(map_tovr_top_mean, {min: 0, max: 200, palette: palette_mean}, 'SOC turnover time at topsoil layer (0-0.3m)');

var map_tovr_top_unc = ee.Image('users/frank/soil/soil_turnover/tovr_maps/tovr_0to30_unc');
Map.addLayer(map_tovr_top_unc, {min: 0, max: 0.4, palette: palette_unc}, 'Uncertainty of SOC turnover time at topsoil layer (0-0.3m)');

var map_tovr_sub_mean = ee.Image('users/frank/soil/soil_turnover/tovr_maps/tovr_30to100_mean');
Map.addLayer(map_tovr_sub_mean, {min: 0, max: 2000, palette: palette_mean}, 'SOC turnover time at topsoil layer (0.3-1m)');

var map_tovr_sub_unc = ee.Image('users/frank/soil/soil_turnover/tovr_maps/tovr_30to100_unc');
Map.addLayer(map_tovr_sub_unc, {min: 0, max: 0.4, palette: palette_unc}, 'Uncertainty of SOC turnover time at topsoil layer (0.3-1m)');

Map.setCenter(8, 20, 3);
