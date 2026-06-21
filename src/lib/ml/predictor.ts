import type { MlPrediction } from "@/lib/ml/features";
import model from "@/lib/ml/model.json";

const LEVELS = ["Low", "Medium", "High"] as const;

type TreeNode =
  | {
      value: number;
    }
  | {
      feature: number;
      threshold: number;
      left: TreeNode;
      right: TreeNode;
    };

interface ModelData {
  classifier: TreeNode[];
  regressor: TreeNode[];
}

const forest = model as ModelData;

function predictTree(
  node: TreeNode,
  vector: number[]
): number {
  if ("value" in node) {
    return node.value;
  }

  const branch =
    vector[node.feature] <= node.threshold
      ? node.left
      : node.right;

  return predictTree(branch, vector);
}

function predictForest(
  trees: TreeNode[],
  vector: number[],
  mode: "regress" | "classify"
): number {
  if (!trees.length) {
    throw new Error("Model has no trees.");
  }

  const predictions = trees.map((tree) =>
    predictTree(tree, vector)
  );

  if (mode === "classify") {
    const counts = new Map<number, number>();

    for (const prediction of predictions) {
      counts.set(
        prediction,
        (counts.get(prediction) ?? 0) + 1
      );
    }

    let winner = predictions[0];
    let maxCount = 0;

    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        winner = value;
      }
    });

    return winner;
  }

  const sum = predictions.reduce(
    (acc, value) => acc + value,
    0
  );

  return sum / predictions.length;
}

export function predictCarbon(
  features: number[]
): MlPrediction {
  if (
    !Array.isArray(features) ||
    features.length !== 9 ||
    features.some((feature) => !Number.isFinite(feature))
  ) {
    throw new Error(
      "Model expects exactly 9 numeric features."
    );
  }

  const footprint = predictForest(
    forest.regressor,
    features,
    "regress"
  );

  const levelIndex = Number(
    predictForest(
      forest.classifier,
      features,
      "classify"
    )
  );

  return {
    carbon_footprint_kg:
      Number(Math.max(0, footprint).toFixed(2)),
    carbon_impact_level:
      LEVELS[levelIndex] ?? "Medium",
  };
}
