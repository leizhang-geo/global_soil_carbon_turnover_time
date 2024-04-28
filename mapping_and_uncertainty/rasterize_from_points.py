import numpy as np
import pandas as pd
import xarray as xr
import rioxarray as rxr
import geopandas as gpd
from shapely.geometry import box, mapping
from geocube.api.core import make_geocube
from geocube.rasterize import rasterize_points_griddata, rasterize_points_radial
from functools import partial
import json
import warnings
warnings.filterwarnings("ignore")


def generate_map(df_pred, variable_name, x_name='x', y_name='y', resolution=0.05, out_dir='./', method='nearest', lon_min=-180, lat_min=-90, lon_max=180, lat_max=90):
    gdf_pred = gpd.GeoDataFrame(df_pred, geometry=gpd.points_from_xy(df_pred[x_name], df_pred[y_name]), crs='epsg:4326')
    
    geom = json.dumps(mapping(box(lon_min, lat_min, lon_max, lat_max)))
    
    geo_grid = make_geocube(
        vector_data=gdf_pred,
        measurements=[variable_name],
        geom=geom,
        resolution=(-resolution, resolution),
        rasterize_function=partial(rasterize_points_griddata, method=method)
    )
    geo_grid.rio.write_crs(4326, inplace=True)
    
    geo_grid[variable_name].rio.to_raster('{}/{}.tif'.format(out_dir, variable_name))
    geo_grid.close()


def main():
    df_pred = pd.read_csv('./results/df_all_pred_topsoil.csv')
    # df_pred = pd.read_csv('./results/df_all_pred_subsoil.csv')
    print(df_pred.shape)
    print(list(df_pred.columns))

    variable_name = 'tovr_pred_mean'
    resolution = 0.05
    out_dir = './results/'
    method = 'linear'  # {'linear', 'nearest', 'cubic'}
    lon_min = -180
    lat_min = -90
    lon_max = 180
    lat_max = 90

    generate_map(df_pred=df_pred, variable_name=variable_name, x_name='x', y_name='y', resolution=resolution, out_dir=out_dir, lon_min=lon_min, lat_min=lat_min, lon_max=lon_max, lat_max=lat_max)
    print('\n--- DONE! ----\n')


if __name__ == "__main__":
    main()
