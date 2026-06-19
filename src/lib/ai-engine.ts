import * as tf from "@tensorflow/tfjs";

/**
 * Performs time-series forecasting using TensorFlow.js Linear Regression.
 * Takes the last 14 days of carbon emissions and projects the next 7 days.
 */
export async function inferTrend(last14Days: number[]): Promise<number[]> {
  // Graceful fallback for empty or small data
  if (!last14Days || last14Days.length === 0) {
    return Array(7).fill(0);
  }

  // If we have fewer than 2 records, we pad to at least 2 points to draw a line
  const data = last14Days.length >= 2 ? last14Days : [...last14Days, ...Array(2 - last14Days.length).fill(last14Days[0] || 0)];
  
  const xsArray = Array.from({ length: data.length }, (_, i) => i);
  const ysArray = [...data];

  // Helper values for normalization
  const xMin = 0;
  const xMax = xsArray.length - 1 || 1;
  const yMin = Math.min(...ysArray);
  const yMax = Math.max(...ysArray);
  const yRange = (yMax - yMin) || 1;

  // Normalize data to range [0, 1] to keep model training stable
  const normalizedXs = xsArray.map((x) => (x - xMin) / xMax);
  const normalizedYs = ysArray.map((y) => (y - yMin) / yRange);

  // Convert to Tensors
  const xs = tf.tensor2d(normalizedXs, [normalizedXs.length, 1]);
  const ys = tf.tensor2d(normalizedYs, [normalizedYs.length, 1]);

  // Create a sequential model with a single dense layer (Simple Linear Regression)
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Compile using a robust optimizer and learning rate
  model.compile({
    optimizer: tf.train.adam(0.1),
    loss: "meanSquaredError",
  });

  // Fit the model over 150 epochs
  await model.fit(xs, ys, {
    epochs: 150,
    verbose: 0,
  });

  // Predict the next 7 days
  const futureIndices = Array.from({ length: 7 }, (_, i) => xsArray.length + i);
  const normalizedFutureXs = futureIndices.map((x) => (x - xMin) / xMax);
  
  const inputTensor = tf.tensor2d(normalizedFutureXs, [7, 1]);
  const predictionTensor = model.predict(inputTensor) as tf.Tensor;
  const predictedNormalizedValues = await predictionTensor.data();

  // Denormalize the predicted values back to original carbon footprint scale
  const predictions = Array.from(predictedNormalizedValues).map(
    (val) => Math.max(0, Number((val * yRange + yMin).toFixed(2)))
  );

  // Clean up tensors from memory
  xs.dispose();
  ys.dispose();
  inputTensor.dispose();
  predictionTensor.dispose();
  model.dispose();

  return predictions;
}
