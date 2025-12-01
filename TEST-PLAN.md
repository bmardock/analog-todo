# Test Plan: Todo, Next, and Someday Pages

## Overview
This test plan covers comprehensive testing of the three core card-based pages: Todo (date-based), Next (named cards), and Someday (named cards).

---

## 1. Todo Page (#todo) - Date-Based Cards

### 1.1 Date Picker & Calendar
- [ ] **Date picker displays current date by default**
  - Verify picker shows today's date in YYYY-MM-DD format
  - Verify placeholder shows "mm/dd/yyyy"
  
- [ ] **Date picker change triggers card load**
  - Change date picker to different date
  - Verify card loads with correct date
  - Verify URL updates with ?date= parameter
  
- [ ] **Calendar widget displays 7-day window**
  - Verify calendar shows current date in middle
  - Verify dates before/after current date are visible
  - Verify today is marked appropriately
  
- [ ] **Calendar widget shows event indicators**
  - Create todos on a date
  - Navigate away and back
  - Verify calendar shows event indicator for dates with todos
  
- [ ] **Clicking calendar date navigates to that date**
  - Click a date in calendar widget
  - Verify date picker updates
  - Verify card loads for that date
  - Verify URL updates correctly

### 1.2 Task Management
- [ ] **Create up to 10 todo items**
  - Add tasks to all 10 slots
  - Verify all tasks save correctly
  - Verify 11th task cannot be added (if UI prevents it)
  
- [ ] **Edit existing todo items**
  - Modify task text
  - Verify changes persist after navigation
  
- [ ] **Delete todo items (by clearing text)**
  - Clear task text
  - Verify task is removed from saved data
  
- [ ] **Task signals: empty (default)**
  - Verify new tasks have empty signal
  - Verify signal button shows empty state
  
- [ ] **Task signals: in-progress**
  - Click signal button
  - Select "in-progress"
  - Verify signal state persists
  
- [ ] **Task signals: completed**
  - Click signal button
  - Select "completed"
  - Verify signal state persists
  
- [ ] **Task signals: appointment**
  - Click signal button
  - Select "appointment"
  - Verify signal state persists
  
- [ ] **Task signals: delegated**
  - Click signal button
  - Select "delegated"
  - Verify signal state persists
  
- [ ] **Signal dropdown disabled for empty tasks**
  - Verify signal button is disabled when task text is empty
  - Add text, verify signal becomes enabled
  
- [ ] **Enter key navigation between tasks**
  - Focus on first task input
  - Press Enter
  - Verify focus moves to next task
  - Verify focus loops to first task after last

### 1.3 Copy Task Functionality
- [ ] **Copy dropdown appears for past dates**
  - Set date to yesterday
  - Add incomplete task (empty or in-progress signal)
  - Verify copy dropdown becomes visible
  
- [ ] **Copy dropdown hidden for completed tasks**
  - Set date to yesterday
  - Mark task as completed
  - Verify copy dropdown is hidden
  
- [ ] **Copy dropdown hidden for today/future dates**
  - Set date to today or tomorrow
  - Add incomplete task
  - Verify copy dropdown is hidden
  
- [ ] **Copy task to Today**
  - Set date to yesterday
  - Add incomplete task
  - Select "Today" from copy dropdown
  - Navigate to today
  - Verify task appears
  
- [ ] **Copy task to Tomorrow**
  - Set date to yesterday
  - Add incomplete task
  - Select "Tomorrow" from copy dropdown
  - Navigate to tomorrow
  - Verify task appears
  
- [ ] **Copy task to Next**
  - Set date to yesterday
  - Add incomplete task
  - Select "Next" from copy dropdown
  - Navigate to #next
  - Verify task appears in most recent card
  
- [ ] **Copy task to Someday**
  - Set date to yesterday
  - Add incomplete task
  - Select "Someday" from copy dropdown
  - Navigate to #someday
  - Verify task appears in most recent card
  
- [ ] **Copy preserves task signal**
  - Set date to yesterday
  - Add task with "in-progress" signal
  - Copy to tomorrow
  - Verify signal is preserved

### 1.4 Card Signals (3 checkboxes)
- [ ] **Card signals save and persist**
  - Check/uncheck each of the 3 card signals
  - Navigate away and back
  - Verify signal states persist
  
- [ ] **Card signals independent of each other**
  - Check signal 1
  - Check signal 2
  - Uncheck signal 1
  - Verify signal 2 remains checked

