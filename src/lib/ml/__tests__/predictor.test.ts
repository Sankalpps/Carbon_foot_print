import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFit = vi.fn();
const mockPredict = vi.fn();
const mockDispose = vi.fn();
const mockDataSync = vi.fn();

const mockSequentialModel = {
  add: vi.fn(),
  compile: vi.fn(),
  fit: mockFit,
  predict: mockPredict,
};

vi.mock('@tensorflow/tfjs', () => {
  return {
    sequential: vi.fn(() => mockSequentialModel),
    layers: {
      lstm: vi.fn(() => ({ type: 'lstm' })),
      dropout: vi.fn(() => ({ type: 'dropout' })),
      dense: vi.fn(() => ({ type: 'dense' })),
    },
    train: {
      adam: vi.fn(() => ({ type: 'adam' })),
    },
    tensor3d: vi.fn((data: unknown) => ({
      dispose: mockDispose,
    })),
    tensor2d: vi.fn((data: unknown, shape?: unknown) => ({
      dispose: mockDispose,
    })),
  };
});

const mockPrepareTrainingData = vi.fn();
const mockDenormalizeData = vi.fn();

vi.mock('../data-pipeline', () => ({
  prepareTrainingData: (...args: unknown[]) => mockPrepareTrainingData(...args),
  denormalizeData: (...args: unknown[]) => mockDenormalizeData(...args),
}));

import { createModel, trainModel, predictFuture } from '../predictor';

describe('Predictor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createModel', () => {
    it('should create and compile sequential LSTM model', () => {
      const model = createModel();
      expect(model).toBe(mockSequentialModel);
      expect(model.add).toHaveBeenCalledTimes(4); // LSTM, Dropout, Dense, Dense
      expect(model.compile).toHaveBeenCalled();
    });
  });

  describe('trainModel', () => {
    it('should return null if training data preparation fails or has < 10 samples', async () => {
      mockPrepareTrainingData.mockReturnValue(null);
      const result = await trainModel([]);
      expect(result).toBeNull();

      mockPrepareTrainingData.mockReturnValue({
        inputs: Array(9).fill(0), // < 10 samples
        targets: Array(9).fill(0),
        normParams: { min: 0, max: 1, range: 1 },
      });
      const result2 = await trainModel([]);
      expect(result2).toBeNull();
    });

    it('should train sequential model and return training params on success', async () => {
      const inputs = Array(12).fill(Array(7).fill(Array(5).fill(0.5)));
      const targets = Array(12).fill(0.8);
      const normParams = { min: 1, max: 100, range: 99 };

      mockPrepareTrainingData.mockReturnValue({ inputs, targets, normParams });
      
      // Simulate successful fit training and logging
      mockFit.mockImplementation(async (xs, ys, config) => {
        config.callbacks?.onEpochEnd?.(0, { loss: 0.12 });
        config.callbacks?.onEpochEnd?.(1, { loss: 0.08 });
      });

      const onProgress = vi.fn();

      const result = await trainModel([], onProgress);

      expect(result).not.toBeNull();
      expect(result?.model).toBe(mockSequentialModel);
      expect(result?.normParams).toEqual(normParams);
      expect(result?.loss).toBe(0.08);

      expect(mockFit).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith({
        isTraining: true,
        epoch: 2,
        totalEpochs: 50,
        loss: 0.08,
      });

      expect(mockDispose).toHaveBeenCalledTimes(2); // xs, ys disposed
    });
  });

  describe('predictFuture', () => {
    it('should call model predict, slide current window and return predictions', () => {
      const normParams = { min: 0, max: 10, range: 10 };
      const recentData = Array(7).fill(Array(5).fill(0.2)); // 7 days of 5 features

      const mockPredictResult = {
        dataSync: () => new Float32Array([0.5]),
        dispose: mockDispose,
      };
      mockPredict.mockReturnValue(mockPredictResult);

      mockDenormalizeData.mockReturnValue([5.0]); // 0.5 * 10 = 5

      const result = predictFuture(mockSequentialModel as any, recentData, normParams, 3);

      expect(result.predictions).toEqual([5, 5, 5]);
      expect(result.labels).toHaveLength(3);
      expect(result.confidenceUpper).toEqual([6, 6, 6]); // 5 * 1.2 = 6
      expect(result.confidenceLower).toEqual([4, 4, 4]); // 5 * 0.8 = 4
      expect(result.confidence).toBe(0.75);

      expect(mockPredict).toHaveBeenCalledTimes(3);
      expect(mockDispose).toHaveBeenCalled();
    });
  });
});
