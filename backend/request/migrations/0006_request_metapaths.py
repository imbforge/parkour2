# Generated by Django 4.2.7 on 2023-11-30 15:34

import request.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("request", "0005_request_token"),
    ]

    operations = [
        migrations.AddField(
            model_name="request",
            name="metapaths",
            field=models.JSONField(default=request.models.metapaths_default),
        ),
    ]