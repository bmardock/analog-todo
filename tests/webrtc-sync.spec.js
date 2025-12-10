const { test, expect } = require("@playwright/test");

test.describe("WebRTC Sync Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#export");
    await page.waitForTimeout(2000);
  });

  test("should migrate connect_id from localStorage to IndexedDB", async ({
    page,
  }) => {
    // Set connect_id in localStorage (simulating old behavior)
    await page.evaluate(() => {
      localStorage.setItem("connect_id", "123-456");
    });

    // Reload page to trigger migration
    await page.reload();
    await page.waitForTimeout(2000);

    // Check that connect_id is in IndexedDB
    const connectIdInDB = await page.evaluate(async () => {
      return await getAppSetting("connect_id");
    });

    expect(connectIdInDB).toBe("123-456");

    // Check that localStorage is cleared
    const connectIdInLS = await page.evaluate(() => {
      return localStorage.getItem("connect_id");
    });
    expect(connectIdInLS).toBeNull();
  });

  test("should migrate thread_id from localStorage to IndexedDB", async ({
    page,
  }) => {
    // Set thread_id in localStorage
    await page.evaluate(() => {
      localStorage.setItem("thread_id", "test-thread-123");
    });

    // Navigate to home first to trigger database migration
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Navigate to coach page
    await page.goto("/#coach");
    await page.waitForTimeout(2000);

    // Check that thread_id is in IndexedDB
    const threadIdInDB = await page.evaluate(async () => {
      return await getAppSetting("thread_id");
    });

    expect(threadIdInDB).toBe("test-thread-123");

    // Check that localStorage is cleared
    const threadIdInLS = await page.evaluate(() => {
      return localStorage.getItem("thread_id");
    });
    expect(threadIdInLS).toBeNull();
  });

  test("should store and retrieve app settings in IndexedDB", async ({
    page,
  }) => {
    // Test setting and getting app settings
    await page.evaluate(async () => {
      await setAppSetting("test_key", "test_value");
    });

    const value = await page.evaluate(async () => {
      return await getAppSetting("test_key");
    });

    expect(value).toBe("test_value");
  });

  test("should resolve conflicts using timestamps (newer wins)", async ({
    page,
  }) => {
    // Navigate to export page to load export.js functions
    await page.goto("/#export");
    await page.waitForTimeout(2000);

    // Wait for export.js to load
    await page.waitForFunction(() => typeof window.importData === "function", {
      timeout: 5000,
    });

    const testData = {
      todo: [
        {
          date: "2024-01-01",
          todos: [{ text: "Original task", signal: "" }],
          cardSignal: [false, false, false],
          braindump: "",
          lastUpdated: new Date("2024-01-01T10:00:00").toISOString(),
        },
      ],
    };

    // First, add the original data
    await page.evaluate(async (data) => {
      await saveToStore("todo", data.todo[0]);
    }, testData);

    // Now import newer version
    const newerData = {
      todo: [
        {
          date: "2024-01-01",
          todos: [{ text: "Updated task", signal: "" }],
          cardSignal: [false, false, false],
          braindump: "",
          lastUpdated: new Date("2024-01-01T11:00:00").toISOString(), // Newer timestamp
        },
      ],
    };

    await page.evaluate(async (data) => {
      const jsonData = JSON.stringify(data);
      await window.importData(jsonData);
    }, newerData);

    await page.waitForTimeout(1000);

    // Verify newer version was saved
    const savedData = await page.evaluate(async () => {
      return await getKeyFromStore("todo", "2024-01-01");
    });

    expect(savedData.todos[0].text).toBe("Updated task");
    expect(new Date(savedData.lastUpdated).getTime()).toBeGreaterThan(
      new Date(testData.todo[0].lastUpdated).getTime()
    );
  });

  test("should resolve conflicts using timestamps (older skipped)", async ({
    page,
  }) => {
    // Navigate to export page to load export.js functions
    await page.goto("/#export");
    await page.waitForTimeout(2000);

    // Wait for export.js to load
    await page.waitForFunction(() => typeof window.importData === "function", {
      timeout: 5000,
    });

    const newerData = {
      todo: [
        {
          date: "2024-01-02",
          todos: [{ text: "Newer task", signal: "" }],
          cardSignal: [false, false, false],
          braindump: "",
          lastUpdated: new Date("2024-01-02T12:00:00").toISOString(),
        },
      ],
    };

    // First, add the newer data
    await page.evaluate(async (data) => {
      await saveToStore("todo", data.todo[0]);
    }, newerData);

    // Now try to import older version
    const olderData = {
      todo: [
        {
          date: "2024-01-02",
          todos: [{ text: "Older task", signal: "" }],
          cardSignal: [false, false, false],
          braindump: "",
          lastUpdated: new Date("2024-01-02T11:00:00").toISOString(), // Older timestamp
        },
      ],
    };

    await page.evaluate(async (data) => {
      const jsonData = JSON.stringify(data);
      await window.importData(jsonData);
    }, olderData);

    await page.waitForTimeout(1000);

    // Verify newer version is still there (older was skipped)
    const savedData = await page.evaluate(async () => {
      return await getKeyFromStore("todo", "2024-01-02");
    });

    expect(savedData.todos[0].text).toBe("Newer task");
  });

  test("should have WebRTC functions available", async ({ page }) => {
    const hasWebRTC = await page.evaluate(() => {
      return typeof RTCPeerConnection !== "undefined";
    });

    expect(hasWebRTC).toBe(true);
  });

  test("should auto-connect with saved connect_id", async ({ page }) => {
    // Set connect_id in IndexedDB
    await page.evaluate(async () => {
      await setAppSetting("connect_id", "789-012");
    });

    // Navigate to export page
    await page.goto("/#export");
    await page.waitForTimeout(3000);

    // Check that code input has the saved value
    const codeInput = page.locator("#code-input");
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    const codeValue = await codeInput.inputValue();

    // The code should be pre-filled (auto-connect may or may not trigger depending on Socket.io)
    expect(codeValue).toBe("789-012");
  });

  test("should export and import data correctly", async ({ page }) => {
    // Navigate to export page to load export.js functions
    await page.goto("/#export");
    await page.waitForTimeout(2000);

    // Wait for export.js to load
    await page.waitForFunction(
      () =>
        typeof window.exportData === "function" &&
        typeof window.importData === "function",
      { timeout: 5000 }
    );

    // Add test data
    const testData = {
      date: "2024-01-03",
      todos: [{ text: "Test export", signal: "" }],
      cardSignal: [false, false, false],
      braindump: "",
      lastUpdated: new Date().toISOString(),
    };

    await page.evaluate(async (data) => {
      await saveToStore("todo", data);
    }, testData);

    // Export data
    const exportedData = await page.evaluate(async () => {
      return await window.exportData();
    });

    const parsed = JSON.parse(exportedData);
    expect(parsed.todo).toBeDefined();
    expect(parsed.todo.length).toBeGreaterThan(0);

    const found = parsed.todo.find((t) => t.date === "2024-01-03");
    expect(found).toBeDefined();
    expect(found.todos[0].text).toBe("Test export");

    // Clear the data and re-import
    await page.evaluate(async () => {
      const transaction = db.transaction(["todo"], "readwrite");
      const store = transaction.objectStore("todo");
      await new Promise((resolve, reject) => {
        const request = store.delete("2024-01-03");
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    // Import the exported data
    await page.evaluate(async (jsonData) => {
      await window.importData(jsonData);
    }, exportedData);

    await page.waitForTimeout(1000);

    // Verify data was imported
    const importedData = await page.evaluate(async () => {
      return await getKeyFromStore("todo", "2024-01-03");
    });

    expect(importedData).toBeDefined();
    expect(importedData.todos[0].text).toBe("Test export");
  });

  test("should handle missing lastUpdated in conflict resolution", async ({
    page,
  }) => {
    // Navigate to export page to load export.js functions
    await page.goto("/#export");
    await page.waitForTimeout(2000);

    // Wait for export.js to load
    await page.waitForFunction(() => typeof window.importData === "function", {
      timeout: 5000,
    });

    // Add data without lastUpdated
    const dataWithoutTimestamp = {
      date: "2024-01-04",
      todos: [{ text: "No timestamp", signal: "" }],
      cardSignal: [false, false, false],
      braindump: "",
    };

    await page.evaluate(async (data) => {
      await saveToStore("todo", data);
    }, dataWithoutTimestamp);

    // Try to import same data with timestamp
    const dataWithTimestamp = {
      todo: [
        {
          date: "2024-01-04",
          todos: [{ text: "With timestamp", signal: "" }],
          cardSignal: [false, false, false],
          braindump: "",
          lastUpdated: new Date().toISOString(),
        },
      ],
    };

    await page.evaluate(async (data) => {
      const jsonData = JSON.stringify(data);
      await window.importData(jsonData);
    }, dataWithTimestamp);

    await page.waitForTimeout(1000);

    // Version with timestamp should win
    const savedData = await page.evaluate(async () => {
      return await getKeyFromStore("todo", "2024-01-04");
    });

    expect(savedData.todos[0].text).toBe("With timestamp");
    expect(savedData.lastUpdated).toBeDefined();
  });
});
