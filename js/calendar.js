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

    const renderEvents = (eventDetails) => {
        eventDetails.forEach(({ date, cardSignal }) => {
            const dayElement = document.getElementById(date);

            if (dayElement) {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="26" viewBox="0 0 6 26" fill="none">
                        <circle cx="3" cy="6" r="3" fill="${cardSignal[0] ? '#000' :'#ccc' }"/>
                        <circle cx="3" cy="14" r="3" fill="${cardSignal[1] ? '#000' :'#ccc'}"/>
                        <circle cx="3" cy="22" r="3" fill="${cardSignal[2] ? '#000' :'#ccc'}"/>
                    </svg>`;
                dayElement.innerHTML += svg;
            }
        });
    };
    const loadEvents = () => {
        databaseOpen(() => {
            getAllFromStore('todo')
                .then(list => {
                    console.log(list[0].cardSignal);
                    // Create a unique set of date and cardSignal pairs
                    const eventDetails = [
                        ...new Set(list.map(({ date, cardSignal }) => JSON.stringify({ date, cardSignal })))
                    ].map(item => JSON.parse(item));

                    renderEvents(eventDetails); // Pass the array of objects to renderEvents
                })
                .catch(databaseError);
        });
    };