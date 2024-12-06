
	function getWeekIdentifier(date) {
	    // Create a new date representing the start of the year
	    const startDate = new Date(date.getFullYear(), 0, 1);
	    // Calculate the difference in days between the given date and the start of the year
	    const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
	    // Calculate the week number
	    const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
	    // Format the result as "YYYY-WW"
	    return `${date.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
	}
	function saveWeeklyGoal(goalText, createTime, reviewTime, callback) {
		const today = new Date();
	    const week = getWeekIdentifier(today);
	    const goalData = {
	        week,
	        goalText,
	        createTime,
	        reviewTime
	    };
   		saveToStore('weeklyGoals', goalData)
        .then(() => {
            console.log("Weekly goal saved successfully!");
            if (callback) callback();
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

document.getElementById("generate-ics").addEventListener("click", () => {
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
});