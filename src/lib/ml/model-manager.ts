/**
 * Model Manager - Handles model lifecycle with IndexedDB persistence.
 */
import * as tf from '@tensorflow/tfjs';

const MODEL_PREFIX = 'indexeddb://carbonwise-model-';
const METADATA_KEY = 'carbonwise-model-metadata';

interface ModelMetadata {
  userId: string;
  lastTrainedAt: string;
  epochs: number;
  loss: number;
  dataPointsUsed: number;
  normParams: any;
}

/**
 * Save a trained model to IndexedDB.
 */
export async function saveModel(model: tf.Sequential, userId: string, metadata: Omit<ModelMetadata, 'userId'>): Promise<void> {
  const path = `${MODEL_PREFIX}${userId}`;
  await model.save(path);

  // Save metadata to localStorage
  const fullMetadata: ModelMetadata = { userId, ...metadata };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${METADATA_KEY}-${userId}`, JSON.stringify(fullMetadata));
  }
}

/**
 * Load a trained model from IndexedDB.
 */
export async function loadModel(userId: string): Promise<tf.Sequential | null> {
  const path = `${MODEL_PREFIX}${userId}`;
  try {
    const model = await tf.loadLayersModel(path);
    return model as tf.Sequential;
  } catch {
    return null;
  }
}

/**
 * Get model metadata.
 */
export function getModelMetadata(userId: string): ModelMetadata | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(`${METADATA_KEY}-${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ModelMetadata;
  } catch {
    return null;
  }
}

/**
 * Determine if the model should be retrained.
 * Retrain weekly or after 20+ new entries since last training.
 */
export function shouldRetrain(
  metadata: ModelMetadata | null,
  currentDataCount: number
): boolean {
  if (!metadata) return true;

  const lastTrained = new Date(metadata.lastTrainedAt);
  const now = new Date();
  const daysSinceTrained = (now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60 * 24);

  // Retrain if: more than 7 days old, or 20+ new data points
  if (daysSinceTrained > 7) return true;
  if (currentDataCount - metadata.dataPointsUsed > 20) return true;

  return false;
}

/**
 * Delete saved model.
 */
export async function deleteModel(userId: string): Promise<void> {
  try {
    const path = `${MODEL_PREFIX}${userId}`;
    await tf.io.removeModel(path);
  } catch {
    // Model might not exist
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${METADATA_KEY}-${userId}`);
  }
}
