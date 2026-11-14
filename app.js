const todoForm = document.querySelector('form');
const todoInput = document.getElementById('todo-input');
const todoListUL = document.getElementById('todo-list');

// Request notification permissions
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

// Function to play a synthesized alarm beep sound using Web Audio API
function playAlarmSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.6); // Beep duration 0.6 seconds
    } catch (e) {
        console.log("AudioContext blocked or not supported");
    }
}

let allTodos = getTodos();
updateTodoList();

// Alarm background check loop (runs every second)
setInterval(() => {
    const now = new Date();
    let updated = false;

    allTodos.forEach((todo) => {
        if (todo.alarmDateTime && !todo.completed) {
            const alarmTime = new Date(todo.alarmDateTime);
            
            if (now >= alarmTime && !todo.triggered) {
                todo.triggered = true;
                updated = true;

                // Play audible alarm beep
                playAlarmSound();

                // Trigger browser push notification
                if (Notification.permission === "granted") {
                    new Notification("🚨 ALARM: Todo Pending!", {
                        body: `Time to check your list: "${todo.text}". Complete or cancel it now!`
                    });
                } else {
                    alert(`ALARM: "${todo.text}" is due! Complete or delete it.`);
                }
            }
        }
    });

    if (updated) {
        saveTodos();
        updateTodoList();
    }
}, 1000);

todoForm.addEventListener('submit', function(e){
    e.preventDefault();
    addTodo();
})

function addTodo(){
    const todoText = todoInput.value.trim();
    if(todoText.length > 0){
        const todoObject = {
            text: todoText,
            completed: false,
            alarmDateTime: null, // Stores chosen date + alarm hour
            triggered: false
        }
        allTodos.push(todoObject);
        updateTodoList();
        saveTodos();
        todoInput.value = "";
    }  
}

function updateTodoList(){
    todoListUL.innerHTML = "";
    allTodos.forEach((todo, todoIndex)=>{
        const todoItem = createTodoItem(todo, todoIndex);
        todoListUL.append(todoItem);
    })
}

