# Generated by Django 5.0.2 on 2024-02-11 19:52

import django.db.models.manager
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('lynx', '0003_usersetting_automatically_summarize_new_links_and_more'),
    ]

    operations = [
        migrations.AlterModelManagers(
            name='link',
            managers=[
                ('objects_with_full_content', django.db.models.manager.Manager()),
            ],
        ),
    ]
