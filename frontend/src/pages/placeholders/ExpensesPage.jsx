import React, { useState, useEffect } from 'react';
import { getExpenses, getCrops, createExpense, updateExpense, deleteExpense } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Expense Tracking Page — CRUD
 */

const CATEGORY_ICONS = {
  Seeds: '🌱', Labour: '👷', Fertilizers: '🧪', Pesticides: '💊',
  Irrigation: '💧', Machinery: '🚜', Transportation: '🚛', Other: '📦',
};

const CATEGORY_COLORS = {
  Seeds: 'bg-success-subtle text-success',
  Labour: 'bg-warning-subtle text-warning',
  Fertilizers: 'bg-info-subtle text-info',
  Pesticides: 'bg-danger-subtle text-danger',
  Irrigation: 'bg-primary-subtle text-primary',
  Machinery: 'bg-dark-subtle text-dark',
  Transportation: 'bg-secondary-subtle text-secondary',
  Other: 'bg-light text-muted',
};

const CATEGORIES = ['Seeds', 'Labour', 'Fertilizers', 'Pesticides', 'Irrigation', 'Machinery', 'Transportation', 'Other'];

const emptyForm = { crop: '', expense_category: 'Seeds', description: '', amount: '', expense_date: '' };

export default function ExpensesPage() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterCrop, setFilterCrop] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [expData, cropData] = await Promise.all([getExpenses(), getCrops()]);
      setExpenses(expData);
      setCrops(cropData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingExpense(null);
    setForm({ ...emptyForm, crop: crops[0]?.id || '', expense_date: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  }

  function openEdit(exp) {
    setEditingExpense(exp);
    setForm({
      crop: exp.crop,
      expense_category: exp.expense_category,
      description: exp.description || '',
      amount: exp.amount,
      expense_date: exp.expense_date,
    });
    setError('');
    setShowModal(true);
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, crop: parseInt(form.crop), amount: parseFloat(form.amount) };
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        setSuccess(t('expenses.expenseUpdated'));
      } else {
        await createExpense(payload);
        setSuccess(t('expenses.expenseAdded'));
      }
      setShowModal(false);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteExpense(id);
      setSuccess(t('expenses.expenseDeleted'));
      setDeleteConfirm(null);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  // Filtered expenses
  const filtered = expenses.filter((e) => {
    if (filterCrop !== 'All' && e.crop !== parseInt(filterCrop)) return false;
    if (filterCategory !== 'All' && e.expense_category !== filterCategory) return false;
    return true;
  });

  const totalAmount = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  // Per-category breakdown
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    const total = filtered.filter((e) => e.expense_category === cat).reduce((s, e) => s + parseFloat(e.amount), 0);
    if (total > 0) acc[cat] = total;
    return acc;
  }, {});

  const getCropName = (cropId) => crops.find((c) => c.id === cropId)?.crop_name || `Crop #${cropId}`;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-success mb-0">
            <i className="bi bi-wallet2 me-2"></i>{t('expenseTracking')}
          </h2>
          <small className="text-muted"> · </small>
        </div>
        <button className="btn btn-success" onClick={openAdd} disabled={crops.length === 0}>
          <i className="bi bi-plus-lg me-1"></i>{t('addExpense')}
        </button>
      </div>

      {error && <div className="alert alert-danger" onClick={() => setError('')}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success}</div>}

      {crops.length === 0 && !loading && (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {t('expenses.noCropsFoundAlert')}
        </div>
      )}

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-danger text-white">
            <div className="card-body">
              <p className="mb-0 small opacity-75">{t('totalExpensesFiltered')}</p>
              <h3 className="fw-bold mb-0">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body">
              <p className="mb-0 small opacity-75">{t('expenseEntries')}</p>
              <h3 className="fw-bold mb-0">{filtered.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body">
              <p className="mb-0 small opacity-75">{t('avgPerEntry')}</p>
              <h3 className="fw-bold mb-0">
                ₹{filtered.length > 0 ? (totalAmount / filtered.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-bottom">
            <h6 className="mb-0 fw-semibold">
              <i className="bi bi-pie-chart me-2 text-success"></i>
              {t('expenses.expenseByCategory')}
            </h6>
          </div>
          <div className="card-body d-flex flex-wrap gap-2">
            {Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).map(([cat, total]) => (
              <div key={cat} className={`badge ${CATEGORY_COLORS[cat]} px-3 py-2 fs-6`}>
                {CATEGORY_ICONS[cat]} {t(`expenseCategories.${cat}`, { defaultValue: cat })}: ₹{total.toLocaleString('en-IN')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 d-flex gap-3 flex-wrap align-items-center">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 fw-semibold small">{t('expenses.crop')}</label>
            <select className="form-select form-select-sm" value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)}>
              <option value="All">{t('allCrops')}</option>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.crop_name}</option>)}
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 fw-semibold small">{t('category')}:</label>
            <select className="form-select form-select-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="All">{t('allCategories')}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`expenseCategories.${c}`, { defaultValue: c })}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-receipt fs-1 d-block mb-2"></i>
              {expenses.length === 0 
                ? t('expenses.noExpensesYet') 
                : t('expenses.noExpensesMatch')}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>{t('category')}</th>
                    <th>{t('cropName')}</th>
                    <th>{t('description')}</th>
                    <th>{t('date')}</th>
                    <th className="text-end">{t('amount')} (₹)</th>
                    <th className="text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp, idx) => (
                    <tr key={exp.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <span className={`badge ${CATEGORY_COLORS[exp.expense_category] || 'bg-secondary-subtle text-secondary'}`}>
                          {CATEGORY_ICONS[exp.expense_category]} {t(`expenseCategories.${exp.expense_category}`, { defaultValue: exp.expense_category })}
                        </span>
                      </td>
                      <td>{getCropName(exp.crop)}</td>
                      <td>{exp.description || <span className="text-muted">—</span>}</td>
                      <td>{exp.expense_date}</td>
                      <td className="text-end fw-semibold text-danger">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(exp)} title={t('edit')}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm(exp)} title={t('delete')}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="5" className="text-end fw-bold">{t('common.total')}:</td>
                    <td className="text-end fw-bold text-danger">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  {editingExpense ? `✏️ ${t('expenses.editExpense')}` : `➕ ${t('expenses.addExpense')}`}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('expenses.cropRequired')}</label>
                      <select name="crop" value={form.crop} onChange={handleChange} className="form-select" required>
                        <option value="">{t('expenses.selectCrop')}</option>
                        {crops.map((c) => <option key={c.id} value={c.id}>{c.crop_name} ({t(`seasonLabels.${c.season}`, { defaultValue: c.season })})</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('category')} *</label>
                      <select name="expense_category" value={form.expense_category} onChange={handleChange} className="form-select" required>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{t(`expenseCategories.${c}`, { defaultValue: c })}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">{t('description')}</label>
                      <input name="description" value={form.description} onChange={handleChange} className="form-control" placeholder={t('expenses.descriptionPlaceholder')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('amount')} (₹) *</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input type="number" name="amount" value={form.amount} onChange={handleChange} className="form-control" placeholder="0.00" min="0" step="0.01" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('date')} *</label>
                      <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange} className="form-control" required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-success" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-1"></span>}
                    {editingExpense ? t('common.update') : t('addExpense')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div className="modal-body text-center py-4">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-1 d-block mb-2"></i>
                <p>
                  {t('expenses.deleteExpenseConfirm', { crop: deleteConfirm.expense_category, amount: Number(deleteConfirm.amount).toLocaleString('en-IN') })}
                </p>
                <small className="text-muted d-block">{t('expenses.deleteWarning')}</small>
              </div>
              <div className="modal-footer justify-content-center">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>{t('delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
