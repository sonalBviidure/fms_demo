import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    FarmerProfile, Field, Crop, Expense, Harvest, Sale,
    FinancialAnalysis, CropRecommendation, YieldPrediction,
    ProfitPrediction, SystemAnnouncement
)


class Command(BaseCommand):
    help = 'Seeds realistic sample data for farmers, operations, and website analytics'

    def handle(self, *args, **options):
        self.stdout.write('Seeding comprehensive demonstration data...')

        # 1. System Admin user
        admin_user, _ = User.objects.get_or_create(
            username='systemadmin',
            defaults={
                'email': 'admin@fms.local',
                'first_name': 'System',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('adminsystem123')
        admin_user.save()

        # 2. System Announcements
        announcements_data = [
            {
                'title': 'Heavy Monsoon Rainfall Advisory for Western Maharashtra',
                'message': 'IMD has issued an alert for heavy to very heavy precipitation in Kolhapur, Sangli, and Satara districts. Ensure proper field drainage to prevent waterlogging in soybean and sugarcane plots.',
                'priority': 'warning',
            },
            {
                'title': 'PM-Kisan 17th Installment DBT Disbursement Live',
                'message': 'Beneficiary farmers can check their DBT credit status through their bank accounts or visit the local CSC center with Aadhaar number.',
                'priority': 'success',
            },
            {
                'title': 'Fall Armyworm Infestation Alert on Maize Crops',
                'message': 'Department of Agriculture advises regular pheromone trap monitoring and application of recommended bio-pesticides upon reaching threshold levels.',
                'priority': 'danger',
            },
            {
                'title': 'FMS Platform 3.2 Feature Release: Live Mandi Intel',
                'message': 'Farmers and managers can now monitor real-time APMC mandi modal prices across 12 major commodities in Maharashtra.',
                'priority': 'info',
            },
        ]

        for ann in announcements_data:
            SystemAnnouncement.objects.get_or_create(
                title=ann['title'],
                defaults={
                    'message': ann['message'],
                    'priority': ann['priority'],
                    'is_active': True,
                    'created_by': admin_user
                }
            )

        # 3. Sample Farmers
        farmers_spec = [
            {
                'username': 'ramesh_patil',
                'phone': '9822012345',
                'first_name': 'Ramesh',
                'last_name': 'Patil',
                'location': 'Karveer, Kolhapur',
                'acres': Decimal('12.5'),
                'fields': [
                    {'name': 'Gat No. 102 - Riverbank Plot', 'area': Decimal('7.5'), 'soil': 'Black'},
                    {'name': 'Gat No. 105 - High Garden', 'area': Decimal('5.0'), 'soil': 'Loamy'},
                ],
                'crops': [
                    {
                        'crop_name': 'Sugarcane',
                        'variety': 'Co 86032',
                        'season': 'Annual',
                        'field_idx': 0,
                        'sowing_days_ago': 280,
                        'status': 'Growing',
                        'expenses': [
                            ('Seeds', 'Sugarcane sets Co 86032', Decimal('22000'), 270),
                            ('Labour', 'Planting & ridge formation labor', Decimal('15000'), 265),
                            ('Fertilizers', 'Basal dose DAP & Potash', Decimal('18500'), 240),
                            ('Irrigation', 'Drip system maintenance & power', Decimal('8000'), 150),
                            ('Fertilizers', 'Urea & Micronutrient spray', Decimal('12000'), 90),
                            ('Labour', 'Inter-cultivation and weeding', Decimal('9500'), 60),
                        ],
                        'harvest': None,
                        'sale': None,
                    },
                    {
                        'crop_name': 'Soybean',
                        'variety': 'JS 335',
                        'season': 'Kharif',
                        'field_idx': 1,
                        'sowing_days_ago': 120,
                        'status': 'Harvested',
                        'expenses': [
                            ('Seeds', 'Certified JS 335 seed bags', Decimal('6200'), 115),
                            ('Machinery', 'Tractor rotavator & sowing', Decimal('7500'), 112),
                            ('Fertilizers', 'Single Super Phosphate & Zinc', Decimal('5800'), 100),
                            ('Pesticides', 'Chlorantraniliprole insect spray', Decimal('4200'), 70),
                            ('Labour', 'Harvesting & threshing charges', Decimal('8500'), 20),
                            ('Transportation', 'Transport to APMC market', Decimal('3000'), 10),
                        ],
                        'harvest': {'qty': Decimal('48.5'), 'unit': 'Quintals', 'days_ago': 15},
                        'sale': {'qty': Decimal('48.5'), 'price': Decimal('4900'), 'buyer': 'Kolhapur Shetkari Mandi', 'days_ago': 10},
                    }
                ]
            },
            {
                'username': 'suresh_shinde',
                'phone': '9822987654',
                'first_name': 'Suresh',
                'last_name': 'Shinde',
                'location': 'Baramati, Pune',
                'acres': Decimal('8.0'),
                'fields': [
                    {'name': 'Plot A - Canal Side', 'area': Decimal('5.0'), 'soil': 'Alluvial'},
                    {'name': 'Plot B - Malshiras Road', 'area': Decimal('3.0'), 'soil': 'Black'},
                ],
                'crops': [
                    {
                        'crop_name': 'Wheat',
                        'variety': 'GW 496',
                        'season': 'Rabi',
                        'field_idx': 0,
                        'sowing_days_ago': 95,
                        'status': 'Growing',
                        'expenses': [
                            ('Seeds', 'GW 496 wheat seeds', Decimal('4500'), 90),
                            ('Machinery', 'Ploughing & sowing tractor rent', Decimal('6000'), 88),
                            ('Fertilizers', 'NPK 10:26:26 & Urea', Decimal('8400'), 70),
                            ('Irrigation', 'Canal rotational water charges', Decimal('3200'), 40),
                        ],
                        'harvest': None,
                        'sale': None,
                    },
                    {
                        'crop_name': 'Maize',
                        'variety': 'Pioneer 3396',
                        'season': 'Kharif',
                        'field_idx': 1,
                        'sowing_days_ago': 130,
                        'status': 'Harvested',
                        'expenses': [
                            ('Seeds', 'Hybrid Maize Pioneer', Decimal('4800'), 125),
                            ('Fertilizers', 'Complex fertilizers', Decimal('7200'), 105),
                            ('Labour', 'Weeding & earthing up', Decimal('5000'), 80),
                            ('Labour', 'Cob plucking & threshing', Decimal('6500'), 25),
                        ],
                        'harvest': {'qty': Decimal('62.0'), 'unit': 'Quintals', 'days_ago': 20},
                        'sale': {'qty': Decimal('60.0'), 'price': Decimal('2250'), 'buyer': 'Pune Feed Mill Corp', 'days_ago': 15},
                    }
                ]
            },
            {
                'username': 'anita_deshmukh',
                'phone': '9423112233',
                'first_name': 'Anita',
                'last_name': 'Deshmukh',
                'location': 'Niphad, Nashik',
                'acres': Decimal('6.0'),
                'fields': [
                    {'name': 'Vinyard & Onion Parcel', 'area': Decimal('6.0'), 'soil': 'Red'},
                ],
                'crops': [
                    {
                        'crop_name': 'Onion',
                        'variety': 'Fursungi Red',
                        'season': 'Rabi',
                        'field_idx': 0,
                        'sowing_days_ago': 70,
                        'status': 'Growing',
                        'expenses': [
                            ('Seeds', 'Nursery seedling purchase', Decimal('12000'), 65),
                            ('Labour', 'Transplanting seedling workforce', Decimal('16000'), 60),
                            ('Fertilizers', 'Sulphur, Potash & 19:19:19', Decimal('11500'), 45),
                            ('Pesticides', 'Fungicide for purple blotch', Decimal('4800'), 30),
                        ],
                        'harvest': None,
                        'sale': None,
                    }
                ]
            },
            {
                'username': 'vitthal_chavan',
                'phone': '9765432109',
                'first_name': 'Vitthal',
                'last_name': 'Chavan',
                'location': 'Tasgaon, Sangli',
                'acres': Decimal('10.0'),
                'fields': [
                    {'name': 'Gat 84 - Tasgaon Mal', 'area': Decimal('6.0'), 'soil': 'Loamy'},
                    {'name': 'Gat 85 - Drip Well Plot', 'area': Decimal('4.0'), 'soil': 'Black'},
                ],
                'crops': [
                    {
                        'crop_name': 'Cotton',
                        'variety': 'RCH 659 BG II',
                        'season': 'Kharif',
                        'field_idx': 0,
                        'sowing_days_ago': 160,
                        'status': 'Harvested',
                        'expenses': [
                            ('Seeds', 'Bt Cotton seed packets', Decimal('7800'), 155),
                            ('Machinery', 'Land preparation & ridging', Decimal('9000'), 150),
                            ('Fertilizers', 'NPK & Zinc chelate', Decimal('14500'), 120),
                            ('Pesticides', 'Pink bollworm spray rounds', Decimal('8900'), 80),
                            ('Labour', 'Cotton picking round 1 & 2', Decimal('16000'), 35),
                            ('Transportation', 'APMC Mandi freight', Decimal('4500'), 15),
                        ],
                        'harvest': {'qty': Decimal('36.0'), 'unit': 'Quintals', 'days_ago': 25},
                        'sale': {'qty': Decimal('36.0'), 'price': Decimal('7200'), 'buyer': 'Sangli Cotton Ginning Mill', 'days_ago': 18},
                    }
                ]
            },
        ]

        now = datetime.datetime.now().date()

        for spec in farmers_spec:
            user, created = User.objects.get_or_create(
                username=spec['username'],
                defaults={
                    'first_name': spec['first_name'],
                    'last_name': spec['last_name'],
                    'email': f"{spec['username']}@farm.local",
                    'is_active': True,
                }
            )
            user.set_password('farmer123')
            user.save()

            profile, _ = FarmerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone': spec['phone'],
                    'location': spec['location'],
                    'total_acres': spec['acres'],
                }
            )

            # Fields
            created_fields = []
            for f_spec in spec['fields']:
                f_obj, _ = Field.objects.get_or_create(
                    farmer=user,
                    field_name=f_spec['name'],
                    defaults={
                        'land_area': f_spec['area'],
                        'soil_type': f_spec['soil'],
                    }
                )
                created_fields.append(f_obj)

            # Crops
            for c_spec in spec['crops']:
                target_field = created_fields[c_spec['field_idx']]
                sowing_dt = now - datetime.timedelta(days=c_spec['sowing_days_ago'])
                crop_obj, _ = Crop.objects.get_or_create(
                    farmer=user,
                    crop_name=c_spec['crop_name'],
                    field=target_field,
                    defaults={
                        'variety': c_spec['variety'],
                        'season': c_spec['season'],
                        'sowing_date': sowing_dt,
                        'status': c_spec['status'],
                    }
                )

                # Expenses
                for cat, desc, amt, days_ago in c_spec['expenses']:
                    exp_dt = now - datetime.timedelta(days=days_ago)
                    Expense.objects.get_or_create(
                        crop=crop_obj,
                        expense_category=cat,
                        description=desc,
                        amount=amt,
                        expense_date=exp_dt,
                    )

                # Harvest
                harvest_obj = None
                if c_spec.get('harvest'):
                    h_info = c_spec['harvest']
                    h_dt = now - datetime.timedelta(days=h_info['days_ago'])
                    harvest_obj, _ = Harvest.objects.get_or_create(
                        crop=crop_obj,
                        harvest_date=h_dt,
                        defaults={
                            'quantity_harvested': h_info['qty'],
                            'unit': h_info['unit'],
                        }
                    )

                # Sale
                if c_spec.get('sale') and harvest_obj:
                    s_info = c_spec['sale']
                    s_dt = now - datetime.timedelta(days=s_info['days_ago'])
                    Sale.objects.get_or_create(
                        harvest=harvest_obj,
                        sale_date=s_dt,
                        defaults={
                            'quantity_sold': s_info['qty'],
                            'selling_price': s_info['price'],
                            'buyer_name': s_info['buyer'],
                        }
                    )

                # Financial Analysis
                tot_expenses = sum(Decimal(amt) for _, _, amt, _ in c_spec['expenses'])
                tot_rev = Decimal('0.00')
                if c_spec.get('sale'):
                    tot_rev = Decimal(c_spec['sale']['qty']) * Decimal(c_spec['sale']['price'])
                
                net_pl = tot_rev - tot_expenses
                area = Decimal(target_field.land_area)
                cost_acre = round(tot_expenses / area, 2) if area > 0 else Decimal('0.00')
                pl_acre = round(net_pl / area, 2) if area > 0 else Decimal('0.00')

                FinancialAnalysis.objects.update_or_create(
                    crop=crop_obj,
                    defaults={
                        'total_cost': tot_expenses,
                        'total_revenue': tot_rev,
                        'profit_loss': net_pl,
                        'cost_per_acre': cost_acre,
                        'profit_per_acre': pl_acre,
                    }
                )

                # AI Recommendations / Yield Predictions
                CropRecommendation.objects.get_or_create(
                    farmer=user,
                    recommended_crop=c_spec['crop_name'],
                    season=c_spec['season'],
                    soil_type=target_field.soil_type,
                    defaults={
                        'weather_conditions': 'Moderate 750-900mm rainfall, avg temp 27°C',
                        'irrigation_type': 'Drip / Furrow',
                    }
                )

                YieldPrediction.objects.get_or_create(
                    crop=crop_obj,
                    land_area=target_field.land_area,
                    season=c_spec['season'],
                    soil_type=target_field.soil_type,
                    defaults={
                        'rainfall': Decimal('780.0'),
                        'predicted_yield': Decimal('45.0') if c_spec['crop_name'] == 'Soybean' else Decimal('35.0'),
                        'fertilizer_use': 'NPK balanced',
                    }
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded comprehensive agricultural demonstration data!'))
