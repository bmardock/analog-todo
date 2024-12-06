    let db;
    function checkDatabaseVersion(dbName='todos') {
        console.log('get name', dbName);
        const request = indexedDB.open(dbName);
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log(`The current version of the '${dbName}' database is: ${db.version}`);
            db.close(); // Close the database when done
        }
        request.onupgradeneeded = function (e){
          console.log('need upgrade');
        }
        request.onerror = function(e) {
            console.error("Failed to open the database:", e.target.error);
        };
    }
    //const databaseError = (e) => console.error('IndexedDB Error:', e.target.error);
    const databaseError = (error) => {
      if (error && error.message) {
        console.error("Database Error:", error.message);
      } else {
        console.error("An unexpected error occurred:", error);
      }
    };
    //open db
    const databaseOpen = (callback) => {
        console.log('starting db');
        // Open a database, specify the name and version
        var version = 26;
        var request = indexedDB.open('todos', version);
        // Run migrations if necessary
        request.onupgradeneeded = (e) => {
          const dbLocal = e.target.result;
          databaseSchema(e);
        };
        request.onsuccess = function(e) {
          db = e.target.result;
          console.log('success');
          callback(db);
        };
        request.onerror = (e) => { databaseError(e) };
        request.onblocked = () => {
          console.warn('Database open request was blocked. Close other tabs with this database open.');
        };
    };
    const databaseSchema = (e) => {
        console.log('Updating database schema...');
        const db = event.target.result;
        const tx = event.target.transaction;
        // Helper to check and create missing indexes
        const ensureIndexes = (store, indexes) => {
            indexes.forEach(({ name, keyPath, options }) => {
                if (!store.indexNames.contains(name)) {
                    store.createIndex(name, keyPath, options);
                    console.log(`Index '${name}' created.`);
                }
            });
        };
        // 'todo' store
        {
            let store;
            if (!db.objectStoreNames.contains('todo')) {
                store = db.createObjectStore('todo', { keyPath: 'date' }); // Composite key
                console.log("Object store 'todo' created.");
            } else {
                store = tx.objectStore('todo');
            }
            ensureIndexes(store, [
                { name: 'date', keyPath: 'date', options: { unique: true } }
            ]);
        }
        // 'next' store
        {
            let store;
            if (!db.objectStoreNames.contains('next')) {
                store = db.createObjectStore('next', { keyPath: 'name' });
                console.log("Object store 'next' created.");
            } else {
                store = tx.objectStore('next');
            }
            ensureIndexes(store, [
                { name: 'name', keyPath: 'name', options: { unique: true } },
                { name: 'lastUpdated', keyPath: 'lastUpdated', options: { unique: false } },
                { name: 'archived', keyPath: 'archived', options: { unique: false } }
            ]);
        }
        // 'someday' store
        {
            let store;
            if (!db.objectStoreNames.contains('someday')) {
                store = db.createObjectStore('someday', { keyPath: 'name' });
                console.log("Object store 'someday' created.");
            } else {
                store = tx.objectStore('someday');
            }
            ensureIndexes(store, [
                { name: 'name', keyPath: 'name', options: { unique: true } },
                { name: 'lastUpdated', keyPath: 'lastUpdated', options: { unique: false } },
                { name: 'archived', keyPath: 'archived', options: { unique: false } }
            ]);
        }
        // 'weeklyGoals' store
        {
            if (!db.objectStoreNames.contains('weeklyGoals')) {
                db.createObjectStore('weeklyGoals', { keyPath: 'week' }); // 'week' as primary key
                console.log("Object store 'weeklyGoals' created.");
            }
        }
    }
    // Open a transaction with a specified mode (default to "readonly")
    function openTransaction(storeNames, mode = 'readonly') {
        return db.transaction(storeNames, mode);
    }
    function recreateDatabase(databaseName, callback) {
        if (db) db.close(); // Close the existing database connection
        const deleteRequest = indexedDB.deleteDatabase(databaseName);
        deleteRequest.onsuccess = () => {
            console.log(`Database "${databaseName}" deleted successfully.`);
            // Reopen and recreate the database
            databaseOpen(databaseName, (newDb) => {
                console.log(`Database "${databaseName}" opened and schema recreated.`);
                callback(newDb); // Notify the caller that the database has been recreated
            });
        };
        deleteRequest.onerror = (e) => {
            console.error(`Failed to delete the database "${databaseName}":`, e.target.error);
            callback(null); // Notify the caller that the deletion failed
        };
        deleteRequest.onblocked = () => {
            console.warn(`Database deletion for "${databaseName}" is blocked. Ensure all tabs are closed.`);
        };
    }

    function getDataByIndex(storeName, indexName, query) {
        return new Promise((resolve, reject) => {
            const transaction = openTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            // Check if the index exists
            if (!store.indexNames.contains(indexName)) {
                console.warn(`Index "${indexName}" does not exist in store "${storeName}". Deleting and recreating database.`);
                // Delete and recreate the database
                recreateDatabase(db.name, () => {
                    console.log('Database recreated successfully.');
                    reject(new Error(`Index "${indexName}" was missing. Database has been recreated.`));
                });
                return; // Exit early since the database is being recreated
            }
            const index = store.index(indexName);
            const request = index.getAll(query);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    function getAllFromStore(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = openTransaction([storeName]);
            const store = transaction.objectStore(storeName);

            // Use the specified index or the object store itself
            const source = indexName ? store.index(indexName) : store;

            // Create a key range if a query is provided
            const request = query !== null ? source.getAll(IDBKeyRange.only(query)) : source.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    function getLastRow(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = openTransaction([storeName]);
            const store = transaction.objectStore(storeName);

            // Open a cursor in reverse order to get the last row
            const request = store.openCursor(null, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    resolve(cursor.value); // Return the last row
                } else {
                    resolve(null); // Resolve as null if the store is empty
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
    function getKeyFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = openTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    // Get all keys from a specific store
    function getKeysFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = openTransaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.getAllKeys();
            request.onsuccess = () => {
                const keys = request.result;
                // Normalize keys: Convert strings to arrays by splitting on "_"
                const normalizedKeys = keys.map((key) => {
                    if (typeof key === 'string') {
                        // Split the string key (e.g., "type_date2024-11-17") into an array
                        const match = key.match(/(.*?)(_?\d{4}-\d{2}-\d{2})$/);
                        if (match) {
                            return [match[1].replace(/_$/, ''), match[2]]; // [prefix, date]
                        }
                        return [key]; // Return the full key as a single-element array if no match
                    }
                    return key; // Leave arrays (composite keys) unchanged
                });
                resolve(normalizedKeys);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Save data to a specific store
    function saveToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = openTransaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
            request.onerror = (event) => reject(event.target.error);
        });
    }
