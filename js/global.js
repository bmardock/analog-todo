if (!window.TodoApp || !window.TodoApp.cardManager) {
  class TodoManager {
    constructor() {
      this.storeName = "";
      //this.init();
    }

    setupTodos = () => {
      const todoList = document.querySelector("todoList");
      const template = todoList.firstElementChild;
      const fragment = document.createDocumentFragment();
      for (let x = 2; x <= 10; x++) {
        const clone = template.cloneNode(true);
        clone.setAttribute("data-position", x);
        clone.querySelector("input").tabIndex = x;
        fragment.appendChild(clone);
      }
      todoList.appendChild(fragment);
    };

    // Utility to get a unique card name
    async getUniqueCardName(name) {
      let uniqueName = name;
      let count = 2;
      while (await getKeyFromStore(this.storeName, uniqueName)) {
        uniqueName = `${name}_${count}`;
        count++;
      }
      return uniqueName;
    }

    // Fetch list data based on archive status and populate a container
    async fetchListData(archivedStatus, containerSelector) {
      const container = document.querySelector(containerSelector);
      console.log("fetchListData", "archive:", archivedStatus, this.storeName);
      try {
        const rows = await getAllFromStore(
          this.storeName,
          "archived",
          archivedStatus
        );
        rows.sort((a, b) => a.lastUpdated - b.lastUpdated); // Sort rows
        container.innerHTML = ""; // Clear existing content
        rows.forEach((todo) => {
          container.innerHTML += `<div class="circle" data-text="${todo.name}"></div>`;
        });
        if (archivedStatus === 0) {
          container.innerHTML +=
            '<div class="circle" data-text="Add New">+</div>';
        }
        container.parentNode.classList.toggle("empty", rows.length < 1);
      } catch (error) {
        console.error(`Error fetching rows for ${containerSelector}:`, error);
      }
    }

    // Get data from the DOM
    getDataFromDOM() {
      return {
        [document.querySelector(".picker").name]:
          document.querySelector(".picker").value,
        archived: document.querySelector("[name=archive]").checked ? 1 : 0,
        todos: Array.from(document.querySelectorAll("todoList todoitem"))
          .map((todo) => ({
            signal: todo.querySelector(".signal")?.value || "",
            text: todo.querySelector("input")?.value.trim() || "",
          }))
          .filter((todo) => todo.text !== ""),
        cardSignal: Array.from(
          document.querySelectorAll(".cardSignal input")
        ).map((signal) => signal.checked),
        braindump: document.querySelector("[name=braindump]").value,
      };
    }

    // Render a card
    renderCard(data) {
      const { name = "", archived = false } = data?.[0] || {};
      if (this.storeName != "todo") {
        const titleInput = document.querySelector(".picker");
        titleInput.value = name;
        titleInput.readOnly = !!name;
        document
          .querySelector(".archive-button")
          .classList.toggle("on", !!name);
        document.getElementById("archive").checked = !!archived;
        document.querySelector(`[data-text="${name}"]`)?.classList.add("on");
      }
      this.renderTodos(data);
    }

    // Render todos
    renderTodos(data) {
      const todoList = document.querySelectorAll("todoItem");
      const cardSignals = document.querySelectorAll(".cardSignal input");
      const braindump = document.querySelector("[name=braindump]");
      const todoDate = data?.[0]?.date;
      const today = new Date().toLocaleDateString("en-CA");

      todoList.forEach((item, index) => {
        const todo = data?.[0]?.todos?.[index] || { signal: "", text: "" };
        item
          .querySelector(".dropdown")
          .classList.toggle("disabled", todo.text.trim() === "");
        item.querySelector("input").value = todo.text;
        item.querySelector(".signal").className = `signal ${todo.signal}`;
        item.querySelector(".signal").value = todo.signal;
        const shouldShow =
          todoDate < today &&
          (todo.signal === "" || todo.signal === "in-progress") &&
          todo.text !== "";
        item
          .querySelector("select.copy")
          .classList.toggle("hidden", !shouldShow);
      });

      cardSignals.forEach((sig, index) => {
        sig.checked = data?.[0]?.cardSignal?.[index] || false;
      });

      braindump.value = data?.[0]?.braindump || "";
      document.documentElement.classList.toggle(
        "notes",
        braindump.value.trim() !== ""
      );
    }

    // Fetch recent list
    recentList = () => {
      this.fetchListData(0, "#recent_list");
      this.fetchListData(1, "#archive_list");
    };

    renderCalList = () => {
      const dateInput = document.querySelector(".picker");
      getKeysFromStore(this.storeName).then((todos) => {
        console.log("todos", todos);
        const eventDates = new Set();
        todos.forEach(([type, date]) => {
          if (date) {
            eventDates.add(date);
          }
        });

        const [year, month, day] = dateInput.value.split("-").map(Number);
        const todayDate = new Date(year, month - 1, day);
        const calWindow = 7;
        const middle = Math.floor(calWindow / 2);
        document.querySelector(".calendar").innerHTML = Array.from(
          { length: calWindow },
          (_, i) => {
            const currentDate = new Date(todayDate);
            currentDate.setDate(todayDate.getDate() + i - middle);
            const key = currentDate.toLocaleDateString("en-CA");
            const hasEvent = eventDates.has(key);
            return this.createDayElement(currentDate, i === middle, hasEvent);
          }
        ).join("");
      });
    };
    createDayElement = (date, current, hasEvent) => {
      const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
      let classNames = current ? "current " : "";
      classNames +=
        date.toDateString() === new Date().toDateString() ? "today " : "";
      classNames += hasEvent ? "has-event " : "";

      return `
      <div class="day">
        ${daysOfWeek[date.getDay()]}
        <a href="?date=${date.toLocaleDateString(
          "en-CA"
        )}" class="${classNames}">${date.getDate()}</a>
        ${hasEvent ? '<span class="today"></span>' : ""}
      </div>`;
    };

    // Save and render
    saveAndRender = () => {
      console.log("Saving todo and re-rendering");
      const data = this.getDataFromDOM();
      console.log(data);
      this.saveList(data, () => {
        this.fetchAndRender();
      });
    };

    // Fetch and render
    fetchAndRender = () => {
      console.log("Fetching and rendering todos");
      const key = document.querySelector(".picker").name;
      const value = document.querySelector(".picker").value;
      this.reconstructUrl(key, value);
      if (this.storeName == "todo") {
        console.log("rerender Cal list");
        this.renderCalList();
      } else {
        console.log("rerender Recent list");
        this.recentList();
      }
      this.fetchCard(key, value, this.renderCard.bind(this));
    };

    // Save list
    async saveList(data, callback) {
      console.log("Saving altered data", this.storeName, data);
      data.lastUpdated = new Date();

      if (data.name !== "") {
        try {
          await saveToStore(this.storeName, data);
          callback();
        } catch (error) {
          console.error("Error saving data:", error.message);
        }
      } else {
        alert("Set Name first");
      }
    }

    // Fetch card
    async fetchCard(key, value, callback) {
      console.log("Fetching List:", key, value);
      try {
        const data = await getDataByIndex(this.storeName, key, value);
        callback(data);
      } catch (error) {
        console.error("Error fetching todos by index:", error.message);
      }
    }

    // Change content direction
    changeContent(direction) {
      const cards = document.querySelectorAll("card");
      const activeIndex = Array.from(cards).findIndex((card) =>
        card.classList.contains("active")
      );
      if (activeIndex !== -1) cards[activeIndex].classList.remove("active");
      const newIndex = (activeIndex + direction + cards.length) % cards.length;
      cards[newIndex].classList.add("active");
    }

    reconstructUrl(key, value) {
      const url = new URL(window.location);
      url.searchParams.set(key, value);
      window.history.pushState({}, "", url);
    }
    async getLastRow(storeName) {
      try {
        const rows = await getAllFromStore(storeName, "archived", 0);
        if (rows.length > 0) {
          rows.sort((a, b) => a.lastUpdated - b.lastUpdated);
          return rows.at(-1);
          //this.renderCard([rows.at(-1)]); // Using `at(-1)` to get the last element
        }
        return null;
      } catch (error) {
        console.error("Error fetching the last row:", error);
      }
    }
    async copyTaskToList(copyTo, signal, text) {
      const today = new Date().toLocaleDateString("en-CA");
      const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString(
        "en-CA"
      );
      // Determine store name and value
      const storeMap = {
        today: { storeName: "todo", value: today },
        tomorrow: { storeName: "todo", value: tomorrow },
        next: { storeName: "next" },
        someday: { storeName: "someday" },
      };
      const { storeName, value } = storeMap[copyTo] || {};
      if (!storeName) {
        alert("Invalid destination list specified.");
        return;
      }
      let data;
      if (copyTo === "next" || copyTo === "someday") {
        // Get the last row for "next" or "someday"
        if (!(data = await this.getLastRow(storeName))) {
          alert("No list available in the target store.");
          return;
        }
      } else {
        // For "today" or "tomorrow", find or create a matching entry
        const results = await getDataByIndex(storeName, "date", value);
        data = results[0] || {
          date: value,
          todos: [],
          cardSignal: "",
          braindump: "",
        };
      }

      // Add the task to the list
      if (data.todos.length < 10) {
        data.todos.push({ signal, text });
        await saveToStore(storeName, data);
        console.log("Data saved successfully:", data);
      } else {
        alert("Todo list is full, cannot add more items.");
      }
    }
    // Initialize the manager
    async init() {
      //store name should only be todo, next, someday
      this.storeName =
        window.location.hash.slice(1) ||
        document.querySelector("#listType").value.toLowerCase();
      document.documentElement.classList.remove("notes");

      if (document.querySelector(".picker")?.value) {
        //if card name is set
        this.fetchAndRender();
      } else if (this.storeName == "next" || this.storeName == "someday") {
        //otherwise get last row
        console.log("No name in URL. Fetching most recent card.");
        const lastRow = await this.getLastRow(this.storeName);
        if (lastRow) {
          this.renderCard([lastRow]);
          this.recentList();
        }
      }
    }
  }

  // Attach instance to the global namespace
  window.TodoApp = window.TodoApp || {};
  window.TodoApp.cardManager = new TodoManager();
} else {
  window.TodoApp.cardManager.init();
}
