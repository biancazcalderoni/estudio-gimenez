// Uso: node audit.js <url> <password> <carpeta-salida> [ancho]
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const [url, pass, out, ancho = '390'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-first-run'],
  });
  const page = await browser.newPage();
  const W = Number(ancho);
  await page.setViewport({ width: W, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('dialog', d => d.dismiss());

  await page.goto(url, { waitUntil: 'networkidle0' });
  if (await page.$('input[name=password]')) {
    await page.type('input[name=password]', pass);
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('button[type=submit]')]);
  }
  await page.screenshot({ path: `${out}/00-inicio.png` });
  await page.evaluate(() => setState({ currentUser: 'juan' }));

  const desbordes = () => page.evaluate((W) => {
    const res = [];
    const docW = document.documentElement.scrollWidth;
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && el.classList.contains('modal')) return;
      if (r.right > W + 1 || r.left < -1) {
        // solo reportar el elemento "más externo" que desborda
        const p = el.parentElement && el.parentElement.getBoundingClientRect();
        if (p && (p.right > W + 1 || p.left < -1)) return;
        const desc = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '') +
          ' [' + Math.round(r.left) + '→' + Math.round(r.right) + '] ' + (el.innerText || '').replace(/\s+/g, ' ').slice(0, 50);
        res.push(desc);
      }
    });
    return { docW, res: res.slice(0, 12) };
  }, W);

  const pasos = [
    ['dashboard', { currentView: 'dashboard' }],
    ['clientes', { currentView: 'clientes' }],
    ['casos', { currentView: 'casos' }],
    ['expedientes', { currentView: 'expedientes' }],
    ['tareas', { currentView: 'tareas' }],
    ['finanzas', { currentView: 'finanzas' }],
    ['baseLegal', { currentView: 'baseLegal' }],
    ['calendario', { currentView: 'calendario' }],
    ['ficha-cliente', 'cliente'],
    ['modal-caso', 'caso'],
    ['caso-completo', 'casoDetalle'],
    ['modal-expediente', 'expediente'],
    ['nuevo-cliente', { currentView: 'clientes', newClientDialog: true }],
    ['nuevo-caso', { currentView: 'casos', newCaseDialog: true }],
    ['nuevo-expediente', { currentView: 'expedientes', newExpedienteDialog: true }],
    ['nueva-tarea', { currentView: 'tareas', newTareaDialog: true }],
    ['config', { configDialog: true }],
    ['menu-abierto', 'menu'],
  ];
  const limpiar = { selectedClient: null, selectedCase: null, selectedCaseDetail: null, selectedExpediente: null, newClientDialog: false, newCaseDialog: false, newExpedienteDialog: false, newTareaDialog: false, configDialog: false, menuAbierto: false };

  let i = 1;
  for (const [nombre, paso] of pasos) {
    try {
      await page.evaluate((paso, limpiar) => {
        window.scrollTo(0, 0);
        setState(limpiar);
        const d = state.data;
        if (paso === 'cliente') setState({ currentView: 'clientes', selectedClient: d.clientes[2] });
        else if (paso === 'caso') setState({ currentView: 'casos', selectedCase: d.casos[0] });
        else if (paso === 'casoDetalle') setState({ currentView: 'casos', selectedCaseDetail: d.casos[0] });
        else if (paso === 'expediente') setState({ currentView: 'expedientes', selectedExpediente: d.expedientes[0] });
        else if (paso === 'menu') setState({ menuAbierto: true });
        else setState(paso);
      }, paso, limpiar);
      await new Promise(r => setTimeout(r, 500));
      const d = await desbordes();
      const esModal = await page.evaluate(() => !!document.querySelector('.modal, .caso-completo, .menu-fondo'));
      await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-${nombre}.png`, fullPage: !esModal });
      if (esModal) {
        // segunda captura: el modal scrolleado hasta abajo, para ver que todo el contenido es alcanzable
        const alcanzable = await page.evaluate(() => {
          const m = document.querySelector('.modal > div, .caso-completo');
          if (!m) return null;
          m.scrollTop = m.scrollHeight;
          return { scrollHeight: m.scrollHeight, clientHeight: m.clientHeight, scrolls: m.scrollHeight > m.clientHeight };
        });
        await new Promise(r => setTimeout(r, 200));
        await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-${nombre}-abajo.png` });
        if (alcanzable) console.log(`   modal: alto contenido ${alcanzable.scrollHeight}, pantalla ${alcanzable.clientHeight}`);
      }
      console.log(`${nombre}: ancho doc ${d.docW}${d.docW > W ? ' ✗ SCROLL HORIZONTAL' : ''}${d.res.length ? '\n   ' + d.res.join('\n   ') : ''}`);
    } catch (e) {
      console.log(`${nombre}: ERROR ${e.message.split('\n')[0]}`);
    }
    i++;
  }
  if (errs.length) console.log('Errores JS:', errs.slice(0, 5));
  await browser.close();
})();
