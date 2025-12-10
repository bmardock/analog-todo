let db;
// Unified logger - initialize once globally, used by all modules
// This file loads first, so we set up the logger here
if (typeof window !== 'undefined' && !window.DEBUG) {
  window.DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}
// Create unified logger functions that check DEBUG internally
// Store on window to persist across script reloads and avoid redeclaration errors
if (!window.log) {
  window.log = (...args) => {
    if (window.DEBUG) console.log(...args);
  };
  window.error = (...args) => {
    if (window.DEBUG) console.error(...args);
  };
  window.warn = (...args) => {
    if (window.DEBUG) console.warn(...args);
  };
}

function checkDatabaseVersion(dbName = "todos") {
  window.log("get name", dbName);
  const request = indexedDB.open(dbName);
  request.onsuccess = function (event) {
    db = event.target.result;
    window.log(
      `The current version of the '${dbName}' database is: ${db.version}`
    );
    db.close(); // Close the database when done
  };
  request.onupgradeneeded = function (e) {
    window.log("need upgrade");
  };
  request.onerror = function (e) {
    window.error("Failed to open the database:", e.target.error);
  };
}
//const databaseError = (e) => console.error('IndexedDB Error:', e.target.error);
const databaseError = (error) => {
  if (error && error.message) {
    window.error("Database Error:", error.message);
  } else {
    window.error("An unexpected error occurred:", error);
  }
};
//open db
const databaseOpen = (callback) => {
  window.log("starting db");
  // Open a database, specify the name and version
  const version = 27; // Increment version to trigger migration for appSettings store
  const request = indexedDB.open("todos", version);
  // Run migrations if necessary
  request.onupgradeneeded = (e) => {
    const dbLocal = e.target.result;
    databaseSchema(e);
  };
  request.onsuccess = function (e) {
    db = e.target.result;
    window.log("success");
    // Migrate localStorage values to IndexedDB after database is ready
    migrateLocalStorageToIndexedDB().then(() => {
      callback(db);
    });
  };
  request.onerror = (e) => {
    databaseError(e);
  };
  request.onblocked = () => {
    window.warn(
      "Database open request was blocked. Close other tabs with this database open."
    );
  };
};
const databaseSchema = (e) => {
  window.log("Updating database schema...");
  const db = e.target.result;
  const tx = e.target.transaction;
  // Helper to check and create missing indexes
  const ensureIndexes = (store, indexes) => {
    indexes.forEach(({ name, keyPath, options }) => {
      if (!store.indexNames.contains(name)) {
        store.createIndex(name, keyPath, options);
        window.log(`Index '${name}' created.`);
      }
    });
  };
  // 'todo' store
  {
    let store;
    if (!db.objectStoreNames.contains("todo")) {
      store = db.createObjectStore("todo", { keyPath: "date" }); // Composite key
      window.log("Object store 'todo' created.");
    } else {
      store = tx.objectStore("todo");
    }
    ensureIndexes(store, [
      { name: "date", keyPath: "date", options: { unique: true } },
    ]);
  }
  // 'next' store
  {
    let store;
    if (!db.objectStoreNames.contains("next")) {
      store = db.createObjectStore("next", { keyPath: "name" });
      window.log("Object store 'next' created.");
    } else {
      store = tx.objectStore("next");
    }
    ensureIndexes(store, [
      { name: "name", keyPath: "name", options: { unique: true } },
      {
        name: "lastUpdated",
        keyPath: "lastUpdated",
        options: { unique: false },
      },
      { name: "archived", keyPath: "archived", options: { unique: false } },
    ]);
  }
  // 'someday' store
  {
    let store;
    if (!db.objectStoreNames.contains("someday")) {
      store = db.createObjectStore("someday", { keyPath: "name" });
      window.log("Object store 'someday' created.");
    } else {
      store = tx.objectStore("someday");
    }
    ensureIndexes(store, [
      { name: "name", keyPath: "name", options: { unique: true } },
      {
        name: "lastUpdated",
        keyPath: "lastUpdated",
        options: { unique: false },
      },
      { name: "archived", keyPath: "archived", options: { unique: false } },
    ]);
  }
  // 'weeklyGoals' store
  {
    if (!db.objectStoreNames.contains("weeklyGoals")) {
      db.createObjectStore("weeklyGoals", { keyPath: "week" }); // 'week' as primary key
      window.log("Object store 'weeklyGoals' created.");
    }
  }
  // 'appSettings' store
  {
    if (!db.objectStoreNames.contains("appSettings")) {
      db.createObjectStore("appSettings", { keyPath: "key" });
      window.log("Object store 'appSettings' created.");
    }
  }
};
// Open a transaction with a specified mode (default to "readonly")
function openTransaction(storeNames, mode = "readonly") {
  return db.transaction(storeNames, mode);
}
function recreateDatabase(databaseName, callback) {
  if (db) db.close(); // Close the existing database connection
  const deleteRequest = indexedDB.deleteDatabase(databaseName);
  deleteRequest.onsuccess = () => {
    window.log(`Database "${databaseName}" deleted successfully.`);
    // Reopen and recreate the database
    databaseOpen(databaseName, (newDb) => {
      window.log(`Database "${databaseName}" opened and schema recreated.`);
      callback(newDb); // Notify the caller that the database has been recreated
    });
  };
  deleteRequest.onerror = (e) => {
    window.error(
      `Failed to delete the database "${databaseName}":`,
      e.target.error
    );
    callback(null); // Notify the caller that the deletion failed
  };
  deleteRequest.onblocked = () => {
    window.warn(
      `Database deletion for "${databaseName}" is blocked. Ensure all tabs are closed.`
    );
  };
}

