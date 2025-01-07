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

<<<<<<< HEAD
    let socket = null;
    checkDatabaseVersion();
    databaseOpen(() => {
            console.log('Database opened');
    });
    document.getElementById('generateButton').addEventListener('click', () => {
        const randomCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
        codeInput.value = randomCode;
        connectButton.disabled = false;
    });
    codeInput.addEventListener("input", function (event) {
        let input = event.target;
        let value = input.value.replace(/\D/g, ""); // Remove any non-digit characters
        // Format as XXX-XXX
        if (value.length > 3) { value = value.slice(0, 3) + "-" + value.slice(3, 6); }
        input.value = value;
        connectButton.disabled = !/^\d{3}-\d{3}$/.test(input.value);
    });
    connectButton.addEventListener('click', () => {
        statusMessage.textContent = event.target.checked 
        ? "Waiting for another device to connect…" 
        : "Enter code and toggle the switch to connect.";
        
        const code = codeInput.value;
        syncButton.disabled = true;
        // Validate code format
        if (/^\d{3}-\d{3}$/.test(code)) {
            if (socket && socket.connected) {
                console.log("Disconnecting existing socket connection...");
                socket.disconnect(); // Disconnect the existing socket connection
                generateButton.style.display = 'block';
                codeInput.classList.remove('connected');
                codeInput.readOnly = false;
                syncButton.disabled = true;
                return
=======
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
>>>>>>> fdaf486 (grabbed latest from bwalk)
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
<<<<<<< HEAD
                document.getElementById('userCount').textContent = userMsg;
            });
        	socket.on('sync', (compressedData) => {
        		msg('sync request');
                const jsonData = decompressData(decodeURIComponent(compressedData));
                msg("Decompressed JSON Data:");
                console.log(jsonData);
                importData(jsonData).then(() => {
                    msg("Import completed!");
                });
        	});
        }
    });
    //export to others
	syncButton.addEventListener('click', () => {
  		msg('sending export');
  		exportData().then((jsonData) => {
        	const compressedData = compressData(jsonData);
        	const encodedData = encodeURIComponent(compressedData);
			socket.emit('sync', encodedData);
		});
	});

    //manually export
    document.getElementById('showData').addEventListener('click', () => {
        exportData().then((jsonData) => {
            console.log(compressData(jsonData));
            document.getElementById('json').value = jsonData;
            document.getElementById('saveData').disabled = false;
        });
    });
    //validate json before saving
    document.getElementById('json').addEventListener('change', ({ target }) => {
        const isValidJSON = (value) => { 
            try {
                JSON.parse(value);
                return true;
            } catch {
                return false;
=======
>>>>>>> fdaf486 (grabbed latest from bwalk)
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