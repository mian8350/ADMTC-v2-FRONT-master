import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-language-drop-down',
  templateUrl: './language-drop-down.component.html',
  styleUrls: ['./language-drop-down.component.scss'],
})
export class LanguageDropDownComponent implements OnInit {
  currentLang = 'en';
  selectImage = 'assets/img/en.png';

  langArray: any[] = [
    {
      img: 'assets/img/en.png',
      name: 'English',
      value: 'en',
    },
    {
      img: 'assets/img/france.png',
      name: 'French',
      value: 'fr',
    },
    /* {
         img: 'assets/img/he.png',
         name: 'Hebrew',
         value: 'he'
      },
      {
         img: 'assets/img/ru.png',
         name: 'Russian',
         value: 'ru'
      },
      {
         img: 'assets/img/ar.png',
         name: 'Arabic',
         value: 'ar'
      },
      {
         img: 'assets/img/china.png',
         name: 'Chinese',
         value: 'zh'
      },
      {
         img: 'assets/img/german.png',
         name: 'German',
         value: 'de'
      },
      {
         img: 'assets/img/spanish.jpg',
         name: 'Spanish',
         value: 'es'
      },
      {
         img: 'assets/img/japan.jpeg',
         name: 'Japanese',
         value: 'ja'
      },
      {
         img: 'assets/img/korean.jpg',
         name: 'Korean',
         value: 'ko'
      },
      {
         img: 'assets/img/italian.png',
         name: 'Italian',
         value: 'it'
      },
      {
         img: 'assets/img/hungary.png',
         name: 'Hungarian',
         value: 'hu'
      } */
  ];

  constructor(public translate: TranslateService) {}

  ngOnInit() {
    const lang = localStorage.getItem('currentLang');
    if (!lang) {
      localStorage.setItem('currentLang', 'fr');
      this.translate.use('fr');
    } else {
      this.translate.use(lang);
    }
    if (this.translate.currentLang === 'fr') {
      this.selectImage = 'assets/img/france.png';
    } else {
      this.selectImage = 'assets/img/en.png';
    }
  }

  setLang(lang) {
    for (const data of this.langArray) {
      if (data.value === lang) {
        this.selectImage = data.img;
        break;
      }
    }
    localStorage.setItem('currentLang', lang);
    this.translate.use(lang);
  }
}
