# Generated by Django 3.2.16 on 2023-07-02 16:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('flowcell', '0005_remove_sequencer_lanes'),
    ]

    operations = [
        migrations.AddField(
            model_name='flowcell',
            name='index1_cycles',
            field=models.PositiveSmallIntegerField(default=1, verbose_name='index 1 cycles'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='flowcell',
            name='index2_cycles',
            field=models.PositiveSmallIntegerField(default=1, verbose_name='index 2 cycles'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='flowcell',
            name='library_prep_kits',
            field=models.CharField(blank=True, help_text='For samplesheet', max_length=200, verbose_name='library prep kits'),
        ),
        migrations.AddField(
            model_name='flowcell',
            name='read1_cycles',
            field=models.PositiveSmallIntegerField(default=1, verbose_name='read 1 cycles'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='flowcell',
            name='read2_cycles',
            field=models.PositiveSmallIntegerField(default=1, verbose_name='read 2 cycles'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='flowcell',
            name='run_name',
            field=models.CharField(default='run_name', help_text='For samplesheet', max_length=200, verbose_name='run name'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='sequencer',
            name='bclconvert_version',
            field=models.CharField(default='1.1.1', help_text='For samplesheet', max_length=50, verbose_name='BCLconvert version'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='sequencer',
            name='instrument_platform',
            field=models.CharField(default='NextSeq', help_text='For samplesheet', max_length=50, verbose_name='instrument platform'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='sequencer',
            name='instrument_type',
            field=models.CharField(default='NextSeq', help_text='For samplesheet', max_length=50, verbose_name='instrument type'),
            preserve_default=False,
        ),
    ]