### 1.5 Braindump Notes
- [ ] **Braindump textarea accessible on back of card**
  - Click flip button
  - Verify braindump textarea is visible
  - Verify placeholder text is shown
  
- [ ] **Braindump notes save on blur**
  - Flip to back of card
  - Enter text in braindump
  - Blur textarea
  - Navigate away and back
  - Verify text persists
  
- [ ] **Braindump notes indicator on front**
  - Add braindump note
  - Flip to front
  - Verify visual indicator (notes class) appears
  
- [ ] **Braindump notes clear correctly**
  - Add braindump note
  - Clear text
  - Verify indicator disappears

### 1.6 Card Flip
- [ ] **Flip button flips to back**
  - Click flip button on front
  - Verify back card becomes active
  - Verify front card becomes inactive
  
- [ ] **Flip button flips to front**
  - Flip to back
  - Click flip button on back
  - Verify front card becomes active
  
- [ ] **Arrow key navigation (when not in input)**
  - Ensure no input is focused
  - Press ArrowRight
  - Verify card flips to back
  - Press ArrowLeft
  - Verify card flips to front
  
- [ ] **Arrow keys don't flip when input focused**
  - Focus on task input
  - Press ArrowRight
  - Verify card does NOT flip

### 1.7 Weekly Goal Display
- [ ] **Weekly goal displays in listType element**
  - Set weekly goal for current week
  - Navigate to #todo
  - Verify goal text appears in #listType element

---

## 2. Next Page (#next) - Named Cards

### 2.1 Card Name Management
- [ ] **Picker shows placeholder (current month)**
  - Navigate to #next
  - Verify placeholder shows current month name
  
- [ ] **Create new card via "Add New" button**
  - Click "Add New" circle in recent list
  - Verify picker becomes editable (readonly removed)
  - Verify picker value is empty
  
- [ ] **Save card name**
  - Enter card name
  - Blur picker
  - Verify card name saves
  - Verify card appears in recent list
  
- [ ] **Card name becomes readonly after saving**
  - Create card with name
  - Verify picker readonly attribute is set
  
- [ ] **Unique name generation**
  - Create card named "Test"
  - Create another card named "Test"
  - Verify second card is named "Test_2"
  - Create third card named "Test"
  - Verify third card is named "Test_3"
  
- [ ] **Select existing card from recent list**
  - Click card circle in recent list
  - Verify card loads
  - Verify picker shows card name
  - Verify card is marked as "on" in list

### 2.2 Recent & Archive Lists
- [ ] **Recent list shows non-archived cards**
  - Create multiple cards
  - Verify all appear in recent list
  - Archive one
  - Verify it disappears from recent list
  
- [ ] **Archive list toggle**
  - Click archive header
  - Verify archive list expands/collapses
  
- [ ] **Archive list shows archived cards**
  - Archive a card
  - Verify it appears in archive list
  
- [ ] **Select card from archive list**
  - Click archived card
  - Verify card loads
  - Verify archive checkbox is checked

### 2.3 Archive Functionality
- [ ] **Archive checkbox visible for named cards**
  - Verify archive checkbox is visible
  - Verify archive button appears when card has name
  
- [ ] **Archive card**
  - Create card
  - Check archive checkbox
  - Verify card moves to archive list
  - Verify card disappears from recent list
  
- [ ] **Unarchive card**
  - Archive a card
  - Select it from archive list
  - Uncheck archive checkbox
  - Verify card moves back to recent list
  
- [ ] **Archive state persists**
  - Archive a card
  - Navigate away and back
  - Verify card remains archived

### 2.4 Task Management (Same as Todo)
- [ ] **Create, edit, delete tasks** (same tests as Todo 1.2)
- [ ] **Task signals** (same tests as Todo 1.2)
- [ ] **Enter key navigation** (same tests as Todo 1.2)

### 2.5 Copy Task Functionality
- [ ] **Copy task to Today**
  - Add task to Next card
  - Select "Today" from copy dropdown
  - Navigate to #todo
  - Verify task appears in today's card
  
- [ ] **Copy task to Tomorrow**
  - Add task to Next card
  - Select "Tomorrow" from copy dropdown
  - Navigate to tomorrow's #todo
  - Verify task appears
  
- [ ] **Copy task to Next**
  - Add task to Next card
  - Select "Next" from copy dropdown
  - Verify task appears in most recent Next card
  
