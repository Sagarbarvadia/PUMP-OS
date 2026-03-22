# Generated migration for adding gst_percent to BOM

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bom', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bom',
            name='gst_percent',
            field=models.IntegerField(choices=[(0, '0%'), (5, '5%'), (12, '12%'), (18, '18%')], default=18),
        ),
    ]
