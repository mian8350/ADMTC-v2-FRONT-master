import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageDropDownComponent } from './global/language-drop-down/language-drop-down.component';

@NgModule({
	declarations: [
		LanguageDropDownComponent
	],
	imports: [
		CommonModule,
		MatCardModule,
		FlexLayoutModule,
		MatButtonModule,
		MatMenuModule,
		TranslateModule,
	],
	exports: [
		LanguageDropDownComponent
	]
})

export class WidgetComponentModule { }
