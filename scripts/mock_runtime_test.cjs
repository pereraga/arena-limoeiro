const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

// Let's create a minimal browser environment mock to test runtime
const mockElements = {};
function createMockEl(id, tagName = 'div') {
  return {
    id,
    tagName,
    value: id === 'bookingDate' ? '2026-10-31' : '',
    innerHTML: '',
    textContent: '',
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    },
    querySelectorAll: () => [],
    appendChild: () => {},
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => 'fut5',
    focus: () => {},
    scrollIntoView: () => {}
  };
}

const window = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  supabase: null
};

const document = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockEl(id);
    return mockElements[id];
  },
  querySelectorAll: () => [createMockEl('space1', 'button'), createMockEl('space2', 'button')],
  addEventListener: () => {}
};

try {
  const fn = new Function('window', 'document', code);
  fn(window, document);
  console.log('Runtime execution: SUCCESS!');
  console.log('window.chooseSpace is a:', typeof window.chooseSpace);
} catch (e) {
  console.error('Runtime execution error:', e);
}
