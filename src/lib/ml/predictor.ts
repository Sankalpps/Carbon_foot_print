/**
 * LSTM Prediction Model - TensorFlow.js based emission forecasting.
 * Runs entirely in the browser for privacy.
 */
import * as tf from '@tensorflow/tfjs';
import { prepareTrainingData, denormalizeData } from './data-pipeline';
import type { NormalizationParams } from './data-pipeline';

const WINDOW_SIZE = 7; // 7 days lookback
const NUM_FEATURES = 5; // transport, energy, food, shopping, total
const EPOCHS = 50;
const BATCH_SIZE = 8;

export interface PredictionResult {
  predictions: number[];
  labels: string[];
  confidenceUpper: number[];
  confidenceLower: number[];
  confidence: number;
}

export interface TrainingStatus {
  isTraining: boolean;
  epoch: number;
  totalEpochs: number;
  loss: number;
}

/**
 * Create the LSTM model architecture.
 */
export function createModel(): tf.Sequential {
  const model = tf.sequential();

  model.add(
    tf.layers.lstm({
      units: 32,
      returnSequences: false,
      inputShape: [WINDOW_SIZE, NUM_FEATURES],
    })
  );

  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
  });

  return model;
}

/**
 * Train the model on user's activity history.
 */
export async function trainModel(
  activities: { category: string; co2Amount: number; date: Date }[],
  onProgress?: (status: TrainingStatus) => void
): Promise<{ model: tf.Sequential; normParams: NormalizationParams; loss: number } | null> {
  const prepared = prepareTrainingData(activities, WINDOW_SIZE);
  if (!prepared) return null;

  const { inputs, targets, normParams } = prepared;

  if (inputs.length < 10) return null; // Need at least 10 training samples

  const model = createModel();

  // Convert to tensors
  const xs = tf.tensor3d(inputs);
  const ys = tf.tensor2d(targets, [targets.length, 1]);

  let finalLoss = 0;

  try {
    await model.fit(xs, ys, {
      epochs: EPOCHS,
      batchSize: BATCH_SIZE,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          finalLoss = logs?.loss ?? 0;
          onProgress?.({
            isTraining: true,
            epoch: epoch + 1,
            totalEpochs: EPOCHS,
            loss: finalLoss,
          });
        },
      },
    });
  } finally {
    xs.dispose();
    ys.dispose();
  }

  return { model, normParams, loss: finalLoss };
}

/**
 * Predict future emissions.
 */
export function predictFuture(
  model: tf.Sequential,
  recentData: number[][],
  normParams: NormalizationParams,
  periodsAhead: number = 7
): PredictionResult {
  const predictions: number[] = [];
  let currentWindow = recentData.slice(-WINDOW_SIZE);

  for (let i = 0; i < periodsAhead; i++) {
    const inputTensor = tf.tensor3d([currentWindow]);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const normalizedValue = prediction.dataSync()[0];

    // Denormalize
    const actualValue = denormalizeData([normalizedValue], normParams)[0];
    predictions.push(Math.max(0, Math.round(actualValue * 100) / 100));

    // Slide window forward (use prediction as next total)
    const newRow = [0, 0, 0, 0, normalizedValue]; // Simplified: only total predicted
    currentWindow = [...currentWindow.slice(1), newRow];

    inputTensor.dispose();
    prediction.dispose();
  }

  // Generate labels (future dates)
  const labels: string[] = [];
  for (let i = 1; i <= periodsAhead; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Confidence intervals (±20% by default)
  const confidence = 0.75;
  const confidenceUpper = predictions.map((p) => Math.round(p * 1.2 * 100) / 100);
  const confidenceLower = predictions.map((p) => Math.round(p * 0.8 * 100) / 100);

  return { predictions, labels, confidenceUpper, confidenceLower, confidence };
}

export { WINDOW_SIZE, NUM_FEATURES };
