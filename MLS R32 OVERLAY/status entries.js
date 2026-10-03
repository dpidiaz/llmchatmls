/* Canonical verification monitor. No editorial writes or D1 queries. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const PAGE_SIZE = 50;
  let catalog = null, snapshot = null, page = 1, catalogRequest = null;
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  async function loadCatalog() {
    if (catalog) return catalog;
    if (!catalogRequest) {
      catalogRequest = (async () => {
        const response = await fetch('/data/canonical/index.json', { cache: 'no-cache', signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Catálogo no disponible');
        const data = await response.json();
        const codes = new Set();
        if (!Array.isArray(data.entries) || data.entries.length !== data.totalEntries) throw new Error('Catálogo incompleto');
        for (const entry of data.entries) {
          if (!/^MLS-V\d{2}-\d{4}$/.test(entry.code) || codes.has(entry.code) ||
              typeof entry.title !== 'string' || !entry.title.trim() || typeof entry.language !== 'string') {
            throw new Error('Catálogo inválido');
          }
          codes.add(entry.code);
        }
        catalog = data.entries.slice().sort((a, b) => a.code.localeCompare(b.code));
        return catalog;
      })().finally(() => { catalogRequest = null; });
    }
    return catalogRequest;
  }

  function unavailable() {
    $('entryFreshness').textContent = snapshot
      ? 'Datos desactualizados. Se conserva la última consulta; reintentaremos en la próxima actualización.'
      : 'No se pudo consultar la lista. Reintentaremos en la próxima actualización.';
    $('entryFreshness').className = 'entryNotice warn';
  }

  function render() {
    if (!snapshot || !catalog) return;
    const query = normalize($('entrySearch').value.trim());
    const language = $('entryLanguage').value;
    const status = $('entryStatus').value;
    const filtered = catalog.filter(entry => {
      const verified = snapshot.codes.has(entry.code);
      return (!language || entry.language === language) &&
        (!status || (status === 'VERIFIED') === verified) &&
        (!query || normalize(entry.code + ' ' + entry.title).includes(query));
    });
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const start = (page - 1) * PAGE_SIZE;
    const body = $('entryRows');
    body.replaceChildren();
    for (const entry of filtered.slice(start, start + PAGE_SIZE)) {
      const row = document.createElement('tr');
      const verified = snapshot.codes.has(entry.code);
      for (const value of [entry.code, entry.title, snapshot.names.get(entry.language) || entry.language, verified ? 'VERIFIED' : 'Pendiente']) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      row.lastChild.className = verified ? 'entryVerified' : 'entryPending';
      const cell = document.createElement('td');
      const link = document.createElement('a');
      link.href = '/#entry=' + encodeURIComponent(entry.code);
      link.textContent = 'Abrir';
      link.setAttribute('aria-label', 'Abrir ' + entry.code + ': ' + entry.title);
      cell.append(link);
      row.append(cell);
      body.append(row);
    }
    if (!filtered.length) {
      const row = document.createElement('tr'), cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'No hay entradas que coincidan con los filtros.';
      row.append(cell);
      body.append(row);
    }
    $('entryResults').textContent = filtered.length
      ? `${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} de ${filtered.length.toLocaleString('es-GT')} ${filtered.length === 1 ? 'entrada' : 'entradas'} · Página ${page} de ${pages}`
      : '0 entradas';
    $('entryPrevious').disabled = page <= 1;
    $('entryNext').disabled = page >= pages;
  }

  // The summary and individual states use the very same response, never a second index fetch.
  window.mlsStatusEntries = {
    async update(data) {
      try {
        const entries = await loadCatalog();
        if (!data.ok || !Array.isArray(data.verifiedCodes) || !Array.isArray(data.languages)) throw new Error('Estado inválido');
        const codes = new Set(data.verifiedCodes);
        const known = new Set(entries.map(entry => entry.code));
        if (codes.size !== data.verifiedCodes.length || codes.size !== data.verifiedCount ||
            entries.length !== data.totalEntries || [...codes].some(code => !known.has(code))) throw new Error('Fuentes incompatibles');
        const names = new Map(data.languages.map(language => [language.slug, language.name]));
        snapshot = { codes, names };
        const selected = $('entryLanguage').value;
        $('entryLanguage').replaceChildren();
        for (const [value, label] of [['', 'Todos los idiomas'], ...names]) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          $('entryLanguage').append(option);
        }
        $('entryLanguage').value = names.has(selected) ? selected : '';
        $('entryFreshness').textContent = 'Verificación consultada: ' + new Date(data.fetchedAt).toLocaleString('es-GT');
        $('entryFreshness').className = 'entryNotice';
        render();
      } catch {
        unavailable();
      }
    },
    unavailable
  };
  for (const id of ['entrySearch', 'entryLanguage', 'entryStatus']) {
    $(id).addEventListener('input', () => { page = 1; render(); });
  }
  $('entryPrevious').addEventListener('click', () => { page = Math.max(1, page - 1); render(); });
  $('entryNext').addEventListener('click', () => { page++; render(); });
})();
