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

        console.log('render cal:', year, month);
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
        getAllFromStore('todo')
            .then(list => {
                // Create a unique set of date and cardSignal pairs
                const eventDetails = [
                    ...new Set(list.map(({ date, cardSignal }) => JSON.stringify({ date, cardSignal })))
                ].map(item => JSON.parse(item));

                renderEvents(eventDetails); // Pass the array of objects to renderEvents
            })
            .catch(databaseError);
    };

    const getYearWeekArray = (year, month) => {
        // Create a date object for the first day of the given month and year
        const startDate = new Date(year, month - 1, 1); // JavaScript months are 0-indexed
        // Create a date object for the first day of the next month
        const endDate = new Date(year, month, 1);
        const yearWeekArray = [];
        // Iterate through each week in the month
        while (startDate < endDate) {
            // Use the corrected getWeekIdentifier function
            const weekIdentifier = getWeekIdentifier(startDate);
            // Add the week identifier to the array if it's not already added
            if (!yearWeekArray.includes(weekIdentifier)) {
                yearWeekArray.push(weekIdentifier);
            }
            // Move to the next week
            startDate.setDate(startDate.getDate() + 7);
        }
        return yearWeekArray;
    };
    const getWeeklyGoals = async () => {
        try {
            const result = await getAllFromStore('weeklyGoals'); // Await the data
            if (result.length > 0) {
                console.log("Weekly goals retrieved:", result);
            } else {
                console.log("No goals found.");
            }
            return result; // Return the resolved result
        } catch (error) {
            console.error("Error reading weekly goals:", error);
            return []; // Return an empty array on error
        }
    };
    
    const getWeekIdentifier = (date) => {
      const year = date.getUTCFullYear();
      const startOfYear = new Date(Date.UTC(year, 0, 1));
      const daysDifference = Math.floor((date - startOfYear) / 86400000);
      const week = Math.ceil((daysDifference + startOfYear.getUTCDay() + 1) / 7);

      return `${year}-${week.toString().padStart(2, '0')}`;
    };

    function saveWeeklyGoal(week, goalText, createTime=null, reviewTime=null, callback) {
        //const today = new Date();
        //const week = getWeekIdentifier(today);
        if (!week || !goalText) {
            console.error('Week and goalText must be provided.');
            return;
        }
        const goalData = {
            week,
            goalText,
            createTime,
            reviewTime
        };
        saveToStore('weeklyGoals', goalData)
        .then(() => {
            console.log("Weekly goal saved successfully!");
            if (typeof callback === 'function') {
                callback();
            }
        })
        .catch((error) => {
            console.error("Error saving goal:", error);
        });
    }
    function readWeeklyGoal(callback) {
        getAllFromStore('weeklyGoals')
        .then((result) => {
            if (result.length > 0) {
                console.log("Weekly goals retrieved:", result);
                if (callback) callback(result);
            } else {
                console.log("No goals found.");
            }
        })
        .catch((error) => {
            console.error("Error reading weekly goals:", error);
        });
    }
    function renderGoals(result) {
        console.log(result);

        // Get the last item from the result array
        const lastItem = result?.at(-1);

        const goalText = lastItem?.goalText ?? "";
        const createTodos = lastItem?.createTime ?? "";
        const reviewTodos = lastItem?.reviewTime ?? "";

        if (lastItem) {
            document.querySelector('[name=goal]').value = goalText;
            document.querySelector('[name=start]').value = createTodos;
            document.querySelector('[name=review]').value = reviewTodos;
        }

        document.getElementById('generate-ics').style.display = (createTodos.length && reviewTodos.length) ? 'block' : 'none';
    }

function generateICS () {
  const startTime = document.querySelector('[name=start]').value;
  const reviewTime = document.querySelector('[name=review]').value;

  // Check if inputs are provided
  if (!startTime || !reviewTime) {
    alert("Please enter both start and review times.");
    return;
  }

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Function to format time as HHMMSS
  function formatTime(time) {
    return time.replace(":", "") + "00";
  }

  // Get current date in YYYYMMDD format
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

  // Generate dynamic content for the .ics file
icsContent = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
PRODID:-//Analog Tasks//iCal Event Maker//EN
VERSION:2.0
X-WR-CALNAME:Scheduled Reminders
BEGIN:VTIMEZONE
TZID:${userTimeZone}
BEGIN:DAYLIGHT
DTSTART:20070311T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZOFFSETFROM:-0800
TZOFFSETTO:-0700
END:DAYLIGHT
BEGIN:STANDARD
DTSTART:20071104T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZOFFSETFROM:-0700
TZOFFSETTO:-0800
END:STANDARD
END:VTIMEZONE

BEGIN:VEVENT
DTEND;TZID=${userTimeZone}:${dateStr}T${formatTime(startTime)}
DTSTAMP:${dateStr}T000000Z
DTSTART;TZID=${userTimeZone}:${dateStr}T${formatTime(startTime)}
RRULE:FREQ=DAILY
SUMMARY:Create Todo List
DESCRIPTION:Think about this weeks goal and what tasks will get closer to that goal?
TRANSP:OPAQUE
UID:ReviewTodoList-${dateStr}
END:VEVENT

BEGIN:VEVENT
DTEND;TZID=${userTimeZone}:${dateStr}T${formatTime(reviewTime)}
DTSTAMP:${dateStr}T000000Z
DTSTART;TZID=${userTimeZone}:${dateStr}T${formatTime(reviewTime)}
RRULE:FREQ=DAILY
SUMMARY:Review Todo List
DESCRIPTION:Update status of todays tasks, copy over any to tomorrow and rate your daily progress with the cardSignal.
TRANSP:OPAQUE
UID:CreateTodoList-${dateStr}
END:VEVENT
END:VCALENDAR`;

  // Create a blob with the ICS content and download it
  const blob = new Blob([icsContent], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendar.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}