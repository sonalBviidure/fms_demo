from django.urls import path
from .views import (
    # Auth
    api_status,
    register_farmer,
    login_farmer,
    farmer_profile,
    logout_farmer,

    # Fields & Crops
    field_list_create,
    field_detail,
    crop_list_create,
    crop_detail,

    # Expenses
    expense_list_create,
    expense_detail,

    # Harvest & Sales
    harvest_list_create,
    harvest_detail,
    sale_list_create,
    sale_detail,

    # Financial Analysis
    financial_analysis_list,
    financial_analysis_for_crop,

    # Reports / Dashboard
    dashboard_summary,
    crop_comparison_report,

    # AI Modules
    crop_recommendation,
    yield_prediction,
    profit_prediction,
    crop_field_intelligence,
    current_market_prices,
)
from . import admin_views

urlpatterns = [
    # Health Check
    path('status/', api_status, name='api-status'),

    # Auth
    path('auth/register/', register_farmer, name='auth-register'),
    path('auth/login/', login_farmer, name='auth-login'),
    path('auth/profile/', farmer_profile, name='auth-profile'),
    path('auth/logout/', logout_farmer, name='auth-logout'),

    # Public Announcements for Farmers
    path('announcements/', admin_views.public_announcements, name='public-announcements'),

    # Fields
    path('fields/', field_list_create, name='field-list-create'),
    path('fields/<int:pk>/', field_detail, name='field-detail'),

    # Crops
    path('crops/', crop_list_create, name='crop-list-create'),
    path('crops/<int:pk>/', crop_detail, name='crop-detail'),

    # Expenses
    path('expenses/', expense_list_create, name='expense-list-create'),
    path('expenses/<int:pk>/', expense_detail, name='expense-detail'),

    # Harvests
    path('harvests/', harvest_list_create, name='harvest-list-create'),
    path('harvests/<int:pk>/', harvest_detail, name='harvest-detail'),

    # Sales
    path('sales/', sale_list_create, name='sale-list-create'),
    path('sales/<int:pk>/', sale_detail, name='sale-detail'),

    # Financial Analysis
    path('financial/', financial_analysis_list, name='financial-list'),
    path('financial/crop/<int:crop_id>/', financial_analysis_for_crop, name='financial-crop'),

    # Reports / Dashboard
    path('reports/dashboard/', dashboard_summary, name='dashboard-summary'),
    path('reports/crop-comparison/', crop_comparison_report, name='crop-comparison'),

    # AI & Advisory Modules
    path('ai/crop-recommendation/', crop_recommendation, name='ai-crop-rec'),
    path('ai/yield-prediction/', yield_prediction, name='ai-yield-pred'),
    path('ai/profit-prediction/', profit_prediction, name='ai-profit-pred'),
    path('ai/crop-intelligence/<int:crop_id>/', crop_field_intelligence, name='ai-crop-intelligence'),
    path('ai/market-prices/', current_market_prices, name='ai-market-prices'),

    # ============================================================================
    #  SYSTEM ADMIN API — WEBSITE OPERATIONS & FARMERS MANAGEMENT
    # ============================================================================
    # Auth & Profile
    path('admin-api/login/', admin_views.admin_login, name='admin-login'),
    path('admin-api/profile/', admin_views.admin_profile, name='admin-profile'),

    # Dashboard & Global Stats
    path('admin-api/stats/', admin_views.admin_dashboard_stats, name='admin-stats'),
    path('admin-api/activity/', admin_views.admin_recent_activity, name='admin-activity'),
    path('admin-api/report/', admin_views.admin_platform_report, name='admin-platform-report'),

    # Farmer Management
    path('admin-api/farmers/', admin_views.admin_farmers_list, name='admin-farmers'),
    path('admin-api/farmers/create/', admin_views.admin_create_farmer, name='admin-create-farmer'),
    path('admin-api/farmers/<int:user_id>/update/', admin_views.admin_update_farmer, name='admin-update-farmer'),
    path('admin-api/farmers/<int:user_id>/reset-password/', admin_views.admin_reset_farmer_password, name='admin-reset-password'),
    path('admin-api/farmers/<int:user_id>/toggle/', admin_views.admin_toggle_farmer, name='admin-toggle-farmer'),
    path('admin-api/farmers/<int:user_id>/delete/', admin_views.admin_delete_farmer, name='admin-delete-farmer'),
    path('admin-api/farmers/<int:user_id>/report/', admin_views.admin_farmer_report, name='admin-farmer-report'),

    # Crop & Field Operations
    path('admin-api/crops/', admin_views.admin_crops_list, name='admin-crops'),
    path('admin-api/crops/<int:crop_id>/status/', admin_views.admin_update_crop_status, name='admin-crop-status'),
    path('admin-api/crops/<int:crop_id>/delete/', admin_views.admin_delete_crop, name='admin-crop-delete'),
    path('admin-api/fields/', admin_views.admin_fields_list, name='admin-fields'),

    # Financials, Expenses & Sales
    path('admin-api/expenses/', admin_views.admin_expenses_list, name='admin-expenses'),
    path('admin-api/sales/', admin_views.admin_sales_list, name='admin-sales'),

    # Mandi Market Prices Operations
    path('admin-api/mandi-prices/', admin_views.admin_mandi_prices_list, name='admin-mandi-prices'),
    path('admin-api/mandi-prices/update/', admin_views.admin_mandi_price_update, name='admin-mandi-update'),
    path('admin-api/mandi-prices/ai-predict/', admin_views.admin_mandi_ai_predict, name='admin-mandi-ai-predict'),
    path('admin-api/mandi-prices/ai-predict-all/', admin_views.admin_mandi_ai_predict_all, name='admin-mandi-ai-predict-all'),

    # AI Advisory Operations & Model Diagnostics
    path('admin-api/ai-advisory/', admin_views.admin_ai_advisory_list, name='admin-ai-advisory'),
    path('admin-api/ml-models-status/', admin_views.admin_ml_models_status, name='admin-ml-models-status'),
    path('admin-api/retrain-models/', admin_views.admin_retrain_models, name='admin-retrain-models'),

    # Broadcast Announcements
    path('admin-api/announcements/', admin_views.admin_announcements_list_create, name='admin-announcements'),
    path('admin-api/announcements/<int:pk>/', admin_views.admin_announcement_detail, name='admin-announcement-detail'),

    # System Health, Recalculation & Tools
    path('admin-api/system-health/', admin_views.admin_system_health, name='admin-system-health'),
    path('admin-api/recalculate-all/', admin_views.admin_recalculate_all_financials, name='admin-recalculate-financials'),
    path('admin-api/seed-demo-data/', admin_views.admin_seed_demo_data, name='admin-seed-demo-data'),

    # Real Database Backup & File Download
    path('admin-api/backups/', admin_views.admin_backups_list, name='admin-backups-list'),
    path('admin-api/backups/create/', admin_views.admin_create_backup, name='admin-create-backup'),
    path('admin-api/backups/<str:filename>/download/', admin_views.admin_download_backup, name='admin-download-backup'),
]
