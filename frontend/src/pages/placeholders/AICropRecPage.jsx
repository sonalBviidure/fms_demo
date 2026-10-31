import React, { useState, useEffect } from 'react';
import { getCropRecommendations, submitCropRecommendation } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * AI Crop Advisory Page - State-aware multi-crop recommendations with AI Weather Intelligence
 */

const AI_WEATHER_PRESETS = [
  {
    value: 'Optimal Monsoon (Heavy to Moderate Rainfall, 26°C-32°C)',
    label: '🌧️ AI: Optimal Monsoon (Heavy Rain, 26°C-32°C, 80%+ Humidity)',
    season: 'Kharif',
    climate: 'Heavy Rain',
  },
  {
    value: 'Moderate Monsoon Showers & Warm Humid Climate (24°C-30°C)',
    label: '🌦️ AI: Moderate Showers & Humid (24°C-30°C, Balanced Rain)',
    season: 'Kharif',
    climate: 'Moderate Rain',
  },
  {
    value: 'Cool Winter Climate with Mild Sun (15°C-22°C)',
    label: '❄️ AI: Cool Winter Climate (15°C-22°C, Mild Cold, Low Dew)',
    season: 'Rabi',
    climate: 'Cool / Mild Cold',
  },
  {
    value: 'Cold Dry Winter with Morning Mist (10°C-18°C)',
    label: '🌫️ AI: Cold Dry Winter & Dew (10°C-18°C, Northern Plains/Hills)',
    season: 'Rabi',
    climate: 'Cold / Dry',
  },
  {
    value: 'Hot Summer & High Sunshine (35°C-42°C, Dry Air)',
    label: '☀️ AI: High Sunshine & Hot Summer (35°C-42°C, High Evaporation)',
    season: 'Zaid',
    climate: 'Hot & Dry',
  },
  {
    value: 'Semi-Arid Dry Sunny Climate with Low Rainfall (30°C-38°C)',
    label: '🏜️ AI: Semi-Arid Dry Climate (30°C-38°C, Drought Resilient Zone)',
    season: 'Any',
    climate: 'Semi-Arid',
  },
  {
    value: 'Humid Coastal Tropical Breeze (28°C-34°C, High Moisture)',
    label: '🌊 AI: Tropical Coastal Humidity (28°C-34°C, High Moisture & Showers)',
    season: 'Any',
    climate: 'Coastal Humid',
  },
  {
    value: 'Temperate & Cool Mountain Slopes (12°C-20°C, High Elevation)',
    label: '🏔️ AI: Temperate Mountain Slope (12°C-20°C, Hill Agro-Zone)',
    season: 'Any',
    climate: 'Cool Hill Station',
  },
];

function getAIPredictedWeather(state, season) {
  const s = (state || '').toLowerCase();
  if (s.includes('himachal') || s.includes('uttarakhand') || s.includes('kashmir')) {
    return 'Temperate & Cool Mountain Slopes (12°C-20°C, High Elevation)';
  }
  if (s.includes('rajasthan')) {
    return 'Semi-Arid Dry Sunny Climate with Low Rainfall (30°C-38°C)';
  }
  if (s.includes('kerala') || s.includes('goa') || s.includes('bengal') || s.includes('odisha') || s.includes('tamil')) {
    return 'Humid Coastal Tropical Breeze (28°C-34°C, High Moisture)';
  }
  if (season === 'Kharif') {
    return 'Optimal Monsoon (Heavy to Moderate Rainfall, 26°C-32°C)';
  }
  if (season === 'Rabi') {
    return 'Cool Winter Climate with Mild Sun (15°C-22°C)';
  }
  if (season === 'Zaid') {
    return 'Hot Summer & High Sunshine (35°C-42°C, Dry Air)';
  }
  return 'Moderate Monsoon Showers & Warm Humid Climate (24°C-30°C)';
}

