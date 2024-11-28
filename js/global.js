class TodoAppManager {
	constructor(storeName, type='todo'){
		this.storeName = storeName;
    	this.type = type;
	}

	fetchAndRender() { 
		fetchCard(name, renderCard);/* Unified logic */ 
	}
  	saveAndRender() { 
  		saveList(getDataFromDOM(), fetchAndRender);/* Unified logic */ 
  	}
  	renderTodos() { /* Shared rendering logic */ }
  	renderCards() { /* Card-specific rendering */ }

  	getUniqueCardName = async (name) => {
  		let uniqueName = name;
	    let count = 2;
	    while (await getKeyFromStore(storeName, uniqueName)) {
	      uniqueName = `${name}_${count}`;
	      count++;
	    }
	    return uniqueName;
  	}
  	getDataFromDOM = () => ({
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
	    braindump: document.querySelector('textarea[name=braindump]').value
  	});
}