function getDataByIndex(storeName, indexName, query) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = openTransaction([storeName]);
      if (!transaction) {
        reject(new Error("Failed to open transaction"));
        return;
      }
      transaction.onerror = (e) => reject(e.target.error);
      
      const store = transaction.objectStore(storeName);
      if (!store) {
        reject(new Error(`Store "${storeName}" not found`));
        return;
      }
      
      // Check if the index exists
      if (!store.indexNames.contains(indexName)) {
        const debug = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (debug) {
          console.warn(
            `Index "${indexName}" does not exist in store "${storeName}". This may require a database update.`
          );
        }
        // Don't automatically recreate - let the upgrade handler deal with it
        reject(
          new Error(
            `Index "${indexName}" is missing. Please refresh the page to update the database.`
          )
        );
        return;
      }
      const index = store.index(indexName);
      const request = index.getAll(query);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}
function getAllFromStore(storeName, indexName = null, query = null) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = openTransaction([storeName]);
      if (!transaction) {
        reject(new Error("Failed to open transaction"));
        return;
      }
      transaction.onerror = (e) => reject(e.target.error);
      
      const store = transaction.objectStore(storeName);
      if (!store) {
        reject(new Error(`Store "${storeName}" not found`));
        return;
      }

      // Use the specified index or the object store itself
      const source = indexName ? store.index(indexName) : store;
      if (!source) {
        reject(new Error(`Index "${indexName}" not found in store "${storeName}"`));
        return;
      }

      // Create a key range if a query is provided
      const request =
        query !== null ? source.getAll(IDBKeyRange.only(query)) : source.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}
function getLastRow(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = openTransaction([storeName]);
    const store = transaction.objectStore(storeName);

    // Open a cursor in reverse order to get the last row
    const request = store.openCursor(null, "prev");

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
        if (typeof key === "string") {
          // Split the string key (e.g., "type_date2024-11-17") into an array
          const match = key.match(/(.*?)(_?\d{4}-\d{2}-\d{2})$/);
          if (match) {
            return [match[1].replace(/_$/, ""), match[2]]; // [prefix, date]
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
    try {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }
      if (!data) {
        reject(new Error("No data provided to save"));
        return;
      }
      const transaction = openTransaction([storeName], "readwrite");
      if (!transaction) {
        reject(new Error("Failed to open transaction"));
        return;
      }
      transaction.onerror = (e) => reject(e.target.error);
      
      const store = transaction.objectStore(storeName);
      if (!store) {
        reject(new Error(`Store "${storeName}" not found`));
        return;
      }
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    } catch (error) {
      reject(error);
    }
  });
}

// Get app setting from IndexedDB
function getAppSetting(key) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = openTransaction(["appSettings"]);
      if (!transaction) {
        reject(new Error("Failed to open transaction"));
        return;
      }
      transaction.onerror = (e) => reject(e.target.error);
      
      const store = transaction.objectStore("appSettings");
      if (!store) {
        reject(new Error("Store 'appSettings' not found"));
        return;
      }
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

// Set app setting in IndexedDB
function setAppSetting(key, value) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = openTransaction(["appSettings"], "readwrite");
      if (!transaction) {
        reject(new Error("Failed to open transaction"));
        return;
      }
      transaction.onerror = (e) => reject(e.target.error);
      
      const store = transaction.objectStore("appSettings");
      if (!store) {
        reject(new Error("Store 'appSettings' not found"));
        return;
      }
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    } catch (error) {
      reject(error);
    }
  });
}

// Migrate localStorage values to IndexedDB (run once on app load)
function migrateLocalStorageToIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve(); // Database not ready yet, skip migration
      return;
    }
    
    const keysToMigrate = ['connect_id', 'thread_id'];
    const migrationPromises = keysToMigrate.map(key => {
      const value = localStorage.getItem(key);
      if (value) {
        return getAppSetting(key).then(storedValue => {
          // Only migrate if not already in IndexedDB
          if (storedValue === null) {
            return setAppSetting(key, value).then(() => {
              window.log(`Migrated ${key} from localStorage to IndexedDB`);
              localStorage.removeItem(key); // Remove from localStorage after migration
            });
          }
        });
      }
      return Promise.resolve();
    });
    
    Promise.all(migrationPromises)
      .then(() => resolve())
      .catch(error => {
        window.error("Error during localStorage migration:", error);
        resolve(); // Don't fail app if migration fails
      });
  });
}
