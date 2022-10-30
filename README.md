# Global Soil Carbon Turnover Time
This repository contains the code used for the analysis in the paper "Zhang et al. global patterns of top- and subsoil organic carbon turnover times".

## Requirement
- Python3
- numpy
- pandas
- scipy
- scikit-learn
- cartopy
- xarray
- openpyxl
- seaborn
- matplotlib
- jupyterlab

## Description of files
- [**sample_data_processing**](): The folder contains codes for preprocess the original soil sample datasets (WoSIS and NCSCD data). The procedure includes data screening, cleaning and transformation/complement.
- [**covariate_collection**](): The folder contains codes for collecting environmental covariate data from Google Earth Engine. The covariates mainly include four categories: climate, topography, physical and chemical soil properties.
- [**modelling**](): The folder contains codes for generating the machine learning model to predictive mapping of the global SOC turnover time, and includes the understanding the environmental effects (controlling factors) on the SOC turnover.
- [**mapping_and_uncertainty**](): The folder contains codes for visualize the global maps of SOC turnover times at top- and subsoil layers with their distribution of estimation uncertainty. It also contains codes for illustrating the key results in this study.
- [**datasets**](): The folder contains the data for the analysis in this study. Some data used in the programming procedure can be asked from the author privately due to the volume of these data is too large to present here.

## Contact

For questions and more details of our study please contact the author: Lei Zhang 张磊 (lei.zhang.geo@outlook.com)

Lei Zhang's [Homepage](https://leizhang-geo.github.io/)
