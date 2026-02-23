/*(JavaScript)*/

const calculatorState = {
    currentInput: '0',
    previousResult: null,
    history: 'Last: None',
    isNewInput: true,
    theme: 'light'
};

/*DOM ELEMENTS*/

const elements = {
    display: document.getElementById('display'),
    preview: document.getElementById('preview'),
    history: document.getElementById('history'),
    themeToggle: document.getElementById('themeToggle'),
    buttons: document.querySelector('.buttons')
};

/*INITIALIZATION*/

function init() {
    // Set up event listeners
    setupButtonListeners();
    setupKeyboardListeners();
    setupThemeToggle();
    
    // Load saved theme
    loadTheme();
    
    // Initial display update
    updateDisplay();
}

/*BUTTON EVENT*/

function setupButtonListeners() {
    elements.buttons.addEventListener('click', (e) => {
        const button = e.target.closest('.btn');
        if (!button) return;
        
        // Add click animation
        button.style.animation = 'none';
        setTimeout(() => {
            button.style.animation = '';
        }, 10);
        
        const value = button.dataset.value;
        const action = button.dataset.action;
        
        if (value) {
            handleInput(value);
        } else if (action) {
            handleAction(action);
        }
    });
}

/*KEYBOARD EVENT*/

function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        // Prevent default for calculator keys
        if (/[0-9+\-*/.()=]/.test(e.key) || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') {
            e.preventDefault();
        }
        
        // Number keys (0-9)
        if (/[0-9]/.test(e.key)) {
            handleInput(e.key);
            highlightButton(`[data-value="${e.key}"]`);
        }
        // Operators
        else if (e.key === '+') {
            handleInput('+');
            highlightButton('[data-value="+"]');
        }
        else if (e.key === '-') {
            handleInput('-');
            highlightButton('[data-value="-"]');
        }
        else if (e.key === '*') {
            handleInput('*');
            highlightButton('[data-value="*"]');
        }
        else if (e.key === '/') {
            handleInput('/');
            highlightButton('[data-value="/"]');
        }
        // Decimal
        else if (e.key === '.') {
            handleInput('.');
            highlightButton('[data-value="."]');
        }
        // Brackets
        else if (e.key === '(') {
            handleInput('(');
            highlightButton('[data-value="("]');
        }
        else if (e.key === ')') {
            handleInput(')');
            highlightButton('[data-value=")"]');
        }
        // Actions
        else if (e.key === 'Enter' || e.key === '=') {
            handleAction('equals');
            highlightButton('[data-action="equals"]');
        }
        else if (e.key === 'Escape') {
            handleAction('clear');
            highlightButton('[data-action="clear"]');
        }
        else if (e.key === 'Backspace') {
            handleAction('delete');
            highlightButton('[data-action="delete"]');
        }
    });
}

/*BUTTON HIGHLIGHT*/

function highlightButton(selector) {
    const button = document.querySelector(selector);
    if (button) {
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 2px 8px rgba(238, 90, 111, 0.3)';
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 150);
    }
}

/*INPUT HANDLING*/

function handleInput(value) {
    // Starting fresh or after equals
    if (calculatorState.isNewInput && value !== '(' && !/[+\-*/]/.test(value)) {
        calculatorState.currentInput = value;
        calculatorState.isNewInput = false;
    } else {
        // Start with 0 for fresh calculator
        if (calculatorState.currentInput === '0' && value !== '.') {
            calculatorState.currentInput = value;
        } else {
            // Validate input before adding
            if (isValidInput(value)) {
                calculatorState.currentInput += value;
            }
        }
        calculatorState.isNewInput = false;
    }
    
    updateDisplay();
}

/*INPUT VALIDATION*/

function isValidInput(value) {
    const lastChar = calculatorState.currentInput.slice(-1);
    const operators = ['+', '-', '*', '/'];
    
    // Prevent multiple operators in a row (except brackets)
    if (operators.includes(value) && operators.includes(lastChar)) {
        return false;
    }
    
    // Prevent multiple decimal points in same number
    if (value === '.') {
        const numbers = calculatorState.currentInput.split(/[+\-*/()]/);
        const lastNumber = numbers[numbers.length - 1];
        if (lastNumber.includes('.')) {
            return false;
        }
    }
    
    // Prevent starting with operator (except minus for negative numbers)
    if (calculatorState.currentInput === '0' && operators.includes(value) && value !== '-') {
        return false;
    }
    
    return true;
}