function createTodoItem(todo, todoIndex){
    const todoId = "todo-"+todoIndex;
    const todoLI = document.createElement("li");
    const todoText = todo.text;
    todoLI.className = "todo";
    
    let isRinging = false;
    let formattedAlarm = "";
    if (todo.alarmDateTime) {
        const dt = new Date(todo.alarmDateTime);
        formattedAlarm = `Alarm: ${dt.toLocaleDateString()} at ${String(dt.getHours()).padStart(2, '0')}:00`;
        
        if (new Date() >= dt && !todo.completed) {
            isRinging = true;
            todoLI.classList.add("alarm-ringing");
        }
    }

    todoLI.innerHTML = `
        <input type="checkbox" id="${todoId}">
        <label class="custom-checkbox" for="${todoId}">
            <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
        </label>
        <label for="${todoId}" class="todo-text">
            ${todoText} 
            ${formattedAlarm ? `<span style="font-size: 0.75rem; color: ${isRinging ? 'var(--danger-color)' : 'var(--accent-color)'}; margin-left: 8px;">(${isRinging ? 'RINGING - ' : ''}${formattedAlarm})</span>` : ''}
        </label>
        <button class="calander-button" aria-label="Set alarm">
            <svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="20px" width="20px"><path d="M5,8H19V6H5V8ZM5,8V6V8ZM5,22q-0.83,0-1.41-0.59T3,20V6Q3,5.18 3.59,4.59T5,4H6V2H8V4h8V2h2V4h1q0.83,0 1.41,0.59Q21,5.18 21,6v5.67q-0.47-0.22-0.97-0.38T19,11.08V10H5V20h6.3q0.18,0.55 0.41,1.05T12.28,22H5Zm9.46-0.46Q13,20.08 13,18t1.46-3.54T18,13t3.54,1.46T23,18t-1.46,3.54T18,23q-2.07,0-3.54-1.46Zm5.21-1.1610.7-0.7L18.5,17.8V15h-1v3.212.18,2.18Z"/></svg>
        </button>
        <button class="delete-button" aria-label="Delete todo">
            <svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
        </button>

        <!-- Calendar & Alarm Dialog Markup -->
        <div class="calendar-dialog">
            <div class="calendar-header">
                <button type="button" class="nav-btn prev-month">&lt;</button>
                <span class="month-year-label"></span>
                <button type="button" class="nav-btn next-month">&gt;</button>
            </div>
            <div class="calendar-weekdays">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div class="calendar-days"></div>
            
            <div class="hour-container">
                <div class="hour-title">Set Alarm Hour:</div>
                <div class="hour-grid"></div>
            </div>
        </div>
    `;

    const deleteButton = todoLI.querySelector(".delete-button");
    deleteButton.addEventListener("click", ()=>{
        deleteTodoItem(todoIndex);
    });

    const checkbox = todoLI.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", ()=>{
        allTodos[todoIndex].completed = checkbox.checked;
        saveTodos();
        updateTodoList();
    });
    checkbox.checked = todo.completed;

    // Alarm Dialog & Grid Logic
    const calButton = todoLI.querySelector(".calander-button");
    const dialog = todoLI.querySelector(".calendar-dialog");
    const monthYearLabel = todoLI.querySelector(".month-year-label");
    const daysContainer = todoLI.querySelector(".calendar-days");
    const hourGrid = todoLI.querySelector(".hour-grid");
    const prevBtn = todoLI.querySelector(".prev-month");
    const nextBtn = todoLI.querySelector(".next-month");

    let calendarDate = new Date();
    let selectedAlarmDate = todo.alarmDateTime ? new Date(todo.alarmDateTime) : new Date();
    let selectedHour = selectedAlarmDate.getHours();

    if (todo.alarmDateTime) {
        calendarDate = new Date(selectedAlarmDate);
    }

    calButton.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".calendar-dialog").forEach(d => {
            if (d !== dialog) d.classList.remove("open");
        });
        dialog.classList.toggle("open");
        if (dialog.classList.contains("open")) {
            renderMiniCalendar();
            renderHours();
        }
    });

    prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderMiniCalendar();
    });

    nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderMiniCalendar();
    });

    function renderMiniCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        monthYearLabel.textContent = `${monthNames[month]} ${year}`;
        daysContainer.innerHTML = "";

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = "day-cell empty";
            daysContainer.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement("div");
            dayDiv.className = "day-cell";
            dayDiv.textContent = day;

            if (
                selectedAlarmDate &&
                day === selectedAlarmDate.getDate() &&
                month === selectedAlarmDate.getMonth() &&
                year === selectedAlarmDate.getFullYear()
            ) {
                dayDiv.classList.add("selected");
            }

            dayDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                selectedAlarmDate.setFullYear(year, month, day);
                selectedAlarmDate.setHours(selectedHour, 0, 0, 0);

                allTodos[todoIndex].alarmDateTime = selectedAlarmDate.toISOString();
                allTodos[todoIndex].triggered = false;
                saveTodos();
                updateTodoList();
                renderMiniCalendar();
            });

            daysContainer.appendChild(dayDiv);
        }
    }

    function renderHours() {
        hourGrid.innerHTML = "";
        for (let h = 0; h < 24; h++) {
            const hourCell = document.createElement("div");
            hourCell.className = "hour-cell";
            hourCell.textContent = String(h).padStart(2, '0') + ":00";

            if (selectedHour === h) {
                hourCell.classList.add("selected");
            }

            hourCell.addEventListener("click", (e) => {
                e.stopPropagation();
                selectedHour = h;
                selectedAlarmDate.setHours(selectedHour, 0, 0, 0);

                allTodos[todoIndex].alarmDateTime = selectedAlarmDate.toISOString();
                allTodos[todoIndex].triggered = false;
                saveTodos();
                updateTodoList();
                renderHours();
            });

            hourGrid.appendChild(hourCell);
        }
    }

    return todoLI;
}

// Close dialogs when clicking outside
document.addEventListener("click", () => {
    document.querySelectorAll(".calendar-dialog").forEach(d => d.classList.remove("open"));
});

function deleteTodoItem(todoIndex){
    allTodos = allTodos.filter((_, i)=> i !== todoIndex);
    saveTodos();
    updateTodoList();
}

function saveTodos(){
    const todosJson = JSON.stringify(allTodos);
    localStorage.setItem("todos", todosJson);
}

function getTodos(){
    const todos = localStorage.getItem("todos") || "[]";
    return JSON.parse(todos);
}