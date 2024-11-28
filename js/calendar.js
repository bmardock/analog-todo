(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const monthParam = urlParams.get('month');
    let date;

    if (monthParam) {
        // Parse the month parameter, assume it's in "YYYY-MM" format
        const [year, month] = monthParam.split('-').map(Number);
        date = new Date(year, month - 1); // Adjust for zero-based month index
    } else {
        date = new Date(); // Default to the current date
    }

    const [month, year, today] = [date.getMonth(), date.getFullYear(), date.getDate()];
    const [preDay, endMonth] = [new Date(year, month, 1).getDay(), new Date(year, month + 1, 0).getDate()];

    const renderCalendar = () => {
        const today = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();
        const preDay = new Date(year, month, 1).getDay();
        const endMonth = new Date(year, month + 1, 0).getDate();

        console.log(year, month);
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

    const renderEvents = (eventDates) => {
        eventDates.forEach(date => {
            const dayElement = document.getElementById(date);
            if (dayElement) {
                dayElement.innerHTML += `<a class="event today" href="?date=${date}#todo"></a>`;
            }
        });
    };
    // Load events from the database and render them
    const loadEvents = () => {
        databaseOpen(() => {
            getAllFromStore('todo')
                .then(list => {
                    const eventDates = [...new Set(list.map(({ date }) => date))];
                    renderEvents(eventDates);
                })
                .catch(databaseError);
        });
    };
    //handle click on empty day
    document.querySelector('#month_days').addEventListener("click", ({ target }) => {
        if (target.classList.contains('day_num')) {
            const url = `?date=${target.getAttribute('id')}#todo`;
            window.history.pushState({}, '', url);
            window.dispatchEvent(new Event("hashchange"));
        }
    });
    document.getElementById('prev-month').addEventListener('click', () => {
        date.setMonth(date.getMonth() - 1); // Go to the previous month
        const newUrl = `?month=${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}#calendar`;
        window.history.pushState({}, '', newUrl);
        renderCalendar();
        loadEvents(); // Reload events for the new month
    });

    document.getElementById('next-month').addEventListener('click', () => {
        date.setMonth(date.getMonth() + 1); // Go to the next month
        const newUrl = `?month=${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}#calendar`;
        window.history.pushState({}, '', newUrl);
        renderCalendar();
        loadEvents(); // Reload events for the new month
    });
    // Initialize calendar and load events
    renderCalendar();
    loadEvents();
})();