const { chromium } = require('playwright');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const SS_DIR = path.join(process.env.TEMP || '/tmp', 'payitos_verify');
mkdirSync(SS_DIR, { recursive: true });

let stepNum = 0;
async function ss(page, label) {
  stepNum++;
  const filePath = path.join(SS_DIR, `${String(stepNum).padStart(2,'0')}_${label}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`📸 ${stepNum}. ${label} → ${filePath}`);
  return filePath;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  // ── 1. Root redirect ──────────────────────────────────────────────────────
  console.log('\n── 1. Root redirect ──');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await ss(page, 'root');
  console.log(`URL: ${page.url()}`);

  // ── 2. Login if needed ────────────────────────────────────────────────────
  console.log('\n── 2. Login ──');
  if (page.url().includes('/login')) {
    await page.fill('input[type="email"]', 'axel@payitos.local');
    await page.fill('input[type="password"]', 'payitos2024');
    await ss(page, 'login_filled');
    await page.click('button[type="submit"]');
    try { await page.waitForURL(u => !u.includes('/login'), { timeout: 8000 }); } catch {}
    await ss(page, 'after_login');
    console.log(`URL after login: ${page.url()}`);
  } else {
    console.log(`Already authenticated at: ${page.url()}`);
  }

  // ── 3. Recetas list ───────────────────────────────────────────────────────
  console.log('\n── 3. Recetas list ──');
  await page.goto(`${BASE}/panadero/recetas`, { waitUntil: 'networkidle' });
  await ss(page, 'recetas_list');
  console.log(`URL: ${page.url()}`);
  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log(`Page snippet: ${bodyText.slice(0, 200)}`);

  // ── 4. Open first editable recipe ────────────────────────────────────────
  console.log('\n── 4. Open recipe edit ──');
  const editLink = page.locator('a[href*="/editar"]').first();
  const editHref = await editLink.getAttribute('href').catch(() => null);
  console.log(`Edit href: ${editHref}`);

  if (editHref) {
    await page.goto(`${BASE}${editHref}`, { waitUntil: 'networkidle' });
  } else {
    // Try nueva receta
    await page.goto(`${BASE}/panadero/recetas/nueva`, { waitUntil: 'networkidle' });
  }
  await ss(page, 'recipe_form');
  console.log(`URL: ${page.url()}`);

  // ── 5. Check "Pasos de producción" section ───────────────────────────────
  console.log('\n── 5. Check production steps section ──');
  const stepsSection = page.getByText('Pasos de producción', { exact: false }).first();
  const sectionVisible = await stepsSection.isVisible().catch(() => false);
  console.log(`"Pasos de producción" section: ${sectionVisible ? '✅ VISIBLE' : '❌ NOT FOUND'}`);

  const addBtn = page.getByText('Agregar paso', { exact: false }).first();
  const addVisible = await addBtn.isVisible().catch(() => false);
  console.log(`"Agregar paso" button: ${addVisible ? '✅ VISIBLE' : '❌ NOT FOUND'}`);

  // ── 6. Add steps ─────────────────────────────────────────────────────────
  console.log('\n── 6. Add 3 production steps ──');
  if (addVisible) {
    // Add paso 1
    await addBtn.click(); await page.waitForTimeout(400);
    const nameInputs = page.locator('input[placeholder="Nombre del paso…"]');
    const durInputs  = page.locator('input[placeholder="0.5"]');
    const wrkInputs  = page.locator('input[placeholder="1"]');

    await nameInputs.nth(0).fill('Masa y tortillas');
    await durInputs.nth(0).fill('4');
    await wrkInputs.nth(0).fill('1');

    // Add paso 2
    await addBtn.click(); await page.waitForTimeout(400);
    await nameInputs.nth(1).fill('Rellenos');
    await durInputs.nth(1).fill('1');
    await wrkInputs.nth(1).fill('2');

    // Add paso 3
    await addBtn.click(); await page.waitForTimeout(400);
    await nameInputs.nth(2).fill('Horneado');
    await durInputs.nth(2).fill('2');
    await wrkInputs.nth(2).fill('1');

    await page.waitForTimeout(600);
    await ss(page, 'steps_filled');

    // Scroll to summary
    await page.evaluate(() => {
      const el = document.querySelector('[class*="Resumen"], [class*="resumen"]') ||
                 Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Resumen de tiempos'));
      if (el) el.scrollIntoView();
    });
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(300);
    await ss(page, 'steps_summary');

    // Read computed totals
    const allText = await page.locator('body').innerText();
    const calMatch = allText.match(/Tiempo calendario[\s\S]{0,30}/);
    const labMatch = allText.match(/Horas-hombre[\s\S]{0,30}/);
    console.log(`Calendar time text: ${calMatch ? calMatch[0].replace(/\n/g,' ') : 'NOT FOUND'}`);
    console.log(`Labor hours text:   ${labMatch ? labMatch[0].replace(/\n/g,' ') : 'NOT FOUND'}`);
    // Expected: calendar=7h (4+1+2), labor=8h-h (4×1 + 1×2 + 2×1)
  } else {
    console.log('⚠ Cannot test step addition – button not found');
  }

  // ── 7. Save recipe ────────────────────────────────────────────────────────
  console.log('\n── 7. Save recipe ──');
  const saveBtn = page.getByRole('button', { name: /guardar receta/i });
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await page.waitForTimeout(4000); // Server action + redirect
    await ss(page, 'after_save');
    console.log(`URL after save: ${page.url()}`);
    // Check for errors
    const errEl = page.locator('div').filter({ hasText: /error|Error/ }).filter({ hasNot: page.locator('button') }).first();
    const errVisible = await errEl.isVisible().catch(() => false);
    if (errVisible) {
      console.log(`❌ Error shown: ${await errEl.textContent().catch(() => '')}`);
    } else {
      console.log('✅ No error — save appears successful');
    }
  }

  // ── 8. Planeacion list ────────────────────────────────────────────────────
  console.log('\n── 8. Planeación ──');
  await page.goto(`${BASE}/panadero/planeacion`, { waitUntil: 'networkidle' });
  await ss(page, 'planeacion_list');
  console.log(`URL: ${page.url()}`);

  // Open first plan
  const planLinks = await page.locator('a[href*="/planeacion/"]').all();
  const validPlan = planLinks.find ? planLinks : [];
  let planHref = null;
  for (const link of validPlan) {
    const href = await link.getAttribute('href').catch(() => '');
    if (href && !href.includes('nueva') && !href.includes('editar') && href.match(/\/planeacion\/[a-z0-9-]{10}/)) {
      planHref = href; break;
    }
  }
  console.log(`Plan href: ${planHref}`);

  if (planHref) {
    await page.goto(`${BASE}${planHref}`, { waitUntil: 'networkidle' });
    await ss(page, 'plan_detail');
    console.log(`URL: ${page.url()}`);

    // Scroll to capacity section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(300);
    await ss(page, 'plan_mid_scroll');

    const capSection = page.getByText('Capacidad de producción', { exact: false }).first();
    const capVisible = await capSection.isVisible().catch(() => false);
    console.log(`"Capacidad de producción" widget: ${capVisible ? '✅ VISIBLE' : '❌ NOT FOUND'}`);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await ss(page, 'plan_bottom');

    const bodyAll = await page.locator('body').innerText();
    if (bodyAll.includes('Tiempo calendario')) {
      console.log('✅ Tiempo calendario found in plan view');
    }
    if (bodyAll.includes('Horas-hombre')) {
      console.log('✅ Horas-hombre found in plan view');
    }
    if (bodyAll.includes('carga')) {
      const loadMatch = bodyAll.match(/[\d.]+%\s*carga/);
      console.log(`Semáforo badge: ${loadMatch ? loadMatch[0] : 'badge text not parsed'}`);
    }
  }

  // ── 9. Console errors ─────────────────────────────────────────────────────
  console.log('\n── Console errors ──');
  if (consoleErrors.length === 0) {
    console.log('✅ Zero console errors');
  } else {
    consoleErrors.slice(0,10).forEach(e => console.log(`❌ ${e}`));
  }

  await browser.close();
  console.log(`\n🗂  Screenshots: ${SS_DIR}`);
})().catch(err => { console.error('SCRIPT ERROR:', err); process.exit(1); });
