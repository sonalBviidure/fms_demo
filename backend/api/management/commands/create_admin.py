from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create default system admin user'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='systemadmin').exists():
            User.objects.create_superuser(
                username='systemadmin',
                password='adminsystem123',
                email='admin@fms.local',
                first_name='System',
                last_name='Admin'
            )
            self.stdout.write(self.style.SUCCESS('System admin created: systemadmin / adminsystem123'))
        else:
            self.stdout.write('System admin already exists.')
