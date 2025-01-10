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

function msg(text) {
    const msgConsole = document.getElementById("msgs");
    msgConsole.value += text + '\n';
    console.log(text);
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
    const data = JSON.parse(jsonData);
    const promises = [];

    const mergeAndSave = async (type, newData) => {
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
    };

    // Process each type of data
    for (const type of ['todo', 'next', 'someday', 'weeklyGoals']) {
        if (data[type]) {
            promises.push(mergeAndSave(type, data[type]));
        }
    }

    await Promise.all(promises);
} 