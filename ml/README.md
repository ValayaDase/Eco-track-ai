# EcoTrack AI ML Model

This folder contains the dataset, training scripts, and exported Random Forest model used by the website.

## Structure

- `personal_carbon_footprint_behavior.csv` - training dataset
- `model.json` - exported Random Forest classifier and regressor consumed by Next.js
- `scripts/train_random_forest.py` - trains and exports the model
- `scripts/predict.py` - tests predictions from the exported JSON model

## Train

```powershell
python -m pip install -r ml/requirements.txt
python ml/scripts/train_random_forest.py
```

The training script prints regression MAE, regression R2, and classification accuracy, then updates `ml/model.json`.