- [ ] **Copy task to Someday**
  - Add task to Next card
  - Select "Someday" from copy dropdown
  - Navigate to #someday
  - Verify task appears in most recent Someday card

### 2.6 Card Signals & Braindump (Same as Todo)
- [ ] **Card signals** (same tests as Todo 1.4)
- [ ] **Braindump notes** (same tests as Todo 1.5)
- [ ] **Card flip** (same tests as Todo 1.6)

### 2.7 Initialization
- [ ] **Loads most recent card if no name in URL**
  - Navigate to #next without card name
  - Verify most recent card loads automatically
  - Verify recent list populates

---

## 3. Someday Page (#someday) - Named Cards

### 3.1 Card Name Management
- [ ] **Picker shows placeholder (current year)**
  - Navigate to #someday
  - Verify placeholder shows current year
  
- [ ] **All card name tests** (same as Next 2.1)

### 3.2 Recent & Archive Lists
- [ ] **All recent/archive list tests** (same as Next 2.2)

### 3.3 Archive Functionality
- [ ] **All archive tests** (same as Next 2.3)

### 3.4 Task Management
- [ ] **All task management tests** (same as Next 2.4)

### 3.5 Copy Task Functionality
- [ ] **All copy task tests** (same as Next 2.5)

### 3.6 Card Signals & Braindump
- [ ] **All card signals & braindump tests** (same as Next 2.6)

### 3.7 Initialization
- [ ] **All initialization tests** (same as Next 2.7)

---

## 4. Cross-Page Functionality

### 4.1 Data Persistence
- [ ] **Todos persist across page navigation**
  - Create todos on Todo page
  - Navigate to Next
  - Navigate back to Todo
  - Verify todos still exist
  
- [ ] **Card data persists across navigation**
  - Create card on Next page
  - Navigate to Someday
  - Navigate back to Next
  - Verify card still exists

### 4.2 Copy Task Between Pages
- [ ] **Copy from Todo to Next preserves data**
  - Create task on Todo page
  - Copy to Next
  - Verify task text and signal preserved
  
- [ ] **Copy from Next to Someday preserves data**
  - Create task on Next page
  - Copy to Someday
  - Verify task text and signal preserved
  
- [ ] **Copy from Someday to Todo preserves data**
  - Create task on Someday page
  - Copy to Today
  - Verify task text and signal preserved

### 4.3 Edge Cases
- [ ] **Empty card name prevents save**
  - Try to save card with empty name
  - Verify alert appears
  - Verify card doesn't save
  
- [ ] **Maximum 10 tasks per card**
  - Add 10 tasks to a card
  - Try to copy 11th task
  - Verify alert appears if limit reached
  
- [ ] **Copy to full card shows alert**
  - Fill card with 10 tasks
  - Try to copy another task to it
  - Verify alert appears

---

## Test Organization

### Proposed Test Files:
1. **`tests/todo.spec.js`** - Todo page specific tests (date picker, calendar, weekly goals)
2. **`tests/next.spec.js`** - Next page specific tests (card naming, unique names, recent/archive lists)
3. **`tests/someday.spec.js`** - Someday page specific tests (same as Next but separate for clarity)
4. **`tests/card-shared.spec.js`** - Shared card functionality (tasks, signals, braindump, flip, copy)

### Alternative Organization:
1. **`tests/todo.spec.js`** - All Todo page tests
2. **`tests/next.spec.js`** - All Next page tests  
3. **`tests/someday.spec.js`** - All Someday page tests
4. **`tests/card-interactions.spec.js`** - Cross-page copy functionality

---

## Questions for Review:

1. **Test Organization**: Do you prefer separate files per page, or grouping by functionality (e.g., all copy tests together)?

2. **Test Depth**: Should we test visual states (CSS classes, indicators) or just functional behavior?

3. **Edge Cases**: Are there any specific edge cases or error scenarios you want covered?

4. **Performance**: Should we test with large datasets (many cards, many tasks)?

5. **Accessibility**: Should we test keyboard navigation and ARIA labels?

6. **Browser Compatibility**: Should tests run on multiple browsers or just Chromium?

---

## Estimated Test Count:
- Todo Page: ~35 tests
- Next Page: ~30 tests  
- Someday Page: ~25 tests (mostly duplicates of Next)
- Cross-Page: ~10 tests

**Total: ~100 tests**

