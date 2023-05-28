import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MailboxComponent } from './mailbox/mailbox.component';
import { SentboxComponent } from './sent-box/sent-box.component';
import { ImportantboxComponent } from './important/important.component';
import { TrashComponent } from './trash/trash.component';
import { DraftComponent } from './draft/draft.component';
import { SharedModule } from 'app/shared/shared.module';
import { MailboxRoutingModule } from './mailbox-routing.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { MailToGroupDialogComponent } from './mail-to-group-dialog/mail-to-group-dialog.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CcComponent } from './cc/cc.component';

@NgModule({
    declarations: [MailboxComponent, SentboxComponent, ImportantboxComponent, TrashComponent, DraftComponent, CcComponent],
    imports: [CommonModule, SharedModule, MailboxRoutingModule, CKEditorModule, NgSelectModule],
    exports: [MailboxComponent, SentboxComponent, ImportantboxComponent, TrashComponent, DraftComponent, CcComponent]
})
export class MailboxModule {}
