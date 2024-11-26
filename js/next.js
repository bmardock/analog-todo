(function () {
  // Check if namespace already exists to avoid overwriting
  if (window.TodoApp?.nextManager) {
    console.warn('Script already loaded. Skipping redefinition.');
    window.TodoApp.nextManager.reinit();
    return;
  }

  // Define namespace if it doesn't exist
  window.TodoApp = window.TodoApp || {};
  const nextManager = {};

  // Utility functions
  const getUniqueCardName = async (name) => {
    let uniqueName = name;
    let count = 2;
    while (await getKeyFromStore('next', uniqueName)) {
      uniqueName = `${name}_${count}`;
      count++;
    }
    return uniqueName;
  };

  const fetchListData = (archivedStatus, containerSelector) => {
    const container = document.querySelector(containerSelector);
    return getAllFromStore('next', 'archived', archivedStatus)
      .then((rows) => {
        rows.sort((a, b) => a.lastUpdated - b.lastUpdated);
        container.innerHTML = ''; // Clear existing content
        rows.forEach(todo => {
          container.innerHTML += `<div class="circle" data-text="${todo.name}"></div>`;
        });
        if (archivedStatus === 0) {
          container.innerHTML += '<div class="circle" data-text="Add New">+</div>';
        }
      })
      .catch(error => console.error(`Error fetching rows for ${containerSelector}:`, error));
  };

  const getSaveDataFromDOM = () => ({
    type: document.querySelector('header [name=listType]').value,
    name: document.querySelector('header [name=title]').value,
    archived: document.querySelector('[name=archive]').checked ? 1 : 0,
    todos: Array.from(document.querySelectorAll('todoList todoitem'))
      .map(todo => ({
        signal: todo.querySelector('.signal')?.value || '',
        text: todo.querySelector('input')?.value.trim() || '',
      }))
      .filter(todo => todo.text !== ''),
    cardSignal: Array.from(document.querySelectorAll('.cardSignal input')).map(signal => signal.checked),
    braindump: document.querySelector('textarea[name=braindump]').value,
  });

  const renderNext = (data) => {
    const { name = '', archived = false } = data?.[0] || {};
    const titleInput = document.querySelector('[name=title]');
    titleInput.value = name;
    titleInput.readOnly = !!name;
    document.getElementById('archive').checked = !!archived;
    document.querySelector(`[data-text="${name}"]`)?.classList.add('on');
    renderTodos(data);
  };

    const renderTodos = (data) => {
      console.log(data?.[0]?.todos);
      const todoList = document.querySelectorAll('todoItem');
      const cardSignals = document.querySelectorAll(".cardSignal input");
      const braindump = document.querySelector("textarea[name=braindump]");
      const todoDate = data?.[0]?.date;
      const today = new Date().toLocaleDateString('en-CA');
      todoList.forEach((item, index) => {
        //if data doesnt exist assume empty
        const todo = data?.[0]?.todos?.[index] || { signal: '', text: '' };
        item.querySelector(".dropdown").classList.toggle('disabled', todo.text.trim() === "");
        item.querySelector("input").value = todo.text;
        item.querySelector(".signal").className = `signal ${todo.signal}`;
        item.querySelector(".signal").value = todo.signal;
        const shouldShow = (todoDate < today && (todo.signal === '' || todo.signal === 'in-progress') && todo.text !== '');
        item.querySelector("select.copy").classList.toggle('hidden', !shouldShow);
      });

      cardSignals.forEach((sig, index) => {
        sig.checked = data?.[0]?.cardSignal?.[index] || false;
      });
      braindump.value = data?.[0]?.braindump || '';
      document.documentElement.classList.toggle('notes', braindump.value.trim() !== '');
    }

  // High-level functions
  const recentList = () => {
    fetchListData(0, '#recent_list');
    fetchListData(1, '#archive_list');
  };

  const saveAndRender = () => {
    console.log('Saving todo and re-rendering');
    saveNextList(getSaveDataFromDOM(), fetchAndRender);
  };

  const fetchAndRender = () => {
    console.log('Fetching and rendering todos');
    const name = document.querySelector('header [name=title]').value;
    fetchNext(name, renderNext);
  };

  const saveNextList = (data, callback) => {
    console.log('Saving altered data');
    data.lastUpdated = new Date();
    if (data.name !== '') {
      saveToStore('next', data)
        .then(() => callback())
        .catch(databaseError);
    } else {
      alert('Set Name first');
    }
  };

  const fetchNext = (name, callback) => {
    console.log('Fetching Next List:', name);
    getDataByIndex('next', 'name', name)
      .then((data) => callback(data))
      .catch((error) => {
        console.error('Error fetching todos by index:', error.message);
        callback(error, null);
      });
  };

  // Initialization function
  const init = () => {
    console.log('Database opened');
    recentList();
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    if (name) {
      fetchNext(name, renderNext);
    } else {
      console.log('No name in URL. Fetching most recent card.');
      getAllFromStore('next', 'archived', 0)
        .then((rows) => {
          if (rows.length > 0) {
            rows.sort((a, b) => a.lastUpdated - b.lastUpdated);
            renderNext([rows.at(-1)]);
          }
        })
        .catch(error => console.error('Error fetching the last row:', error));
    }
  };

  // Attach functions to namespace
  nextManager.getUniqueCardName = getUniqueCardName;
  nextManager.recentList = recentList;
  nextManager.saveAndRender = saveAndRender;
  nextManager.fetchAndRender = fetchAndRender;
  nextManager.saveNextList = saveNextList;
  nextManager.fetchNext = fetchNext;
  nextManager.getSaveDataFromDOM = getSaveDataFromDOM;
  nextManager.reinit = init

  // Assign namespace
  window.TodoApp.nextManager = nextManager;
  // Open database and initialize
  databaseOpen(init);
})();
