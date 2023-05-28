import { Component, OnInit, NgZone, PLATFORM_ID, Inject, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { SubSink } from 'subsink';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import am4themes_dark from '@amcharts/amcharts4/themes/dark';
import * as moment from 'moment';
import { isPlatformBrowser } from '@angular/common';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

interface mappedDataXYChart{
  name : string;
  counter: number;
  objective: number;
}
@Component({
  selector: 'ms-xychart-column-series',
  templateUrl: './xychart-column-series.component.html',
  styleUrls: ['./xychart-column-series.component.scss']
})
export class XychartColumnSeriesComponent implements OnInit, OnDestroy, AfterViewInit {
  private chart: am4charts.XYChart;
  private subs = new SubSink();
  @Input() dataChart: mappedDataXYChart[];

  listCampus = [];
  scrollVertical = 0;
  scrollHorizontal = 0;
  dataGeneral: any;
  dataCampus = [];
  dataCampusIsNull = [];
  campusList: any[][] = [];
  fullDataUser;
  campusConnected;
  currentUser;
  isDirectorAdmission = false;
  isMemberAdmission = false;
  listFilter: any;
  lang: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId,
    private zone: NgZone,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = this.translate.currentLang;

      this.generateChart();
    });
  }

  ngAfterViewInit(): void {
    this.generateChart();
  }

  generateChart() {
    this.browserOnly(() => {
      am4core.useTheme(am4themes_animated);
      am4core.useTheme(am4themes_dark);
      const chart = am4core.create('chartdiv', am4charts.XYChart);
      // chart.padding(40, 40, 40, 40);
      chart.data = this.dataChart;

      const categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.dataFields.category = 'name';
      categoryAxis.renderer.minGridDistance = 30;
      categoryAxis.renderer.inversed = true;

      const valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
      valueAxis.min = 0;

      const series = chart.series.push(new am4charts.ColumnSeries());
      series.sequencedInterpolation = true
      series.dataFields.categoryY = 'name';
      series.dataFields.valueX = 'objective';
      series.columns.template.strokeOpacity = 0;
      series.clustered = false;
      series.columns.template.column.cornerRadiusBottomRight = 5;
      series.columns.template.column.cornerRadiusTopRight = 5;
      series.columns.template.column.fillOpacity = 0.6;

      const series2 = chart.series.push(new am4charts.ColumnSeries());
      series2.sequencedInterpolation = true
      series2.dataFields.categoryY = 'name';
      series2.dataFields.valueX = 'counter';
      series2.columns.template.strokeWidth = 2;
      series2.clustered = false;
      series2.columns.template.width = am4core.percent(5);

      if (this.lang === 'fr') {
        series2.tooltipText = 'Actif: [bold]{valueX.value}';
        series.tooltipText = 'Total apprenants: [bold]{valueX.value}';
      } else {
        series2.tooltipText = 'Active: [bold]{valueX.value}';
        series.tooltipText = 'Total Student: [bold]{valueX.value}';
      }


      const labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.horizontalCenter = 'left';
      labelBullet.label.dx = 10;
      // labelBullet.label.text = '{values.valueX.workingValue.formatNumber("#.0as")}';
      labelBullet.locationX = 1;

      const labelBullet1 = series2.bullets.push(new am4charts.LabelBullet());
      labelBullet1.label.horizontalCenter = 'left';
      labelBullet1.label.dx = 10;
      // labelBullet1.label.text = '{values.valueX.workingValue.formatNumber("#.0as")}';
      labelBullet1.locationX = 1;

      // as by default columns of the same series are of the same color, we add adapter which takes colors from chart.colors color set
      // series.columns.template.adapter.add('fill', function (fill, target) {
      //   return chart.colors.getIndex(target.dataItem.index);
      // });

      // on hover, make corner radiuses bigger
      const hoverState = series.columns.template.column.states.create('hover');
      series.columns.template.column.cornerRadiusBottomRight = 0;
      series.columns.template.column.cornerRadiusTopRight = 0;
      hoverState.properties.fillOpacity = 1;

      // as by default columns of the same series are of the same color, we add adapter which takes colors from chart.colors color set
      series2.columns.template.adapter.add('fill', function (fill, target) {
        return chart.colors.getIndex(target.dataItem.index);
      });

      chart.cursor = new am4charts.XYCursor();
      chart.cursor.lineX.disabled = true;
      chart.cursor.lineY.disabled = true;
      // categoryAxis.sortBySeries = series;
      chart.responsive.enabled = true;

      const cellSize = 30;
      chart.events.on('datavalidated', function (ev) {
        // Get objects of interest
        const charts = ev.target;
        const categoryAxiss = charts.yAxes.getIndex(0);

        // Calculate how we need to adjust chart height
        const adjustHeight = charts.data.length * cellSize - categoryAxiss.pixelHeight;

        // get current chart height
        const targetHeight = charts.pixelHeight + adjustHeight;

        // Set it on chart's container
        charts.svgContainer.htmlElement.style.height = targetHeight + 'px';
      });
      this.chart = chart;
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
    this.subs.unsubscribe();
  }

}
