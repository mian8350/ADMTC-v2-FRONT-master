import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-origin-class-selection',
  templateUrl: './origin-class-selection.component.html',
  styleUrls: ['./origin-class-selection.component.scss'],
})
export class OriginClassSelectionComponent implements OnInit, OnDestroy, OnChanges {
  rncpId: any;
  @Input() classData;
  classParent: any;
  classes: any;
  originClass;
  class: any;
  isWaitingForResponse = true;
  searchForm = new UntypedFormControl('');
  private subs = new SubSink();
  @Input() currentClassId;

  @Output() triggerRefresh = new EventEmitter<Boolean>();
  classId: any;
  parentRncpId: any;
  private timeOutVal: any;

  constructor(private route: ActivatedRoute, private rncpService: RNCPTitlesService, private translate: TranslateService) {}

  ngOnInit() {
  }

  ngOnChanges() {
    this.rncpId = this.route.snapshot.paramMap.get('rncpId');

    if (this.classData && this.classData.origin_class && this.classData.origin_class._id) {
      this.searchForm.setValue(this.classData.origin_class._id);
      this.displayClass(this.classData.origin_class._id)
    }
    this.getListClass();
    this.getParentRncp();
    this.initFilter();
  }

  initFilter() {
    this.subs.sink = this.searchForm.valueChanges.pipe().subscribe(resp => {
      if (resp) {
        const temp = _.cloneDeep(this.originClass);


        if (temp) {
          this.classes = temp.filter((classesdata) => {
            return classesdata && classesdata.name ? classesdata.name.toLowerCase().includes(resp.toLowerCase()) : false
          });
        }
      } else {
        this.classes = _.cloneDeep(this.originClass);
      }
    })
  }

  getListClass() {
    this.subs.sink = this.rncpService.getClassByRncpTitleDuplicate(this.rncpId).subscribe((resp) => {
      this.classes = resp.filter((list) => list._id !== this.currentClassId);
      this.originClass = _.cloneDeep(this.classes);

      if (this.classData && this.classData.origin_class && this.classData.origin_class._id) {
        this.displayClass(this.classData.origin_class._id)
      }
    });
  }

  getParentRncp() {
    this.subs.sink = this.rncpService.getClassById(this.currentClassId).subscribe((resp) => {
      this.classParent = resp;

      this.parentRncpId = this.classParent && this.classParent.parent_rncp_title ? this.classParent.parent_rncp_title : null;
    });
  }

  displayClass(value) {
    if (value) {
      let className = null
      if (this.classes && this.classes.length) {
        className = this.classes.find((list) => list._id === value)
        return className ? className.name : '';
      }
    } else {
      return null;
    }
  }

  displayClassDisabled(value) {
    if (value) {
      let className = null
      if (this.classes && this.classes.length) {
        className = this.classes.find((list) => list._id === value)
        return className ? className.name : '';
      }
    } else {
      return null;
    }
  }

  onSelect() {
    this.isWaitingForResponse = true;
    const getForm = this.searchForm.value;

    const getIdClass = this.originClass.find((dataClass) => dataClass._id === getForm);
    const originClassId = getIdClass ? getIdClass._id : null ;
    const payload = {
      origin_class: originClassId,
      class_duplication_status: 'class_selected',
      parent_rncp_title: this.parentRncpId._id,
    };
    if (this.classData && this.classData.class_duplication_status && this.classData.class_duplication_status !== 'not_started') {
      delete payload.class_duplication_status;
    }
    if (originClassId) {
      const className = getIdClass ? getIdClass.name : '';
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('Duplicate_Class.TITLE'),
        html: this.translate.instant('Duplicate_Class.TEXT', { class_name: className }),
        footer: `<span style="margin-left: auto">Duplicate_Class</span>`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('Duplicate_Class.BUTTON_1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('Duplicate_Class.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('Duplicate_Class.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('Duplicate_Class.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.subs.sink = this.rncpService.updateClass(this.currentClassId, payload).subscribe(
            (response) => {
              this.isWaitingForResponse = false;

              this.triggerRefresh.emit(true);
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
                allowEscapeKey: true,
                confirmButtonText: 'Okay',
              });
            },
            (err) => {
              this.isWaitingForResponse = false;
            },
          );
        } else {
          this.isWaitingForResponse = false;
        }
      })
    }
    // this.subs.sink = this.rncpService.getClassForDuplication(getIdClass[0]._id).subscribe(resp => {
    //   this.class = resp;

    //   Swal.fire({
    //     type: 'success',
    //     title: 'Bravo!',
    //     allowEscapeKey: true,
    //     confirmButtonText: 'Okay',
    //   });
    //   this.isWaitingForResponse = false;
    // },
    // (err) => {

    // })
    //  const payload = this.createPayload();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
