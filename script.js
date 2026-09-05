const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const allButtons = document.querySelectorAll('.btn');
const themeToggle = document.getElementById('themeToggle');

const historyToggle = document.getElementById('historyToggle');
const closeHistory = document.getElementById('closeHistory');
const historyDrawer = document.getElementById('historyDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistory');

let currentValue = '0';
let previousValue = null;
let operator = null;
let expressionText = '';
let justEvaluated = false;
let isError = false;

/* ================= DISPLAY ================= */
function updateDisplay(){
  resultEl.classList.toggle('error', isError);
  resultEl.textContent = isError ? currentValue : formatNumber(currentValue);
  expressionEl.textContent = expressionText;

  if(!isError){
    const len = resultEl.textContent.length;
    if(len > 9) resultEl.style.fontSize = '2rem';
    else if(len > 6) resultEl.style.fontSize = '2.6rem';
    else resultEl.style.fontSize = '3.2rem';
  }
}

function formatNumber(numStr){
  const num = parseFloat(numStr);
  if(isNaN(num)) return '0';
  if(!isFinite(num)) return 'Error';
  const parts = numStr.split('.');
  const formattedInt = Number(parts[0]).toLocaleString('en-US');
  return parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
}

/* ================= INPUT ================= */
function inputDigit(digit){
  if(isError || justEvaluated){
    currentValue = digit === '.' ? '0.' : digit;
    expressionText = '';
    justEvaluated = false;
    isError = false;
  } else if(currentValue === '0' && digit !== '.'){
    currentValue = digit;
  } else if(digit === '.' && currentValue.includes('.')){
    return;
  } else {
    currentValue += digit;
  }
  updateDisplay();
}

function symbolFor(op){
  return { add:'+', subtract:'−', multiply:'×', divide:'÷' }[op] || '';
}

function highlightOperator(op){
  document.querySelectorAll('.operator').forEach(btn => btn.classList.remove('active'));
  if(op){
    const btn = document.querySelector(`[data-action="${op}"]`);
    if(btn) btn.classList.add('active');
  }
}

function setOperator(op){
  if(isError) return;
  if(operator && previousValue !== null && !justEvaluated){
    calculate();
    if(isError) return;
  }
  previousValue = currentValue;
  operator = op;
  expressionText = `${formatNumber(previousValue)} ${symbolFor(op)}`;
  justEvaluated = false;
  currentValue = '0';
  highlightOperator(op);
  updateDisplay();
}

function calculate(){
  if(operator === null || previousValue === null || isError) return;

  const prev = parseFloat(previousValue);
  const curr = parseFloat(currentValue);

  if(operator === 'divide' && curr === 0){
    expressionText = `${formatNumber(previousValue)} ÷ ${formatNumber(currentValue)}`;
    currentValue = 'Cannot divide by zero';
    isError = true;
    operator = null;
    previousValue = null;
    justEvaluated = true;
    highlightOperator(null);
    updateDisplay();
    return;
  }

  let result;
  switch(operator){
    case 'add': result = prev + curr; break;
    case 'subtract': result = prev - curr; break;
    case 'multiply': result = prev * curr; break;
    case 'divide': result = prev / curr; break;
    default: return;
  }

  if(isNaN(result) || !isFinite(result)){
    currentValue = 'Error';
    isError = true;
    expressionText = '';
  } else {
    const finalResult = trimResult(result);
    const line = `${formatNumber(previousValue)} ${symbolFor(operator)} ${formatNumber(currentValue)} = ${formatNumber(finalResult)}`;
    expressionText = `${formatNumber(previousValue)} ${symbolFor(operator)} ${formatNumber(currentValue)} =`;
    currentValue = finalResult;
    addToHistory(line);
  }

  operator = null;
  previousValue = null;
  justEvaluated = true;
  highlightOperator(null);
  updateDisplay();
}

function trimResult(num){
  let str = num.toString();
  if(str.includes('.') && str.length > 12){
    str = parseFloat(num.toFixed(6)).toString();
  }
  return str;
}

function clearAll(){
  currentValue = '0';
  previousValue = null;
  operator = null;
  expressionText = '';
  justEvaluated = false;
  isError = false;
  highlightOperator(null);
  updateDisplay();
}

function negate(){
  if(isError || currentValue === '0') return;
  currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : '-' + currentValue;
  updateDisplay();
}

function percent(){
  if(isError) return;
  currentValue = (parseFloat(currentValue) / 100).toString();
  updateDisplay();
}

function backspace(){
  if(isError || justEvaluated) return;
  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  updateDisplay();
}

/* ================= BUTTON CLICKS ================= */
allButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const value = btn.dataset.value;
    const action = btn.dataset.action;

    if(value !== undefined){
      inputDigit(value);
      return;
    }
    switch(action){
      case 'clear': clearAll(); break;
      case 'negate': negate(); break;
      case 'percent': percent(); break;
      case 'equals': calculate(); break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        setOperator(action);
        break;
    }
  });
});

/* ================= KEYBOARD SUPPORT ================= */
document.addEventListener('keydown', (e) => {
  if(e.key >= '0' && e.key <= '9'){
    inputDigit(e.key);
  } else if(e.key === '.'){
    inputDigit('.');
  } else if(e.key === '+'){
    setOperator('add');
  } else if(e.key === '-'){
    setOperator('subtract');
  } else if(e.key === '*'){
    setOperator('multiply');
  } else if(e.key === '/'){
    e.preventDefault();
    setOperator('divide');
  } else if(e.key === 'Enter' || e.key === '='){
    e.preventDefault();
    calculate();
  } else if(e.key === 'Escape'){
    clearAll();
  } else if(e.key === 'Backspace'){
    backspace();
  } else if(e.key === '%'){
    percent();
  }
});

/* ================= HISTORY ================= */
let history = JSON.parse(localStorage.getItem('calcify-history') || '[]');

function addToHistory(entry){
  history.unshift(entry);
  if(history.length > 25) history.pop();
  localStorage.setItem('calcify-history', JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  historyList.innerHTML = '';
  if(history.length === 0){
    historyEmpty.style.display = 'block';
  } else {
    historyEmpty.style.display = 'none';
    history.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = entry;
      historyList.appendChild(li);
    });
  }
}

clearHistoryBtn.addEventListener('click', () => {
  history = [];
  localStorage.removeItem('calcify-history');
  renderHistory();
});

/* ================= HISTORY DRAWER OPEN/CLOSE ================= */
function openDrawer(){
  historyDrawer.classList.add('open');
  drawerOverlay.classList.add('open');
}
function closeDrawer(){
  historyDrawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
}
historyToggle.addEventListener('click', openDrawer);
closeHistory.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

/* ================= THEME TOGGLE ================= */
const iconMoon = themeToggle.querySelector('.icon-moon');
const iconSun = themeToggle.querySelector('.icon-sun');

function applyTheme(theme){
  if(theme === 'light'){
    document.documentElement.setAttribute('data-theme', 'light');
    iconMoon.style.display = 'none';
    iconSun.style.display = 'block';
  } else {
    document.documentElement.removeAttribute('data-theme');
    iconMoon.style.display = 'block';
    iconSun.style.display = 'none';
  }
  localStorage.setItem('calcify-theme', theme);
}

const savedTheme = localStorage.getItem('calcify-theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  applyTheme(isLight ? 'dark' : 'light');
});

/* ================= INIT ================= */
renderHistory();
updateDisplay();