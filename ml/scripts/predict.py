import argparse
import json
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT_DIR / "ml" / "model.json"
LEVELS = ["Low", "Medium", "High"]


def predict_tree(node: dict, vector: list[float]) -> float:
    if "value" in node:
        return node["value"]

    feature = node["feature"]
    branch = "left" if vector[feature] <= node["threshold"] else "right"
    return predict_tree(node[branch], vector)


def predict_forest(trees: list[dict], vector: list[float], mode: str) -> float:
    predictions = [predict_tree(tree, vector) for tree in trees]

    if mode == "classify":
        return max(set(predictions), key=predictions.count)

    return sum(predictions) / len(predictions)


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict carbon footprint from exported Random Forest JSON.")
    parser.add_argument("features", nargs=9, type=float, help="Nine model features in training order.")
    args = parser.parse_args()

    model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    footprint = predict_forest(model["regressor"], args.features, "regress")
    level_index = int(predict_forest(model["classifier"], args.features, "classify"))

    print(
        json.dumps(
            {
                "carbon_footprint_kg": round(footprint, 2),
                "carbon_impact_level": LEVELS[level_index] if 0 <= level_index < len(LEVELS) else "Medium",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
