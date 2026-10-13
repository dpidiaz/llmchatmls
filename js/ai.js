// Local PWA edition: intentionally no AI or remote API requests.
(() => {
  'use strict';
  const MLS = window.MLS = window.MLS || {};
  MLS.aiTutor = {
    open() {
      if (typeof MLS.toast === 'function') {
        MLS.toast('La edición local no se conecta a servicios externos.');
      }
    }
  };
})();