const SOIL_TYPES = ['Black', 'Red', 'Loamy', 'Alluvial', 'Clayey', 'Sandy', 'Other'];
const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Annual'];
const IRRIGATION_TYPES = ['Rainfed', 'Canal', 'Drip', 'Sprinkler', 'Borewell', 'Other'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];

const CROP_ICONS = {
  Cotton: '\u{1F33F}', Wheat: '\u{1F33E}', Groundnut: '\u{1F95C}', Sunflower: '\u{1F33B}',
  Soybean: '\u{1F331}', Rice: '\u{1F35A}', Sugarcane: '\u{1F38B}', Maize: '\u{1F33D}',
  Watermelon: '\u{1F349}', Bajra: '\u{1F33E}', Mustard: '\u{1F33C}', Chickpea: '\u{1FAD8}',
  Potato: '\u{1F954}', Banana: '\u{1F34C}', Onion: '\u{1F9C5}', Grapes: '\u{1F347}',
  Apple: '\u{1F34E}', Coconut: '\u{1F965}', Rubber: '\u{1F333}', Pepper: '\u{1F336}',
  Ragi: '\u{1F33E}', 'Tur Dal': '\u{1FAD8}', 'Green Gram': '\u{1FAD9}', Jute: '\u{1F33F}',
  Tea: '\u{1F375}', Cardamom: '\u{1F33F}', Castor: '\u{1F33F}', Vegetables: '\u{1F966}',
  Lentil: '\u{1FAD8}', Coriander: '\u{1F33F}', Ginger: '\u{1FAD9}', Pea: '\u{1FAD9}',
  'Moth Bean': '\u{1FAD8}', 'Cluster Bean': '\u{1FAD9}',
};

const RANK_COLORS = ['success', 'primary', 'secondary'];
const RANK_BADGE_BG = ['bg-success', 'bg-primary', 'bg-secondary'];
const RANK_KEYS = [
  'cropRecommendation.rank1Label',
  'cropRecommendation.rank2Label',
  'cropRecommendation.rank3Label',
];

