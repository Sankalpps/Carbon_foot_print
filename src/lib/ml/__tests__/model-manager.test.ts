import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSave = vi.fn();

vi.mock('@tensorflow/tfjs', () => {
  return {
    loadLayersModel: vi.fn(),
    io: {
      removeModel: vi.fn(),
    },
  };
});

import * as tf from '@tensorflow/tfjs';
import {
  saveModel,
  loadModel,
  getModelMetadata,
  shouldRetrain,
  deleteModel,
} from '../model-manager';

describe('Model Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('saveModel', () => {
    it('should save model and metadata', async () => {
      const mockModel = {
        save: mockSave,
      } as unknown as tf.Sequential;

      const metadata = {
        lastTrainedAt: new Date().toISOString(),
        epochs: 50,
        loss: 0.05,
        dataPointsUsed: 30,
        normParams: { min: 0, max: 10, range: 10 },
      };

      await saveModel(mockModel, 'user123', metadata);

      expect(mockSave).toHaveBeenCalledWith('indexeddb://carbonwise-model-user123');
      expect(localStorage.getItem('carbonwise-model-metadata-user123')).toBeDefined();
      const stored = JSON.parse(localStorage.getItem('carbonwise-model-metadata-user123')!);
      expect(stored.userId).toBe('user123');
      expect(stored.epochs).toBe(50);
    });
  });

  describe('loadModel', () => {
    it('should call loadLayersModel and return model', async () => {
      const mockModel = { id: 'loaded-model' };
      vi.mocked(tf.loadLayersModel).mockResolvedValue(mockModel as unknown as tf.Sequential);

      const result = await loadModel('user123');

      expect(tf.loadLayersModel).toHaveBeenCalledWith('indexeddb://carbonwise-model-user123');
      expect(result).toBe(mockModel);
    });

    it('should return null if loadLayersModel throws', async () => {
      vi.mocked(tf.loadLayersModel).mockRejectedValue(new Error('Load failed'));

      const result = await loadModel('user123');

      expect(result).toBeNull();
    });
  });

  describe('getModelMetadata', () => {
    it('should return null if no metadata in localStorage', () => {
      const result = getModelMetadata('user123');
      expect(result).toBeNull();
    });

    it('should return parsed metadata if it exists', () => {
      const metadata = {
        userId: 'user123',
        lastTrainedAt: new Date().toISOString(),
        epochs: 10,
        loss: 0.1,
        dataPointsUsed: 5,
        normParams: { min: 0, max: 1, range: 1 },
      };
      localStorage.setItem('carbonwise-model-metadata-user123', JSON.stringify(metadata));

      const result = getModelMetadata('user123');
      expect(result).toEqual(metadata);
    });

    it('should return null if JSON parsing fails', () => {
      localStorage.setItem('carbonwise-model-metadata-user123', '{invalid}');
      const result = getModelMetadata('user123');
      expect(result).toBeNull();
    });
  });

  describe('shouldRetrain', () => {
    it('should return true if metadata is null', () => {
      expect(shouldRetrain(null, 10)).toBe(true);
    });

    it('should return true if more than 7 days since last training', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 8);

      const metadata = {
        userId: 'user123',
        lastTrainedAt: lastWeek.toISOString(),
        epochs: 10,
        loss: 0.1,
        dataPointsUsed: 5,
        normParams: { min: 0, max: 1, range: 1 },
      };

      expect(shouldRetrain(metadata, 5)).toBe(true);
    });

    it('should return true if 20+ new data points since last training', () => {
      const today = new Date();

      const metadata = {
        userId: 'user123',
        lastTrainedAt: today.toISOString(),
        epochs: 10,
        loss: 0.1,
        dataPointsUsed: 5,
        normParams: { min: 0, max: 1, range: 1 },
      };

      expect(shouldRetrain(metadata, 26)).toBe(true); // 26 - 5 = 21 new points (>20)
    });

    it('should return false if training is recent and data points growth is small', () => {
      const today = new Date();

      const metadata = {
        userId: 'user123',
        lastTrainedAt: today.toISOString(),
        epochs: 10,
        loss: 0.1,
        dataPointsUsed: 5,
        normParams: { min: 0, max: 1, range: 1 },
      };

      expect(shouldRetrain(metadata, 10)).toBe(false); // 10 - 5 = 5 new points (<=20)
    });
  });

  describe('deleteModel', () => {
    it('should remove model from storage and clear metadata', async () => {
      localStorage.setItem('carbonwise-model-metadata-user123', 'metadata');
      vi.mocked(tf.io.removeModel).mockResolvedValue({} as unknown as void);

      await deleteModel('user123');

      expect(tf.io.removeModel).toHaveBeenCalledWith('indexeddb://carbonwise-model-user123');
      expect(localStorage.getItem('carbonwise-model-metadata-user123')).toBeNull();
    });

    it('should still clear metadata even if removeModel throws', async () => {
      localStorage.setItem('carbonwise-model-metadata-user123', 'metadata');
      vi.mocked(tf.io.removeModel).mockRejectedValue(new Error('Deletion error'));

      await deleteModel('user123');

      expect(localStorage.getItem('carbonwise-model-metadata-user123')).toBeNull();
    });
  });
});
