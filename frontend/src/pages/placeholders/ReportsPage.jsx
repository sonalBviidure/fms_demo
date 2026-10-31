
import React, { useState, useEffect } from 'react';
import {
  getFinancialSummaries,
  getCrops,
  recalculateFinancial
} from '../../services/api';

import { useLanguage } from '../../context/LanguageContext';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

/**
 * Financial Reports Page
 */

export default function ReportsPage() {
  const { t } = useLanguage();

  const [report, setReport] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==========================================
  // FINANCIAL NUMBER CONVERSION
  // ==========================================

  // Convert Django Decimal/string values into JavaScript numbers
  const toNumber = (value) => {
    const parsed = Number(
      String(value ?? 0).replace(/[₹,\s]/g, '')
    );

    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Calculate individual crop profit or loss
  const getProfitLoss = (row) => {
    return (
      toNumber(row.total_revenue) -
      toNumber(row.total_cost)
    );
  };

  // Format currency in Indian Rupees
  const formatCurrency = (value) => {
    return toNumber(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ==========================================
  // LOAD FINANCIAL DATA
  // ==========================================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [finData, cropData] = await Promise.all([
        getFinancialSummaries(),
        getCrops(),
      ]);

      setReport(Array.isArray(finData) ? finData : []);
      setCrops(Array.isArray(cropData) ? cropData : []);

    } catch (e) {
      setError(e.message || 'Unable to load financial reports.');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // RECALCULATE FINANCIAL DATA
  // ==========================================

  async function handleRecalculate(cropId, cropName) {
    setRecalculating(cropId);
    setSuccess('');
    setError('');

    try {
      await recalculateFinancial(cropId);

      setSuccess(
        t('reports.analysisRecalculated', {
          crop: cropName
        })
      );

      await loadData();

    } catch (e) {
      setError(e.message || 'Financial recalculation failed.');
    } finally {
      setRecalculating(null);
    }
  }

  // ==========================================
  // TOTAL FINANCIAL CALCULATIONS
  // ==========================================

  const totalRevenue = report.reduce(
    (sum, row) => sum + toNumber(row.total_revenue),
    0
  );

  const totalCost = report.reduce(
    (sum, row) => sum + toNumber(row.total_cost),
    0
  );

  // Actual profit or loss
  const netProfit = totalRevenue - totalCost;

  const isProfit = netProfit >= 0;

  // ==========================================
  // CSV EXPORT
  // ==========================================

  function exportCSV() {
    const headers = [
      'Crop',
      'Variety',
      'Season',
      'Field',
      'Area (Acres)',
      'Cost (INR)',
      'Revenue (INR)',
      'Profit/Loss (INR)',
      'Profit/Acre (INR)'
    ];

    const rows = report.map((r) => [
      `"${r.crop_name || ''}"`,
      `"${r.variety || ''}"`,
      `"${r.season || ''}"`,
      `"${r.field_name || ''}"`,
      toNumber(r.land_area),
      toNumber(r.total_cost),
      toNumber(r.total_revenue),
      getProfitLoss(r),
      toNumber(r.profit_per_acre)
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => row.join(','))
      ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `fms_financial_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // ==========================================
  // BAR CHART DATA
  // ==========================================

  const barChartData = {
    labels: report.map((r) => r.crop_name),

    datasets: [
      {
        label: t('reports.revenueRupees'),

        data: report.map((r) =>
          toNumber(r.total_revenue)
        ),

        backgroundColor: 'rgba(25, 135, 84, 0.75)',
        borderColor: 'rgb(25, 135, 84)',
        borderWidth: 1,
      },

      {
        label: t('reports.costRupees'),

        data: report.map((r) =>
          toNumber(r.total_cost)
        ),

        backgroundColor: 'rgba(220, 53, 69, 0.75)',
        borderColor: 'rgb(220, 53, 69)',
        borderWidth: 1,
      },

      {
        label: t('reports.profitLossRupees'),

        data: report.map((r) =>
          getProfitLoss(r)
        ),

        backgroundColor: 'rgba(13, 110, 253, 0.75)',
        borderColor: 'rgb(13, 110, 253)',
        borderWidth: 1,
      }
    ],
  };

  // ==========================================
  // DOUGHNUT CHART DATA
  // ==========================================

  // Show cost and profit when profitable.
  // Show cost and loss separately when there is a loss.
  const distributionData = {
    labels: [
      t('reports.cost'),
      isProfit
        ? t('reports.netProfit')
        : t('reports.profitLoss')
    ],

    datasets: [
      {
        data: [
          totalCost,
          Math.abs(netProfit)
        ],

        backgroundColor: [
          'rgba(220, 53, 69, 0.8)',
          isProfit
            ? 'rgba(25, 135, 84, 0.8)'
            : 'rgba(255, 193, 7, 0.85)'
        ],

        borderColor: ['#fff', '#fff'],
        borderWidth: 2,
      }
    ]
  };

  // ==========================================
  // RENDER PAGE
  // ==========================================

  return (
    <div className="container-fluid py-4">

      {/* HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">

        <div>
          <h2 className="fw-bold text-success mb-0">
            <i className="bi bi-bar-chart-line me-2"></i>
            {t('financialReports')}
          </h2>

          <p className="text-muted mb-0 small">
            {t('reports.subtitle')}
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">

          {report.length > 0 && (
            <>
              <button
                className="btn btn-outline-secondary"
                onClick={() => window.print()}
                title="Print or Save as PDF"
              >
                <i className="bi bi-printer me-1"></i>
                {t('common.printPdf')}
              </button>

              <button
                className="btn btn-outline-success"
                onClick={exportCSV}
              >
                <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                {t('common.exportCsv')}
              </button>
            </>
          )}

          <button
            className="btn btn-outline-success"
            onClick={loadData}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            {t('refresh')}
          </button>

        </div>
      </div>

      {/* ERROR AND SUCCESS MESSAGES */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="row g-3 mb-4">

        {/* TOTAL REVENUE */}

        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">

                <div>
                  <p className="mb-0 small opacity-75">
                    {t('totalRevenue')}
                  </p>

                  <h3 className="fw-bold">
                    ₹{formatCurrency(totalRevenue)}
                  </h3>
                </div>

                <i className="bi bi-cash-stack fs-1 opacity-50"></i>

              </div>
            </div>
          </div>
        </div>

        {/* TOTAL COST */}

        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-danger text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">

                <div>
                  <p className="mb-0 small opacity-75">
                    {t('totalCost')}
                  </p>

                  <h3 className="fw-bold">
                    ₹{formatCurrency(totalCost)}
                  </h3>
                </div>

                <i className="bi bi-receipt fs-1 opacity-50"></i>

              </div>
            </div>
          </div>
        </div>

        {/* PROFIT / LOSS */}

        <div className="col-md-4">
          <div
            className={`card border-0 shadow-sm text-white h-100 ${
              isProfit ? 'bg-primary' : 'bg-warning'
            }`}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between">

                <div>
                  <p className="mb-0 small opacity-75">
                    {t('profitLoss')}
                  </p>

                  <h3 className="fw-bold">
                    {isProfit ? '+' : '-'}₹
                    {formatCurrency(Math.abs(netProfit))}
                  </h3>

                  <small>
                    {isProfit ? 'Net Profit' : 'Net Loss'}
                  </small>
                </div>

                <i
                  className={`bi ${
                    isProfit
                      ? 'bi-graph-up-arrow'
                      : 'bi-graph-down-arrow'
                  } fs-1 opacity-50`}
                ></i>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS */}

      {report.length > 0 && (
        <div className="row g-4 mb-4">

          {/* CROP REVENUE VS COST */}

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">

              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-dark">
                  <i className="bi bi-bar-chart-fill me-2 text-success"></i>
                  {t('reports.cropRevenueVsCostChart')}
                </h5>
              </div>

              <div className="card-body">
                <div style={{ height: '320px' }}>

                  <Bar
                    data={barChartData}

                    options={{
                      responsive: true,
                      maintainAspectRatio: false,

                      plugins: {
                        legend: {
                          position: 'top'
                        },

                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return (
                                context.dataset.label +
                                ': ₹' +
                                Number(context.raw).toLocaleString('en-IN')
                              );
                            }
                          }
                        }
                      },

                      scales: {
                        y: {
                          beginAtZero: true,

                          ticks: {
                            callback: (value) =>
                              '₹' +
                              Number(value).toLocaleString('en-IN')
                          }
                        }
                      }
                    }}
                  />

                </div>
              </div>

            </div>
          </div>

          {/* FINANCIAL DISTRIBUTION */}

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">

              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-dark">
                  <i className="bi bi-pie-chart-fill me-2 text-primary"></i>
                  {t('reports.financialDistribution')}
                </h5>
              </div>

              <div className="card-body d-flex flex-column align-items-center justify-content-center">

                <div style={{ width: '240px', height: '240px' }}>

                  <Doughnut
                    data={distributionData}

                    options={{
                      responsive: true,
                      maintainAspectRatio: false,

                      plugins: {
                        legend: {
                          position: 'bottom'
                        },

                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return (
                                context.label +
                                ': ₹' +
                                Number(context.raw).toLocaleString('en-IN')
                              );
                            }
                          }
                        }
                      }
                    }}
                  />

                </div>

                <div className="mt-3 text-center small text-muted">

                  <div>
                    {t('totalRevenueBadge')}:
                    <strong>
                      {' '}₹{formatCurrency(totalRevenue)}
                    </strong>
                  </div>

                  <div className="mt-1">
                    {t('profitLoss')}:

                    <strong
                      className={
                        isProfit ? 'text-success' : 'text-danger'
                      }
                    >
                      {' '}
                      {isProfit ? '+' : '-'}₹
                      {formatCurrency(Math.abs(netProfit))}
                    </strong>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* CROP COMPARISON TABLE */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-table me-2 text-success"></i>
            {t('cropWiseComparison')}
          </h5>
        </div>

        <div className="card-body p-0">

          {loading ? (

            <div className="text-center py-5">

              <div className="spinner-border text-success"></div>

              <p className="mt-2 text-muted">
                {t('loading')}
              </p>

            </div>

          ) : report.length === 0 ? (

            <div className="text-center py-5 text-muted">

              <i className="bi bi-clipboard-data fs-1 d-block mb-2"></i>

              <p>
                {t('reports.noFinancialData')}
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table table-hover mb-0">

                <thead className="table-light">

                  <tr>
                    <th>{t('reports.crop')}</th>
                    <th>{t('season')}</th>
                    <th>{t('field')}</th>
                    <th>{t('area')} ({t('acres')})</th>
                    <th className="text-end">
                      {t('reports.cost')} (₹)
                    </th>
                    <th className="text-end">
                      {t('reports.revenue')} (₹)
                    </th>
                    <th className="text-end">
                      {t('profitLoss')} (₹)
                    </th>
                    <th className="text-end">
                      {t('profitPerAcre')} (₹)
                    </th>
                    <th className="text-center">
                      {t('actions')}
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {report.map((row) => {

                    // Calculate profit/loss for each crop
                    const cropProfitLoss = getProfitLoss(row);

                    const cropIsProfit = cropProfitLoss >= 0;

                    return (

                      <tr key={row.crop_id}>

                        {/* CROP */}

                        <td className="fw-semibold">
                          {row.crop_name}

                          {row.variety
                            ? ` (${row.variety})`
                            : ''
                          }
                        </td>

                        {/* SEASON */}

                        <td>
                          <span className="badge bg-success-subtle text-success">

                            {t(`seasonLabels.${row.season}`, {
                              defaultValue: row.season
                            })}

                          </span>
                        </td>

                        {/* FIELD */}

                        <td>
                          {row.field_name}
                        </td>

                        {/* AREA */}

                        <td>
                          {toNumber(row.land_area)}
                        </td>

                        {/* COST */}

                        <td className="text-end text-danger">
                          ₹{formatCurrency(row.total_cost)}
                        </td>

                        {/* REVENUE */}

                        <td className="text-end text-success">
                          ₹{formatCurrency(row.total_revenue)}
                        </td>

                        {/* PROFIT / LOSS */}

                        <td
                          className={`text-end fw-bold ${
                            cropIsProfit
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >

                          {cropIsProfit ? '+' : '-'}₹
                          {formatCurrency(Math.abs(cropProfitLoss))}

                        </td>

                        {/* PROFIT PER ACRE */}

                        <td
                          className={`text-end ${
                            toNumber(row.profit_per_acre) >= 0
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >

                          ₹{formatCurrency(row.profit_per_acre)}

                        </td>

                        {/* ACTIONS */}

                        <td className="text-center">

                          <button
                            className="btn btn-sm btn-outline-primary"

                            onClick={() =>
                              handleRecalculate(
                                row.crop_id,
                                row.crop_name
                              )
                            }

                            disabled={
                              recalculating === row.crop_id
                            }
                          >

                            {recalculating === row.crop_id ? (

                              <span className="spinner-border spinner-border-sm"></span>

                            ) : (

                              <>
                                <i className="bi bi-arrow-repeat me-1"></i>
                                {t('recalculate')}
                              </>

                            )}

                          </button>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>
      </div>

      {/* RECALCULATE ALL CROPS */}

      {crops.length > 0 && report.length === 0 && !loading && (

        <div className="mt-3">

          <div className="alert alert-info">

            <i className="bi bi-info-circle me-2"></i>

            {t('reports.recalculateNotice')}

          </div>

          <div className="d-flex gap-2 flex-wrap">

            {crops.map((crop) => (

              <button
                key={crop.id}

                className="btn btn-outline-success btn-sm"

                onClick={() =>
                  handleRecalculate(
                    crop.id,
                    crop.crop_name
                  )
                }

                disabled={recalculating === crop.id}
              >

                {recalculating === crop.id ? (

                  <span className="spinner-border spinner-border-sm me-1"></span>

                ) : (

                  <i className="bi bi-calculator me-1"></i>

                )}

                {t('recalculate')}: {crop.crop_name}

              </button>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}