export default function AICropRecPage() {
  const { t } = useLanguage();

  const [form, setForm] = useState({
    soil_type: 'Black',
    season: 'Kharif',
    weather_conditions: AI_WEATHER_PRESETS[0].value,
    irrigation_type: 'Rainfed',
    state: 'Maharashtra',
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [aiWeatherNote, setAiWeatherNote] = useState('AI auto-configured for Maharashtra Kharif season');

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const data = await getCropRecommendations();
      setHistory(data);
    } catch (e) {
      console.warn('History load error:', e.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'state' || name === 'season') {
        const predicted = getAIPredictedWeather(
          name === 'state' ? value : updated.state,
          name === 'season' ? value : updated.season
        );
        updated.weather_conditions = predicted;
        setAiWeatherNote(`AI updated weather pattern for ${updated.state || 'region'} (${updated.season})`);
      }
      return updated;
    });
  }

  function handleAutoPredictWeather() {
    const predicted = getAIPredictedWeather(form.state, form.season);
    setForm((prev) => ({ ...prev, weather_conditions: predicted }));
    setAiWeatherNote(`✨ AI Model synced agro-climate for ${form.state || 'General Region'} (${form.season})`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.weather_conditions.trim()) {
      setError(t('cropRecommendation.describeWeather'));
      return;
    }
    setLoading(true);
    setError('');
    setRecommendations([]);
    try {
      const res = await submitCropRecommendation(form);
      const recs = res.recommendation?.recommendations || [];
      setRecommendations(recs);
      await loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const topRec = recommendations[0] || null;
  const otherRecs = recommendations.slice(1);

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h2 className="fw-bold text-success mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-cpu"></i>
            <span>AI Crop Advisory & Prediction Engine</span>
            <span className="badge bg-success-subtle text-success border border-success-subtle fs-6 fw-normal">
              AI Powered
            </span>
          </h2>
          <p className="text-muted mb-0 small">
            AI-driven crop suitability recommendations tailored to your state, soil, season, and AI-predicted weather
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoPredictWeather}
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-2 shadow-sm"
          title="Auto-detect AI weather for selected state and season"
        >
          <i className="bi bi-stars text-warning"></i>
          <span>AI Auto-Predict Weather</span>
        </button>
      </div>

      <div className="row g-4">
        {/* ── Input Form ── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-success text-white d-flex align-items-center justify-content-between">
              <h6 className="mb-0 fw-semibold">
                <i className="bi bi-sliders me-2"></i>{t('enterFarmParams')}
              </h6>
              <span className="badge bg-white text-success small py-1 px-2 fw-bold">
                <i className="bi bi-robot me-1"></i>AI Engine
              </span>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <form onSubmit={handleSubmit}>

                {/* State */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small d-flex justify-content-between">
                    <span>{t('cropRecommendation.stateLabel')}</span>
                    <span className="text-muted small">Agro-climatic zone</span>
                  </label>
                  <select name="state" value={form.state} onChange={handleChange} className="form-select form-select-sm">
                    <option value="">{t('cropRecommendation.statePlaceholder')}</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Soil */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{t('soilType')}</label>
                  <select name="soil_type" value={form.soil_type} onChange={handleChange} className="form-select form-select-sm">
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>{t('common.soilLabel', { type: s })}</option>
                    ))}
                  </select>
                </div>

                {/* Season */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">{t('season')}</label>
                  <select name="season" value={form.season} onChange={handleChange} className="form-select form-select-sm">
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>{t(`seasonLabels.${s}`, { defaultValue: s })}</option>
                    ))}
                  </select>
                </div>

                {/* Weather - AI Predicted Dropdown */}
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fw-semibold small mb-0">
                      <i className="bi bi-cloud-sun me-1 text-primary"></i>
                      AI Predicted Weather Conditions *
                    </label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-success fw-semibold"
                      style={{ fontSize: '11px' }}
                      onClick={handleAutoPredictWeather}
                    >
                      <i className="bi bi-magic me-1"></i>AI Auto-Detect
                    </button>
                  </div>

                  <select
                    name="weather_conditions"
                    value={form.weather_conditions}
                    onChange={handleChange}
                    className="form-select form-select-sm border-success shadow-none"
                    required
                  >
                    {AI_WEATHER_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  {aiWeatherNote && (
                    <div className="mt-1 small text-success d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{aiWeatherNote}</span>
                    </div>
                  )}
                  <div className="form-text" style={{ fontSize: '11px' }}>
                    Select an AI-predicted agro-climatic pattern or let AI auto-predict based on State &amp; Season.
                  </div>
                </div>

                {/* Irrigation */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small">{t('irrigationType')}</label>
                  <select name="irrigation_type" value={form.irrigation_type} onChange={handleChange} className="form-select form-select-sm">
                    {IRRIGATION_TYPES.map((irr) => (
                      <option key={irr} value={irr}>{t(`irrigationTypes.${irr}`, { defaultValue: irr })}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-success w-100 fw-semibold shadow-sm" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Generating AI Advisory...</>
                    : <><i className="bi bi-cpu me-2"></i>Run AI Crop Recommendation</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Results + History ── */}
        <div className="col-lg-8">

          {/* TOP RECOMMENDATION CARD */}
          {topRec && (
            <div className="card border-0 shadow border-start border-success border-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>
                    {CROP_ICONS[topRec.crop] || '\u{1F33E}'}
                  </span>
                  <div className="flex-grow-1">
                    <span className="badge bg-success mb-1 px-2">
                      <i className="bi bi-award me-1"></i>AI {t(RANK_KEYS[0])}
                    </span>
                    <h3 className="fw-bold text-success mb-0">{topRec.crop}</h3>
                    <small className="text-muted">
                      Optimal AI-matched crop for {form.state || 'your region'} under {form.season} season
                    </small>
                  </div>
                  <div className="text-center px-3 py-2 bg-success bg-opacity-10 rounded-3">
                    <div className="fw-bold fs-3 text-success">{topRec.confidence}%</div>
                    <div className="small text-muted">AI Match Score</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="progress mb-3" style={{ height: '8px' }}>
                  <div className="progress-bar bg-success" style={{ width: `${topRec.confidence}%` }}></div>
                </div>

                {/* Reason */}
                <div className="alert alert-success py-2 mb-3">
                  <strong><i className="bi bi-robot me-1"></i>AI Advisory Insight:</strong>{' '}
                  {topRec.reason}
                </div>

                {/* Tips */}
                {topRec.tips && topRec.tips.length > 0 && (
                  <div className="bg-light rounded-3 p-3">
                    <h6 className="fw-bold text-success mb-3">
                      <i className="bi bi-lightbulb-fill me-2"></i>
                      AI Cultivation Guidelines for {topRec.crop}
                    </h6>
                    <div className="row g-2">
                      {topRec.tips.map((tip, i) => (
                        <div key={i} className="col-12">
                          <div className="d-flex gap-2 align-items-start">
                            <span className="badge bg-success-subtle text-success rounded-circle" style={{ minWidth: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                              {i + 1}
                            </span>
                            <span className="small text-dark">{tip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTHER OPTIONS */}
          {otherRecs.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-semibold text-muted mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-grid-3x3-gap"></i>
                <span>Alternative AI Recommendations</span>
              </h6>
              <div className="row g-3">
                {otherRecs.map((rec, i) => (
                  <div key={rec.crop} className="col-md-6">
                    <div className={`card border-0 shadow-sm border-start border-${RANK_COLORS[i + 1]} border-3 h-100`}>
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span style={{ fontSize: '2rem' }}>{CROP_ICONS[rec.crop] || '\u{1F33E}'}</span>
                          <div className="flex-grow-1">
                            <span className={`badge ${RANK_BADGE_BG[i + 1]} mb-1`} style={{ fontSize: '10px' }}>
                              AI {t(RANK_KEYS[i + 1])}
                            </span>
                            <div className="fw-bold">{rec.crop}</div>
                          </div>
                          <div className={`fw-bold text-${RANK_COLORS[i + 1]}`}>{rec.confidence}%</div>
                        </div>
                        <div className="progress mb-2" style={{ height: '5px' }}>
                          <div className={`progress-bar bg-${RANK_COLORS[i + 1]}`} style={{ width: `${rec.confidence}%` }}></div>
                        </div>
                        <p className="small text-muted mb-0">{rec.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex align-items-center">
              <h6 className="mb-0 fw-semibold">
                <i className="bi bi-clock-history me-2 text-success"></i>
                AI Advisory History Log
              </h6>
              <span className="badge bg-secondary-subtle text-secondary ms-auto">{history.length}</span>
            </div>
            <div className="card-body p-0">
              {historyLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-success"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                  {t('cropRecommendation.noRecommendations')}
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {history.slice(0, 10).map((rec) => (
                    <div key={rec.id} className="list-group-item d-flex align-items-center gap-3 py-3">
                      <div className="fs-3">{CROP_ICONS[rec.recommended_crop] || '\u{1F33E}'}</div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-success d-flex align-items-center gap-2">
                          <span>{rec.recommended_crop}</span>
                          <span className="badge bg-success-subtle text-success small" style={{ fontSize: '10px' }}>
                            AI Verified
                          </span>
                        </div>
                        <small className="text-muted">
                          {t('common.soilLabel', { type: rec.soil_type })} &middot;{' '}
                          {t(`seasonLabels.${rec.season}`, { defaultValue: rec.season })} &middot;{' '}
                          {t(`irrigationTypes.${rec.irrigation_type}`, { defaultValue: rec.irrigation_type })}
                          {rec.weather_conditions ? ` · 🌤️ ${rec.weather_conditions}` : ''}
                        </small>
                      </div>
                      <small className="text-muted text-nowrap">
                        {new Date(rec.recommendation_date).toLocaleDateString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
