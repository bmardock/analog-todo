(function () {
  // Check if namespace already exists to avoid overwriting
  if (window.TodoApp?.cardManager) {
    console.warn('Script already loaded. Skipping redefinition.');
    window.TodoApp.cardManager.reinit();
    return;
  }

  // Define namespace if it doesn't exist
  window.TodoApp = window.TodoApp || {};
  const manager = {};
  let storeName = document.querySelector('[name=listType]').value.toLowerCase();

  // Utility functions
  const getUniqueCardName = async (name) => {
    let uniqueName = name;
    let count = 2;
    while (await getKeyFromStore(storeName, uniqueName)) {
      uniqueName = `${name}_${count}`;
      count++;
    }
    return uniqueName;
  };

  const fetchListData = (archivedStatus, containerSelector) => {
    const container = document.querySelector(containerSelector);
    console.log('fetchListData', storeName);
    return getAllFromStore(storeName, 'archived', archivedStatus)
      .then((rows) => {
        if (Array.isArray(rows)) {
          rows.sort((a, b) => a.lastUpdated - b.lastUpdated); // Sort only if rows is an array
        }
        container.innerHTML = ''; // Clear existing content
        rows.forEach(todo => {
          container.innerHTML += `<div class="circle" data-text="${todo.name}"></div>`;
        });
        if (archivedStatus === 0) {
          container.innerHTML += '<div class="circle" data-text="Add New">+</div>';
        }
        if(rows.length < 1){
          container.parentNode.classList.add('empty');
        }else{
          container.parentNode.classList.remove('empty');
        }
      })
      .catch(error => console.error(`Error fetching rows for ${containerSelector}:`, error));
  };

  const getDataFromDOM = () => ({
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

  const renderCard = (data) => {
    const { name = '', archived = false } = data?.[0] || {};
    const titleInput = document.querySelector('[name=title]');
    titleInput.value = name;
    titleInput.readOnly = !!name;
    //hide archive button if empty
    document.querySelector('.archive-button').style.display = name ? 'block' : 'none';
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
    saveList(getDataFromDOM(), fetchAndRender);
  };

  const fetchAndRender = () => {
    console.log('Fetching and rendering todos');
    const name = document.querySelector('header [name=title]').value;
    fetchCard(name, renderCard);
  };

  const saveList = (data, callback) => {
    console.log('Saving altered data', storeName, data);
    data.lastUpdated = new Date();
    if (data.name !== '') {
      saveToStore(storeName, data)
        .then(() => callback())
        .catch(databaseError);
    } else {
      alert('Set Name first');
    }
  };

  const fetchCard = (name, callback) => {
    console.log('Fetching List:', name);
    getDataByIndex(storeName, 'name', name)
      .then((data) => callback(data))
      .catch((error) => {
        console.error('Error fetching todos by index:', error.message);
        callback(error, null);
      });
  };

  // Initialization function
  const init = () => {
    console.log('Database opened');
    storeName = document.querySelector('[name=listType]').value.toLowerCase();
    recentList();
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    if (name) {
      fetchCard(name, renderCard);
    } else {
      console.log('No name in URL. Fetching most recent card.');
      getAllFromStore(storeName, 'archived', 0)
        .then((rows) => {
          if (rows.length > 0) {
            rows.sort((a, b) => a.lastUpdated - b.lastUpdated);
            renderCard([rows.at(-1)]);
          }
        })
        .catch(error => console.error('Error fetching the last row:', error));
    }
  };


  // Attach functions to namespace
  manager.getUniqueCardName = getUniqueCardName;
  manager.recentList = recentList;
  manager.saveAndRender = saveAndRender;
  manager.fetchAndRender = fetchAndRender;
  manager.reinit = init

  // Assign namespace
  window.TodoApp.cardManager = manager;
  // Open database and initialize
  databaseOpen(init);
})();
