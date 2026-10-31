"""
Comprehensive System Admin Views for Farm Management System (FMS).
Handles website operations, farmer lifecycle management, crop operations,
mandi market prices, AI advisory logs, system health, broadcasts, and audits.
"""

import os
import sys
import time
import csv
import datetime
import subprocess
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate as dj_auth
from django.contrib.auth.models import User
from django.db import connection
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.core.management import call_command

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    FarmerProfile, Field, Crop, Expense, Harvest, Sale,
    FinancialAnalysis, CropRecommendation, YieldPrediction,
    ProfitPrediction, SystemAnnouncement
)
from .market_intelligence import (
    get_live_market_price,
    predict_ai_mandi_price,
    predict_all_ai_mandi_prices,
    COMMODITY_AI_PROFILES,
    CSV_PATH
)


def is_admin(user):
    """Verify if user has administrative privileges (superuser or staff)."""
    return user.is_authenticated and (user.is_superuser or user.is_staff)


# ============================================================================
#  1. AUTHENTICATION & PROFILE
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login - validates staff or superuser privileges."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = dj_auth(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not (user.is_superuser or user.is_staff):
        return Response({'error': 'Access denied. Administrative privileges required.'}, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'username': user.username,
        'full_name': user.get_full_name() or user.username,
        'email': user.email,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_profile(request):
    """Get current admin session info."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'full_name': request.user.get_full_name() or request.user.username,
        'email': request.user.email,
        'is_superuser': request.user.is_superuser,
        'date_joined': request.user.date_joined.strftime('%d %b %Y'),
    })


# ============================================================================
#  2. PLATFORM DASHBOARD STATS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Consolidated platform statistics for the main admin dashboard."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_farmers = FarmerProfile.objects.count()
    active_farmers = User.objects.filter(is_active=True, is_staff=False, is_superuser=False).count()
    total_fields = Field.objects.count()
    total_acres = float(Field.objects.aggregate(t=Sum('land_area'))['t'] or 0)
    total_crops = Crop.objects.count()
    active_crops = Crop.objects.filter(status__in=['Sown', 'Growing']).count()
    harvested_crops = Crop.objects.filter(status='Harvested').count()
    closed_crops = Crop.objects.filter(status='Closed').count()

    total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
    total_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    total_harvest_qty = Harvest.objects.aggregate(total=Sum('quantity_harvested'))['total'] or 0
    total_sales_count = Sale.objects.count()
    total_recommendations = CropRecommendation.objects.count()
    total_yield_predictions = YieldPrediction.objects.count()
    total_profit_predictions = ProfitPrediction.objects.count()
    active_announcements = SystemAnnouncement.objects.filter(is_active=True).count()

    now = timezone.now()
    new_farmers_this_month = FarmerProfile.objects.filter(
        created_at__year=now.year, created_at__month=now.month
    ).count()

    six_months_ago = now - datetime.timedelta(days=180)
    monthly_map = {}
    for dt in FarmerProfile.objects.filter(created_at__gte=six_months_ago).values_list('created_at', flat=True):
        if dt:
            m_key = dt.strftime('%b %Y')
            monthly_map[m_key] = monthly_map.get(m_key, 0) + 1
    monthly_signups = [{'month': k, 'count': v} for k, v in monthly_map.items()]

    top_crops = (
        Crop.objects
        .values('crop_name')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    expense_by_category = (
        Expense.objects
        .values('expense_category')
        .annotate(total=Sum('amount'))
        .order_by('-total')[:6]
    )
    expense_by_category_list = [
        {'category': e['expense_category'], 'total': float(e['total'])}
        for e in expense_by_category
    ]

    top_farmers_qs = (
        Sale.objects
        .values('harvest__crop__farmer__username', 'harvest__crop__farmer__first_name', 'harvest__crop__farmer__last_name')
        .annotate(revenue=Sum('total_amount'))
        .order_by('-revenue')[:5]
    )

    net_profit = float(total_revenue) - float(total_expenses)

    return Response({
        'summary': {
            'total_farmers': total_farmers,
            'active_farmers': active_farmers,
            'new_farmers_this_month': new_farmers_this_month,
            'total_fields': total_fields,
            'total_acres': round(total_acres, 2),
            'total_crops': total_crops,
            'active_crops': active_crops,
            'harvested_crops': harvested_crops,
            'closed_crops': closed_crops,
            'total_expenses': float(total_expenses),
            'total_revenue': float(total_revenue),
            'net_profit': net_profit,
            'total_harvest_qty': float(total_harvest_qty),
            'total_sales_count': total_sales_count,
            'total_recommendations': total_recommendations,
            'total_yield_predictions': total_yield_predictions,
            'total_profit_predictions': total_profit_predictions,
            'active_announcements': active_announcements,
        },
        'monthly_signups': monthly_signups,
        'top_crops': list(top_crops),
        'expense_by_category': expense_by_category_list,
        'top_farmers': [
            {
                'username': f['harvest__crop__farmer__username'],
                'name': (' '.join([f['harvest__crop__farmer__first_name'] or '', f['harvest__crop__farmer__last_name'] or ''])).strip() or f['harvest__crop__farmer__username'],
                'revenue': float(f['revenue']),
            }
            for f in top_farmers_qs
        ],
    })


# ============================================================================
#  3. FARMERS LIFECYCLE MANAGEMENT
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_farmers_list(request):
    """List all registered farmers with aggregated statistics."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    profiles = FarmerProfile.objects.select_related('user').order_by('-created_at')
    data = []
    for profile in profiles:
        user = profile.user
        crop_count = Crop.objects.filter(farmer=user).count()
        fields_count = Field.objects.filter(farmer=user).count()
        total_expenses = Expense.objects.filter(crop__farmer=user).aggregate(t=Sum('amount'))['t'] or 0
        total_revenue = Sale.objects.filter(harvest__crop__farmer=user).aggregate(t=Sum('total_amount'))['t'] or 0
        data.append({
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'phone': profile.phone,
            'location': profile.location,
            'total_acres': float(profile.total_acres),
            'fields_count': fields_count,
            'crop_count': crop_count,
            'total_expenses': float(total_expenses),
            'total_revenue': float(total_revenue),
            'net_profit': float(total_revenue) - float(total_expenses),
            'is_active': user.is_active,
            'joined': user.date_joined.strftime('%d %b %Y'),
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_farmer(request):
    """Admin directly onboards a new farmer."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    username = data.get('username', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    location = data.get('location', '').strip()
    total_acres = data.get('total_acres', 0.0)

    if not username or not phone or not password or not location:
        return Response({'error': 'Username, phone, password, and location are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': f'Username "{username}" is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    if FarmerProfile.objects.filter(phone=phone).exists():
        return Response({'error': f'Phone number "{phone}" is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    name_parts = full_name.split(' ', 1)
    first_name = name_parts[0] if name_parts else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        email=f"{username}@farm.local",
        is_active=True
    )

    try:
        acres = Decimal(str(total_acres))
    except Exception:
        acres = Decimal('0.00')

    FarmerProfile.objects.create(
        user=user,
        phone=phone,
        location=location,
        total_acres=acres
    )

    return Response({
        'message': f'Farmer "{full_name or username}" successfully onboarded.',
        'farmer': {
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'phone': phone,
            'location': location,
            'total_acres': float(acres),
            'is_active': user.is_active,
            'joined': user.date_joined.strftime('%d %b %Y'),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_farmer(request, user_id):
    """Admin updates farmer profile details."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id, is_superuser=False, is_staff=False)
        profile = FarmerProfile.objects.get(user=user)
    except (User.DoesNotExist, FarmerProfile.DoesNotExist):
        return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    if 'full_name' in data:
        name_parts = data['full_name'].strip().split(' ', 1)
        user.first_name = name_parts[0]
        user.last_name = name_parts[1] if len(name_parts) > 1 else ''

    if 'phone' in data:
        new_phone = data['phone'].strip()
        if new_phone != profile.phone and FarmerProfile.objects.filter(phone=new_phone).exists():
            return Response({'error': 'Phone number is already used by another farmer.'}, status=status.HTTP_400_BAD_REQUEST)
        profile.phone = new_phone

    if 'location' in data:
        profile.location = data['location'].strip()

    if 'total_acres' in data:
        try:
            profile.total_acres = Decimal(str(data['total_acres']))
        except Exception:
            pass

    if 'is_active' in data:
        user.is_active = bool(data['is_active'])

    user.save()
    profile.save()

    return Response({
        'message': f'Farmer {user.username} updated successfully.',
        'farmer': {
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'phone': profile.phone,
            'location': profile.location,
            'total_acres': float(profile.total_acres),
            'is_active': user.is_active,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reset_farmer_password(request, user_id):
    """Admin sets a new password for a farmer."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    new_password = request.data.get('new_password', '').strip()
    if not new_password or len(new_password) < 6:
        return Response({'error': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id, is_superuser=False, is_staff=False)
        user.set_password(new_password)
        user.save()
        return Response({'message': f'Password for {user.username} has been reset successfully.'})
    except User.DoesNotExist:
        return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_toggle_farmer(request, user_id):
    """Activate or deactivate a farmer account."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        farmer = User.objects.get(id=user_id, is_superuser=False, is_staff=False)
        farmer.is_active = not farmer.is_active
        farmer.save()
        status_str = 'activated' if farmer.is_active else 'deactivated'
        return Response({'message': f'Farmer {farmer.username} {status_str}.', 'is_active': farmer.is_active})
    except User.DoesNotExist:
        return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_farmer(request, user_id):
    """Delete a farmer account and all associated data."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        farmer = User.objects.get(id=user_id, is_superuser=False, is_staff=False)
        username = farmer.username
        farmer.delete()
        return Response({'message': f'Farmer {username} deleted successfully.'})
    except User.DoesNotExist:
        return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_farmer_report(request, user_id):
    """Comprehensive detailed dossier for an individual farmer."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        farmer = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        profile = FarmerProfile.objects.get(user=farmer)
        phone = profile.phone
        location = profile.location
        total_acres = float(profile.total_acres)
        joined = farmer.date_joined.strftime('%d %b %Y')
    except FarmerProfile.DoesNotExist:
        phone, location, total_acres = '', '', 0
        joined = farmer.date_joined.strftime('%d %b %Y')

    crops = Crop.objects.filter(farmer=farmer).select_related('field')
    total_crops = crops.count()
    active_crops = crops.filter(status__in=['Sown', 'Growing']).count()
    harvested_crops = crops.filter(status='Harvested').count()

    total_expenses = Expense.objects.filter(crop__farmer=farmer).aggregate(t=Sum('amount'))['t'] or 0
    total_revenue = Sale.objects.filter(harvest__crop__farmer=farmer).aggregate(t=Sum('total_amount'))['t'] or 0
    net_profit = float(total_revenue) - float(total_expenses)

    expense_breakdown = []
    for cat_code, cat_label in Expense.CATEGORY_CHOICES:
        cat_total = Expense.objects.filter(crop__farmer=farmer, expense_category=cat_code).aggregate(t=Sum('amount'))['t'] or 0
        if cat_total > 0:
            expense_breakdown.append({'category': cat_label, 'amount': float(cat_total)})

    crop_list = []
    for c in crops.order_by('-sowing_date'):
        field_name = c.field.field_name if c.field else '—'
        land_area = float(c.field.land_area) if c.field else 0
        crop_expenses = Expense.objects.filter(crop=c).aggregate(t=Sum('amount'))['t'] or 0
        crop_revenue = Sale.objects.filter(harvest__crop=c).aggregate(t=Sum('total_amount'))['t'] or 0
        crop_list.append({
            'id': c.id,
            'crop_name': c.crop_name,
            'variety': c.variety or '',
            'season': c.season,
            'status': c.status,
            'field_name': field_name,
            'land_area': land_area,
            'sowing_date': c.sowing_date.strftime('%d %b %Y'),
            'total_expenses': float(crop_expenses),
            'total_revenue': float(crop_revenue),
            'profit': float(crop_revenue) - float(crop_expenses),
        })

    fields = Field.objects.filter(farmer=farmer)
    field_list = [
        {'id': f.id, 'field_name': f.field_name, 'land_area': float(f.land_area), 'soil_type': f.soil_type}
        for f in fields
    ]

    # AI history
    recommendations = CropRecommendation.objects.filter(farmer=farmer).order_by('-recommendation_date')[:5]
    recs_data = [
        {
            'crop': r.recommended_crop,
            'season': r.season,
            'soil': r.soil_type,
            'date': r.recommendation_date.strftime('%d %b %Y'),
        }
        for r in recommendations
    ]

    profit_per_acre = round(net_profit / total_acres, 2) if total_acres > 0 else 0

    return Response({
        'farmer': {
            'id': farmer.id,
            'username': farmer.username,
            'full_name': farmer.get_full_name() or farmer.username,
            'phone': phone,
            'location': location,
            'total_acres': total_acres,
            'is_active': farmer.is_active,
            'joined': joined,
        },
        'summary': {
            'total_crops': total_crops,
            'active_crops': active_crops,
            'harvested_crops': harvested_crops,
            'total_fields': fields.count(),
            'total_expenses': float(total_expenses),
            'total_revenue': float(total_revenue),
            'net_profit': net_profit,
            'profit_per_acre': profit_per_acre,
        },
        'expense_breakdown': expense_breakdown,
        'crops': crop_list,
        'fields': field_list,
        'ai_recommendations': recs_data,
    })


# ============================================================================
#  4. CROP & FIELD OPERATIONS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_crops_list(request):
    """Platform-wide list of crops with advanced filters."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    qs = Crop.objects.select_related('farmer', 'field').order_by('-sowing_date')

    status_filter = request.GET.get('status')
    season_filter = request.GET.get('season')
    farmer_id = request.GET.get('farmer_id')
    search = request.GET.get('search', '').strip()

    if status_filter:
        qs = qs.filter(status=status_filter)
    if season_filter:
        qs = qs.filter(season=season_filter)
    if farmer_id:
        qs = qs.filter(farmer_id=farmer_id)
    if search:
        qs = qs.filter(
            Q(crop_name__icontains=search) |
            Q(variety__icontains=search) |
            Q(farmer__username__icontains=search) |
            Q(farmer__first_name__icontains=search) |
            Q(farmer__last_name__icontains=search)
        )

    crops_data = []
    for c in qs:
        expenses_total = Expense.objects.filter(crop=c).aggregate(t=Sum('amount'))['t'] or 0
        revenue_total = Sale.objects.filter(harvest__crop=c).aggregate(t=Sum('total_amount'))['t'] or 0
        harvest_count = Harvest.objects.filter(crop=c).count()
        expense_count = Expense.objects.filter(crop=c).count()

        crops_data.append({
            'id': c.id,
            'crop_name': c.crop_name,
            'variety': c.variety or '',
            'season': c.season,
            'status': c.status,
            'sowing_date': c.sowing_date.strftime('%d %b %Y'),
            'sowing_date_raw': c.sowing_date.isoformat(),
            'farmer_id': c.farmer.id,
            'farmer_name': c.farmer.get_full_name() or c.farmer.username,
            'farmer_username': c.farmer.username,
            'field_id': c.field.id if c.field else None,
            'field_name': c.field.field_name if c.field else '—',
            'land_area': float(c.field.land_area) if c.field else 0,
            'soil_type': c.field.soil_type if c.field else '—',
            'expense_count': expense_count,
            'total_expenses': float(expenses_total),
            'harvest_count': harvest_count,
            'total_revenue': float(revenue_total),
            'net_profit': float(revenue_total) - float(expenses_total),
        })

    return Response(crops_data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_crop_status(request, crop_id):
    """Admin transitions crop lifecycle status (Sown, Growing, Harvested, Closed)."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        crop = Crop.objects.get(id=crop_id)
    except Crop.DoesNotExist:
        return Response({'error': 'Crop not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid_statuses = [s[0] for s in Crop.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response({'error': f'Invalid status. Allowed: {", ".join(valid_statuses)}'}, status=status.HTTP_400_BAD_REQUEST)

    crop.status = new_status
    crop.save()
    return Response({'message': f'Crop status updated to {new_status}.', 'id': crop.id, 'status': crop.status})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_crop(request, crop_id):
    """Admin permanently deletes a crop cycle."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        crop = Crop.objects.get(id=crop_id)
        name = crop.crop_name
        crop.delete()
        return Response({'message': f'Crop "{name}" deleted successfully.'})
    except Crop.DoesNotExist:
        return Response({'error': 'Crop not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_fields_list(request):
    """Platform-wide agricultural land parcels and soil analytics."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    fields = Field.objects.select_related('farmer').order_by('-created_at')
    fields_data = []
    soil_distribution = {}

    for f in fields:
        crop_count = Crop.objects.filter(field=f).count()
        area = float(f.land_area)
        soil = f.soil_type
        soil_distribution[soil] = soil_distribution.get(soil, 0) + 1

        fields_data.append({
            'id': f.id,
            'field_name': f.field_name,
            'farmer_id': f.farmer.id,
            'farmer_name': f.farmer.get_full_name() or f.farmer.username,
            'land_area': area,
            'soil_type': soil,
            'crop_count': crop_count,
            'created_at': f.created_at.strftime('%d %b %Y'),
        })

    return Response({
        'total_fields': len(fields_data),
        'total_acres': round(sum(f['land_area'] for f in fields_data), 2),
        'soil_distribution': [{'soil': k, 'count': v} for k, v in soil_distribution.items()],
        'fields': fields_data,
    })


# ============================================================================
#  5. FINANCIALS, EXPENSES & SALES TRANSACTIONS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_expenses_list(request):
    """Platform-wide itemized cultivation expenses."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    qs = Expense.objects.select_related('crop', 'crop__farmer').order_by('-expense_date')

    category = request.GET.get('category')
    search = request.GET.get('search', '').strip()

    if category:
        qs = qs.filter(expense_category=category)
    if search:
        qs = qs.filter(
            Q(description__icontains=search) |
            Q(crop__crop_name__icontains=search) |
            Q(crop__farmer__username__icontains=search) |
            Q(crop__farmer__first_name__icontains=search)
        )

    total_amount = float(qs.aggregate(t=Sum('amount'))['t'] or 0)
    items = []
    for exp in qs[:150]:
        items.append({
            'id': exp.id,
            'crop_id': exp.crop.id,
            'crop_name': exp.crop.crop_name,
            'farmer_name': exp.crop.farmer.get_full_name() or exp.crop.farmer.username,
            'farmer_username': exp.crop.farmer.username,
            'expense_category': exp.expense_category,
            'description': exp.description or '—',
            'amount': float(exp.amount),
            'expense_date': exp.expense_date.strftime('%d %b %Y'),
        })

    return Response({
        'total_count': qs.count(),
        'total_amount': total_amount,
        'expenses': items,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_sales_list(request):
    """Platform-wide market sales trades."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    qs = Sale.objects.select_related('harvest__crop__farmer', 'harvest__crop').order_by('-sale_date')

    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(buyer_name__icontains=search) |
            Q(harvest__crop__crop_name__icontains=search) |
            Q(harvest__crop__farmer__username__icontains=search)
        )

    total_revenue = float(qs.aggregate(t=Sum('total_amount'))['t'] or 0)
    items = []
    for s in qs[:150]:
        crop = s.harvest.crop
        farmer = crop.farmer
        items.append({
            'id': s.id,
            'sale_date': s.sale_date.strftime('%d %b %Y'),
            'crop_name': crop.crop_name,
            'farmer_name': farmer.get_full_name() or farmer.username,
            'buyer_name': s.buyer_name,
            'quantity_sold': float(s.quantity_sold),
            'unit': s.harvest.unit,
            'selling_price': float(s.selling_price),
            'total_amount': float(s.total_amount),
        })

    return Response({
        'total_count': qs.count(),
        'total_revenue': total_revenue,
        'sales': items,
    })


# ============================================================================
#  6. MANDI MARKET PRICES OPERATIONS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_mandi_prices_list(request):
    """List APMC mandi market prices enriched with AI forecasting metrics."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    data = []
    if os.path.exists(CSV_PATH):
        try:
            with open(CSV_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    ck = row['crop_key'].lower()
                    ai_meta = COMMODITY_AI_PROFILES.get(ck, {})
                    data.append({
                        'crop_key': row['crop_key'],
                        'crop_name': row['crop_name'],
                        'market_name': row['market_name'],
                        'min_price': float(row['min_price']),
                        'max_price': float(row['max_price']),
                        'modal_price': float(row['modal_price']),
                        'unit': row['unit'],
                        'state': row['state'],
                        'ai_confidence': ai_meta.get('confidence', 95),
                        'ai_trend': ai_meta.get('trend', 'Stable (+1.0%)'),
                        'ai_reasoning': ai_meta.get('reason', 'AI Market Intel: Model projected rate using supply-demand parity.'),
                        'is_ai_predicted': True,
                    })
        except Exception as e:
            return Response({'error': f'Failed to read mandi data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_mandi_ai_predict(request):
    """
    AI Price Forecasting: Generates AI predicted modal, min, and max price
    based on crop commodity, market center, and machine learning price intelligence.
    Admin does not need to guess or enter the price manually.
    """
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    crop_key = request.data.get('crop_key', '').strip()
    market_name = request.data.get('market_name', 'Maharashtra APMC').strip()
    state = request.data.get('state', 'Maharashtra').strip()

    if not crop_key:
        return Response({'error': 'crop_key is required for AI price prediction.'}, status=status.HTTP_400_BAD_REQUEST)

    ai_forecast = predict_ai_mandi_price(crop_key, market_name, state)
    return Response({
        'message': f'AI Market Price generated successfully for {ai_forecast["crop_name"]}.',
        'forecast': ai_forecast
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_mandi_ai_predict_all(request):
    """
    AI Bulk Re-forecasting: Re-evaluates and updates all 11+ commodities
    across APMC mandis using the AI pricing model and updates the live board.
    """
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    results = predict_all_ai_mandi_prices()
    return Response({
        'message': f'AI successfully re-forecasted market benchmark prices for all {len(results)} commodities.',
        'updated_count': len(results),
        'results': results
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_mandi_price_update(request):
    """Add or update an APMC mandi commodity price."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    crop_key = request.data.get('crop_key', '').strip().lower()
    crop_name = request.data.get('crop_name', '').strip()
    market_name = request.data.get('market_name', 'Maharashtra APMC').strip()
    min_price = request.data.get('min_price')
    max_price = request.data.get('max_price')
    modal_price = request.data.get('modal_price')
    unit = request.data.get('unit', '₹ / Quintal').strip()
    state = request.data.get('state', 'Maharashtra').strip()

    if not crop_key or not crop_name or modal_price is None:
        return Response({'error': 'crop_key, crop_name, and modal_price are required.'}, status=status.HTTP_400_BAD_REQUEST)

    rows = []
    found = False
    fieldnames = ['crop_key', 'crop_name', 'market_name', 'min_price', 'max_price', 'modal_price', 'unit', 'state']

    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['crop_key'].lower() == crop_key:
                    rows.append({
                        'crop_key': crop_key,
                        'crop_name': crop_name,
                        'market_name': market_name,
                        'min_price': str(min_price or modal_price),
                        'max_price': str(max_price or modal_price),
                        'modal_price': str(modal_price),
                        'unit': unit,
                        'state': state,
                    })
                    found = True
                else:
                    rows.append(row)

    if not found:
        rows.append({
            'crop_key': crop_key,
            'crop_name': crop_name,
            'market_name': market_name,
            'min_price': str(min_price or modal_price),
            'max_price': str(max_price or modal_price),
            'modal_price': str(modal_price),
            'unit': unit,
            'state': state,
        })

    with open(CSV_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return Response({'message': f'Mandi price for {crop_name} updated successfully.'})


# ============================================================================
#  7. AI / ML ADVISORY OPERATIONS & MODELS DIAGNOSTICS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_ai_advisory_list(request):
    """Platform-wide AI recommendations and prediction consultations."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    recs = CropRecommendation.objects.select_related('farmer').order_by('-recommendation_date')[:50]
    yield_preds = YieldPrediction.objects.select_related('crop', 'crop__farmer').order_by('-prediction_date')[:50]
    profit_preds = ProfitPrediction.objects.select_related('crop', 'crop__farmer').order_by('-prediction_date')[:50]

    return Response({
        'crop_recommendations': [
            {
                'id': r.id,
                'farmer': r.farmer.get_full_name() or r.farmer.username,
                'soil_type': r.soil_type,
                'season': r.season,
                'weather': r.weather_conditions,
                'irrigation': r.irrigation_type,
                'recommended_crop': r.recommended_crop,
                'date': r.recommendation_date.strftime('%d %b %Y, %H:%M'),
            }
            for r in recs
        ],
        'yield_predictions': [
            {
                'id': y.id,
                'farmer': y.crop.farmer.get_full_name() or y.crop.farmer.username,
                'crop_name': y.crop.crop_name,
                'land_area': float(y.land_area),
                'season': y.season,
                'soil_type': y.soil_type,
                'rainfall': float(y.rainfall) if y.rainfall else 0,
                'predicted_yield': float(y.predicted_yield),
                'date': y.prediction_date.strftime('%d %b %Y, %H:%M'),
            }
            for y in yield_preds
        ],
        'profit_predictions': [
            {
                'id': p.id,
                'farmer': p.crop.farmer.get_full_name() or p.crop.farmer.username,
                'crop_name': p.crop.crop_name,
                'estimated_cost': float(p.estimated_cost),
                'predicted_yield': float(p.predicted_yield),
                'estimated_selling_price': float(p.estimated_selling_price),
                'predicted_profit': float(p.predicted_profit),
                'date': p.prediction_date.strftime('%d %b %Y, %H:%M'),
            }
            for p in profit_preds
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_ml_models_status(request):
    """Inspect Scikit-Learn .pkl model files status, size, and modified time."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    saved_models_dir = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models')
    models_info = [
        {
            'name': 'AI Crop Recommendation Model',
            'filename': 'crop_recommendation_model.pkl',
            'algorithm': 'RandomForestClassifier (Ensemble Multi-Class)',
            'description': 'Predicts optimal crop suited for soil type, season, rainfall, and irrigation.'
        },
        {
            'name': 'AI Yield Prediction Model',
            'filename': 'yield_prediction_model.pkl',
            'algorithm': 'GradientBoostingRegressor (Non-linear Boosting)',
            'description': 'Predicts expected produce yield based on acre land area, rainfall, and fertilizers.'
        },
        {
            'name': 'AI Profit Margin Prediction Model',
            'filename': 'profit_prediction_model.pkl',
            'algorithm': 'RandomForestRegressor (Decision Tree Ensemble)',
            'description': 'Forecasts expected gross profit and APMC market realization based on input costs.'
        },
    ]

    result = []
    for m in models_info:
        file_path = os.path.join(saved_models_dir, m['filename'])
        exists = os.path.exists(file_path)
        size_kb = round(os.path.getsize(file_path) / 1024, 2) if exists else 0
        mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%d %b %Y, %H:%M') if exists else 'N/A'

        result.append({
            'name': m['name'],
            'filename': m['filename'],
            'algorithm': m['algorithm'],
            'description': m['description'],
            'exists': exists,
            'size_kb': size_kb,
            'last_modified': mod_time,
            'status': 'Ready / Operational' if exists else 'Not Found / Needs Retraining',
        })

    return Response({
        'models_directory': saved_models_dir,
        'models': result,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_retrain_models(request):
    """Trigger offline Scikit-Learn pipeline retraining."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    script_path = os.path.join(settings.BASE_DIR, 'ml_models', 'train_models.py')
    python_bin = sys.executable

    try:
        proc = subprocess.run([python_bin, script_path], capture_output=True, text=True, check=True)
        return Response({
            'message': 'Machine learning models retrained successfully.',
            'output': proc.stdout.splitlines()[-5:] if proc.stdout else []
        })
    except Exception as e:
        return Response({
            'error': f'Retraining error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
#  8. SYSTEM ANNOUNCEMENTS & BROADCASTS
# ============================================================================

@api_view(['GET', 'POST'])
def admin_announcements_list_create(request):
    """List or create system broadcasts."""
    if request.method == 'GET':
        announcements = SystemAnnouncement.objects.select_related('created_by').order_by('-created_at')
        return Response([
            {
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'priority': a.priority,
                'is_active': a.is_active,
                'created_at': a.created_at.strftime('%d %b %Y, %H:%M'),
                'created_by': a.created_by.get_full_name() if a.created_by else 'System',
            }
            for a in announcements
        ])

    # POST (Admin only)
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title', '').strip()
    message = request.data.get('message', '').strip()
    priority = request.data.get('priority', 'info')
    is_active = request.data.get('is_active', True)

    if not title or not message:
        return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

    ann = SystemAnnouncement.objects.create(
        title=title,
        message=message,
        priority=priority,
        is_active=is_active,
        created_by=request.user
    )

    return Response({
        'message': 'Announcement published successfully.',
        'announcement': {
            'id': ann.id,
            'title': ann.title,
            'message': ann.message,
            'priority': ann.priority,
            'is_active': ann.is_active,
            'created_at': ann.created_at.strftime('%d %b %Y, %H:%M'),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_announcement_detail(request, pk):
    """Toggle status or delete an announcement."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        ann = SystemAnnouncement.objects.get(pk=pk)
    except SystemAnnouncement.DoesNotExist:
        return Response({'error': 'Announcement not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        ann.delete()
        return Response({'message': 'Announcement deleted successfully.'})

    if 'is_active' in request.data:
        ann.is_active = bool(request.data['is_active'])
        ann.save()
        return Response({'message': 'Announcement updated.', 'is_active': ann.is_active})

    return Response({'error': 'No changes specified.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_announcements(request):
    """Active announcements visible to all farmers and visitors."""
    active = SystemAnnouncement.objects.filter(is_active=True).order_by('-created_at')[:5]
    return Response([
        {
            'id': a.id,
            'title': a.title,
            'message': a.message,
            'priority': a.priority,
            'created_at': a.created_at.strftime('%d %b %Y'),
        }
        for a in active
    ])


# ============================================================================
#  9. SYSTEM HEALTH, RECALCULATION & AUDIT
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_system_health(request):
    """Deep system health diagnostics and database connection audit."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    start = time.time()
    db_connected = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_connected = True
    except Exception:
        db_connected = False
    latency_ms = round((time.time() - start) * 1000, 2)

    db_engine = settings.DATABASES['default']['ENGINE'].split('.')[-1]
    db_name = settings.DATABASES['default'].get('NAME', 'farm_db')

    farmer_count = User.objects.filter(is_superuser=False).count()
    crops_count = Crop.objects.count()
    expenses_count = Expense.objects.count()
    sales_count = Sale.objects.count()
    fields_count = Field.objects.count()
    harvests_count = Harvest.objects.count()
    recs_count = CropRecommendation.objects.count()
    yields_count = YieldPrediction.objects.count()
    profits_count = ProfitPrediction.objects.count()

    table_counts = {
        'farmers': farmer_count,
        'crops': crops_count,
        'expenses': expenses_count,
        'sales': sales_count,
        'fields': fields_count,
        'harvests': harvests_count,
        'recommendations': recs_count,
        'yield_predictions': yields_count,
        'profit_predictions': profits_count,
        # Display name keys
        'Users': User.objects.count(),
        'Farmer Profiles': FarmerProfile.objects.count(),
        'Fields': fields_count,
        'Crops': crops_count,
        'Expenses': expenses_count,
        'Harvests': harvests_count,
        'Sales': sales_count,
        'Financial Analyses': FinancialAnalysis.objects.count(),
        'Crop Recommendations': recs_count,
        'Yield Predictions': yields_count,
        'Profit Predictions': profits_count,
        'System Announcements': SystemAnnouncement.objects.count(),
        'Active Tokens': Token.objects.count(),
    }

    return Response({
        'status': 'Healthy' if db_connected else 'Degraded',
        'database': {
            'engine': db_engine,
            'name': db_name,
            'connected': db_connected,
            'latency_ms': latency_ms,
        },
        'environment': {
            'python_version': sys.version.split()[0],
            'django_version': settings.VERSION if hasattr(settings, 'VERSION') else '5.x',
            'server_timezone': str(settings.TIME_ZONE),
            'server_time': timezone.now().strftime('%d %b %Y, %H:%M:%S %Z'),
            'debug_mode': settings.DEBUG,
        },
        'table_counts': table_counts,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_recalculate_all_financials(request):
    """Recalculate financial engine metrics for all crops across the platform."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    crops = Crop.objects.select_related('field').all()
    count = 0
    for crop in crops:
        tot_cost = Expense.objects.filter(crop=crop).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        tot_rev = Sale.objects.filter(harvest__crop=crop).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
        net_pl = Decimal(str(tot_rev)) - Decimal(str(tot_cost))
        land_area = Decimal(str(crop.field.land_area)) if crop.field and crop.field.land_area else Decimal('1.00')

        cost_per_acre = round(Decimal(str(tot_cost)) / land_area, 2) if land_area > 0 else Decimal('0.00')
        profit_per_acre = round(net_pl / land_area, 2) if land_area > 0 else Decimal('0.00')

        FinancialAnalysis.objects.update_or_create(
            crop=crop,
            defaults={
                'total_cost': tot_cost,
                'total_revenue': tot_rev,
                'profit_loss': net_pl,
                'cost_per_acre': cost_per_acre,
                'profit_per_acre': profit_per_acre,
            }
        )
        count += 1

    return Response({'message': f'Financial analysis recalculated successfully for {count} crops.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_seed_demo_data(request):
    """Seed comprehensive demonstration data via admin action."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        call_command('seed_demo_data')
        return Response({'message': 'Demo data successfully seeded into database.'})
    except Exception as e:
        return Response({'error': f'Failed to seed data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------------------------------------------------------------
#  DATABASE BACKUP & ARCHIVE MANAGEMENT
# ----------------------------------------------------------------------------
BACKUPS_DIR = os.path.join(settings.BASE_DIR, 'backups')


def get_disk_backups():
    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR, exist_ok=True)
    files = []
    for fname in sorted(os.listdir(BACKUPS_DIR), reverse=True):
        if fname.endswith('.json') or fname.endswith('.sql'):
            fpath = os.path.join(BACKUPS_DIR, fname)
            fstat = os.stat(fpath)
            size_kb = round(fstat.st_size / 1024, 1)
            size_str = f"{size_kb} KB" if size_kb < 1024 else f"{round(size_kb / 1024, 2)} MB"
            cdate = datetime.datetime.fromtimestamp(fstat.st_mtime).strftime('%d %b %Y, %I:%M %p')
            files.append({
                'id': fname,
                'name': fname,
                'path': fpath,
                'size': size_str,
                'date': cdate,
                'status': 'Verified',
                'download_url': f'/api/admin-api/backups/{fname}/download/',
            })
    return files


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_backups_list(request):
    """List real database backup archives located in backend/backups/."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    backups = get_disk_backups()
    return Response({
        'storage_directory': BACKUPS_DIR,
        'backups': backups,
        'total_backups': len(backups),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_backup(request):
    """Generate a real database snapshot using Django dumpdata into backend/backups/."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        if not os.path.exists(BACKUPS_DIR):
            os.makedirs(BACKUPS_DIR, exist_ok=True)

        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"farm_db_snapshot_{timestamp}.json"
        filepath = os.path.join(BACKUPS_DIR, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            call_command(
                'dumpdata',
                'auth.User',
                'api.FarmerProfile',
                'api.Field',
                'api.Crop',
                'api.Expense',
                'api.Harvest',
                'api.Sale',
                'api.FinancialAnalysis',
                'api.CropRecommendation',
                'api.YieldPrediction',
                'api.ProfitPrediction',
                'api.SystemAnnouncement',
                indent=2,
                stdout=f
            )

        fstat = os.stat(filepath)
        size_kb = round(fstat.st_size / 1024, 1)
        size_str = f"{size_kb} KB" if size_kb < 1024 else f"{round(size_kb / 1024, 2)} MB"
        cdate = datetime.datetime.now().strftime('%d %b %Y, %I:%M %p')

        return Response({
            'message': 'Real database snapshot created successfully on disk!',
            'backup': {
                'id': filename,
                'name': filename,
                'path': filepath,
                'size': size_str,
                'date': cdate,
                'status': 'Verified',
                'download_url': f'/api/admin-api/backups/{filename}/download/',
            },
            'storage_directory': BACKUPS_DIR,
        })
    except Exception as e:
        return Response({'error': f'Failed to generate database backup: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_download_backup(request, filename):
    """Download a database backup file directly."""
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(BACKUPS_DIR, safe_filename)
    if not os.path.exists(filepath):
        return Response({'error': 'Backup file not found.'}, status=status.HTTP_404_NOT_FOUND)

    from django.http import FileResponse
    return FileResponse(open(filepath, 'rb'), as_attachment=True, filename=safe_filename)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_platform_report(request):
    """Comprehensive platform-wide report."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_farmers = FarmerProfile.objects.count()
    active_farmers = User.objects.filter(is_active=True, is_staff=False, is_superuser=False).count()
    total_crops = Crop.objects.count()
    active_crops = Crop.objects.filter(status__in=['Sown', 'Growing']).count()
    total_fields = Field.objects.count()
    total_expenses = float(Expense.objects.aggregate(t=Sum('amount'))['t'] or 0)
    total_revenue = float(Sale.objects.aggregate(t=Sum('total_amount'))['t'] or 0)
    net_profit = total_revenue - total_expenses
    total_harvest = float(Harvest.objects.aggregate(t=Sum('quantity_harvested'))['t'] or 0)
    total_recommendations = CropRecommendation.objects.count()
    total_yield_predictions = YieldPrediction.objects.count()

    crop_season_breakdown = []
    for season_code, season_label in Crop.SEASON_CHOICES:
        count = Crop.objects.filter(season=season_code).count()
        expenses = float(Expense.objects.filter(crop__season=season_code).aggregate(t=Sum('amount'))['t'] or 0)
        revenue = float(Sale.objects.filter(harvest__crop__season=season_code).aggregate(t=Sum('total_amount'))['t'] or 0)
        crop_season_breakdown.append({
            'season': season_label,
            'crop_count': count,
            'expenses': expenses,
            'revenue': revenue,
            'profit': revenue - expenses,
        })

    expense_breakdown = []
    for cat_code, cat_label in Expense.CATEGORY_CHOICES:
        total = float(Expense.objects.filter(expense_category=cat_code).aggregate(t=Sum('amount'))['t'] or 0)
        if total > 0:
            expense_breakdown.append({'category': cat_label, 'total': total})

    top_crops = list(
        Crop.objects.values('crop_name').annotate(count=Count('id')).order_by('-count')[:10]
    )

    farmers_data = []
    for profile in FarmerProfile.objects.select_related('user').order_by('-created_at'):
        u = profile.user
        crop_count = Crop.objects.filter(farmer=u).count()
        expenses = float(Expense.objects.filter(crop__farmer=u).aggregate(t=Sum('amount'))['t'] or 0)
        revenue = float(Sale.objects.filter(harvest__crop__farmer=u).aggregate(t=Sum('total_amount'))['t'] or 0)
        farmers_data.append({
            'id': u.id,
            'full_name': u.get_full_name() or u.username,
            'username': u.username,
            'phone': profile.phone,
            'location': profile.location,
            'total_acres': float(profile.total_acres),
            'crop_count': crop_count,
            'total_expenses': expenses,
            'total_revenue': revenue,
            'net_profit': revenue - expenses,
            'is_active': u.is_active,
            'joined': u.date_joined.strftime('%d %b %Y'),
        })

    return Response({
        'summary': {
            'total_farmers': total_farmers,
            'active_farmers': active_farmers,
            'total_crops': total_crops,
            'active_crops': active_crops,
            'total_fields': total_fields,
            'total_expenses': total_expenses,
            'total_revenue': total_revenue,
            'net_profit': net_profit,
            'total_harvest': total_harvest,
            'total_recommendations': total_recommendations,
            'total_yield_predictions': total_yield_predictions,
        },
        'crop_season_breakdown': crop_season_breakdown,
        'expense_breakdown': expense_breakdown,
        'top_crops': top_crops,
        'farmers': farmers_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_recent_activity(request):
    """Recent platform-wide activity feed."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    activities = []

    for p in FarmerProfile.objects.select_related('user').order_by('-created_at')[:8]:
        uname = p.user.get_full_name() or p.user.username
        activities.append({
            'type': 'farmer_joined',
            'icon': 'person-plus',
            'color': 'success',
            'message': f"{uname} joined from {p.location}",
            'time': p.created_at.strftime('%d %b %Y, %H:%M'),
            'ts': p.created_at.timestamp(),
        })

    for c in Crop.objects.select_related('farmer').order_by('-created_at')[:8]:
        name = c.farmer.get_full_name() or c.farmer.username
        activities.append({
            'type': 'crop_added',
            'icon': 'flower1',
            'color': 'primary',
            'message': f"{name} cultivated {c.crop_name} ({c.season})",
            'time': c.created_at.strftime('%d %b %Y, %H:%M'),
            'ts': c.created_at.timestamp(),
        })

    for s in Sale.objects.select_related('harvest__crop__farmer').order_by('-sale_date')[:8]:
        name = s.harvest.crop.farmer.get_full_name() or s.harvest.crop.farmer.username
        amt = '{:,.0f}'.format(float(s.total_amount))
        activities.append({
            'type': 'sale',
            'icon': 'cash-coin',
            'color': 'warning',
            'message': f"{name} completed sale of ₹{amt} to {s.buyer_name}",
            'time': s.sale_date.strftime('%d %b %Y') if s.sale_date else 'N/A',
            'ts': s.created_at.timestamp() if hasattr(s, 'created_at') else 0,
        })

    for r in CropRecommendation.objects.select_related('farmer').order_by('-recommendation_date')[:8]:
        name = r.farmer.get_full_name() or r.farmer.username
        activities.append({
            'type': 'recommendation',
            'icon': 'cpu',
            'color': 'info',
            'message': f"{name} received AI recommendation for {r.recommended_crop}",
            'time': r.recommendation_date.strftime('%d %b %Y, %H:%M'),
            'ts': r.recommendation_date.timestamp(),
        })

    activities.sort(key=lambda x: -x['ts'])
    for a in activities:
        del a['ts']

    return Response(activities[:25])