/*ACTION HANDLING*/

function handleAction(action) {
    switch (action) {
        case 'clear':
            calculatorState.currentInput = '0';
            calculatorState.isNewInput = true;
            elements.display.classList.remove('error');
            updateDisplay();
            break;
            
        case 'delete':
            if (calculatorState.currentInput.length > 1) {
                calculatorState.currentInput = calculatorState.currentInput.slice(0, -1);
            } else {
                calculatorState.currentInput = '0';
            }
            updateDisplay();
            break;
            
        case 'equals':
            calculateResult();
            break;
    }
}

/* CALCULATION ENGINE*/

function calculateResult() {
    try {
        const expression = calculatorState.currentInput;
        
        // Validate brackets are balanced
        if (!areBracketsBalanced(expression)) {
            showError('Invalid brackets');
            return;
        }
        
        // Safe evaluation using Function constructor (better than eval)
        const result = safeEvaluate(expression);
        
        // Check for invalid results
        if (!isFinite(result)) {
            showError('Cannot divide by zero');
            return;
        }
        
        // Round to avoid floating point errors
        const roundedResult = Math.round(result * 100000000) / 100000000;
        
        // Update history
        calculatorState.history = `Last: ${expression} = ${roundedResult}`;
        elements.history.textContent = calculatorState.history;
        
        // Update display
        calculatorState.currentInput = roundedResult.toString();
        calculatorState.previousResult = roundedResult;
        calculatorState.isNewInput = true;
        elements.display.classList.remove('error');
        
        updateDisplay();
        
    } catch (error) {
        showError('Invalid expression');
    }
}

/*SAFE EXPRESSION EVALUATOR*/

function safeEvaluate(expression) {
    // Replace division symbol
    expression = expression.replace(/÷/g, '/');
    expression = expression.replace(/×/g, '*');
    
    // Validate expression contains only allowed characters
    if (!/^[0-9+\-*/.()\s]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
    }
    
    // Use Function constructor for safe evaluation
    // This is safer than eval as it doesn't have access to local scope
    const func = new Function('return ' + expression);
    return func();
}

/*BRACKET VALIDATION*/
function areBracketsBalanced(expression) {
    let count = 0;
    for (let char of expression) {
        if (char === '(') count++;
        if (char === ')') count--;
        if (count < 0) return false;
    }
    return count === 0;
}

/*ERROR DISPLAY*/
function showError(message) {
    elements.display.textContent = message;
    elements.display.classList.add('error');
    elements.preview.textContent = '';
    
    // Shake animation
    const calculator = document.querySelector('.calculator');
    calculator.style.animation = 'shake 0.5s';
    setTimeout(() => {
        calculator.style.animation = '';
    }, 500);
}

/* Add shake animation to CSS dynamically */
if (!document.querySelector('#shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

/*DISPLAY UPDATE*/
function updateDisplay() {
    // Update main display
    elements.display.textContent = calculatorState.currentInput;
    
    // Update preview with live calculation
    if (calculatorState.currentInput !== '0' && !calculatorState.isNewInput) {
        try {
            const previewResult = safeEvaluate(calculatorState.currentInput);
            if (isFinite(previewResult) && calculatorState.currentInput.length > 1) {
                const rounded = Math.round(previewResult * 100000000) / 100000000;
                elements.preview.textContent = `= ${rounded}`;
            } else {
                elements.preview.textContent = '';
            }
        } catch (e) {
            elements.preview.textContent = '';
        }
    } else {
        elements.preview.textContent = '';
    }
}

/*THEME TOGGLE*/
function setupThemeToggle() {
    elements.themeToggle.addEventListener('click', () => {
        calculatorState.theme = calculatorState.theme === 'light' ? 'dark' : 'light';
        applyTheme();
        saveTheme();
    });
}

function applyTheme() {
    const isDark = calculatorState.theme === 'dark';
    document.body.setAttribute('data-theme', calculatorState.theme);
    elements.themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
}

function saveTheme() {
    localStorage.setItem('calculator-theme', calculatorState.theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('calculator-theme');
    if (savedTheme) {
        calculatorState.theme = savedTheme;
        applyTheme();
    }
}

/*START APPLICATION*/

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}