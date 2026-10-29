import React, { useState, useEffect } from 'react';
import { getFinancialSummaries, getCrops, recalculateFinancial } from '../../services/api';
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

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [finData, cropData] = await Promise.all([
        getFinancialSummaries(),
        getCrops(),
      ]);
      setReport(finData);
      setCrops(cropData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate(cropId, cropName) {
    setRecalculating(cropId);
    setSuccess('');
    setError('');
    try {
      await recalculateFinancial(cropId);
      setSuccess(t('reports.analysisRecalculated', { crop: cropName }));
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setRecalculating(null);
    }
  }

  const totalRevenue = report.reduce((s, r) => s + r.total_revenue, 0);
  const totalCost = report.reduce((s, r) => s + r.total_cost, 0);
  const netProfit = totalRevenue - totalCost;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-success mb-0">
            <i className="bi bi-bar-chart-line me-2"></i>{t('financialReports')}
          </h2>
          <p className="text-muted mb-0 small">{t('reports.subtitle')}</p>
        </div>
        <div className="d-flex gap-2">
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
                onClick={() => {
                  const headers = ['Crop', 'Variety', 'Season', 'Field', 'Area (Acres)', 'Cost (INR)', 'Revenue (INR)', 'Profit/Loss (INR)', 'Profit/Acre (INR)'];
                  const rows = report.map(r => [
                    `"${r.crop_name}"`,
                    `"${r.variety || ''}"`,
                    `"${r.season}"`,
                    `"${r.field_name}"`,
                    r.land_area,
                    r.total_cost,
                    r.total_revenue,
                    r.profit_loss,
                    r.profit_per_acre
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `fms_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                {t('common.exportCsv')}
              </button>
            </>
          )}
          <button className="btn btn-outline-success" onClick={loadData} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>{t('refresh')}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="mb-0 small opacity-75">{t('totalRevenue')}</p>
                  <h3 className="fw-bold">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <i className="bi bi-cash-stack fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-danger text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="mb-0 small opacity-75">{t('totalCost')}</p>
                  <h3 className="fw-bold">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <i className="bi bi-receipt fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card border-0 shadow-sm text-white ${netProfit >= 0 ? 'bg-primary' : 'bg-warning'}`}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="mb-0 small opacity-75">{t('profitLoss')}</p>
                  <h3 className="fw-bold">{netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <i className={`bi ${netProfit >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'} fs-1 opacity-50`}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart.js Interactive Visualizations */}
      {report.length > 0 && (
        <div className="row g-4 mb-4">
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
                    data={{
                      labels: report.map(r => r.crop_name),
                      datasets: [
                        {
                          label: t('reports.revenueRupees'),
                          data: report.map(r => r.total_revenue),
                          backgroundColor: 'rgba(25, 135, 84, 0.75)',
                          borderColor: 'rgb(25, 135, 84)',
                          borderWidth: 1,
                        },
                        {
                          label: t('reports.costRupees'),
                          data: report.map(r => r.total_cost),
                          backgroundColor: 'rgba(220, 53, 69, 0.75)',
                          borderColor: 'rgb(220, 53, 69)',
                          borderWidth: 1,
                        },
                        {
                          label: t('reports.profitLossRupees'),
                          data: report.map(r => r.profit_loss),
                          backgroundColor: 'rgba(13, 110, 253, 0.75)',
                          borderColor: 'rgb(13, 110, 253)',
                          borderWidth: 1,
                        }
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => '₹' + Number(value).toLocaleString('en-IN'),
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
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
                    data={{
                      labels: [
                        t('reports.cost'),
                        t('reports.netProfit')
                      ],
                      datasets: [{
                        data: [totalCost, Math.max(0, netProfit)],
                        backgroundColor: ['rgba(220, 53, 69, 0.8)', 'rgba(25, 135, 84, 0.8)'],
                        borderColor: ['#fff', '#fff'],
                        borderWidth: 2,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }}
                  />
                </div>
                <div className="mt-3 text-center small text-muted">
                  <span>{t('totalRevenueBadge')}: <strong>₹{totalRevenue.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Comparison Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-table me-2 text-success"></i>{t('cropWiseComparison')}
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <p className="mt-2 text-muted">{t('loading')}</p>
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
                    <th className="text-end">{t('reports.cost')} (₹)</th>
                    <th className="text-end">{t('reports.revenue')} (₹)</th>
                    <th className="text-end">{t('profitLoss')} (₹)</th>
                    <th className="text-end">{t('profitPerAcre')} (₹)</th>
                    <th className="text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.crop_id}>
                      <td className="fw-semibold">{row.crop_name}{row.variety ? ` (${row.variety})` : ''}</td>
                      <td><span className="badge bg-success-subtle text-success">{t(`seasonLabels.${row.season}`, { defaultValue: row.season })}</span></td>
                      <td>{row.field_name}</td>
                      <td>{row.land_area}</td>
                      <td className="text-end text-danger">₹{Number(row.total_cost).toLocaleString('en-IN')}</td>
                      <td className="text-end text-success">₹{Number(row.total_revenue).toLocaleString('en-IN')}</td>
                      <td className={`text-end fw-bold ${row.profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                        {row.profit_loss >= 0 ? '+' : ''}₹{Number(row.profit_loss).toLocaleString('en-IN')}
                      </td>
                      <td className={`text-end ${row.profit_per_acre >= 0 ? 'text-success' : 'text-danger'}`}>
                        ₹{Number(row.profit_per_acre).toLocaleString('en-IN')}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleRecalculate(row.crop_id, row.crop_name)}
                          disabled={recalculating === row.crop_id}
                        >
                          {recalculating === row.crop_id
                            ? <span className="spinner-border spinner-border-sm"></span>
                            : <><i className="bi bi-arrow-repeat me-1"></i>{t('recalculate')}</>
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recalculate All Buttons */}
      {crops.length > 0 && report.length === 0 && (
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
                onClick={() => handleRecalculate(crop.id, crop.crop_name)}
                disabled={recalculating === crop.id}
              >
                {recalculating === crop.id
                  ? <span className="spinner-border spinner-border-sm me-1"></span>
                  : <i className="bi bi-calculator me-1"></i>
                }
                {t('recalculate')}: {crop.crop_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
