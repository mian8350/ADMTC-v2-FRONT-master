/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/docs/ts/latest/guide/browser-support.html
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */  // Run `npm install --save web-animations-js`.  // Run `npm install --save web-animations-js`.



/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js/dist/zone.js';  // Included with Angular CLI.
(window as any).__Zone_disable_toString = true; // Zone will not patch Function.prototype.toString


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

(window as any).process = {
  env: { DEBUG: undefined },
};

/* ngx-charts required polyfill ie11 */
/* import 'core-js/es7/array';
import 'core-js/es7/reflect'; */


/**
 * Date, currency, decimal and percent pipes.
 * Needed for: All but Chrome, Firefox, Edge, IE11 and Safari 10
 */
// import 'intl';  // Run `npm install --save intl`.
import 'intl';
import 'intl/locale-data/complete.js';
import 'intl/locale-data/jsonp/en.js';

if (typeof SVGElement.prototype.contains == 'undefined') {
  SVGElement.prototype.contains = HTMLDivElement.prototype.contains;
}

(window as any).global = window;

// new code

/* import 'core-js/es7/object'; */

/** IE10 and IE11 requires the following for the Reflect API. */
/* import 'core-js/es6/reflect'; */

if (!Element.prototype.matches) {
  Element.prototype.matches = (<any>Element.prototype).msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}
