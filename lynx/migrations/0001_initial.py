# Generated by Django 4.2.7 on 2023-11-23 20:45

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Link',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_viewed_at', models.DateTimeField(null=True)),
                ('original_url', models.URLField(max_length=2000)),
                ('cleaned_url', models.URLField(max_length=1000)),
                ('hostname', models.CharField(blank=True, max_length=500)),
                ('article_date', models.DateField()),
                ('author', models.CharField(blank=True, max_length=255)),
                ('title', models.CharField(blank=True, max_length=500)),
                ('excerpt', models.TextField(blank=True)),
                ('header_image_url', models.URLField(blank=True)),
                ('article_html', models.TextField(blank=True)),
                ('raw_text_content', models.TextField(blank=True)),
                ('full_page_html', models.TextField(blank=True)),
                ('summary', models.TextField(blank=True)),
                ('read_time_seconds', models.IntegerField(blank=True)),
                ('read_time_display', models.CharField(blank=True, max_length=100)),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
