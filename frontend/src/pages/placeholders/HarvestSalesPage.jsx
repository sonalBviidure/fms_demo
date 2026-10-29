import React, { useState, useEffect } from 'react';
import { getCrops, getHarvests, getSales, createHarvest, createSale, deleteHarvest, deleteSale } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Harvest & Sales Management Page
 */

const UNIT_LABELS = { Quintals: 'Qtl', Tonnes: 'T', Bags: 'Bags', Kgs: 'Kg' };

export default function HarvestSalesPage() {
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Harvest Form
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestForm, setHarvestForm] = useState({ crop: '', harvest_date: '', quantity_harvested: '', unit: 'Quintals' });
  const [savingHarvest, setSavingHarvest] = useState(false);

  // Sale Form
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ harvest: '', quantity_sold: '', selling_price: '', buyer_name: '', sale_date: '' });
  const [savingSale, setSavingSale] = useState(false);

  const [activeTab, setActiveTab] = useState('harvests');

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    setLoading(true);
    try {
      const cropData = await getCrops();
      setCrops(cropData);
      const [harvestData, saleData] = await Promise.all([getHarvests(), getSales()]);
      setHarvests(harvestData);
      setSales(saleData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Filter by selected crop
  const filteredHarvests = selectedCrop
    ? harvests.filter((h) => h.crop === parseInt(selectedCrop))
    : harvests;

  const filteredSales = selectedCrop
    ? sales.filter((s) => filteredHarvests.some((h) => h.id === s.harvest))
    : sales;

  const totalHarvested = filteredHarvests.reduce((s, h) => s + parseFloat(h.quantity_harvested), 0);
  const totalSaleRevenue = filteredSales.reduce((s, sa) => s + parseFloat(sa.total_amount), 0);

  function getCropName(cropId) {
    return crops.find((c) => c.id === cropId)?.crop_name || `Crop #${cropId}`;
  }

  function getHarvestLabel(harvestId) {
    const h = harvests.find((hv) => hv.id === harvestId);
    if (!h) return `Harvest #${harvestId}`;
    return `${getCropName(h.crop)} — ${h.harvest_date} (${h.quantity_harvested} ${UNIT_LABELS[h.unit] || h.unit})`;
  }

  // Harvest handlers
  function openHarvestModal() {
    setHarvestForm({ crop: selectedCrop || crops[0]?.id || '', harvest_date: new Date().toISOString().split('T')[0], quantity_harvested: '', unit: 'Quintals' });
    setError('');
    setShowHarvestModal(true);
  }

  async function handleAddHarvest(e) {
    e.preventDefault();
    setSavingHarvest(true);
    setError('');
    try {
      await createHarvest({ ...harvestForm, crop: parseInt(harvestForm.crop), quantity_harvested: parseFloat(harvestForm.quantity_harvested) });
      setSuccess(t('harvestSales.harvestAdded'));
      setShowHarvestModal(false);
      const [hd, sd] = await Promise.all([getHarvests(), getSales()]);
      setHarvests(hd);
      setSales(sd);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingHarvest(false);
    }
  }

  async function handleDeleteHarvest(id) {
    const crop = getCropName(harvests.find((h) => h.id === id)?.crop);
    const confirmMsg = t('harvestSales.deleteHarvestConfirm', { crop });
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteHarvest(id);
      setSuccess(t('harvestSales.harvestDeleted'));
      const [hd, sd] = await Promise.all([getHarvests(), getSales()]);
      setHarvests(hd);
      setSales(sd);
    } catch (e) {
      setError(e.message);
    }
  }

  // Sale handlers
  function openSaleModal(harvestId = '') {
    setSaleForm({
      harvest: harvestId || filteredHarvests[0]?.id || '',
      quantity_sold: '',
      selling_price: '',
      buyer_name: '',
      sale_date: new Date().toISOString().split('T')[0],
    });
    setError('');
    setShowSaleModal(true);
  }

  async function handleAddSale(e) {
    e.preventDefault();
    setSavingSale(true);
    setError('');
    try {
      await createSale({
        ...saleForm,
        harvest: parseInt(saleForm.harvest),
        quantity_sold: parseFloat(saleForm.quantity_sold),
        selling_price: parseFloat(saleForm.selling_price),
      });
      setSuccess(t('harvestSales.saleRecorded'));
      setShowSaleModal(false);
      const [hd, sd] = await Promise.all([getHarvests(), getSales()]);
      setHarvests(hd);
      setSales(sd);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingSale(false);
    }
  }

  async function handleDeleteSale(id) {
    const confirmMsg = t('harvestSales.deleteSaleConfirm');
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteSale(id);
      setSuccess(t('harvestSales.saleDeleted'));
      const sd = await getSales();
      setSales(sd);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-success mb-0">
            <i className="bi bi-shop me-2"></i>{t('harvestSalesTitle')}
          </h2>
          <small className="text-muted"> · </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success" onClick={openHarvestModal} disabled={crops.length === 0}>
            <i className="bi bi-basket me-1"></i>{t('logHarvest')}
          </button>
          <button className="btn btn-success" onClick={() => openSaleModal()} disabled={filteredHarvests.length === 0}>
            <i className="bi bi-bag-check me-1"></i>{t('recordSaleBtn')}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" onClick={() => setError('')}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success}</div>}

      {/* Crop Filter */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 d-flex align-items-center gap-3 flex-wrap">
          <label className="form-label mb-0 fw-semibold">{t('harvestSales.filterByCrop')}</label>
          <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
            <option value="">{t('allCrops')}</option>
            {crops.map((c) => <option key={c.id} value={c.id}>{c.crop_name} ({c.season})</option>)}
          </select>
          <div className="ms-auto d-flex gap-3 flex-wrap">
            <span className="badge bg-success-subtle text-success fs-6 px-3 py-2">
              🌾 {t('totalHarvested')}: {totalHarvested.toFixed(2)} {t('common.units')}
            </span>
            <span className="badge bg-primary-subtle text-primary fs-6 px-3 py-2">
              💰 {t('totalRevenueBadge')}: ₹{totalSaleRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-0 border-bottom-0">
        <li className="nav-item">
          <button className={`nav-link fw-semibold ${activeTab === 'harvests' ? 'active text-success' : 'text-muted'}`} onClick={() => setActiveTab('harvests')}>
            <i className="bi bi-basket me-1"></i>{t('harvestSales.harvests')} ({filteredHarvests.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-semibold ${activeTab === 'sales' ? 'active text-success' : 'text-muted'}`} onClick={() => setActiveTab('sales')}>
            <i className="bi bi-bag-check me-1"></i>{t('harvestSales.sales')} ({filteredSales.length})
          </button>
        </li>
      </ul>

      <div className="card border-0 shadow-sm rounded-top-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
          ) : activeTab === 'harvests' ? (
            filteredHarvests.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-basket fs-1 d-block mb-2"></i>
                {t('harvestSales.noHarvestsYet')}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>{t('cropName')}</th>
                      <th>{t('harvestDate')}</th>
                      <th>{t('quantity')}</th>
                      <th>{t('unit')}</th>
                      <th>{t('harvestSales.salesCount')}</th>
                      <th className="text-center">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHarvests.map((h, idx) => (
                      <tr key={h.id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td className="fw-semibold">{getCropName(h.crop)}</td>
                        <td>{h.harvest_date}</td>
                        <td>{h.quantity_harvested}</td>
                        <td><span className="badge bg-success-subtle text-success">{h.unit}</span></td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary">
                            {h.sales?.length || 0} {t('harvestSales.sales')}
                          </span>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-outline-success me-1" onClick={() => openSaleModal(h.id)} title={t('recordSaleBtn')}>
                            <i className="bi bi-bag-check"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteHarvest(h.id)} title={t('delete')}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredSales.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-bag-x fs-1 d-block mb-2"></i>
                {t('harvestSales.noSalesYet')}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>{t('harvestSales.harvestCrop')}</th>
                      <th>{t('buyerName')}</th>
                      <th>{t('saleDate')}</th>
                      <th>{t('harvestSales.qtySold')}</th>
                      <th className="text-end">{t('pricePer')} (₹)</th>
                      <th className="text-end">{t('harvestSales.totalAmount')}</th>
                      <th className="text-center">{t('delete')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((s, idx) => (
                      <tr key={s.id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>{getHarvestLabel(s.harvest)}</td>
                        <td>{s.buyer_name}</td>
                        <td>{s.sale_date}</td>
                        <td>{s.quantity_sold}</td>
                        <td className="text-end">₹{Number(s.selling_price).toLocaleString('en-IN')}</td>
                        <td className="text-end fw-bold text-success">₹{Number(s.total_amount).toLocaleString('en-IN')}</td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSale(s.id)} title={t('delete')}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">{t('totalRevenueBadge')}:</td>
                      <td className="text-end fw-bold text-success">₹{totalSaleRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Add Harvest Modal */}
      {showHarvestModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold"><i className="bi bi-basket me-2"></i>{t('logHarvest')}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowHarvestModal(false)}></button>
              </div>
              <form onSubmit={handleAddHarvest}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">{t('harvestSales.cropRequired')}</label>
                      <select name="crop" value={harvestForm.crop} onChange={(e) => setHarvestForm((p) => ({ ...p, crop: e.target.value }))} className="form-select" required>
                        {crops.map((c) => <option key={c.id} value={c.id}>{c.crop_name} ({c.season})</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('harvestDate')} *</label>
                      <input type="date" value={harvestForm.harvest_date} onChange={(e) => setHarvestForm((p) => ({ ...p, harvest_date: e.target.value }))} className="form-control" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('unit')} *</label>
                      <select value={harvestForm.unit} onChange={(e) => setHarvestForm((p) => ({ ...p, unit: e.target.value }))} className="form-select">
                        {['Quintals', 'Tonnes', 'Bags', 'Kgs'].map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">{t('harvestSales.quantityHarvested')}</label>
                      <div className="input-group">
                        <input type="number" value={harvestForm.quantity_harvested} onChange={(e) => setHarvestForm((p) => ({ ...p, quantity_harvested: e.target.value }))} className="form-control" placeholder="e.g. 40" min="0" step="0.01" required />
                        <span className="input-group-text">{UNIT_LABELS[harvestForm.unit]}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowHarvestModal(false)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-success" disabled={savingHarvest}>
                    {savingHarvest && <span className="spinner-border spinner-border-sm me-1"></span>}
                    {t('logHarvest')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Sale Modal */}
      {showSaleModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold"><i className="bi bi-bag-check me-2"></i>{t('recordSaleBtn')}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowSaleModal(false)}></button>
              </div>
              <form onSubmit={handleAddSale}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">{t('harvestSales.harvestBatch')}</label>
                      <select value={saleForm.harvest} onChange={(e) => setSaleForm((p) => ({ ...p, harvest: e.target.value }))} className="form-select" required>
                        <option value="">{t('harvestSales.selectHarvest')}</option>
                        {(selectedCrop ? filteredHarvests : harvests).map((h) => (
                          <option key={h.id} value={h.id}>{getHarvestLabel(h.id)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('buyerName')} *</label>
                      <input value={saleForm.buyer_name} onChange={(e) => setSaleForm((p) => ({ ...p, buyer_name: e.target.value }))} className="form-control" placeholder={t('harvestSales.buyerPlaceholder')} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('saleDate')} *</label>
                      <input type="date" value={saleForm.sale_date} onChange={(e) => setSaleForm((p) => ({ ...p, sale_date: e.target.value }))} className="form-control" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('harvestSales.quantitySold')}</label>
                      <input type="number" value={saleForm.quantity_sold} onChange={(e) => setSaleForm((p) => ({ ...p, quantity_sold: e.target.value }))} className="form-control" placeholder="e.g. 30" min="0" step="0.01" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('pricePer')} (₹) *</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input type="number" value={saleForm.selling_price} onChange={(e) => setSaleForm((p) => ({ ...p, selling_price: e.target.value }))} className="form-control" placeholder="e.g. 3500" min="0" step="0.01" required />
                      </div>
                    </div>
                    {saleForm.quantity_sold && saleForm.selling_price && (
                      <div className="col-12">
                        <div className="alert alert-success py-2 mb-0">
                          <strong>{t('common.total')} = ₹{(parseFloat(saleForm.quantity_sold) * parseFloat(saleForm.selling_price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSaleModal(false)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-success" disabled={savingSale}>
                    {savingSale && <span className="spinner-border spinner-border-sm me-1"></span>}
                    {t('recordSaleBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
