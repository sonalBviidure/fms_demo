from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from api.models import FarmerProfile, Field, Crop, Expense, SystemAnnouncement


class SystemAdminApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_superuser(
            username='admin_test',
            password='password123',
            email='admin@test.local',
            first_name='Admin',
            last_name='User'
        )
        self.client.force_authenticate(user=self.admin)

        # Farmer user
        self.farmer_user = User.objects.create_user(
            username='farmer_test',
            password='farmerpassword',
            first_name='Kisan',
            last_name='Kumar',
            email='farmer@test.local'
        )
        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            phone='9999900001',
            location='Pune',
            total_acres=5.0
        )

        self.field = Field.objects.create(
            farmer=self.farmer_user,
            field_name='North Farm',
            land_area=5.0,
            soil_type='Black'
        )

        self.crop = Crop.objects.create(
            farmer=self.farmer_user,
            field=self.field,
            crop_name='Soybean',
            variety='JS 335',
            season='Kharif',
            sowing_date='2026-06-15',
            status='Sown'
        )

    def test_admin_dashboard_stats(self):
        url = reverse('admin-stats')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('summary', res.json())
        self.assertEqual(res.json()['summary']['total_farmers'], 1)

    def test_admin_farmers_list(self):
        url = reverse('admin-farmers')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'farmer_test')

    def test_admin_create_farmer(self):
        url = reverse('admin-create-farmer')
        payload = {
            'username': 'new_kisan',
            'phone': '9876543219',
            'password': 'password123',
            'full_name': 'New Kisan',
            'location': 'Nashik',
            'total_acres': 8.5
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='new_kisan').exists())

    def test_admin_crop_status_update(self):
        url = reverse('admin-crop-status', kwargs={'crop_id': self.crop.id})
        res = self.client.patch(url, {'status': 'Growing'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.crop.refresh_from_db()
        self.assertEqual(self.crop.status, 'Growing')

    def test_admin_announcements_flow(self):
        url = reverse('admin-announcements')
        # Create
        res = self.client.post(url, {
            'title': 'Test Notice',
            'message': 'Weather alert in effect',
            'priority': 'warning'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # List
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.json()) >= 1)

    def test_admin_system_health(self):
        url = reverse('admin-system-health')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['status'], 'Healthy')
        self.assertIn('database', data)
        self.assertIn('table_counts', data)
