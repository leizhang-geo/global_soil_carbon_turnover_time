library(randomForest)
library(ranger)

# Set work directory to the source file path
src_file_path = rstudioapi::getActiveDocumentContext()$path
setwd(dirname(src_file_path))
print(getwd())

df = read.csv('./data/df_samples_with_covariates.csv')		# load the sample data with the environemental covariate values

y_name = c('tovr_0to30')
#y_name = c('tovr_30to100')
x_names = c(#'y', 'x',
            'bio01', 'bio12',
            'clay_0to30', 'sand_0to30', 'silt_0to30', 'nitrogen_0to30', 'ph_0to30', 'cec_0to30',
            #'clay_30to100', 'sand_30to100', 'silt_30to100', 'nitrogen_30to100', 'ph_30to100', 'cec_30to100',
            'elev', 'slp', 'vrm', 'roughness', 'cti', 'tri', 'tpi', 'spi')
y = df[, y_name]
x = df[, x_names]

## Quantile regression forest
quantiles=c(0.05, 0.5, 0.95)

qrf <- ranger(x=x, y=y,
              num.trees=500,
              quantreg=TRUE)
pred <- predict(qrf, x, type="quantiles", quantiles=quantiles)
pred_values = pred$predictions[, 2]

# predict on all points
df_all = read.csv('./data/df_all.csv')	# load the environemental covariate data at all pixel points for generating the predictive map
x_all = df_all[, x_names]

pred_all <- predict(qrf, x_all, type="quantiles", quantiles=quantiles)
pred_res = as.data.frame(pred_all$predictions)
names(pred_res) <- c("pred_lower", "pred_median", "pred_higher")

df_all_pred = cbind(df_all, pred_res)

write.csv(x=df_all_pred, file="./results/df_all_pred_top.csv", row.names=FALSE)
#write.csv(x=df_all_pred, file="./results/df_all_pred_sub.csv", row.names=FALSE)
