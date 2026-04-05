const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('Navegando a login...');
    await page.goto('https://defend-acquired-inches-update.trycloudflare.com/login', { waitUntil: 'networkidle0' });
    
    console.log('Haciendo login...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@vollweb.com');
    await page.type('input[type="password"]', 'admin123');
    
    const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    console.log('Click en submit...');
    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ timeout: 15000 }).catch(() => console.log('No navigation'))
    ]);
    
    console.log('Esperando contenido...');
    await new Promise(r => setTimeout(r, 5000));
    
    const url = page.url();
    console.log('URL actual:', url);
    
    // Si estamos en login, intentar de nuevo
    if (url.includes('login')) {
      console.log('Aún en login, intentando de nuevo...');
      await page.goto('https://defend-acquired-inches-update.trycloudflare.com/', { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('Capturando pantalla...');
    const screenshot = await page.screenshot({ encoding: 'base64' });
    console.log('SCREENSHOT_BASE64_START');
    console.log(screenshot);
    console.log('SCREENSHOT_BASE64_END');
    
    await browser.close();
  } catch (err) {
    console.error('Error:', err);
  }
})();
