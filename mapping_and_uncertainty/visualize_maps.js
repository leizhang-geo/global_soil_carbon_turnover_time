// This is the GEE code used for sharing and visualzing our global maps to anyone interested in 
// our paper: "Zhang et al. Global patterns of top- and subsoil organic carbon turnover times".

var palettes = require('users/gena/packages:palettes');
var palette_mean = palettes.kovesi.diverging_rainbow_bgymr_45_85_c67[7].reverse();
var palette_unc = palettes.matplotlib.plasma[7];

var map_tovr_top_mean = ee.Image('users/leizhang-geo/soil/soil_turnover/results/tovr_maps/tovr_0to30_mean');
Map.addLayer(map_tovr_top_mean, {min: 0, max: 200, palette: palette_mean}, 'SOC turnover time at topsoil layer (0-0.3m)');

var map_tovr_sub_mean = ee.Image('users/leizhang-geo/soil/soil_turnover/results/tovr_maps/tovr_30to100_mean');
Map.addLayer(map_tovr_sub_mean, {min: 0, max: 2000, palette: palette_mean}, 'SOC turnover time at subsoil layer (0.3-1m)');

Map.setCenter(8, 20, 3);
