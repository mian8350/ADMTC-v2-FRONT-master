import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryComponent } from './history/history.component';
import { SharedModule } from 'app/shared/shared.module';
import { HistoryRoutingModule } from './history-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { ViewHistoryComponent } from './view-history/view-history.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { HistoryParentTabComponent } from './history-parent-tab/history-parent-tab.component';

@NgModule({
    declarations: [HistoryComponent, ViewHistoryComponent, HistoryParentTabComponent],
    imports: [CommonModule, SharedModule, HistoryRoutingModule, TranslateModule, NgxMaterialTimepickerModule],
    providers: [DatePipe]
})
export class HistoryModule {}
