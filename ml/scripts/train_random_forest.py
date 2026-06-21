import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split


ROOT_DIR = Path(__file__).resolve().parents[2]
ML_DIR = ROOT_DIR / "ml"
DATASET_PATH = ML_DIR / "personal_carbon_footprint_behavior.csv"
MODEL_PATH = ML_DIR / "model.json"

DAY_MAP = {"Weekday": 0, "Weekend": 1}
TRANSPORT_MAP = {"EV": 0, "Walk": 1, "Bike": 2, "Bus": 3, "Car": 4}
FOOD_MAP = {"Veg": 0, "Mixed": 1, "Non-Veg": 2}
LEVEL_MAP = {"Low": 0, "Medium": 1, "High": 2}

FEATURE_COLUMNS = [
    "day_type_enc",
    "transport_mode_enc",
    "distance_km",
    "electricity_kwh",
    "renewable_usage_pct",
    "food_type_enc",
    "screen_time_hours",
    "waste_generated_kg",
    "eco_actions",
]


def clean_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()

    for column in df.select_dtypes(include=["object"]).columns:
        df[column] = df[column].astype(str).str.strip()

    df["day_type_enc"] = df["day_type"].map(DAY_MAP).fillna(0).astype(int)
    df["transport_mode_enc"] = df["transport_mode"].map(TRANSPORT_MAP).fillna(1).astype(int)
    df["food_type_enc"] = df["food_type"].map(FOOD_MAP).fillna(0).astype(int)
    df["carbon_impact_level_enc"] = df["carbon_impact_level"].map(LEVEL_MAP).fillna(1).astype(int)

    return df


def export_tree(tree, is_classifier: bool) -> dict:
    tree_ = tree.tree_

    def recurse(node: int) -> dict:
        if tree_.feature[node] != -2:
            return {
                "feature": int(tree_.feature[node]),
                "threshold": float(tree_.threshold[node]),
                "left": recurse(tree_.children_left[node]),
                "right": recurse(tree_.children_right[node]),
            }

        value = tree_.value[node][0]
        if is_classifier:
            return {"value": int(np.argmax(value))}

        return {"value": float(value[0])}

    return recurse(0)


def train_and_export() -> None:
    df = clean_dataset(DATASET_PATH)
    x = df[FEATURE_COLUMNS].values
    y_reg = df["carbon_footprint_kg"].values
    y_clf = df["carbon_impact_level_enc"].values

    stratify = y_clf if len(set(y_clf)) > 1 else None
    x_train, x_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        x,
        y_reg,
        y_clf,
        test_size=0.2,
        random_state=42,
        stratify=stratify,
    )

    classifier = RandomForestClassifier(n_estimators=80, max_depth=12, random_state=42)
    regressor = RandomForestRegressor(n_estimators=80, max_depth=12, random_state=42)

    classifier.fit(x_train, y_clf_train)
    regressor.fit(x_train, y_reg_train)

    reg_predictions = regressor.predict(x_test)
    clf_predictions = classifier.predict(x_test)

    model_data = {
        "metadata": {
            "algorithm": "RandomForest",
            "dataset": DATASET_PATH.name,
            "featureColumns": FEATURE_COLUMNS,
            "labelColumn": "carbon_footprint_kg",
            "classColumn": "carbon_impact_level",
            "transportMap": TRANSPORT_MAP,
            "foodMap": FOOD_MAP,
            "dayMap": DAY_MAP,
            "levelMap": LEVEL_MAP,
            "metrics": {
                "regressionMae": round(float(mean_absolute_error(y_reg_test, reg_predictions)), 4),
                "regressionR2": round(float(r2_score(y_reg_test, reg_predictions)), 4),
                "classificationAccuracy": round(float(accuracy_score(y_clf_test, clf_predictions)), 4),
            },
        },
        "classifier": [export_tree(tree, is_classifier=True) for tree in classifier.estimators_],
        "regressor": [export_tree(tree, is_classifier=False) for tree in regressor.estimators_],
    }

    MODEL_PATH.write_text(json.dumps(model_data, separators=(",", ":")), encoding="utf-8")
    print(f"Loaded {len(df)} rows from {DATASET_PATH}")
    print(f"Saved Random Forest model to {MODEL_PATH}")
    print(json.dumps(model_data["metadata"]["metrics"], indent=2))


if __name__ == "__main__":
    train_and_export()
