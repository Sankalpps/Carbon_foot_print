'use client';

import { useMemo } from 'react';
import { useRealTimeCarbon } from '@/hooks/useRealTimeCarbon';
import IntensityGauge from '@/components/charts/IntensityGauge';
import FuelMixChart from '@/components/charts/FuelMixChart';
import TrendChart from '@/components/charts/TrendChart';
import Card from '@/components/ui/Card';
import styles from './live.module.css';

export default function LiveGridPage() {
  const { intensity, status, fuelMix, isConnected, isLoading, error } = useRealTimeCarbon();

  // Simulated 24h intensity trend with cyclical valley/peak behavior
  const dailyTrendData = useMemo(() => {
    const hours = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
    
    // Cycle emissions to peak in evening/daytime and drop overnight
    const intensities = hours.map((_, idx) => {
      const base = intensity;
      const variation = Math.sin((idx * Math.PI) / 4 - Math.PI / 2) * 45;
      return Math.max(20, Math.round(base + variation));
    });

    return {
      labels: hours,
      datasets: [
        {
          label: 'Grid Intensity (gCO₂/kWh)',
          data: intensities,
        },
      ],
    };
  }, [intensity]);

  // Derived smart scheduling recommendations based on current grid intensity
  const recommendations = useMemo(() => {
    if (status === 'low') {
      return [
        { task: 'Run Laundry / Washer', priority: 'High', icon: '🧺', tip: 'Low emissions window. Excellent time to run heavy appliances.' },
        { task: 'Charge EV / Devices', priority: 'High', icon: '🚗', tip: 'Grid energy is clean. Plug in vehicle and battery banks now.' },
        { task: 'Run Dishwasher', priority: 'Medium', icon: '🍽️', tip: 'Great time to sanitize dishes with minimal carbon impact.' },
      ];
    } else if (status === 'moderate') {
      return [
        { task: 'Run Laundry / Washer', priority: 'Medium', icon: '🧺', tip: 'Moderate grid intensity. Clean enough to run, but delay if possible.' },
        { task: 'Charge EV / Devices', priority: 'Medium', icon: '🚗', tip: 'Set charger to eco-mode or wait for off-peak night cycles.' },
        { task: 'General heating / Cooling', priority: 'Low', icon: '🌡️', tip: 'Optimize thermostatic settings to minimize usage spikes.' },
      ];
    } else {
      return [
        { task: 'Run Laundry / Washer', priority: 'Avoid', icon: '🧺', tip: 'High carbon spike. Postpone laundry loads to later tonight.' },
        { task: 'Charge EV / Devices', priority: 'Avoid', icon: '🚗', tip: 'Unplug high-draw devices. Avoid charging electric cars right now.' },
        { task: 'General heating / Cooling', priority: 'Reduce', icon: '🌡️', tip: 'Lower thermostat or select energy saving presets.' },
      ];
    }
  }, [status]);

  if (isLoading && !isConnected) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} aria-hidden="true" />
        <p>Connecting to Live Carbon Grid API...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Live Grid Intensity</h1>
          <p className={styles.subtitle}>
            Real-time carbon intensity of the local electricity grid. Use energy when the grid is greenest.
          </p>
        </div>
        
        {/* Connection health indicator */}
        <span className={`${styles.connectionBadge} ${isConnected ? styles.online : styles.offline}`}>
          <span className={styles.pulseDot} aria-hidden="true" />
          {isConnected ? 'SSE Connected (Live Updates)' : 'Polling Fallback Active'}
        </span>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Primary Analytics Section */}
      <div className={styles.mainGrid}>
        {/* Semicircle Gauge */}
        <div className={styles.gaugeSection}>
          <Card variant="glass" className={styles.gaugeCard}>
            <h2 className={styles.cardTitle}>Current Intensity Status</h2>
            <div className={styles.gaugeWrapper}>
              <IntensityGauge value={intensity} label={status.toUpperCase()} />
            </div>
            <p className={styles.gaugeGuidance}>
              {status === 'low'
                ? 'Emissions are low. Go ahead and use power-hungry appliances.'
                : status === 'moderate'
                ? 'Grid emissions are moderate. Moderate usage is okay.'
                : 'Emissions are high. Please postpone heavy power usage if possible.'}
            </p>
          </Card>
        </div>

        {/* Doughnut Fuel Mix Chart */}
        <div className={styles.fuelMixSection}>
          <Card variant="glass" className={styles.fuelCard}>
            <h2 className={styles.cardTitle}>Current Grid Fuel Mix</h2>
            <FuelMixChart data={fuelMix} />
          </Card>
        </div>
      </div>

      {/* Secondary Row: 24h Trend and Smart Scheduling */}
      <div className={styles.secondaryGrid}>
        {/* Intensity Line Trend */}
        <div className={styles.trendCard}>
          <h2 className={styles.cardTitle}>24-Hour Intensity Forecast</h2>
          <TrendChart data={dailyTrendData} period="week" />
        </div>

        {/* Scheduling recommendations list */}
        <Card variant="glass" className={styles.recsCard}>
          <h2 className={styles.cardTitle}>Smart Appliance Scheduler</h2>
          <div className={styles.recsList}>
            {recommendations.map((rec, idx) => (
              <div key={idx} className={styles.recItem}>
                <div className={styles.recIcon} aria-hidden="true">{rec.icon}</div>
                <div className={styles.recText}>
                  <div className={styles.recHeader}>
                    <h3 className={styles.recTask}>{rec.task}</h3>
                    <span className={`${styles.priorityBadge} ${styles[rec.priority.toLowerCase()]}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className={styles.recTip}>{rec.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
