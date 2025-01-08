function compressData(jsonData) {
    // Compress JSON string with pako (Gzip)
    const jsonString = JSON.stringify(jsonData);
    // Compress JSON string with pako (Gzip)
    const compressed = pako.gzip(jsonString);
    // Convert the compressed data to Base64 for QR code compatibility
    return btoa(String.fromCharCode(...new Uint8Array(compressed)));
}

function decompressData(compressedData) {
    // Decode Base64 string to binary string
    const binaryString = atob(compressedData);
    // Convert binary string to Uint8Array for decompression
    const charData = binaryString.split('').map(char => char.charCodeAt(0));
    const binData = new Uint8Array(charData);
    // Decompress using pako and parse JSON
    const decompressedString = pako.ungzip(binData, { to: 'string' });
    // Convert the decompressed JSON string back into a JavaScript object
    return JSON.parse(decompressedString);
}
function msg(text){
    const msgConsole = document.getElementById("msgs");
    msgConsole.value += text + '\n';
    console.log(text);
}

function exportData() {
    return Promise.all([getAllFromStore('todo'), getAllFromStore('next'), getAllFromStore('someday'), getAllFromStore('weeklyGoals')])
        .then(([todoData, nextData, somedayData, weeklyGoalsData ]) => {
            return JSON.stringify({ 
                todo: todoData,
                next: nextData,
                someday: somedayData,
                weeklyGoals: weeklyGoalsData });
        });
}

 async function importData(jsonData) {
    const data = JSON.parse(jsonData);
    const promises = [];
    
    async function mergeAndSave(type, newData) {
        const existingData = await getAllFromStore(type) || [];

        const identifierKey = {
            todo: 'date',
            next: 'name',
            someday: 'name',
            weeklyGoals: 'week',
        }[type];

        for (const newItem of newData) {
            if (!newItem[identifierKey]) {
                console.error(`Error: Missing required key (${identifierKey}) in new ${type} item:`, newItem);
                msg(`Error: Missing key (${identifierKey}) in ${type}`);
                continue; // Skip items without the required key
            }

            const isDuplicate = existingData.some(existingItem => existingItem[identifierKey] === newItem[identifierKey]);

            if (isDuplicate) {
                msg(`Skipped: Duplicate ${type} entry for ${identifierKey}: ${newItem[identifierKey]}`);
            } else {
                try {
                    await saveToStore(type, newItem); // Save individual item
                    msg(`Added: New ${type} entry for ${identifierKey}: ${newItem[identifierKey]}`);
                } catch (error) {
                    console.error(`Failed to save ${type} item:`, newItem, error);
                    msg(`Error saving ${type} entry for ${identifierKey}: ${newItem[identifierKey]}`);
                }
            }
        }
    }

    // Process each type of data
    ['todo', 'next', 'someday', 'weeklyGoals'].forEach(type => {
        if (data[type]) {
            promises.push(mergeAndSave(type, data[type]));
        }
    });

    return Promise.all(promises);
}