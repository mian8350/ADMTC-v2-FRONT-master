import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuideRoutingModule } from './guide-routing.module';
import { AutoPromoComponent } from './auto-promo/auto-promo.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { UserComponent } from './user/user.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [AutoPromoComponent, UserComponent],
  imports: [
    CommonModule,
    GuideRoutingModule,
    SweetAlert2Module.forRoot(),
    SharedModule
  ]
})
export class GuideModule { }
