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

    # System Admin API
    admin_login,
    admin_dashboard_stats,
    admin_farmers_list,
    admin_toggle_farmer,
    admin_delete_farmer,
    admin_recent_activity,
    admin_farmer_report,
    admin_platform_report,
)

urlpatterns = [
    # Health Check
    path('status/', api_status, name='api-status'),

    # Auth
    path('auth/register/', register_farmer, name='auth-register'),
    path('auth/login/', login_farmer, name='auth-login'),
    path('auth/profile/', farmer_profile, name='auth-profile'),
    path('auth/logout/', logout_farmer, name='auth-logout'),

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

    # System Admin API
    path('admin-api/login/', admin_login, name='admin-login'),
    path('admin-api/stats/', admin_dashboard_stats, name='admin-stats'),
    path('admin-api/farmers/', admin_farmers_list, name='admin-farmers'),
    path('admin-api/farmers/<int:user_id>/toggle/', admin_toggle_farmer, name='admin-toggle-farmer'),
    path('admin-api/farmers/<int:user_id>/delete/', admin_delete_farmer, name='admin-delete-farmer'),
    path('admin-api/activity/', admin_recent_activity, name='admin-activity'),
    path('admin-api/farmers/<int:user_id>/report/', admin_farmer_report, name='admin-farmer-report'),
    path('admin-api/report/', admin_platform_report, name='admin-platform-report'),
]
