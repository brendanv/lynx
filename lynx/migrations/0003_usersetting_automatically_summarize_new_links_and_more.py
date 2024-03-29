# Generated by Django 5.0.2 on 2024-02-09 03:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lynx', '0002_link_content_search'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersetting',
            name='automatically_summarize_new_links',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usersetting',
            name='summarization_model',
            field=models.CharField(choices=[('gpt-3.5-turbo', 'gpt-3.5-turbo'), ('gpt-3.5-turbo-0125', 'gpt-3.5-turbo-0125'), ('gpt-4', 'gpt-4'), ('gpt-4-turbo-preview', 'gpt-4-turbo-preview')], default='gpt-3.5-turbo', max_length=255),
        ),
    ]
