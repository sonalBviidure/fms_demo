import React, { useState, useEffect } from 'react';
import { 
  getCrops, 
  getFields, 
  createCrop, 
  updateCrop, 
  deleteCrop,
  createField,
  deleteField 
} from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Crop & Field Management Page — CRUD
 */

const STATUS_BADGES = {
  Sown:      'bg-info-subtle text-info',
  Growing:   'bg-success-subtle text-success',
  Harvested: 'bg-warning-subtle text-warning',
  Closed:    'bg-secondary-subtle text-secondary',
};

const SEASON_BADGES = {
  Kharif: 'bg-success-subtle text-success',
  Rabi:   'bg-primary-subtle text-primary',
  Zaid:   'bg-warning-subtle text-warning',
  Annual: 'bg-info-subtle text-info',
};

const emptyCropForm = {
  crop_name: '', 
  variety: '', 
  season: 'Kharif',
  sowing_date: new Date().toISOString().split('T')[0], 
  field: '', 
  status: 'Sown',
};

const emptyFieldForm = {
  field_name: '',
  land_area: '',
  soil_type: 'Loamy',
};

const SOIL_TYPES = ['Black', 'Red', 'Loamy', 'Alluvial', 'Clayey', 'Sandy', 'Other'];

export default function CropsPage() {
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Crop modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [form, setForm] = useState(emptyCropForm);
  const [saving, setSaving] = useState(false);

  // Field modal state
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);
  const [savingField, setSavingField] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterSeason, setFilterSeason] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cropData, fieldData] = await Promise.all([getCrops(), getFields()]);
      setCrops(cropData);
      setFields(fieldData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingCrop(null);
    setForm({ 
      ...emptyCropForm, 
      field: fields[0]?.id || '',
      sowing_date: new Date().toISOString().split('T')[0]
    });
    setError('');
    setShowModal(true);
  }

  function openEdit(crop) {
    setEditingCrop(crop);
    setForm({
      crop_name: crop.crop_name,
      variety: crop.variety || '',
      season: crop.season,
      sowing_date: crop.sowing_date,
      field: crop.field,
      status: crop.status,
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
      if (editingCrop) {
        await updateCrop(editingCrop.id, form);
        setSuccess(t('crops.cropUpdated', { name: form.crop_name }));
      } else {
        await createCrop(form);
        setSuccess(t('crops.cropAdded', { name: form.crop_name }));
      }
      setShowModal(false);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    try {
      await deleteCrop(id);
      setSuccess(t('crops.cropDeleted', { name }));
      setDeleteConfirm(null);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreateField(e) {
    e.preventDefault();
    if (!fieldForm.field_name.trim() || !fieldForm.land_area) {
      setError(t('crops.fillFieldNameAndArea'));
      return;
    }
    setSavingField(true);
    setError('');
    try {
      const created = await createField({
        ...fieldForm,
        land_area: parseFloat(fieldForm.land_area)
      });
      setSuccess(t('crops.fieldAdded', { name: created.field_name }));
      setFieldForm(emptyFieldForm);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingField(false);
    }
  }

  async function handleDeleteField(id, name) {
    const confirmMsg = t('crops.deleteFieldConfirm', { name });
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteField(id);
      setSuccess(t('crops.fieldDeleted', { name }));
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  const filtered = crops.filter((c) => {
    if (filterSeason !== 'All' && c.season !== filterSeason) return false;
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold text-success mb-0">
            <i className="bi bi-flower2 me-2"></i>{t('cropLandManagement')}
          </h2>
          <small className="text-muted">
            {t('crops.cropsRecorded', { count: crops.length })} · {fields.length} {t('crops.registeredFields')}
          </small>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-success" 
            onClick={() => setShowFieldModal(true)}
          >
            <i className="bi bi-geo-alt me-1"></i>{t('manageFields')}
          </button>
          <button 
            className="btn btn-success" 
            onClick={openAdd}
            disabled={fields.length === 0}
            title={fields.length === 0 ? t('crops.registerFieldFirst') : ''}
          >
            <i className="bi bi-plus-lg me-1"></i>{t('addNewCrop')}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {fields.length === 0 && !loading && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <strong>{t('crops.noFieldsRegistered')}</strong>{' '}
            {t('crops.registerFieldFirst')}
          </div>
          <button 
            className="btn btn-warning btn-sm fw-semibold text-dark" 
            onClick={() => setShowFieldModal(true)}
          >
            <i className="bi bi-plus-lg me-1"></i>{t('crops.addFirstField')}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 d-flex gap-3 align-items-center flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 fw-semibold small">{t('filterBySeason')}</label>
            <select className="form-select form-select-sm" value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)}>
              <option value="All">{t('allSeasons')}</option>
              {['Kharif', 'Rabi', 'Zaid', 'Annual'].map((s) => <option key={s} value={s}>{t(`seasonLabels.${s}`, { defaultValue: s })}</option>)}
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 fw-semibold small">{t('filterByStatus')}</label>
            <select className="form-select form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">{t('allStatuses')}</option>
              {['Sown', 'Growing', 'Harvested', 'Closed'].map((s) => <option key={s} value={s}>{t(`cropStatuses.${s}`, { defaultValue: s })}</option>)}
            </select>
          </div>
          <span className="ms-auto text-muted small">{t('crops.cropsRecorded', { count: filtered.length })}</span>
        </div>
      </div>

      {/* Crops Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2 text-muted small">{t('loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-seedling fs-1 d-block mb-2"></i>
              <p className="mb-2">
                {crops.length === 0 
                  ? t('crops.noCropsLogged') 
                  : t('crops.noCropsMatch')}
              </p>
              {fields.length > 0 && crops.length === 0 && (
                <button className="btn btn-success btn-sm" onClick={openAdd}>
                  <i className="bi bi-plus-lg me-1"></i>{t('crops.addFirstCrop')}
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light small">
                  <tr>
                    <th>#</th>
                    <th>{t('cropName')}</th>
                    <th>{t('variety')}</th>
                    <th>{t('season')}</th>
                    <th>{t('fieldParcel')}</th>
                    <th>{t('sowingDate')}</th>
                    <th>{t('status')}</th>
                    <th className="text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((crop, idx) => (
                    <tr key={crop.id}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td className="fw-semibold text-dark">{crop.crop_name}</td>
                      <td>{crop.variety || <span className="text-muted">—</span>}</td>
                      <td><span className={`badge ${SEASON_BADGES[crop.season] || 'bg-secondary-subtle text-secondary'}`}>{t(`seasonLabels.${crop.season}`, { defaultValue: crop.season })}</span></td>
                      <td>
                        <i className="bi bi-geo-alt-fill text-muted me-1 small"></i>
                        {crop.field_name} <small className="text-muted">({crop.field_land_area} {t('acres')})</small>
                      </td>
                      <td className="small">{crop.sowing_date}</td>
                      <td><span className={`badge ${STATUS_BADGES[crop.status] || 'bg-secondary-subtle text-secondary'}`}>{t(`cropStatuses.${crop.status}`, { defaultValue: crop.status })}</span></td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(crop)} title={t('edit')}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm(crop)} title={t('delete')}>
                          <i className="bi bi-trash"></i>
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

      {/* Field Management Modal */}
      {showFieldModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-geo-alt me-2"></i>{t('manageFields')}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowFieldModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Add Field Sub-form */}
                <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                  <h6 className="fw-bold text-dark mb-3">
                    {t('crops.addNewLandParcel')}
                  </h6>
                  <form onSubmit={handleCreateField} className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">
                        {t('crops.fieldName')}
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={t('crops.fieldNamePlaceholder')}
                        value={fieldForm.field_name}
                        onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">
                        {t('crops.areaAcres')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        className="form-control form-control-sm"
                        placeholder="e.g. 2.5"
                        value={fieldForm.land_area}
                        onChange={(e) => setFieldForm({ ...fieldForm, land_area: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">
                        {t('soilType')}
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={fieldForm.soil_type}
                        onChange={(e) => setFieldForm({ ...fieldForm, soil_type: e.target.value })}
                      >
                        {SOIL_TYPES.map((st) => (
                          <option key={st} value={st}>{t('common.soilLabel', { type: st })}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button 
                        type="submit" 
                        className="btn btn-success btn-sm w-100" 
                        disabled={savingField}
                      >
                        {savingField ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-plus-lg me-1"></i>{t('save')}</>}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Existing Fields List */}
                <h6 className="fw-bold text-dark mb-2">
                  {t('crops.registeredFields')} ({fields.length})
                </h6>
                {fields.length === 0 ? (
                  <p className="text-muted small">
                    {t('crops.noFieldsAdded')}
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>{t('crops.fieldName')}</th>
                          <th>{t('crops.acreage')}</th>
                          <th>{t('soilType')}</th>
                          <th>{t('created')}</th>
                          <th className="text-center">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f) => (
                          <tr key={f.id}>
                            <td className="fw-semibold">{f.field_name}</td>
                            <td>{f.land_area} {t('acres')}</td>
                            <td><span className="badge bg-light text-dark border">{t('common.soilLabel', { type: f.soil_type })}</span></td>
                            <td className="small text-muted">{new Date(f.created_at).toLocaleDateString()}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-danger btn-sm py-0 px-2"
                                onClick={() => handleDeleteField(f.id, f.field_name)}
                                title={t('delete')}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowFieldModal(false)}>{t('close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Crop Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingCrop ? 'bi-pencil' : 'bi-plus-lg'} me-2`}></i>
                  {editingCrop ? t('editCrop') : t('addNewCrop')}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">{t('cropName')} *</label>
                      <input 
                        name="crop_name" 
                        value={form.crop_name} 
                        onChange={handleChange} 
                        className="form-control" 
                        placeholder={t('crops.cropNamePlaceholder')} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">{t('variety')}</label>
                      <input 
                        name="variety" 
                        value={form.variety} 
                        onChange={handleChange} 
                        className="form-control" 
                        placeholder="e.g. JS 335, Co 86032" 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">{t('season')} *</label>
                      <select name="season" value={form.season} onChange={handleChange} className="form-select" required>
                        {['Kharif', 'Rabi', 'Zaid', 'Annual'].map((s) => <option key={s} value={s}>{t(`seasonLabels.${s}`, { defaultValue: s })}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">{t('sowingDate')} *</label>
                      <input 
                        type="date" 
                        name="sowing_date" 
                        value={form.sowing_date} 
                        onChange={handleChange} 
                        className="form-control" 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">{t('fieldParcel')} *</label>
                      <select name="field" value={form.field} onChange={handleChange} className="form-select" required>
                        <option value="">{t('crops.selectField')}</option>
                        {fields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.field_name} ({f.land_area} {t('acres')} - {t('common.soilLabel', { type: f.soil_type })})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">{t('status')}</label>
                      <select name="status" value={form.status} onChange={handleChange} className="form-select">
                        {['Sown', 'Growing', 'Harvested', 'Closed'].map((s) => <option key={s} value={s}>{t(`cropStatuses.${s}`, { defaultValue: s })}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-success" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                    {editingCrop ? t('updateCrop') : t('saveCrop')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Crop Confirm Modal */}
      {deleteConfirm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h6 className="modal-title fw-bold"><i className="bi bi-exclamation-triangle me-2"></i>{t('confirmDelete')}</h6>
                <button className="btn-close btn-close-white" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-1">{t('crops.deleteCropConfirmText', { name: deleteConfirm.crop_name })}</p>
                <p className="text-muted small mb-0">
                  {t('crops.deleteCropWarning')}
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.crop_name)}>
                  <i className="bi bi-trash me-1"></i>{t('delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
