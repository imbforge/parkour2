# Generated by Django 3.2.16 on 2023-09-29 08:53

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sample', '0007_auto_20230929_1053'),
        ('library_sample_shared', '0011_auto_20230731_1621'),
    ]

    operations = [
        migrations.AddField(
            model_name='libraryprotocol',
            name='nucleic_acid_type',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='sample.nucleicacidtype', verbose_name='nucleic acid type'),
        ),
        migrations.AlterField(
            model_name='libraryprotocol',
            name='type',
            field=models.CharField(blank=True, choices=[('DNA', 'DNA'), ('RNA', 'RNA')], default='DNA', max_length=3, verbose_name='Type'),
        ),
    ]