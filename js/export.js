function compressData(jsonData) {
    // Compress JSON string with pako (Gzip)
    const jsonString = JSON.stringify(jsonData);
    const compressed = pako.gzip(jsonString);
    return btoa(String.fromCharCode(...new Uint8Array(compressed)));
}

function decompressData(compressedData) {
    const binaryString = atob(compressedData);
    const charData = binaryString.split('').map(char => char.charCodeAt(0));
    const binData = new Uint8Array(charData);
    const decompressedString = pako.ungzip(binData, { to: 'string' });
    return JSON.parse(decompressedString);
}

// Use global debug helpers if available
if (typeof window !== 'undefined' && !window.DEBUG) {
  window.DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.debugLog = (...args) => { if (window.DEBUG) console.log(...args); };
  window.debugError = (...args) => { if (window.DEBUG) console.error(...args); };
}

function msg(text) {
    const msgConsole = document.getElementById("msgs");
    if (msgConsole) {
        msgConsole.value += text + '\n';
    }
    if (window.debugLog) {
        window.debugLog(text);
    }
}

// Sanitize text input to prevent XSS
function sanitizeInput(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate imported data structure
function validateDataStructure(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid data format: must be an object' };
    }
    
    const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB limit
    const dataSize = JSON.stringify(data).length;
    if (dataSize > MAX_DATA_SIZE) {
        return { valid: false, error: `Data too large: ${(dataSize / 1024 / 1024).toFixed(2)}MB (max 10MB)` };
    }
    
    const validTypes = ['todo', 'next', 'someday', 'weeklyGoals'];
    for (const key in data) {
        if (!validTypes.includes(key)) {
            return { valid: false, error: `Invalid data type: ${key}` };
        }
        if (!Array.isArray(data[key])) {
            return { valid: false, error: `Data type ${key} must be an array` };
        }
    }
    
    return { valid: true };
}

// Validate item structure
function validateItem(item, type) {
    const requiredKeys = {
        todo: ['date'],
        next: ['name'],
        someday: ['name'],
        weeklyGoals: ['week']
    };
    
    const required = requiredKeys[type] || [];
    for (const key of required) {
        if (!(key in item) || item[key] === null || item[key] === undefined) {
            return { valid: false, error: `Missing required field: ${key}` };
        }
    }
    
    // Validate data types
    if (type === 'todo' && item.date && typeof item.date !== 'string') {
        return { valid: false, error: 'Date must be a string' };
    }
    if ((type === 'next' || type === 'someday') && item.name && typeof item.name !== 'string') {
        return { valid: false, error: 'Name must be a string' };
    }
    if (type === 'weeklyGoals' && item.week && typeof item.week !== 'string') {
        return { valid: false, error: 'Week must be a string' };
    }
    
    // Sanitize text fields
    if (item.text && typeof item.text === 'string') {
        item.text = sanitizeInput(item.text).substring(0, 1000); // Limit length
    }
    if (item.braindump && typeof item.braindump === 'string') {
        item.braindump = sanitizeInput(item.braindump).substring(0, 10000); // Limit length
    }
    if (item.goalText && typeof item.goalText === 'string') {
        item.goalText = sanitizeInput(item.goalText).substring(0, 2000); // Limit length
    }
    
    return { valid: true };
}

async function exportData() {
    const [todoData, nextData, somedayData, weeklyGoalsData] = await Promise.all([
        getAllFromStore('todo'),
        getAllFromStore('next'),
        getAllFromStore('someday'),
        getAllFromStore('weeklyGoals')
    ]);
    return JSON.stringify({ 
        todo: todoData,
        next: nextData,
        someday: somedayData,
        weeklyGoals: weeklyGoalsData 
    });
}

async function importData(jsonData) {
    // Use window debug functions directly to avoid redeclaration errors
    // Use unified logger from database.js
    const debugLog = window.log || (() => {});
    const debugError = window.error || (() => {});
    
    let data;
    try {
        data = JSON.parse(jsonData);
    } catch (error) {
        msg(`Error: Invalid JSON format - ${error.message}`);
        throw new Error('Invalid JSON format');
    }
    
    // Validate overall data structure
    const structureValidation = validateDataStructure(data);
    if (!structureValidation.valid) {
        msg(`Error: ${structureValidation.error}`);
        throw new Error(structureValidation.error);
    }
    
    const promises = [];

    const mergeAndSave = async (type, newData) => {
        if (!Array.isArray(newData)) {
            msg(`Error: ${type} data must be an array`);
            return;
        }
        
        const existingData = await getAllFromStore(type) || [];
        const identifierKey = {
            todo: 'date',
            next: 'name',
            someday: 'name',
            weeklyGoals: 'week',
        }[type];

        for (const newItem of newData) {
            // Validate item structure
            const itemValidation = validateItem(newItem, type);
            if (!itemValidation.valid) {
                debugError(`Error: ${itemValidation.error} in ${type} item:`, newItem);
                msg(`Error: ${itemValidation.error} in ${type}`);
                continue;
            }
            
            if (!newItem[identifierKey]) {
                debugError(`Error: Missing required key (${identifierKey}) in new ${type} item:`, newItem);
                msg(`Error: Missing key (${identifierKey}) in ${type}`);
                continue;
            }

            const isDuplicate = existingData.some(existingItem => existingItem[identifierKey] === newItem[identifierKey]);

            if (isDuplicate) {
                msg(`Skipped: Duplicate ${type} entry for ${identifierKey}: ${newItem[identifierKey]}`);
            } else {
                try {
                    await saveToStore(type, newItem);
                    msg(`Added: New ${type} entry for ${identifierKey}: ${newItem[identifierKey]}`);
                } catch (error) {
                    debugError(`Failed to save ${type} item:`, newItem, error);
                    msg(`Error saving ${type} entry for ${identifierKey}: ${newItem[identifierKey]}`);
                }
            }
        }
    };

    // Process each type of data
    for (const type of ['todo', 'next', 'someday', 'weeklyGoals']) {
        if (data[type]) {
            promises.push(mergeAndSave(type, data[type]));
        }
    }

    await Promise.all(promises);
} 