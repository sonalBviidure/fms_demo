"""
FMS API Views — Farm Management System
---------------------------------------
Phase 2  (Auth)           — 
Phase 6  (Financial)      — 
Phase 7  (Reports)        — 
Phase 8b (AI Crop Rec)    — 
Phase 8c (AI Profit Pred) — 

Phase 3  (Crops)          — 
Phase 4  (Expenses)       — 
Phase 5  (Harvest/Sales)  — 
Phase 8a (AI Yield Pred)  — 
"""

import os
from decimal import Decimal
import joblib
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count, Q

# Load trained Scikit-Learn pipelines
ML_MODELS_DIR = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models')
try:
    CROP_REC_MODEL = joblib.load(os.path.join(ML_MODELS_DIR, 'crop_recommendation_model.pkl'))
except Exception:
    CROP_REC_MODEL = None

try:
    YIELD_PRED_MODEL = joblib.load(os.path.join(ML_MODELS_DIR, 'yield_prediction_model.pkl'))
except Exception:
    YIELD_PRED_MODEL = None

try:
    PROFIT_PRED_MODEL = joblib.load(os.path.join(ML_MODELS_DIR, 'profit_prediction_model.pkl'))
except Exception:
    PROFIT_PRED_MODEL = None


from .market_intelligence import get_crop_field_intelligence, get_live_market_price
from .models import (
    FarmerProfile, Field, Crop, Expense, Harvest, Sale,
    FinancialAnalysis, CropRecommendation, YieldPrediction, ProfitPrediction
)
from .serializers import (
    UserRegistrationSerializer,
    FarmerUserSerializer,
    LoginSerializer,
    FieldSerializer,
    CropSerializer,
    ExpenseSerializer,
    HarvestSerializer,
    SaleSerializer,
    FinancialAnalysisSerializer,
    CropRecommendationSerializer,
    YieldPredictionSerializer,
    ProfitPredictionSerializer,
)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 2 — AUTH VIEWS  ()
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def api_status(request):
    """Health check and module status endpoint."""
    db_engine = settings.DATABASES['default']['ENGINE'].split('.')[-1]

    return Response({
        'status': 'online',
        'project': 'Farm Management System (FMS)',
        'version': '3.0.0 (Operational)',
        'services': 'Operational',
        'database': {
            'engine': db_engine,
            'configured_for_mysql': settings.USE_MYSQL,
        },
        'server_time': timezone.now().isoformat(),
        'message': 'FMS Backend API — All modules operational.'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_farmer(request):
    """Register a new farmer account with agricultural profile details."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        user_data = FarmerUserSerializer(user).data
        return Response({
            'message': 'Farmer registered successfully',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_201_CREATED)

    return Response({
        'message': 'Validation failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_farmer(request):
    """Authenticate a farmer using phone number (or username) and password."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'message': 'Invalid input',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    identifier = serializer.validated_data['username'].strip()
    password = serializer.validated_data['password']

    target_username = identifier
    if not User.objects.filter(username=identifier).exists():
        profile = FarmerProfile.objects.filter(phone=identifier).first()
        if profile:
            target_username = profile.user.username

    user = authenticate(username=target_username, password=password)

    if not user:
        return Response({
            'message': 'Invalid phone number/username or password.',
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({
            'message': 'Account is inactive.',
        }, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)
    user_data = FarmerUserSerializer(user).data

    return Response({
        'message': 'Login successful',
        'token': token.key,
        'user': user_data
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def farmer_profile(request):
    """Retrieve or update profile of the currently logged-in farmer."""
    user = request.user
    profile, _ = FarmerProfile.objects.get_or_create(
        user=user,
        defaults={'phone': user.username, 'location': 'Not specified', 'total_acres': 0.0}
    )

    if request.method == 'GET':
        return Response(FarmerUserSerializer(user).data)

    elif request.method == 'PUT':
        data = request.data
        if 'full_name' in data:
            name_parts = data['full_name'].strip().split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save()

        if 'location' in data:
            profile.location = data['location'].strip()
        if 'total_acres' in data:
            profile.total_acres = data['total_acres']
        profile.save()

        return Response({
            'message': 'Profile updated successfully',
            'user': FarmerUserSerializer(user).data
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_farmer(request):
    """Invalidates the farmer's current authentication token."""
    try:
        Token.objects.filter(user=request.user).delete()
    except Exception:
        pass
    return Response({'message': 'Successfully signed out'}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 3 — FIELD & CROP VIEWS  ()
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def field_list_create(request):
    """List all fields or create a new field for the logged-in farmer."""
    if request.method == 'GET':
        fields = Field.objects.filter(farmer=request.user).order_by('field_name')
        serializer = FieldSerializer(fields, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = FieldSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(farmer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def field_detail(request, pk):
    """Retrieve, update or delete a specific field."""
    try:
        field = Field.objects.get(pk=pk, farmer=request.user)
    except Field.DoesNotExist:
        return Response({'error': 'Field not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(FieldSerializer(field).data)

    elif request.method == 'PUT':
        serializer = FieldSerializer(field, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        field.delete()
        return Response({'message': 'Field deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def crop_list_create(request):
    """List all crops or create a new crop for the logged-in farmer."""
    if request.method == 'GET':
        crops = Crop.objects.filter(farmer=request.user).select_related('field').order_by('-sowing_date')
        serializer = CropSerializer(crops, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CropSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(farmer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def crop_detail(request, pk):
    """Retrieve, update or delete a specific crop."""
    try:
        crop = Crop.objects.get(pk=pk, farmer=request.user)
    except Crop.DoesNotExist:
        return Response({'error': 'Crop not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CropSerializer(crop).data)

    elif request.method == 'PUT':
        serializer = CropSerializer(crop, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        crop.delete()
        return Response({'message': 'Crop deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 4 — EXPENSE VIEWS  ()
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_list_create(request):
    """List all expenses for farmer's crops or create a new expense."""
    if request.method == 'GET':
        crop_id = request.query_params.get('crop_id')
        expenses = Expense.objects.filter(crop__farmer=request.user)
        if crop_id:
            expenses = expenses.filter(crop_id=crop_id)
        expenses = expenses.order_by('-expense_date')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ExpenseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, pk):
    """Retrieve, update or delete a specific expense."""
    try:
        expense = Expense.objects.get(pk=pk, crop__farmer=request.user)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ExpenseSerializer(expense).data)

    elif request.method == 'PUT':
        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        expense.delete()
        return Response({'message': 'Expense deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 5 — HARVEST & SALE VIEWS  ()
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def harvest_list_create(request):
    """List all harvests or create a new harvest record."""
    if request.method == 'GET':
        crop_id = request.query_params.get('crop_id')
        harvests = Harvest.objects.filter(crop__farmer=request.user).prefetch_related('sales')
        if crop_id:
            harvests = harvests.filter(crop_id=crop_id)
        harvests = harvests.order_by('-harvest_date')
        serializer = HarvestSerializer(harvests, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HarvestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def harvest_detail(request, pk):
    """Retrieve, update or delete a specific harvest."""
    try:
        harvest = Harvest.objects.get(pk=pk, crop__farmer=request.user)
    except Harvest.DoesNotExist:
        return Response({'error': 'Harvest not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(HarvestSerializer(harvest).data)

    elif request.method == 'PUT':
        serializer = HarvestSerializer(harvest, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        harvest.delete()
        return Response({'message': 'Harvest deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sale_list_create(request):
    """List all sales or create a new sale record."""
    if request.method == 'GET':
        harvest_id = request.query_params.get('harvest_id')
        sales = Sale.objects.filter(harvest__crop__farmer=request.user)
        if harvest_id:
            sales = sales.filter(harvest_id=harvest_id)
        sales = sales.order_by('-sale_date')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SaleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def sale_detail(request, pk):
    """Retrieve, update or delete a specific sale."""
    try:
        sale = Sale.objects.get(pk=pk, harvest__crop__farmer=request.user)
    except Sale.DoesNotExist:
        return Response({'error': 'Sale not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(SaleSerializer(sale).data)

    elif request.method == 'PUT':
        serializer = SaleSerializer(sale, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        sale.delete()
        return Response({'message': 'Sale deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 6 — FINANCIAL ANALYSIS VIEWS  ()
# ═══════════════════════════════════════════════════════════════════

def _recalculate_financial_analysis(crop):
    """
    Core calculation engine for a crop cycle's financial metrics.
    Called whenever expenses or sales are modified.
    """
    # Total cost = sum of all expense amounts for this crop
    total_cost = Expense.objects.filter(crop=crop).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')

    # Total revenue = sum of all sale total_amounts for harvests of this crop
    total_revenue = Sale.objects.filter(harvest__crop=crop).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')

    profit_loss = total_revenue - total_cost

    # Land area from the crop's field safely guarded
    try:
        if crop.field and crop.field.land_area and Decimal(str(crop.field.land_area)) > 0:
            land_area = Decimal(str(crop.field.land_area))
        else:
            land_area = Decimal('1.00')
    except Exception:
        land_area = Decimal('1.00')

    cost_per_acre = round(Decimal(str(total_cost)) / land_area, 2)
    profit_per_acre = round(Decimal(str(profit_loss)) / land_area, 2)

    analysis, _ = FinancialAnalysis.objects.update_or_create(
        crop=crop,
        defaults={
            'total_cost': total_cost,
            'total_revenue': total_revenue,
            'profit_loss': profit_loss,
            'cost_per_acre': cost_per_acre,
            'profit_per_acre': profit_per_acre,
        }
    )
    return analysis


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financial_analysis_list(request):
    """
    List financial analysis summaries for all crops of the logged-in farmer.
    Optionally filter by crop_id.
    """
    crop_id = request.query_params.get('crop_id')
    analyses = FinancialAnalysis.objects.filter(
        crop__farmer=request.user
    ).select_related('crop')
    if crop_id:
        analyses = analyses.filter(crop_id=crop_id)

    serializer = FinancialAnalysisSerializer(analyses, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def financial_analysis_for_crop(request, crop_id):
    """
    GET  — Retrieve existing financial analysis for a crop.
    POST — Trigger recalculation (recalculate from current expenses + sales).
    """
    try:
        if getattr(request.user, 'is_staff', False):
            crop = Crop.objects.get(pk=crop_id)
        else:
            crop = Crop.objects.get(pk=crop_id, farmer=request.user)
    except Crop.DoesNotExist:
        return Response({'error': 'Crop not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        try:
            analysis = FinancialAnalysis.objects.get(crop=crop)
            return Response(FinancialAnalysisSerializer(analysis).data)
        except FinancialAnalysis.DoesNotExist:
            return Response(
                {'message': 'No financial analysis yet. Click Recalculate to generate.'},
                status=status.HTTP_404_NOT_FOUND
            )

    elif request.method == 'POST':
        try:
            analysis = _recalculate_financial_analysis(crop)
            return Response({
                'message': 'Financial analysis recalculated successfully.',
                'analysis': FinancialAnalysisSerializer(analysis).data
            })
        except Exception as e:
            return Response({'error': f'Recalculation error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 7 — REPORTS & DASHBOARD VIEWS  ()
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """
    Central dashboard API — returns all KPI metrics for the farmer dashboard.
    Includes: crop counts, total expenses, revenue, profit/loss, and per-season breakdown.
    """
    farmer = request.user

    # Basic counts
    total_crops = Crop.objects.filter(farmer=farmer).count()
    active_crops = Crop.objects.filter(farmer=farmer, status__in=['Sown', 'Growing']).count()
    total_fields = Field.objects.filter(farmer=farmer).count()

    # Expense & revenue aggregates
    total_expenses_agg = Expense.objects.filter(
        crop__farmer=farmer
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    total_revenue_agg = Sale.objects.filter(
        harvest__crop__farmer=farmer
    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

    net_profit = total_revenue_agg - total_expenses_agg

    # Recent crops (last 5)
    recent_crops = Crop.objects.filter(farmer=farmer).select_related('field').order_by('-sowing_date')[:5]
    recent_crops_data = [
        {
            'id': c.id,
            'crop_name': c.crop_name,
            'season': c.season,
            'status': c.status,
            'field_name': c.field.field_name,
            'sowing_date': c.sowing_date,
        }
        for c in recent_crops
    ]

    # Season-wise expense breakdown
    season_breakdown = []
    for season_code, season_label in Crop.SEASON_CHOICES:
        season_expense = Expense.objects.filter(
            crop__farmer=farmer,
            crop__season=season_code
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        season_revenue = Sale.objects.filter(
            harvest__crop__farmer=farmer,
            harvest__crop__season=season_code
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        season_breakdown.append({
            'season': season_label,
            'total_expense': float(season_expense),
            'total_revenue': float(season_revenue),
            'profit_loss': float(season_revenue - season_expense),
        })

    # Expense category breakdown
    category_breakdown = []
    for cat_code, cat_label in Expense.CATEGORY_CHOICES:
        cat_total = Expense.objects.filter(
            crop__farmer=farmer,
            expense_category=cat_code
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        if cat_total > 0:
            category_breakdown.append({
                'category': cat_label,
                'total': float(cat_total)
            })

    return Response({
        'summary': {
            'total_crops': total_crops,
            'active_crops': active_crops,
            'total_fields': total_fields,
            'total_expenses': float(total_expenses_agg),
            'total_revenue': float(total_revenue_agg),
            'net_profit': float(net_profit),
        },
        'recent_crops': recent_crops_data,
        'season_breakdown': season_breakdown,
        'expense_by_category': category_breakdown,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def crop_comparison_report(request):
    """
    Compare all crop cycles financially — useful for Charts / Reports page.
    Returns per-crop: name, season, cost, revenue, profit/loss.
    """
    farmer = request.user
    analyses = FinancialAnalysis.objects.filter(
        crop__farmer=farmer
    ).select_related('crop', 'crop__field').order_by('-crop__sowing_date')

    report = []
    for a in analyses:
        field_name = a.crop.field.field_name if a.crop.field else '—'
        land_area = float(a.crop.field.land_area) if (a.crop.field and a.crop.field.land_area) else 0.0
        report.append({
            'crop_id': a.crop.id,
            'crop_name': a.crop.crop_name,
            'variety': a.crop.variety,
            'season': a.crop.season,
            'field_name': field_name,
            'land_area': land_area,
            'total_cost': float(a.total_cost),
            'total_revenue': float(a.total_revenue),
            'profit_loss': float(a.profit_loss),
            'cost_per_acre': float(a.cost_per_acre),
            'profit_per_acre': float(a.profit_per_acre),
        })

    return Response({'crop_comparison': report})


# ═══════════════════════════════════════════════════════════════════
#  PHASE 8b — AI CROP RECOMMENDATION  ()
# ═══════════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────────
#  State-aware multi-crop recommendation engine
# ─────────────────────────────────────────────────────────────────

# fmt: off
# Structure: state -> season -> soil_group -> irrigation_group -> [(crop, base_score, reason_key)]
# soil_group:  "black"|"red"|"loamy"|"alluvial"|"clayey"|"sandy"|"other"
# irr_group:   "rainfed"|"canal"|"drip"|"sprinkler"|"borewell"|"other"
# base_score 0-100

_SOIL_GROUP = {
    "black": "black", "cotton soil": "black",
    "red": "red", "laterite": "red",
    "loamy": "loamy", "loam": "loamy",
    "alluvial": "alluvial",
    "clayey": "clayey", "clay": "clayey",
    "sandy": "sandy", "sandy loam": "sandy",
    "other": "other",
}
_IRR_GROUP = {
    "rainfed": "rainfed", "rain-fed": "rainfed",
    "canal": "canal",
    "drip": "drip",
    "sprinkler": "sprinkler",
    "borewell": "borewell", "bore well": "borewell",
    "other": "other",
}

# Each entry: (crop_name, score, short_reason)
_STATE_DB = {
    "maharashtra": {
        "Kharif": {
            "black":    {"rainfed":  [("Cotton", 94, "Black soil + rainfed is ideal for cotton in Vidarbha/Marathwada"),
                                      ("Soybean", 82, "Good moisture retention; popular oilseed in Maharashtra"),
                                      ("Tur Dal", 70, "Drought-tolerant; suits rainfed black soil well")],
                         "canal":    [("Sugarcane", 90, "Canal irrigation enables high-yield sugarcane"),
                                      ("Cotton", 80, "Cotton thrives with supplemental canal water"),
                                      ("Soybean", 72, "Reliable yield under canal irrigation")],
                         "drip":     [("Cotton", 92, "Drip conserves water; maximises cotton fibre quality"),
                                      ("Pomegranate", 85, "Drip-irrigated pomegranate is a high-value crop in Maharashtra"),
                                      ("Soybean", 70, "Water-efficient soybean cultivation")]},
            "red":      {"rainfed":  [("Groundnut", 88, "Red soil suits groundnut; good in Konkan/Nashik regions"),
                                      ("Jowar", 75, "Drought-hardy; traditional red soil crop"),
                                      ("Green Gram", 65, "Short-duration legume for red soil")],
                         "drip":     [("Grapes", 93, "Nashik's red soil + drip = premium wine/table grapes"),
                                      ("Onion", 80, "High-value vegetable in Maharashtra"),
                                      ("Pomegranate", 74, "Suits red soil with drip irrigation")]},
            "loamy":    {"rainfed":  [("Soybean", 90, "Loamy soils support excellent soybean yields"),
                                      ("Maize", 78, "Good drainage in loamy soil benefits maize"),
                                      ("Cotton", 68, "Moderate performance on loamy soil")]},
            "alluvial": {"canal":    [("Rice", 92, "Alluvial + canal = classic rice combination"),
                                      ("Sugarcane", 85, "High productivity in alluvial irrigated areas"),
                                      ("Banana", 72, "Water-intensive; suits canal-irrigated alluvial belts")]},
        },
        "Rabi": {
            "black":    {"canal":    [("Wheat", 88, "Black soil retains moisture well for rabi wheat"),
                                      ("Chickpea", 80, "Popular rabi pulse in Maharashtra"),
                                      ("Safflower", 65, "Drought-tolerant oilseed for drier rabi periods")],
                         "rainfed":  [("Chickpea", 85, "Gram grows well on residual moisture in black soil"),
                                      ("Wheat", 72, "Managed with residual irrigation"),
                                      ("Linseed", 60, "Hardy oilseed for dry rabi conditions")]},
            "loamy":    {"canal":    [("Wheat", 90, "Classic rabi crop on loamy irrigated land"),
                                      ("Sunflower", 78, "Profitable oilseed for rabi season"),
                                      ("Chickpea", 72, "Good legume rotation crop")]},
        },
        "Zaid": {
            "sandy":    {"drip":     [("Watermelon", 92, "Sandy soil + drip = excellent watermelon quality"),
                                      ("Cucumber", 80, "Fast-growing summer cash crop"),
                                      ("Muskmelon", 75, "Profitable summer crop in Maharashtra")]},
            "loamy":    {"canal":    [("Maize", 85, "Summer maize with canal irrigation"),
                                      ("Vegetables", 78, "High-value summer vegetables"),
                                      ("Groundnut", 70, "Summer groundnut on loamy soil")]},
        },
    },
    "karnataka": {
        "Kharif": {
            "red":      {"rainfed":  [("Ragi", 93, "Ragi is Karnataka's staple; thrives on red laterite soil"),
                                      ("Groundnut", 80, "Red soil is excellent for groundnut"),
                                      ("Maize", 72, "Good kharif option in north Karnataka")]},
            "black":    {"rainfed":  [("Cotton", 90, "Black soil Kharif cotton in north Karnataka"),
                                      ("Soybean", 78, "Growing oilseed in Karnataka"),
                                      ("Tur Dal", 68, "Legume rotation for black soil")]},
            "loamy":    {"canal":    [("Rice", 88, "Canal-irrigated rice in Cauvery basin"),
                                      ("Sugarcane", 82, "Mandya district sugarcane on loamy alluvial"),
                                      ("Maize", 70, "Hybrid maize on loamy soils")]},
        },
        "Rabi": {
            "red":      {"rainfed":  [("Jowar", 85, "Traditional Rabi jowar on Karnataka red soils"),
                                      ("Chickpea", 75, "Rabi gram in drier districts"),
                                      ("Sunflower", 68, "Oilseed crop for rabi season")]},
            "loamy":    {"canal":    [("Wheat", 86, "Irrigated wheat in north Karnataka"),
                                      ("Sunflower", 80, "High-value oilseed for rabi"),
                                      ("Onion", 72, "Profitable rabi vegetable")]},
        },
    },
    "andhra pradesh": {
        "Kharif": {
            "alluvial": {"canal":    [("Rice", 95, "Godavari-Krishna delta – alluvial + canal is perfect for rice"),
                                      ("Banana", 80, "Water-intensive crop in well-irrigated deltas"),
                                      ("Maize", 70, "Good second option in alluvial kharif")]},
            "black":    {"rainfed":  [("Cotton", 88, "Black cotton soil in Rayalaseema"),
                                      ("Groundnut", 80, "AP groundnut in red/black mixed zones"),
                                      ("Tur Dal", 68, "Legume option for rainfed black soil")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Rice", 90, "Second crop rice in delta regions"),
                                      ("Maize", 82, "High-value rabi maize"),
                                      ("Groundnut", 72, "Rabi groundnut in lighter soils")]},
        },
    },
    "telangana": {
        "Kharif": {
            "black":    {"rainfed":  [("Cotton", 92, "Telangana black soil + rainfed = prime cotton belt"),
                                      ("Soybean", 78, "Rising oilseed crop in Telangana"),
                                      ("Maize", 68, "Kharif maize in loamy-black areas")]},
            "alluvial": {"canal":    [("Rice", 90, "Godavari lift irrigation supports rice"),
                                      ("Sugarcane", 78, "Canal-fed sugarcane in Nizamabad"),
                                      ("Maize", 70, "High-yield hybrid maize")]},
        },
        "Rabi": {
            "black":    {"canal":    [("Chickpea", 88, "Rabi gram is Telangana's major rabi pulse"),
                                      ("Wheat", 74, "Irrigated wheat in Nizamabad"),
                                      ("Sunflower", 68, "Oilseed for rabi rotation")]},
        },
    },
    "rajasthan": {
        "Kharif": {
            "sandy":    {"rainfed":  [("Bajra", 92, "Bajra thrives in sandy soils of Rajasthan with low rainfall"),
                                      ("Moth Bean", 80, "Drought-tolerant legume in arid Rajasthan"),
                                      ("Cluster Bean", 72, "Guar suited to sandy arid soils")]},
            "loamy":    {"canal":    [("Maize", 85, "Canal-irrigated maize in eastern Rajasthan"),
                                      ("Soybean", 74, "Growing oilseed in humid east Rajasthan"),
                                      ("Cotton", 65, "Cotton in canal-irrigated western areas")]},
        },
        "Rabi": {
            "loamy":    {"canal":    [("Wheat", 95, "Canal-irrigated wheat is Rajasthan's top rabi crop"),
                                      ("Mustard", 88, "Rajasthan is India's largest mustard producer"),
                                      ("Chickpea", 74, "Rabi gram in eastern Rajasthan")]},
            "sandy":    {"drip":     [("Cumin", 86, "Rajasthan produces most of India's cumin"),
                                      ("Mustard", 78, "Mustard adapts to sandy soil with drip"),
                                      ("Cluster Bean", 65, "Guar in drip-irrigated desert fringe areas")]},
        },
    },
    "punjab": {
        "Kharif": {
            "alluvial": {"canal":    [("Rice", 96, "Punjab alluvial canal irrigation = highest rice yield in India"),
                                      ("Maize", 78, "Hybrid maize as rice alternative"),
                                      ("Cotton", 68, "Kharif cotton in Malwa belt")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Wheat", 97, "Punjab is India's wheat bowl; alluvial + canal = record yields"),
                                      ("Potato", 82, "High-value rabi vegetable"),
                                      ("Sunflower", 68, "Oilseed diversification option")]},
        },
    },
    "haryana": {
        "Kharif": {
            "alluvial": {"canal":    [("Rice", 93, "Haryana's alluvial belt with canal = premium basmati rice"),
                                      ("Maize", 78, "Good kharif alternative"),
                                      ("Cotton", 70, "Cotton in Hisar/Sirsa districts")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Wheat", 95, "Haryana's main rabi crop"),
                                      ("Mustard", 84, "Second most important rabi crop"),
                                      ("Chickpea", 70, "Legume rotation crop")]},
        },
    },
    "uttar pradesh": {
        "Kharif": {
            "alluvial": {"canal":    [("Rice", 92, "Vast Gangetic alluvial plains with canal = top rice producer"),
                                      ("Sugarcane", 88, "UP is India's largest sugarcane state"),
                                      ("Maize", 72, "Kharif maize in eastern UP")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Wheat", 96, "UP's main food crop; Gangetic plains are ideal"),
                                      ("Potato", 88, "Agra/Farrukhabad are major potato hubs"),
                                      ("Mustard", 74, "Prominent oilseed in western UP")]},
        },
    },
    "madhya pradesh": {
        "Kharif": {
            "black":    {"rainfed":  [("Soybean", 95, "MP is India's soybean capital; black soil + kharif rainfall"),
                                      ("Cotton", 80, "Kharif cotton on black soils of Nimar"),
                                      ("Tur Dal", 68, "Legume complement to soybean rotation")]},
        },
        "Rabi": {
            "black":    {"canal":    [("Wheat", 92, "MP's leading rabi crop; black soil retains moisture well"),
                                      ("Chickpea", 85, "MP is India's top chickpea producer"),
                                      ("Lentil", 70, "Masoor dal in eastern MP")]},
            "loamy":    {"canal":    [("Wheat", 90, "Irrigated wheat on loamy soils of Chambal basin"),
                                      ("Mustard", 78, "Prominent oilseed in rabi rotation"),
                                      ("Coriander", 68, "Specialty spice crop in Malwa")]},
        },
    },
    "gujarat": {
        "Kharif": {
            "black":    {"rainfed":  [("Cotton", 96, "Gujarat's cotton belt; black soil + kharif rain"),
                                      ("Groundnut", 85, "Saurashtra red/black soil groundnut"),
                                      ("Castor", 72, "Gujarat produces most of India's castor")]},
            "sandy":    {"drip":     [("Groundnut", 90, "Sandy loam + drip = Saurashtra's famous groundnut"),
                                      ("Castor", 80, "Drip-irrigated castor in dry tracts"),
                                      ("Cumin", 70, "North Gujarat cumin")]},
        },
        "Rabi": {
            "black":    {"canal":    [("Wheat", 88, "Canal-irrigated wheat in north Gujarat"),
                                      ("Chickpea", 78, "Rabi gram in central Gujarat"),
                                      ("Mustard", 68, "North Gujarat oilseed crop")]},
        },
    },
    "tamil nadu": {
        "Kharif": {
            "alluvial": {"canal":    [("Rice", 94, "Cauvery delta alluvial soil + canal irrigation = premium Sona Masoori rice"),
                                      ("Banana", 80, "Major fruit crop in Trichy/Thanjavur"),
                                      ("Sugarcane", 74, "High-yielding in delta areas")]},
            "red":      {"rainfed":  [("Groundnut", 88, "TN's red laterite soils suit groundnut well"),
                                      ("Ragi", 78, "Traditional crop in rain-fed TN districts"),
                                      ("Maize", 65, "Growing kharif crop")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Rice", 92, "Second season rice in irrigated delta"),
                                      ("Vegetables", 80, "High-value winter vegetables"),
                                      ("Maize", 70, "Rabi maize on alluvial soils")]},
        },
    },
    "west bengal": {
        "Kharif": {
            "alluvial": {"rainfed":  [("Rice", 96, "WB is second only to UP in rice; alluvial + monsoon"),
                                      ("Jute", 88, "WB leads India in jute production"),
                                      ("Maize", 65, "Kharif maize in red laterite districts")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Potato", 92, "WB is India's top potato producer; fertile alluvial land"),
                                      ("Vegetables", 84, "High-value winter crops"),
                                      ("Wheat", 70, "Rabi wheat in western WB")]},
        },
    },
    "bihar": {
        "Kharif": {
            "alluvial": {"canal":    [("Rice", 93, "Bihar's Gangetic plains – paddy is the backbone"),
                                      ("Maize", 82, "Bihar maize production rising rapidly"),
                                      ("Vegetables", 70, "High-value kharif vegetables")]},
        },
        "Rabi": {
            "alluvial": {"canal":    [("Wheat", 94, "Bihar's main rabi food crop"),
                                      ("Lentil", 82, "Bihar leads India in masoor lentil"),
                                      ("Mustard", 68, "Oilseed in western Bihar")]},
        },
    },
    "odisha": {
        "Kharif": {
            "alluvial": {"rainfed":  [("Rice", 95, "Odisha's alluvial river basins are rice country"),
                                      ("Maize", 75, "Hybrid maize in upland areas"),
                                      ("Green Gram", 62, "Short-duration kharif legume")]},
        },
    },
    "assam": {
        "Kharif": {
            "alluvial": {"rainfed":  [("Rice", 96, "Assam's Brahmaputra alluvial belt – rice is staple"),
                                      ("Jute", 82, "Second-largest jute producer after WB"),
                                      ("Tea", 88, "Assam's world-famous tea on laterite hills")]},
        },
    },
    "kerala": {
        "Kharif": {
            "loamy":    {"rainfed":  [("Rice", 90, "Traditional kharif paddy in Kerala's wetlands"),
                                      ("Coconut", 95, "Kerala's top plantation crop on loamy coastal soils"),
                                      ("Banana", 80, "Nendran banana is high-value for Kerala farmers")]},
            "red":      {"rainfed":  [("Rubber", 92, "Laterite hills of Kerala are ideal for rubber"),
                                      ("Pepper", 85, "Black pepper – Kerala's spice flagship"),
                                      ("Cardamom", 78, "High-altitude spice in Idukki")]},
        },
    },
    "himachal pradesh": {
        "Rabi": {
            "loamy":    {"rainfed":  [("Apple", 96, "Himachal's loamy hill soils + cool winters = premium apples"),
                                      ("Wheat", 82, "Winter wheat on terraced hill fields"),
                                      ("Pea", 75, "Early pea is a high-value HP crop")]},
        },
        "Kharif": {
            "loamy":    {"rainfed":  [("Maize", 90, "Main kharif crop on HP slopes"),
                                      ("Potato", 88, "Shimla potato is famous across India"),
                                      ("Ginger", 75, "High-value spice on loamy hill soils")]},
        },
    },
    "uttarakhand": {
        "Kharif": {
            "loamy":    {"rainfed":  [("Rice", 88, "Terrace paddy in Terai + lower hills"),
                                      ("Maize", 84, "Kharif maize on hill terraces"),
                                      ("Soybean", 72, "Growing oilseed on Kumaon hills")]},
        },
        "Rabi": {
            "loamy":    {"rainfed":  [("Wheat", 92, "Major rabi crop in Uttarakhand's Terai belt"),
                                      ("Lentil", 78, "Rabi legume on hill farms"),
                                      ("Mustard", 70, "Oilseed in lower hills")]},
        },
    },
}

# Crop-specific growing tips (English – translated in frontend)
CROP_TIPS = {
    "Cotton":     ["Sow between May 15 – June 15 for Kharif season.",
                   "Maintain 90 cm × 60 cm spacing for hybrid Bt cotton.",
                   "Apply a basal dose of 50 kg DAP + 25 kg MoP per acre at sowing.",
                   "Scout weekly for bollworm and whitefly; use sticky yellow traps.",
                   "Stop irrigation 3 weeks before harvest to improve fibre quality."],
    "Soybean":    ["Use certified, treated seed at 30 kg per acre.",
                   "Inoculate seed with Rhizobium culture to fix atmospheric nitrogen.",
                   "Sow in rows of 45 cm; thin to 10 cm plant-to-plant spacing.",
                   "Apply pre-emergence herbicide (Pendimethalin) within 48 hours of sowing.",
                   "Harvest when 95 % of pods turn yellow-brown and moisture drops below 15 %."],
    "Wheat":      ["Sow between Oct 25 – Nov 15 for optimum yield in north India.",
                   "Apply 50 kg urea split in three doses: sowing, crown root, jointing.",
                   "First irrigation at crown-root initiation stage (21 DAS) is critical.",
                   "Use rust-resistant varieties like HD-2967 or WH-1105.",
                   "Harvest at full physiological maturity to avoid field losses."],
    "Rice":       ["Prepare nursery 30 days before transplanting.",
                   "Maintain 2–5 cm standing water in the field during vegetative stage.",
                   "Apply zinc sulphate (25 kg/acre) to prevent khaira disease.",
                   "Use System of Rice Intensification (SRI) to reduce water use by 25 %.",
                   "Drain field 10 days before harvest for easier machine harvesting."],
    "Groundnut":  ["Treat seed with Trichoderma viride before sowing.",
                   "Sow at 30 cm × 10 cm spacing; apply gypsum (200 kg/acre) at pegging.",
                   "Keep field weed-free for the first 30 days.",
                   "Avoid waterlogging; ridges or raised beds improve pod set.",
                   "Harvest when leaves turn yellow and inner shell shows dark veins."],
    "Sugarcane":  ["Plant seed stools of 3-bud sets; soak in Carbendazim solution.",
                   "Apply trench furrow planting for better yield and ratoon ability.",
                   "Apply 120 kg N per acre split over 3–4 doses.",
                   "Earth up at 60 and 120 days to prevent lodging.",
                   "Target 12–14 months crop cycle for maximum sucrose content."],
    "Maize":      ["Use single-cross hybrid seed at 8 kg per acre.",
                   "Sow at 60 cm × 25 cm spacing; first thinning at 15 days.",
                   "Critical irrigation stages: knee-high, tasseling, and grain-fill.",
                   "Apply 60 kg urea as top dressing at knee-high stage.",
                   "Harvest at 30 % moisture for wet storage or 14 % for dry storage."],
    "Bajra":      ["Sow at the onset of monsoon; 2–3 kg seed per acre.",
                   "Thin to 45 cm × 15 cm spacing; keep field weed-free for 30 days.",
                   "Bajra is drought-tolerant; one life-saving irrigation at flowering is sufficient.",
                   "Use downy-mildew-resistant varieties like HHB-67 Improved.",
                   "Harvest when 80 % of ears are fully brown and dry."],
    "Mustard":    ["Sow in mid-October; use 1.5 kg seed per acre.",
                   "Row spacing of 30 cm is optimum; thin to 15 cm plant spacing.",
                   "Apply sulphur (20 kg/acre) to boost oil content.",
                   "Spray boron at flowering stage to improve pod set.",
                   "Harvest when 75 % of pods turn golden-yellow."],
    "Chickpea":   ["Sow on residual moisture; avoid heavy irrigation.",
                   "Seed treatment with Rhizobium and PSB culture improves yield by 15 %.",
                   "Keep rows 30 cm apart; no thinning required.",
                   "One irrigation at branching + pod-fill stages is usually enough.",
                   "Store at < 10 % moisture in air-tight containers to prevent weevil damage."],
    "Tur Dal":    ["Sow after first good rain; 3 kg seed per acre.",
                   "Spacing: 90 cm × 30 cm; weed at 20 and 40 DAS.",
                   "Apply 8 kg P2O5 per acre as basal; no heavy N needed (legume).",
                   "Withhold irrigation for 20 days before harvest for uniform pod maturity.",
                   "Store cleaned seed in jute bags with neem leaves to prevent pests."],
    "Ragi":       ["Sow transplanted seedlings at 22.5 cm × 10 cm spacing.",
                   "Ragi needs less water than rice; one irrigation at tillering is key.",
                   "Apply 20 kg N per acre split in two doses.",
                   "Ragi is rich in calcium; market as health grain for premium price.",
                   "Harvest when 80 % of ears turn brown; thresh on tarpaulin."],
    "Potato":     ["Use certified, disease-free seed tubers (40 mm size).",
                   "Sow in October–November at 60 cm × 20 cm spacing.",
                   "Earth up at 30 and 45 days after planting.",
                   "Apply Ridomil to prevent late blight; monitor weekly.",
                   "Harvest when plants turn yellow; cure tubers for 10 days before cold storage."],
    "Sunflower":  ["Sow at 60 cm × 30 cm; 1 seed per hole.",
                   "Two critical irrigations: at flower bud stage and seed filling.",
                   "Place bee hives near field to improve pollination by 20 %.",
                   "Spray boron (0.2 %) at flower initiation to prevent hollow heart.",
                   "Harvest when back of head turns yellow and moisture is < 10 %."],
    "Watermelon": ["Use trellising or mulch film to keep fruit off wet soil.",
                   "Drip irrigation saves 40 % water and reduces disease incidence.",
                   "Apply 2 kg NPK 19:19:19 per week through drip fertigation.",
                   "Introduce honeybees for pollination; avoid insecticides during flowering.",
                   "Harvest 30–35 days after fruit set; thump test for hollow sound."],
    "Grapes":     ["Prune to maintain 4 main arms; remove water shoots promptly.",
                   "Drip + fertigation with NPK schedule aligned to phenological stages.",
                   "Spray calcium + boron at berry set to reduce berry cracking.",
                   "Maintain vine spacing of 3 m × 1.5 m for table grapes.",
                   "Harvest bunches at 18–22 Brix for sweet table grape markets."],
    "Rubber":     ["Bud-grafted planting material gives 4× yield over seedlings.",
                   "Tap bark at 1.5 m height; alternate tapping and resting panels.",
                   "Apply NPK fertiliser (10:10:4:1.5 Mg) per tree per year.",
                   "Control white-root disease with Tridemorph soil drenching.",
                   "Store fresh latex in anti-coagulant ammoniated tanks within 6 hours."],
    "Coconut":    ["Plant 45-day old seedlings with pre-soaked husk pits.",
                   "Basin irrigation at 50 litres every 5 days in summer.",
                   "Apply 1.3 kg neem cake + 0.5 kg rock phosphate per palm per year.",
                   "Remove dried fronds and control red palm weevil with pheromone traps.",
                   "Harvest nuts every 45 days; intercrop with banana for extra income."],
    "Apple":      ["Plant on M9 or M106 rootstock for high-density orchards.",
                   "Chill requirement: 1000–1200 hours below 7 °C for proper bud break.",
                   "Thin fruit to one per cluster at 10 mm diameter stage.",
                   "Spray calcium nitrate three times between fruit set and harvest.",
                   "Harvest when starch-iodine test shows 5–6 on the scale for best storage."],
    "Banana":     ["Use tissue-culture plantlets for disease-free crop.",
                   "Drip irrigation at 16–20 litres per plant per day in summer.",
                   "Apply 200 g urea + 200 g MoP per plant at 3, 5, and 7 months.",
                   "Remove the male bud ('गाभा') at 15 cm beyond last hand.",
                   "Harvest when the fruit angle changes from acute to slightly rounded."],
    "Jute":       ["Sow at onset of monsoon; thin to 5 cm spacing in rows of 25 cm.",
                   "First weeding at 4 weeks; second at 6 weeks after sowing.",
                   "Harvest at 50 % flowering stage for best fibre quality.",
                   "Ret bundles for 10–18 days in slow-flowing water.",
                   "Dry extracted fibres in shade to preserve lustre."],
    "Onion":      ["Use certified onion sets or 6–8 week old seedlings.",
                   "Drip irrigation reduces purple blotch incidence significantly.",
                   "Stop irrigation 10–12 days before harvest to improve storage.",
                   "Cure harvested bulbs for 3–5 days in field before storage.",
                   "Grade and market B-grade onions locally; export A-grade for premium price."],
    "Pepper":     ["Train vines on standards of 4–5 m height; prune to 3 plagiotropic branches.",
                   "Apply cowdung slurry to base in June; follow with NPK in August.",
                   "Phytophthora foot rot: drench with Potassium phosphonate 0.3 %.",
                   "Mulch heavily with green leaves to retain moisture and add organic matter.",
                   "Harvest spikes when one or two berries turn orange-red."],
}

DEFAULT_TIPS = [
    "Follow the recommended sowing dates for your agro-climatic zone.",
    "Use certified seeds for better germination and disease resistance.",
    "Apply fertilisers in split doses to reduce losses and improve uptake.",
    "Monitor the crop weekly for pests and diseases; early detection saves yield.",
    "Maintain proper plant spacing to ensure good aeration and sunlight.",
]

_SEASON_DEFAULTS = {
    "Kharif": [("Rice", 78, "Generic Kharif crop suited to monsoon rainfall"),
               ("Maize", 70, "Versatile Kharif crop"),
               ("Soybean", 65, "Popular oilseed for kharif season")],
    "Rabi":   [("Wheat", 82, "Main rabi food grain"),
               ("Chickpea", 74, "Rabi pulse rotation"),
               ("Mustard", 65, "Oilseed for rabi season")],
    "Zaid":   [("Watermelon", 80, "Classic summer crop"),
               ("Maize", 70, "Short-duration summer maize"),
               ("Vegetables", 62, "High-value summer vegetables")],
    "Annual": [("Sugarcane", 85, "Annual perennial cash crop"),
               ("Banana", 78, "Perennial fruit crop"),
               ("Coconut", 72, "Long-term plantation crop")],
}
# fmt: on


def _normalise(val, mapping):
    """Return the canonical group key for a user-supplied value."""
    v = (val or "").strip().lower()
    return mapping.get(v, "other")


def _multi_recommend(soil_type, season, weather_conditions, irrigation_type, state=""):
    """
    Return a list of up to 3 dicts:
      {rank, crop, confidence, reason, tips (rank-1 only)}
    """
    soil_grp  = _normalise(soil_type, _SOIL_GROUP)
    irr_grp   = _normalise(irrigation_type, _IRR_GROUP)
    state_key = (state or "").strip().lower()

    candidates = []

    # 1. Try exact state → season → soil → irrigation
    state_data = _STATE_DB.get(state_key, {})
    season_data = state_data.get(season, {})
    soil_data   = season_data.get(soil_grp, {})
    exact       = soil_data.get(irr_grp, [])
    if exact:
        candidates = list(exact)

    # 2. Fallback: any irrigation for the soil group
    if len(candidates) < 3:
        for irr, crops in soil_data.items():
            for c in crops:
                if not any(x[0] == c[0] for x in candidates):
                    candidates.append(c)

    # 3. Fallback: any soil group in the state-season
    if len(candidates) < 3:
        for sg, irr_map in season_data.items():
            for irr, crops in irr_map.items():
                for c in crops:
                    if not any(x[0] == c[0] for x in candidates):
                        candidates.append(c)

    # 4. Fallback: whole state
    if len(candidates) < 3:
        for seas, soil_map in state_data.items():
            for sg, irr_map in soil_map.items():
                for irr, crops in irr_map.items():
                    for c in crops:
                        if not any(x[0] == c[0] for x in candidates):
                            candidates.append(c)

    # 5. Ultimate fallback: season defaults
    if len(candidates) < 3:
        for c in _SEASON_DEFAULTS.get(season, _SEASON_DEFAULTS["Kharif"]):
            if not any(x[0] == c[0] for x in candidates):
                candidates.append(c)

    # Weather boost: if keyword matches, nudge score up
    weather_lower = (weather_conditions or "").lower()
    boosted = []
    for crop, score, reason in candidates[:6]:
        nudge = 0
        if "rain" in weather_lower and crop in ("Rice", "Jute", "Sugarcane", "Banana", "Tea"):
            nudge = 4
        elif "dry" in weather_lower or "hot" in weather_lower:
            if crop in ("Bajra", "Moth Bean", "Cluster Bean", "Castor", "Cotton", "Groundnut"):
                nudge = 4
        elif "cool" in weather_lower or "cold" in weather_lower:
            if crop in ("Wheat", "Mustard", "Chickpea", "Potato", "Lentil", "Apple", "Pea"):
                nudge = 4
        boosted.append((crop, min(score + nudge, 99), reason))

    # Sort descending by score
    boosted.sort(key=lambda x: -x[1])

    result = []
    for rank, (crop, score, reason) in enumerate(boosted[:3], start=1):
        entry = {
            "rank": rank,
            "crop": crop,
            "confidence": score,
            "reason": reason,
        }
        if rank == 1:
            entry["tips"] = CROP_TIPS.get(crop, DEFAULT_TIPS)
        result.append(entry)

    return result




# ═══════════════════════════════════════════════════════════════════
#  PHASE 8b — AI CROP RECOMMENDATION
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def crop_recommendation(request):
    """
    POST — Submit soil/weather/state parameters and receive ranked crop recommendations.
    GET  — List all past recommendations for the farmer.
    """
    if request.method == 'GET':
        recs = CropRecommendation.objects.filter(farmer=request.user).order_by('-recommendation_date')
        serializer = CropRecommendationSerializer(recs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CropRecommendationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        soil_type         = serializer.validated_data['soil_type']
        season            = serializer.validated_data['season']
        weather_conditions = serializer.validated_data['weather_conditions']
        irrigation_type   = serializer.validated_data['irrigation_type']
        state             = request.data.get('state', '').strip()

        recommendations = _multi_recommend(soil_type, season, weather_conditions, irrigation_type, state)
        top_crop = recommendations[0]['crop'] if recommendations else 'Soybean'

        rec = CropRecommendation.objects.create(
            farmer=request.user,
            soil_type=soil_type,
            season=season,
            weather_conditions=weather_conditions,
            irrigation_type=irrigation_type,
            recommended_crop=top_crop,
        )

        rec_data = CropRecommendationSerializer(rec).data
        rec_data['recommendations'] = recommendations

        return Response({
            'message': 'Crop recommendation generated successfully.',
            'recommendation': rec_data,
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 8a — AI YIELD PREDICTION  ()
# ═══════════════════════════════════════════════════════════════════

# Yield base values per crop (quintals per acre)
YIELD_BASE = {
    'wheat':      18.0,
    'rice':       22.0,
    'soybean':    12.0,
    'cotton':     8.0,
    'sugarcane':  350.0,
    'groundnut':  10.0,
    'maize':      20.0,
    'sunflower':  9.0,
    'watermelon': 60.0,
}


def _ai_predict_yield(crop_name, land_area, season, soil_type, fertilizer_use, rainfall):
    """
    Trained Scikit-Learn GradientBoostingRegressor inference with domain fallback.
    """
    if YIELD_PRED_MODEL is not None:
        try:
            df = pd.DataFrame([{
                'crop_name': crop_name,
                'soil_type': soil_type,
                'season': season,
                'fertilizer_use': fertilizer_use or 'Standard Balanced',
                'land_area': float(land_area),
                'rainfall': float(rainfall) if rainfall is not None else 650.0
            }])
            pred = YIELD_PRED_MODEL.predict(df)
            if len(pred) > 0 and pred[0] > 0:
                return round(float(pred[0]), 2)
        except Exception:
            pass

    base = YIELD_BASE.get(crop_name.lower(), 15.0)

    soil_factors = {'Black': 1.10, 'Alluvial': 1.15, 'Loamy': 1.05, 'Red': 0.95, 'Clayey': 1.0, 'Sandy': 0.85}
    soil_factor = soil_factors.get(soil_type, 1.0)

    fertilizer_factor = 1.0
    if fertilizer_use:
        fu = fertilizer_use.lower()
        if 'high' in fu or 'urea' in fu or 'dap' in fu:
            fertilizer_factor = 1.20
        elif 'medium' in fu or 'npk' in fu:
            fertilizer_factor = 1.10
        elif 'low' in fu or 'none' in fu or 'organic' in fu:
            fertilizer_factor = 0.90

    rainfall_factor = 1.0
    if rainfall is not None:
        rain_mm = float(rainfall)
        if rain_mm >= 800:
            rainfall_factor = 1.10
        elif rain_mm >= 500:
            rainfall_factor = 1.05
        elif rain_mm < 300:
            rainfall_factor = 0.85

    predicted = round(base * float(land_area) * soil_factor * fertilizer_factor * rainfall_factor, 2)
    return predicted


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def yield_prediction(request):
    """
    POST — Submit crop parameters and receive a predicted yield.
    GET  — List all past yield predictions for farmer's crops.
    """
    if request.method == 'GET':
        predictions = YieldPrediction.objects.filter(
            crop__farmer=request.user
        ).select_related('crop').order_by('-prediction_date')
        serializer = YieldPredictionSerializer(predictions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = YieldPredictionSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        crop = serializer.validated_data['crop']

        # Verify ownership
        if crop.farmer != request.user:
            return Response({'error': 'You do not own this crop.'}, status=status.HTTP_403_FORBIDDEN)

        land_area = serializer.validated_data['land_area']
        season = serializer.validated_data['season']
        soil_type = serializer.validated_data['soil_type']
        fertilizer_use = serializer.validated_data.get('fertilizer_use', '')
        rainfall = serializer.validated_data.get('rainfall', None)

        predicted = _ai_predict_yield(
            crop.crop_name, land_area, season, soil_type, fertilizer_use, rainfall
        )

        prediction = YieldPrediction.objects.create(
            crop=crop,
            land_area=land_area,
            season=season,
            soil_type=soil_type,
            fertilizer_use=fertilizer_use,
            rainfall=rainfall,
            predicted_yield=predicted,
        )

        return Response({
            'message': 'Yield prediction calculated successfully.',
            'prediction': YieldPredictionSerializer(prediction).data
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════
#  PHASE 8c — AI PROFIT PREDICTION  ()
# ═══════════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def profit_prediction(request):
    """
    POST — Submit cost/yield/price estimates and receive predicted profit.
    GET  — List all past profit predictions for farmer's crops.
    """
    if request.method == 'GET':
        predictions = ProfitPrediction.objects.filter(
            crop__farmer=request.user
        ).select_related('crop').order_by('-prediction_date')
        serializer = ProfitPredictionSerializer(predictions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ProfitPredictionSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        crop = serializer.validated_data['crop']
        if crop.farmer != request.user:
            return Response({'error': 'You do not own this crop.'}, status=status.HTTP_403_FORBIDDEN)

        estimated_cost = serializer.validated_data['estimated_cost']
        predicted_yield = serializer.validated_data['predicted_yield']
        estimated_selling_price = serializer.validated_data['estimated_selling_price']

        # Exact accounting profit definition: (yield × price) − cost
        predicted_profit = round(
            (float(predicted_yield) * float(estimated_selling_price)) - float(estimated_cost), 2
        )

        # Machine Learning model evaluation
        ml_prediction = None
        if PROFIT_PRED_MODEL is not None:
            try:
                df = pd.DataFrame([{
                    'crop_name': crop.crop_name,
                    'estimated_cost': float(estimated_cost),
                    'predicted_yield': float(predicted_yield),
                    'estimated_selling_price': float(estimated_selling_price),
                }])
                ml_pred = PROFIT_PRED_MODEL.predict(df)
                if len(ml_pred) > 0:
                    ml_prediction = round(float(ml_pred[0]), 2)
            except Exception:
                pass

        prediction = ProfitPrediction.objects.create(
            crop=crop,
            estimated_cost=estimated_cost,
            predicted_yield=predicted_yield,
            estimated_selling_price=estimated_selling_price,
            predicted_profit=predicted_profit,
        )

        resp_data = ProfitPredictionSerializer(prediction).data
        if ml_prediction is not None:
            resp_data['ml_predicted_profit'] = ml_prediction

        return Response({
            'message': 'Profit prediction calculated successfully.',
            'prediction': resp_data
        }, status=status.HTTP_201_CREATED)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def crop_field_intelligence(request, crop_id):
    """
    Returns real field data:
    1. Actual recorded expenses
    2. Land area and soil characteristics
    3. Yield estimate
    4. Current live APMC market price for the crop
    """
    try:
        crop = Crop.objects.get(id=crop_id, farmer=request.user)
    except Crop.DoesNotExist:
        return Response({'error': 'Crop not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

    intel = get_crop_field_intelligence(crop)
    return Response(intel, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def current_market_prices(request):
    """
    Returns latest APMC mandi rates for all major crops.
    """
    crops = ['Soybean', 'Wheat', 'Sugarcane', 'Cotton', 'Rice', 'Maize', 'Groundnut', 'Gram (Chana)', 'Onion', 'Tomato']
    results = [get_live_market_price(c) for c in crops]
    return Response(results, status=status.HTTP_200_OK)


# ===============================================================
#  SYSTEM ADMIN API
# ===============================================================

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
import datetime

def is_admin(user):
    return user.is_authenticated and (user.is_superuser or user.is_staff)

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login - returns token only for superuser/staff accounts."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    from django.contrib.auth import authenticate as dj_auth
    user = dj_auth(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not (user.is_superuser or user.is_staff):
        return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'username': user.username,
        'full_name': user.get_full_name() or user.username,
        'is_superuser': user.is_superuser,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Overall platform statistics for admin dashboard."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_farmers = FarmerProfile.objects.count()
    total_crops = Crop.objects.count()
    active_crops = Crop.objects.filter(status__in=['Sown', 'Growing']).count()
    total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
    total_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    total_harvest_qty = Harvest.objects.aggregate(total=Sum('quantity_harvested'))['total'] or 0
    total_recommendations = CropRecommendation.objects.count()
    total_yield_predictions = YieldPrediction.objects.count()

    now = datetime.datetime.now()
    new_farmers_this_month = FarmerProfile.objects.filter(
        created_at__year=now.year, created_at__month=now.month
    ).count()

    six_months_ago = now - datetime.timedelta(days=180)
    monthly_signups = (
        FarmerProfile.objects
        .filter(created_at__gte=six_months_ago)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

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
    # rename field for frontend compatibility
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
            'new_farmers_this_month': new_farmers_this_month,
            'total_crops': total_crops,
            'active_crops': active_crops,
            'total_expenses': float(total_expenses),
            'total_revenue': float(total_revenue),
            'net_profit': net_profit,
            'total_harvest_qty': float(total_harvest_qty),
            'total_recommendations': total_recommendations,
            'total_yield_predictions': total_yield_predictions,
        },
        'monthly_signups': [
            {'month': item['month'].strftime('%b %Y'), 'count': item['count']}
            for item in monthly_signups
        ],
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_farmers_list(request):
    """List all registered farmers with stats."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    profiles = FarmerProfile.objects.select_related('user').order_by('-created_at')
    data = []
    for profile in profiles:
        user = profile.user
        crop_count = Crop.objects.filter(farmer=user).count()
        total_expenses = Expense.objects.filter(crop__farmer=user).aggregate(t=Sum('amount'))['t'] or 0
        total_revenue = Sale.objects.filter(harvest__crop__farmer=user).aggregate(t=Sum('total_amount'))['t'] or 0
        data.append({
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'phone': profile.phone,
            'location': profile.location,
            'total_acres': float(profile.total_acres),
            'crop_count': crop_count,
            'total_expenses': float(total_expenses),
            'total_revenue': float(total_revenue),
            'is_active': user.is_active,
            'joined': user.date_joined.strftime('%d %b %Y'),
        })
    return Response(data)


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
    """Detailed report for a single farmer."""
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
        phone = ''
        location = ''
        total_acres = 0
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
    for c in crops.order_by('-sowing_date')[:10]:
        field_name = c.field.field_name if c.field else '\u2014'
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

    top_crops_qs = (
        Crop.objects.filter(farmer=farmer)
        .values('crop_name')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    fields = Field.objects.filter(farmer=farmer)
    field_list = [
        {'field_name': f.field_name, 'land_area': float(f.land_area), 'soil_type': f.soil_type}
        for f in fields
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
        'top_crops': list(top_crops_qs),
        'fields': field_list,
    })


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

    for p in FarmerProfile.objects.select_related('user').order_by('-created_at')[:5]:
        uname = p.user.get_full_name() or p.user.username
        activities.append({
            'type': 'farmer_joined',
            'icon': 'person-plus',
            'color': 'success',
            'message': uname + ' joined from ' + p.location,
            'time': p.created_at.strftime('%d %b %Y, %H:%M'),
            'ts': p.created_at.timestamp(),
        })

    for c in Crop.objects.select_related('farmer').order_by('-created_at')[:5]:
        name = c.farmer.get_full_name() or c.farmer.username
        activities.append({
            'type': 'crop_added',
            'icon': 'flower1',
            'color': 'primary',
            'message': name + ' added crop: ' + c.crop_name,
            'time': c.created_at.strftime('%d %b %Y, %H:%M'),
            'ts': c.created_at.timestamp(),
        })

    for s in Sale.objects.select_related('harvest__crop__farmer').order_by('-sale_date')[:5]:
        name = s.harvest.crop.farmer.get_full_name() or s.harvest.crop.farmer.username
        amt = '{:,.0f}'.format(float(s.total_amount))
        activities.append({
            'type': 'sale',
            'icon': 'cash-coin',
            'color': 'warning',
            'message': name + ' recorded sale of Rs.' + amt,
            'time': s.sale_date.strftime('%d %b %Y') if s.sale_date else 'N/A',
            'ts': s.created_at.timestamp() if hasattr(s, 'created_at') else 0,
        })

    for r in CropRecommendation.objects.select_related('farmer').order_by('-recommendation_date')[:5]:
        name = r.farmer.get_full_name() or r.farmer.username
        activities.append({
            'type': 'recommendation',
            'icon': 'cpu',
            'color': 'info',
            'message': name + ' got crop recommendation: ' + r.recommended_crop,
            'time': r.recommendation_date.strftime('%d %b %Y, %H:%M'),
            'ts': r.recommendation_date.timestamp(),
        })

    activities.sort(key=lambda x: -x['ts'])
    for a in activities:
        del a['ts']

    return Response(activities[:20])
