(function (){
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
	function renderGoals(result){
		if(result){
			document.querySelector('[name=goal]').value = result?.[0]?.goalText ?? "";
			document.querySelector('[name=start]').value = result?.[0]?.createTime ?? "";
			document.querySelector('[name=review]').value = result?.[0]?.reviewTime ?? "";
		}
	}

	document.querySelector('main').addEventListener("change", e => {
		let goalText = document.querySelector('[name=goal]').value;
		let createTodos = document.querySelector('[name=start]').value;
		let reviewTodos = document.querySelector('[name=review]').value;
		console.log('changed');
		saveWeeklyGoal(goalText, createTodos, reviewTodos);
	});
	databaseOpen(() => {
	    console.log('Database opened');
			readWeeklyGoal(renderGoals);
	});

/*	Doesnt seem to save the two events

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
  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ical.shopboardwalkvintage.com//iCal Event Maker
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:${userTimeZone}
BEGIN:STANDARD
TZOFFSETFROM:-0000
TZOFFSETTO:-0000
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
DTSTAMP:${dateStr}T000000Z
UID:${Date.now()}-start@ical.shopboardwalkvintage.com
DTSTART;TZID=${userTimeZone}:${dateStr}T${formatTime(startTime)}
RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO,TU,WE,TH,FR;UNTIL=${dateStr}T160000Z
DTEND;TZID=${userTimeZone}:${dateStr}T${formatTime(startTime + 30)}
SUMMARY:Add Todo List
URL:https://shopboardwalkvintage.com/todo/
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Add Todo List
TRIGGER:-PT0M
END:VALARM
END:VEVENT
BEGIN:VEVENT
DTSTAMP:${dateStr}T000000Z
UID:${Date.now()}-review@ical.shopboardwalkvintage.com
DTSTART;TZID=${userTimeZone}:${dateStr}T${formatTime(reviewTime)}
RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO,TU,WE,TH,FR;UNTIL=${dateStr}T160000Z
DTEND;TZID=${userTimeZone}:${dateStr}T${formatTime(reviewTime + 15)}
SUMMARY:Review Progress Todo List
URL:https://shopboardwalkvintage.com/todo/
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Review Progress Todo List
TRIGGER:-PT0M
END:VALARM
END:VEVENT
END:VCALENDAR
`;

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
*/
})();