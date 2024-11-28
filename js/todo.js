(function () {
  // Check if the namespace already exists
  if (window.TodoApp?.todoManager) {
    console.warn('TodoApp.todoManager is already defined. Skipping redefinition.');
    window.TodoApp.todoManager.fetchAndRender();
    return;
  }

  // Define the namespace
  window.TodoApp = window.TodoApp || {};
  const todoManager = {};

  todoManager.renderCalList = () => {
    const dateInput = document.querySelector("header input[name=date]");
    getKeysFromStore('todo')
    .then((todos) => {
        const eventDates = new Set();
        todos.forEach(([type, date]) => {
            if (date) {
                eventDates.add(date);
            }
        });

        const [year, month, day] = dateInput.value.split('-').map(Number);
        const todayDate = new Date(year, month - 1, day);
        const calWindow = 7;
        const middle = Math.floor(calWindow / 2);
        document.querySelector('.calendar').innerHTML = Array.from({ length: calWindow }, (_, i) => {
            const currentDate = new Date(todayDate);
            currentDate.setDate(todayDate.getDate() + i - middle);
            const key = currentDate.toLocaleDateString('en-CA');
            const hasEvent = eventDates.has(key);
            return todoManager.createDayElement(currentDate, i === middle, hasEvent);
        }).join('');
    });
  };
  todoManager.createDayElement = (date, current, hasEvent) => {
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    let classNames = current ? 'current ' : '';
    classNames += date.toDateString() === new Date().toDateString() ? 'today ' : '';
    classNames += hasEvent ? 'has-event ' : '';
    
    return `
      <div class="day">
        ${daysOfWeek[date.getDay()]}
        <a href="/todo/?date=${date.toLocaleDateString('en-CA')}" class="${classNames}">${date.getDate()}</a>
        ${hasEvent ? '<span class="today"></span>' : ''}
      </div>`;
  };
  
  todoManager.fetchAndRender = () => {
    const today = new Date().toLocaleDateString('en-CA');
    const urlParams = new URLSearchParams(window.location.search);
    const dateInput = document.querySelector("header input[name=date]");
    const date = dateInput.value || today;
    console.log('Fetching and rendering todos', date);
    getDataByIndex('todo', 'date', date)
        .then((data) => {
            todoManager.renderTodos(data); // Pass the data to the callback as the second argument
            todoManager.renderCalList();
        })
        .catch((error) => {
            console.error('Error fetching todos by index:', error.message);
        });
  };
  todoManager.renderTodos = (data) => {
      console.log(data?.[0]?.todos);
      const todoList = document.querySelectorAll('todoItem');
      const cardSignals = document.querySelectorAll(".cardSignal input");
      const brainInput = document.querySelector("textarea[name=braindump]");
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
      brainInput.value = data?.[0]?.braindump || '';
      document.documentElement.classList.toggle('notes', brainInput.value.trim() !== '');
    }

  todoManager.saveAndRender = () => {
    console.log('Saving todo and re-rendering');
    saveToStore('todo', todoManager.getDataFromDOM())
          .then(() => todoManager.fetchAndRender() )
          .catch(databaseError);
  };

  todoManager.getDataFromDOM = () => ({
    date: document.querySelector('header [name=date]').value,
    todos: Array.from(document.querySelectorAll('todoList todoitem'))
      .map(todo => ({
        signal: todo.querySelector('.signal')?.value || '',
        text: todo.querySelector('input')?.value.trim() || '',
      }))
      .filter(todo => todo.text !== ''),
    cardSignal: Array.from(document.querySelectorAll('.cardSignal input')).map(signal => signal.checked),
    braindump: document.querySelector('textarea[name=braindump]').value,
  });

  todoManager.changeContent = (direction) => {
    const cards = document.querySelectorAll('card');
    const activeIndex = Array.from(cards).findIndex((card) => card.classList.contains('active'));
    if (activeIndex !== -1) cards[activeIndex].classList.remove('active');
    const newIndex = (activeIndex + direction + cards.length) % cards.length;
    cards[newIndex].classList.add('active');
  };
  todoManager.reconstructUrl = () => {
    const dateInput = document.querySelector("header input[name=date]");
    const url = new URL(window.location);
    url.searchParams.set('date', dateInput.value);
    window.history.pushState({}, '', url);
  };
  // Assign to the namespace
  window.TodoApp.todoManager = todoManager;
})();
