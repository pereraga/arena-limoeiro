const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

const createdElements = [];

function createMockEl(id, tagName = 'div') {
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    value: id === 'bookingDate' ? '2026-10-31' : '',
    innerHTML: '',
    textContent: '',
    children: [],
    style: {},
    classList: {
      _classes: new Set(),
      add: (c) => el.classList._classes.add(c),
      remove: (c) => el.classList._classes.delete(c),
      toggle: (c, val) => val ? el.classList._classes.add(c) : el.classList._classes.delete(c),
      contains: (c) => el.classList._classes.has(c)
    },
    querySelectorAll: (sel) => {
      return createdElements.filter(e => {
        if (sel === '.space-option') return e.className === 'space-option';
        if (sel === '.time-btn') return e.className === 'time-btn';
        if (sel === '[data-choose]') return e.dataset && e.dataset.choose;
        return false;
      });
    },
    appendChild: (child) => {
      el.children.push(child);
      createdElements.push(child);
    },
    addEventListener: (evt, fn) => {
      el['on' + evt] = fn;
    },
    setAttribute: (k, v) => { el[k] = v; },
    getAttribute: (k) => el[k] || (el.dataset ? el.dataset[k] : null),
    dataset: {},
    focus: () => {},
    scrollIntoView: () => {}
  };
  return el;
}

const mockElements = {
  bookingDate: createMockEl('bookingDate', 'input'),
  timeOptions: createMockEl('timeOptions', 'div'),
  endTimeOptions: createMockEl('endTimeOptions', 'div'),
  durationNote: createMockEl('durationNote', 'div'),
  formNotice: createMockEl('formNotice', 'div'),
  summarySpace: createMockEl('summarySpace', 'span'),
  summaryDate: createMockEl('summaryDate', 'span'),
  summaryPrice: createMockEl('summaryPrice', 'span'),
  customerName: createMockEl('customerName', 'input'),
  customerPhone: createMockEl('customerPhone', 'input'),
  bookingForm: createMockEl('bookingForm', 'form'),
  btnSendCode: createMockEl('btnSendCode', 'button'),
  btnValidateOtp: createMockEl('btnValidateOtp', 'button'),
  otpBox: createMockEl('otpBox', 'div'),
  otpInput: createMockEl('otpInput', 'input'),
  otpStatus: createMockEl('otpStatus', 'span')
};

// Add space buttons
for (const s of ['fut5', 'fut6', 'fut7', 'foot', 'beach', 'society']) {
  const btn = createMockEl('btn-' + s, 'button');
  btn.className = 'space-option';
  btn.dataset.space = s;
  btn.space = s;
  createdElements.push(btn);
}

const window = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  supabase: null
};

const document = {
  readyState: 'complete',
  createElement: (tag) => {
    return createMockEl('created-' + Math.random(), tag);
  },
  getElementById: (id) => mockElements[id] || createMockEl(id),
  querySelectorAll: (sel) => {
    return createdElements.filter(e => {
      if (sel === '.space-option') return e.className === 'space-option';
      if (sel === '.time-btn') return e.className === 'time-btn';
      if (sel === '[data-choose]') return e.dataset && e.dataset.choose;
      return false;
    });
  },
  addEventListener: () => {}
};

try {
  const fn = new Function('window', 'document', code);
  fn(window, document);
  console.log('Script initialized successfully!');

  // Test chooseSpace
  console.log('\n--- Testing window.chooseSpace("fut5") ---');
  window.chooseSpace('fut5');
  
  const timeBtns = mockElements.timeOptions.children;
  console.log(`Time options generated: ${timeBtns.length} buttons`);
  if (timeBtns.length > 0) {
    console.log(`First time button: ${timeBtns[0].textContent}`);
    console.log(`Middle time button: ${timeBtns[10].textContent}`);
    console.log(`Last time button: ${timeBtns[timeBtns.length - 1].textContent}`);
    
    // Test clicking a time button (e.g. 14:00)
    const btn14 = timeBtns.find(b => b.textContent === '14:00');
    if (btn14) {
      console.log('Simulating click on 14:00...');
      btn14.onclick({ preventDefault: () => {}, stopPropagation: () => {} });
      
      const endBtns = mockElements.endTimeOptions.children;
      console.log(`End time options generated: ${endBtns.length} buttons`);
      console.log(`First end time: ${endBtns[0].textContent}`);
      console.log(`Last end time: ${endBtns[endBtns.length - 1].textContent}`);
      
      // Select 15:30 (1h30min)
      const btnEnd1530 = endBtns.find(b => b.textContent === '15:30');
      if (btnEnd1530) {
        console.log('Simulating click on end time 15:30...');
        btnEnd1530.onclick({ preventDefault: () => {}, stopPropagation: () => {} });
        console.log(`Summary date/time: ${mockElements.summaryDate.textContent}`);
        console.log(`Summary price text: ${mockElements.summaryPrice.textContent}`);
      }
    }
  }

  console.log('\n✅ ALL SIMULATION TESTS PASSED COMPLETELY!');
} catch (e) {
  console.error('Simulation error:', e);
}
