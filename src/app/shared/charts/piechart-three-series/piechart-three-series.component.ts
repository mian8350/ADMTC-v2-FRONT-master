import { AfterViewInit, Component, Inject, Input, NgZone, OnChanges, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { isPlatformBrowser } from '@angular/common';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import am4themes_dark from '@amcharts/amcharts4/themes/dark';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
interface mappedDataPieChart {
  name: string;
  name_fr?: string;
  counter: number;
}
@Component({
  selector: 'ms-piechart-three-series',
  templateUrl: './piechart-three-series.component.html',
  styleUrls: ['./piechart-three-series.component.scss']
})
export class PiechartThreeSeriesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() dataMapping: mappedDataPieChart[];
  @Input() rncpId;
  @Input() classId;
  @Input() isDonut;
  @Input() chartType;

  private subs = new SubSink();
  lang: any;

  constructor(@Inject(PLATFORM_ID) private platformId, private zone: NgZone, private router: Router, private translate: TranslateService,) { }

  ngOnInit() {
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = this.translate.currentLang;

      this.generateChart();
    });
  }

  ngAfterViewInit(): void {
    this.lang = this.translate.currentLang;
    this.generateChart();
  }

  generateChart() {
    this.browserOnly(() => {
      am4core.useTheme(am4themes_animated);
      am4core.useTheme(am4themes_dark);

      if (this.dataMapping && this.dataMapping.length) {
        const chart = this.chartType === 'school' ? am4core.create('chartDivSchool', am4charts.PieChart3D)
          : this.chartType === 'task' ? am4core.create('chartDivTask', am4charts.PieChart3D)
            : am4core.create('chartDivCompany', am4charts.PieChart3D);
        if (this.isDonut) {
          chart.innerRadius = am4core.percent(40);
        }

        if (this.chartType === 'task') {
          chart.legend = new am4charts.Legend();
          chart.legend.position = "right";
          chart.legend.valign = "bottom";
          // chart.legend.x = 1500;
          // chart.legend.y = 0;
          chart.legend.valueLabels.template.align = "left"
          chart.legend.valueLabels.template.textAlign = "start"
          // chart.legend.maxHeight = 50;
          // chart.legend.maxWidth = 100;
          chart.legend.scrollable = true
          chart.legend.markers.template.width = 12;
          chart.legend.markers.template.height = 12;
          chart.legend.labels.template.fontSize = 12;
          chart.legend.valueLabels.template.fontSize = 12;
          chart.legend.itemContainers.template.paddingTop = 0;
        } else if (this.chartType === 'company') {
          chart.legend = new am4charts.Legend();
          chart.legend.position = "right";
          chart.legend.valign = "bottom";
          // chart.legend.x = 150;
          // chart.legend.y = 120;
          chart.legend.valueLabels.template.align = "left"
          chart.legend.valueLabels.template.textAlign = "start"
          // chart.legend.maxHeight = 50;
          // chart.legend.maxWidth = 50;
          chart.legend.scrollable = true
          chart.legend.markers.template.width = 12;
          chart.legend.markers.template.height = 12;
          chart.legend.labels.template.fontSize = 12;
          chart.legend.valueLabels.template.fontSize = 12;
          chart.legend.itemContainers.template.paddingTop = 0;
          chart.colors.list = [
            am4core.color("#4b87e8"),
            am4core.color("#c27ba0"),
          ];
        } else if (this.chartType === 'school') {
          chart.legend = new am4charts.Legend();
          chart.legend.position = "right";
          chart.legend.valign = "bottom";
          // chart.legend.x = 150;
          // chart.legend.y = 120;
          chart.legend.valueLabels.template.align = "left"
          chart.legend.valueLabels.template.textAlign = "start"
          // chart.legend.maxHeight = 50;
          // chart.legend.maxWidth = 50;
          chart.legend.scrollable = true
          chart.legend.markers.template.width = 12;
          chart.legend.markers.template.height = 12;
          chart.legend.labels.template.fontSize = 12;
          chart.legend.valueLabels.template.fontSize = 12;
          chart.legend.itemContainers.template.paddingTop = 0;
        }

        chart.data = [];
        // Add data
        chart.data = this.dataMapping;

        // Add and configure Series
        const pieSeries = chart.series.push(new am4charts.PieSeries3D());
        pieSeries.dataFields.value = 'counter';
        if (this.chartType === 'company') {
          if (this.lang === 'en') {

            pieSeries.dataFields.category = 'name';
          } else if (this.lang === 'fr') {

            pieSeries.dataFields.category = 'name_fr';
          }
        } else {
          pieSeries.dataFields.category = 'name';
        }
        pieSeries.slices.template.stroke = am4core.color('#fff');
        pieSeries.slices.template.strokeWidth = 2;
        pieSeries.slices.template.strokeOpacity = 1;

        // This creates initial animation
        pieSeries.hiddenState.properties.opacity = 1;
        pieSeries.hiddenState.properties.endAngle = -90;
        pieSeries.hiddenState.properties.startAngle = -90;
        chart.numberFormatter.numberFormat = '#.';
        // pieSeries.labels.template.maxWidth = 100;
        // pieSeries.labels.template.wrap = true;
        pieSeries.labels.template.fontSize = 12;

        if (this.chartType === 'company') {
          pieSeries.labels.template.text = "{category}";
          pieSeries.slices.template.tooltipText = "{category}: {value.value}";
          chart.legend.valueLabels.template.text = "{value.value}";
        } else if (this.chartType === 'task') {
          pieSeries.labels.template.fontSize = 11;
          chart.legend.valueLabels.template.text = "{value.value}";
        }
      }
    });
  }

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }
}
