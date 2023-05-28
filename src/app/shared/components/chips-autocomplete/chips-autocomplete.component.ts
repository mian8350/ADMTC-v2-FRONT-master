import { Component, ElementRef, ViewChild, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

enum ReturnType {
  LABEL = 'LABEL',
  VALUE = 'VALUE',
  OBJECT = 'OBJECT',
}

interface InputType {
  label: string;
  value: string;
}

@Component({
  selector: 'ms-chips-autocomplete',
  templateUrl: './chips-autocomplete.component.html',
  styleUrls: ['./chips-autocomplete.component.scss'],
})
export class ChipsAutocompleteComponent implements OnInit {
  @Input()
  set optionsArray(options: string[]) {
    if (options && options.length > 0) {
      if (typeof options[0] === 'string') {
        this.allLanguages = options.map((option) => {
          return { label: option as string, value: option as string };
        });
      } else {
        this.allLanguages = [...options];
      }
    } else {
      this.allLanguages = [];
    }
    this.inputOptionsArray = [...this.allLanguages];
  }
  @Input()
  set selectedOptions(options: string[]) {
    if (options && options.length > 0) {
      options.forEach((el) => {
        this.allLanguages.splice(
          this.allLanguages.findIndex((i: InputType) => i.value === el),
          1,
        );
      });
      if (this.inputOptionsArray && this.inputOptionsArray.length > 0) {
        this.languages = this.inputOptionsArray.filter((o: InputType) => options.includes(o.value));
      } else {
        if (typeof options[0] === 'string') {
          this.languages = options.map((option) => {
            return { label: option as string, value: option as string };
          });
        } else {
          this.languages = [...options];
        }
      }
    }
  }
  @Input() placeholder = '';
  @Input() allowOther = false;
  @Input() returnType: ReturnType = ReturnType.LABEL;

  @Output() optionSelected: EventEmitter<(string | InputType)[]> = new EventEmitter();

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  languagesCtrl = new UntypedFormControl();
  filteredLanguages: Observable<(string | InputType)[]>;
  languages: (string | InputType)[] = [];
  allLanguages: (string | InputType)[];
  inputOptionsArray: (string | InputType)[];

  @ViewChild('languagesInput', { static: true }) languagesInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto', { static: true }) matAutocomplete: MatAutocomplete;

  constructor() {
    this.filteredLanguages = this.languagesCtrl.valueChanges.pipe(
      startWith(null),
      map((language: string) => (language && language.length > 2 ? this._filter(language) : [])),
    );
  }

  ngOnInit() {}

  add(event: MatChipInputEvent): void {
    // Add language only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.chipInput.inputElement;
      const value = event.value;

      // Add our language
      if ((value || '').trim() && (this.allLanguages.includes(value) || this.allowOther)) {
        this.languages.push({ label: value.trim(), value: value.trim() });
        this.allLanguages.splice(
          this.allLanguages.findIndex((i: InputType) => i.value === value),
          1,
        );
      }

      // Reset the input value
      if (input) {
        input.value = '';
      }

      this.languagesCtrl.setValue(null);
    }
    this.emitSelectedLanguages();
  }

  remove(language: InputType): void {
    const index = this.languages.findIndex((i: InputType) => i.value === language.value);

    if (index >= 0) {
      this.languages.splice(index, 1);

      if (this.allLanguages.findIndex((i: InputType) => i.value === language.value) < 0) {
        this.allLanguages.push(language);
        this.languagesCtrl.setValue(null);
      }
    }
    this.emitSelectedLanguages();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    this.languages.push(value);
    this.languagesInput.nativeElement.value = '';
    this.languagesCtrl.setValue(null);
    this.allLanguages.splice(
      this.allLanguages.findIndex((i: InputType) => i.value === value.value),
      1,
    );

    this.emitSelectedLanguages();
  }

  private _filter(value: any): (string | InputType)[] {
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (value.label) {
      filterValue = value.label.toLowerCase();
    }

    return this.allLanguages.filter((language: InputType) => language.label.toLowerCase().includes(filterValue));
  }

  emitSelectedLanguages() {
    if (this.returnType === ReturnType.OBJECT) {
      this.optionSelected.emit(this.languages);
    } else if (this.returnType === ReturnType.VALUE) {
      this.optionSelected.emit(this.languages.map((o: InputType) => o.value));
    } else {
      this.optionSelected.emit(this.languages.map((o: InputType) => o.label));
    }
  }
}
