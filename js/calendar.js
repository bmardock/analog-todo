(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const date = new Date(urlParams.get('date') || Date.now());
    const [month, year, today] = [date.getMonth(), date.getFullYear(), date.getDate()];
    const [preDay, endMonth] = [new Date(year, month, 1).getDay(), new Date(year, month + 1, 0).getDate()];

    const renderCalendar = () => {
        const today = new Date();
        const calendarHTML = Array.from({ length: 42 }, (_, i) => {
            const day = new Date(year, month, i + 1 - preDay);
            const dayNumber = day.getDate().toString().padStart(2, '0');
            const dayID = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${dayNumber}`;
            const isOutsideMonth = i < preDay || i >= preDay + endMonth;
            const isToday = (day.toDateString() === today.toDateString());
            //const isToday = day.getDate() === today && !isOutsideMonth;
            return `<div id="${dayID}" class="day_num${isOutsideMonth ? ' ignore' : ''}${isToday ? ' selected' : ''}">${dayNumber}</div>`;
        }).join('');

        document.querySelector('.month-year').textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        document.querySelector("#month_days").innerHTML = calendarHTML;
    };

    const renderEvents = (events) => {
        for (const [date, types] of Object.entries(events)) {
            const dayElement = document.getElementById(date);
            if (dayElement) {
                dayElement.innerHTML += Array.from(types, type => `<a class="event ${type.toLowerCase()}" href="?date=${date}&type=${type}#todo"></a>`).join('');
            }
        }
    };

    // Load events from the database and render them
    const loadEvents = () => {
        const events = {};
        databaseOpen(() => {
            getAllFromStore('todo')
                .then(list => {
                    list.forEach(({ date, type }) => (events[date] ||= new Set()).add(type));
                    renderEvents(events);
                })
                .catch(databaseError);
        });
    };
    //handle click on empty day
    document.querySelector('#month_days').addEventListener("click", ({ target }) => {
        if (target.classList.contains('day_num')) {
            const url = `/todo/?date=${target.getAttribute('id')}#todo`;
            window.history.pushState({}, '', url);
            window.dispatchEvent(new Event("hashchange"));
        }
    });
    // Initialize calendar and load events
    renderCalendar();
    loadEvents();
})();