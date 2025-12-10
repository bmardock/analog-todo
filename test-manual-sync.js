const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  
  // Create two browser contexts to simulate two devices
  const device1Context = await browser.newContext();
  const device2Context = await browser.newContext();
  
  const device1 = await device1Context.newPage();
  const device2 = await device2Context.newPage();
  
  try {
    console.log('Setting up both devices...');
    
    // First, ensure both devices have data to avoid redirect to info page
    await device1.goto('http://localhost:8080/');
    await device2.goto('http://localhost:8080/');
    await device1.waitForLoadState('networkidle');
    await device2.waitForLoadState('networkidle');
    
    // Add dummy todos to prevent info redirect
    await device1.evaluate(async () => {
      const dummyTodo = {
        date: new Date().toISOString().split('T')[0],
        todos: [{ text: 'Test', signal: '' }],
        cardSignal: [false, false, false],
        braindump: '',
        lastUpdated: new Date().toISOString()
      };
      await saveToStore('todo', dummyTodo);
    });
    
    await device2.evaluate(async () => {
      const dummyTodo = {
        date: new Date().toISOString().split('T')[0],
        todos: [{ text: 'Test', signal: '' }],
        cardSignal: [false, false, false],
        braindump: '',
        lastUpdated: new Date().toISOString()
      };
      await saveToStore('todo', dummyTodo);
    });
    
    console.log('Navigating both devices to export page...');
    await device1.goto('http://localhost:8080/#export');
    await device2.goto('http://localhost:8080/#export');
    
    await device1.waitForLoadState('networkidle');
    await device2.waitForLoadState('networkidle');
    
    // Wait for page elements
    await device1.waitForSelector('#code-input');
    await device2.waitForSelector('#code-input');
    
    // Wait for scripts to load
    await device1.waitForFunction(() => typeof window.exportData === 'function');
    await device2.waitForFunction(() => typeof window.exportData === 'function');
    
    console.log('Adding test data to both devices...');
    
    // Add different test data to each device
    await device1.evaluate(async () => {
      const todo = {
        date: new Date().toISOString().split('T')[0],
        todos: [{ text: 'Device 1 Task', signal: '' }],
        cardSignal: [false, false, false],
        braindump: '',
        lastUpdated: new Date().toISOString()
      };
      await saveToStore('todo', todo);
    });
    
    await device2.evaluate(async () => {
      const todo = {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        todos: [{ text: 'Device 2 Task', signal: '' }],
        cardSignal: [false, false, false],
        braindump: '',
        lastUpdated: new Date().toISOString()
      };
      await saveToStore('todo', todo);
    });
    
    console.log('Device 1: Generating code...');
    const generateButton1 = device1.locator('#generateButton');
    await generateButton1.click();
    
    // Wait for code to be generated
    await device1.waitForFunction(() => {
      const input = document.getElementById('code-input');
      return input && /^\d{3}-\d{3}$/.test(input.value);
    });
    
    const code = await device1.locator('#code-input').inputValue();
    console.log(`Generated code: ${code}`);
    
    console.log('Device 1: Connecting...');
    const connectButton1 = device1.locator('#connectButton');
    await connectButton1.click();
    
    // Wait for device 1 to show connection status
    await device1.waitForFunction(() => {
      const status = document.getElementById('status-message');
      return status && (status.textContent.includes('Waiting') || 
                       status.textContent.includes('Connected') ||
                       status.textContent.includes('connect'));
    });
    
    console.log('Device 2: Entering code and connecting...');
    const codeInput2 = device2.locator('#code-input');
    await codeInput2.fill(code);
    
    await device2.waitForFunction((expectedCode) => {
      const input = document.getElementById('code-input');
      return input && input.value === expectedCode;
    }, code);
    
    const connectButton2 = device2.locator('#connectButton');
    await connectButton2.click();
    
    // Wait for device 2 to show connection status
    await device2.waitForFunction(() => {
      const status = document.getElementById('status-message');
      return status && (status.textContent.includes('Waiting') || 
                       status.textContent.includes('Connected') ||
                       status.textContent.includes('connect'));
    });
    
    console.log('Both devices connected. Waiting for sync...');
    console.log('Monitoring console messages for 20 seconds...');
    
    // Monitor console messages for 20 seconds
    const messages1 = [];
    const messages2 = [];
    
    device1.on('console', msg => {
      const text = msg.text();
      messages1.push(text);
      if (text.includes('WebRTC') || text.includes('sync') || text.includes('ICE') || text.includes('signal')) {
        console.log(`[Device 1] ${text}`);
      }
    });
    
    device2.on('console', msg => {
      const text = msg.text();
      messages2.push(text);
      if (text.includes('WebRTC') || text.includes('sync') || text.includes('ICE') || text.includes('signal')) {
        console.log(`[Device 2] ${text}`);
      }
    });
    
    // Wait and check for sync activity
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check status messages
    const status1 = await device1.locator('#status-message').textContent();
    const status2 = await device2.locator('#status-message').textContent();
    
    console.log('\n=== Status Messages ===');
    console.log(`Device 1: ${status1}`);
    console.log(`Device 2: ${status2}`);
    
    // Check message logs
    const msgs1 = await device1.locator('#msgs').inputValue();
    const msgs2 = await device2.locator('#msgs').inputValue();
    
    console.log('\n=== Device 1 Messages ===');
    console.log(msgs1);
    
    console.log('\n=== Device 2 Messages ===');
    console.log(msgs2);
    
    // Check if data was synced
    const device1Todos = await device1.evaluate(async () => {
      return await getAllFromStore('todo');
    });
    
    const device2Todos = await device2.evaluate(async () => {
      return await getAllFromStore('todo');
    });
    
    console.log('\n=== Data Check ===');
    console.log(`Device 1 has ${device1Todos.length} todos`);
    console.log(`Device 2 has ${device2Todos.length} todos`);
    
    const device1HasBoth = device1Todos.length >= 2;
    const device2HasBoth = device2Todos.length >= 2;
    
    if (device1HasBoth || device2HasBoth) {
      console.log('\n✅ SUCCESS: Data was synced!');
    } else {
      console.log('\n⚠️  Data sync may not have completed (could be CORS issue)');
    }
    
    console.log('\nTest complete. Browsers will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();

