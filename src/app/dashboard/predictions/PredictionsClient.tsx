'use client';

import { useState, useEffect, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import { aggregateDailyEmissions, prepareTrainingData } from '@/lib/ml/data-pipeline';
import type { NormalizationParams } from '@/lib/ml/data-pipeline';
import { trainModel, predictFuture, type PredictionResult } from '@/lib/ml/predictor';
import { saveModel, loadModel, getModelMetadata, type ModelMetadata } from '@/lib/ml/model-manager';
import { detectAnomalies } from '@/lib/ml/anomaly-detector';
import PredictionChart from '@/components/charts/PredictionChart';
import AnomalyAlert from '@/components/dashboard/AnomalyAlert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import styles from './predictions.module.css';

interface ActivityItem {
  id: string;
  category: string;
  subCategory: string;
  co2Amount: number;
  date: string;
}

interface Anomaly {
  id: string;
  category: string;
  actualValue: number;
  expectedValue: number;
  date: string;
}

interface PredictionsClientProps {
  activities: ActivityItem[];
  userId: string;
}

export default function PredictionsClient({ activities, userId }: PredictionsClientProps) {
  // Parse string dates to Date objects
  const parsedActivities = useMemo(() => {
    return activities.map((a) => ({
      ...a,
      date: new Date(a.date),
    }));
  }, [activities]);

  const dailyData = useMemo(() => {
    return aggregateDailyEmissions(parsedActivities);
  }, [parsedActivities]);

  // States
  const [model, setModel] = useState<tf.Sequential | null>(null);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingEpoch, setTrainingEpoch] = useState(0);
  const [trainingLoss, setTrainingLoss] = useState(0);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);


  // 1. Check if we have enough data (need at least 14 days of logged daily history)
  const isDataSufficient = dailyData.length >= 14;

  // 2. Load model from IndexedDB on mount
  useEffect(() => {
    if (!isDataSufficient) return;

    async function initModel() {
      try {
        const loadedMetadata = getModelMetadata(userId);
        if (loadedMetadata) {
          setMetadata(loadedMetadata);
          const loadedModel = await loadModel(userId);
          if (loadedModel) {
            setModel(loadedModel);
            // Run predictions
            runForecasting(loadedModel, loadedMetadata.normParams);
          }
        }
      } catch (err) {
        console.error('Failed to load TFJS model from IndexedDB:', err);
      }
    }

    initModel();
  }, [isDataSufficient, userId]);

  // 3. Compute anomalies
  useEffect(() => {
    if (parsedActivities.length > 5) {
      const detected = detectAnomalies(parsedActivities);
      // Map statistical anomalies to have actual and expected values
      const mapped = detected.map((anom, idx) => {
        const catActivities = parsedActivities.filter((a) => a.category === anom.category);
        const latestVal = catActivities[catActivities.length - 1]?.co2Amount ?? 0;
        const sum = catActivities.reduce((s, a) => s + a.co2Amount, 0);
        const mean = catActivities.length > 0 ? sum / catActivities.length : 0;

        return {
          id: `anomaly-${idx}`,
          category: anom.category,
          actualValue: latestVal,
          expectedValue: mean,
          date: new Date().toISOString(),
        };
      });
      setAnomalies(mapped);
    }
  }, [parsedActivities]);

  // Run forecasting on the model
  const runForecasting = (trainedModel: tf.Sequential, normParams: NormalizationParams) => {
    const prepared = prepareTrainingData(parsedActivities, 7);
    if (!prepared) return;

    // Extract raw multi-feature inputs from daily data for the last 7 days
    const recentRaw = prepared.dailyData.slice(-7).map((d) => [
      d.transport,
      d.energy,
      d.food,
      d.shopping,
      d.total,
    ]);

    // Normalize input using the saved min/max values
    const min = normParams.min;
    const max = normParams.max;
    const range = max - min || 1;
    const normalizedInput = recentRaw.map((row) =>
      row.map((val) => (val - min) / range)
    );

    const result = predictFuture(trainedModel, normalizedInput, normParams, 7);
    setPredictions(result);
  };

  // Triggers browser LSTM neural network training
  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingEpoch(0);
    setTrainingLoss(0);

    try {
      const result = await trainModel(parsedActivities, (status) => {
        setTrainingEpoch(status.epoch);
        setTrainingLoss(status.loss);
      });

      if (result) {
        const metadataPayload: ModelMetadata = {
          userId,
          lastTrainedAt: new Date().toISOString(),
          epochs: 50,
          loss: result.loss,
          dataPointsUsed: parsedActivities.length,
          normParams: result.normParams,
        };

        await saveModel(result.model, userId, metadataPayload);
        setModel(result.model);
        setMetadata(metadataPayload);
        runForecasting(result.model, result.normParams);
      }
    } catch (err) {
      console.error('Model training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleDismissAnomaly = (id: string) => {
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
  };

  // Format data for chart display
  const chartProps = useMemo(() => {
    if (!predictions) return null;

    // Show last 14 days of historical emissions
    const histDays = dailyData.slice(-14);
    const historicalData = histDays.map((d) => d.total);
    const historicalLabels = histDays.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    return {
      historicalData,
      predictedData: predictions.predictions,
      labels: [...historicalLabels, ...predictions.labels],
      confidenceUpper: predictions.confidenceUpper,
      confidenceLower: predictions.confidenceLower,
    };
  }, [dailyData, predictions]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI Predictions & Forecasting</h1>
        <p className={styles.subtitle}>
          In-browser LSTM neural network models analyze your carbon patterns and predict future footprint values.
        </p>
      </div>

      {/* Anomalies alert list */}
      {anomalies.length > 0 && (
        <div className={styles.alertsContainer}>
          {anomalies.map((anom) => (
            <AnomalyAlert
              key={anom.id}
              category={anom.category}
              actualValue={anom.actualValue}
              expectedValue={anom.expectedValue}
              date={anom.date}
              onDismiss={() => handleDismissAnomaly(anom.id)}
            />
          ))}
        </div>
      )}

      {/* Insufficient Data State */}
      {!isDataSufficient ? (
        <Card variant="glass" className={styles.insufficientCard}>
          <div className={styles.insufficientIcon}>📊</div>
          <h2>Insufficient Historical Data</h2>
          <p>
            The LSTM neural network model requires at least <strong>14 days</strong> of logged carbon history to build reliable forecasts.
          </p>
          <div className={styles.progressContainer}>
            <span className={styles.progressLabel}>
              Logging Progress: {dailyData.length} / 14 days
            </span>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, (dailyData.length / 14) * 100)}%` }}
              />
            </div>
          </div>
          <a href="/dashboard/track" className={styles.ctaLink}>
            Go to Tracker Page →
          </a>
        </Card>
      ) : (
        <div className={styles.layout}>
          {/* Main Chart Area */}
          <div className={styles.chartArea}>
            <Card variant="glass" className={styles.chartCard}>
              <h2 className={styles.cardTitle}>7-Day Emission Forecast</h2>
              {chartProps ? (
                <PredictionChart {...chartProps} />
              ) : (
                <div className={styles.emptyChart}>
                  <p>Train the neural network to generate your forecast chart.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Status/Train panel */}
          <div className={styles.modelPanel}>
            <Card variant="glass" className={styles.modelCard}>
              <h2 className={styles.cardTitle}>Model Lifecycle</h2>

              {!model && (
                <div className={styles.helpSection}>
                  <p className={styles.helpText}>
                    <strong>How to Train:</strong> Click the button below to train an LSTM neural network using your historical carbon data. Training takes a few seconds and runs in your browser.
                  </p>
                </div>
              )}

              <div className={styles.statusGroup}>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Model Status</span>
                  <span
                    className={`${styles.statusBadge} ${
                      model ? styles.statusTrained : styles.statusNotTrained
                    }`}
                  >
                    {model ? 'Trained & Saved' : 'Not Trained'}
                  </span>
                </div>

                {metadata && (
                  <>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Last Trained</span>
                      <span className={styles.statusValue}>
                        {new Date(metadata.lastTrainedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.statusItem}>
                      <span className={styles.statusLabel}>Validation Loss</span>
                      <span className={styles.statusValue}>
                        {metadata.loss.toFixed(4)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {isTraining ? (
                <div className={styles.trainingProgress}>
                  <div className={styles.trainingHeader}>
                    <span>Training LSTM Network...</span>
                    <span>{trainingEpoch} / 50</span>
                  </div>
                  <div className={styles.trainingTrack}>
                    <div
                      className={styles.trainingFill}
                      style={{ width: `${(trainingEpoch / 50) * 100}%` }}
                    />
                  </div>
                  <span className={styles.lossLabel}>
                    Loss: {trainingLoss.toFixed(4)}
                  </span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleTrain}
                  fullWidth
                >
                  {model ? 'Retrain Model (50 epochs)' : 'Train Neural Network'}
                </Button>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
