import React, { useState, useEffect, useCallback } from 'react';
import { fetchExpenses, fetchSales } from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AdminFinancialsPage() {
  const [activeTab, setActiveTab] = useState('EXPENSES'); // 'EXPENSES' | 'SALES'

  // Expenses State
  const [expensesData, setExpensesData] = useState({ expenses: [], total_amount: 0, total_count: 0 });
  const [expenseFilterCat, setExpenseFilterCat] = useState('ALL');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Sales State
  const [salesData, setSalesData] = useState({ sales: [], total_revenue: 0, total_count: 0 });
  const [salesSearch, setSalesSearch] = useState('');
  const [salesLoading, setSalesLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const params = {};
      if (expenseFilterCat !== 'ALL') params.category = expenseFilterCat;
      if (expenseSearch) params.search = expenseSearch;
      const res = await fetchExpenses(params);
      setExpensesData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setExpensesLoading(false);
    }
  }, [expenseFilterCat, expenseSearch]);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const params = {};
      if (salesSearch) params.search = salesSearch;
      const res = await fetchSales(params);
      setSalesData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSalesLoading(false);
    }
  }, [salesSearch]);

  useEffect(() => {
    if (activeTab === 'EXPENSES') loadExpenses();
    else loadSales();
  }, [activeTab, loadExpenses, loadSales]);

  function exportExpensesCSV() {
    const headers = ['ID', 'Crop Name', 'Farmer', 'Category', 'Description', 'Amount (INR)', 'Date'];
    const rows = (expensesData.expenses || []).map((e) => [
      e.id,
      `"${e.crop_name}"`,
      `"${e.farmer_name}"`,
      `"${e.expense_category}"`,
      `"${e.description}"`,
      e.amount,
      e.expense_date,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `platform_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportSalesCSV() {
    const headers = ['ID', 'Date', 'Crop Name', 'Farmer', 'Buyer Name', 'Quantity Sold', 'Unit', 'Price per Unit', 'Total Amount (INR)'];
    const rows = (salesData.sales || []).map((s) => [
      s.id,
      s.sale_date,
      `"${s.crop_name}"`,
      `"${s.farmer_name}"`,
      `"${s.buyer_name}"`,
      s.quantity_sold,
      s.unit,
      s.selling_price,
      s.total_amount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `platform_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const EXPENSE_CATEGORIES = [
    'ALL',
    'Seeds',
    'Labour',
    'Fertilizers',
    'Pesticides',
    'Irrigation',
    'Machinery',
    'Transportation',
    'Other',
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-cash-stack me-2 text-success"></i>Financials & Transactions Center
          </h4>
          <small className="text-muted">
            Audit itemized farming input costs and market produce trade transactions
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {activeTab === 'EXPENSES' ? (
            <button className="btn btn-outline-secondary btn-sm" onClick={exportExpensesCSV}>
              <i className="bi bi-file-earmark-arrow-down me-1"></i>Export Expenses
            </button>
          ) : (
            <button className="btn btn-outline-secondary btn-sm" onClick={exportSalesCSV}>
              <i className="bi bi-file-earmark-arrow-down me-1"></i>Export Sales
            </button>
          )}

          <button
            className="btn btn-outline-success btn-sm"
            onClick={activeTab === 'EXPENSES' ? loadExpenses : loadSales}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* Primary Tab Selector */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-2">
          <ul className="nav nav-pills nav-fill gap-2">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold py-2 ${
                  activeTab === 'EXPENSES' ? 'bg-danger text-white' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('EXPENSES')}
              >
                <i className="bi bi-receipt me-2"></i>Cultivation Expenses Audit
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold py-2 ${
                  activeTab === 'SALES' ? 'bg-success text-white' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('SALES')}
              >
                <i className="bi bi-cart-check-fill me-2"></i>Produce Sales & Trades
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ── EXPENSES TAB CONTENT ────────────────────────────────────────── */}
      {activeTab === 'EXPENSES' && (
        <div>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <div className="text-muted small">Total Input Expenditure</div>
                <div className="fw-bold fs-3 text-danger">{fmtINR(expensesData.total_amount)}</div>
                <small className="text-muted">Across all farmers & crops</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <div className="text-muted small">Recorded Entries</div>
                <div className="fw-bold fs-3 text-dark">{expensesData.total_count}</div>
                <small className="text-muted">Itemized expenditure logs</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <div className="text-muted small">Average Entry Value</div>
                <div className="fw-bold fs-3 text-primary">
                  {expensesData.total_count > 0
                    ? fmtINR(expensesData.total_amount / expensesData.total_count)
                    : '₹0'}
                </div>
                <small className="text-muted">Per logged transaction</small>
              </div>
            </div>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex flex-wrap gap-1">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`btn btn-sm ${
                      expenseFilterCat === cat ? 'btn-danger' : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: 12 }}
                    onClick={() => setExpenseFilterCat(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="input-group" style={{ maxWidth: 280 }}>
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0"
                  placeholder="Search description, crop, farmer..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {expensesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger"></div>
                  <div className="mt-2 text-muted small">Loading expenses...</div>
                </div>
              ) : (expensesData.expenses || []).length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-receipt fs-1 d-block mb-2 text-secondary"></i>
                  No expense records found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Crop</th>
                        <th>Farmer</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-end">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesData.expenses.map((e) => (
                        <tr key={e.id}>
                          <td className="text-muted">{e.expense_date}</td>
                          <td className="fw-semibold text-dark">{e.crop_name}</td>
                          <td>
                            <div>{e.farmer_name}</div>
                            <small className="text-muted">@{e.farmer_username}</small>
                          </td>
                          <td>
                            <span className="badge bg-danger-subtle text-danger px-2 py-1">
                              {e.expense_category}
                            </span>
                          </td>
                          <td className="text-muted">{e.description}</td>
                          <td className="text-end fw-bold text-danger">{fmtINR(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {expensesData.total_count > 0 && (
              <div className="card-footer bg-white text-muted small py-2 d-flex justify-content-between">
                <span>Total Filtered: {expensesData.expenses.length} records</span>
                <span className="fw-semibold text-danger">
                  Total: {fmtINR(expensesData.total_amount)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SALES TAB CONTENT ───────────────────────────────────────────── */}
      {activeTab === 'SALES' && (
        <div>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <div className="text-muted small">Total Produce Sales</div>
                <div className="fw-bold fs-3 text-success">{fmtINR(salesData.total_revenue)}</div>
                <small className="text-muted">Realized market turnover</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <div className="text-muted small">Trade Transactions</div>
                <div className="fw-bold fs-3 text-dark">{salesData.total_count}</div>
                <small className="text-muted">Recorded trade receipts</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-3">
                <div className="text-muted small">Avg. Transaction Value</div>
                <div className="fw-bold fs-3 text-primary">
                  {salesData.total_count > 0
                    ? fmtINR(salesData.total_revenue / salesData.total_count)
                    : '₹0'}
                </div>
                <small className="text-muted">Per market sale</small>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center">
              <span className="small text-muted fw-semibold">
                Showing {salesData.sales?.length || 0} trade records
              </span>
              <div className="input-group" style={{ maxWidth: 300 }}>
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0"
                  placeholder="Search buyer, crop, farmer..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {salesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success"></div>
                  <div className="mt-2 text-muted small">Loading sales transactions...</div>
                </div>
              ) : (salesData.sales || []).length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-cart-x fs-1 d-block mb-2 text-secondary"></i>
                  No sales transactions logged.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Crop</th>
                        <th>Farmer</th>
                        <th>Buyer / Merchant / APMC</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Rate / Unit</th>
                        <th className="text-end">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.sales.map((s) => (
                        <tr key={s.id}>
                          <td className="text-muted">{s.sale_date}</td>
                          <td className="fw-semibold text-dark">{s.crop_name}</td>
                          <td>{s.farmer_name}</td>
                          <td>
                            <i className="bi bi-shop me-1 text-primary"></i>
                            <strong>{s.buyer_name}</strong>
                          </td>
                          <td className="text-center fw-semibold">
                            {s.quantity_sold} {s.unit}
                          </td>
                          <td className="text-end text-muted">₹{s.selling_price}</td>
                          <td className="text-end fw-bold text-success">{fmtINR(s.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {salesData.total_count > 0 && (
              <div className="card-footer bg-white text-muted small py-2 d-flex justify-content-between">
                <span>Total Filtered: {salesData.sales.length} transactions</span>
                <span className="fw-semibold text-success">
                  Total Turnover: {fmtINR(salesData.total_revenue)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
