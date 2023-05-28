import Swal from 'sweetalert2';
import { filter } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { is } from '@amcharts/amcharts4/core';

@Component({
  selector: 'ms-copy-notification-dialog',
  templateUrl: './copy-notification-dialog.component.html',
  styleUrls: ['./copy-notification-dialog.component.scss']
})
export class CopyNotificationDialogComponent implements OnInit, OnDestroy{
  private subs = new SubSink();

  formCopyNotif: FormGroup;
  templateFormBuilder: any;

  notifAndMessage: any;
  tempNotifAndMessage: any;
  
  constructor(
    private fb:FormBuilder,
    private dialogRef:MatDialogRef<CopyNotificationDialogComponent>,
    private formBuilderService:FormBuilderService
  ) { }

  ngOnInit(): void {
    this.initFormCopyNotif();
    this.getAllTemplateFormBuilders();
    this.filterNotif();
  }

  getAllTemplateFormBuilders(){
    this.subs.sink = this.formBuilderService?.getAllFormTemplate()?.subscribe((resp)=>{
      this.templateFormBuilder = resp;
    });
  }
  
  initFormCopyNotif(){
    this.formCopyNotif = this.fb.group({
      form_builder_id: [null, [Validators.required]],
      notification_id: [null, [Validators.required]]
    })
  }

  filterNotif(){
    return this.formCopyNotif?.get('form_builder_id')?.valueChanges?.subscribe((resp_id)=>{
      this.formCopyNotif.get('notification_id').setValue(null);
      this.getNotifAndMessage(resp_id);
    })
  }

  getNotifAndMessage(id:any){
    if(id){
      this.subs.sink = this.formBuilderService?.getAllStepsNotifAndMessages(id)?.subscribe((resp)=>{
          this.notifAndMessage = resp?.map((value)=>{
            return value;
          })
      });
    }else{
      this.notifAndMessage = [];
    }
  }

  submitCopyNotif(){
    let notif_id:any = this.formCopyNotif.value;
    let dataNotif:any = this.notifAndMessage.filter((resp)=> resp._id == notif_id.notification_id);
    
    let payload = {
      subject: dataNotif[0]?.subject,
      body: dataNotif[0]?.body
    }
    
    Swal.fire({
      title: 'Bravo !',
      type: 'success',
      allowOutsideClick: false
    }).then(()=>{
      this.dialogRef.close(payload);
    })
  }
  
  closeDialog(){
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }

}
