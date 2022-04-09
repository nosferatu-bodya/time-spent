
// class that manages time
function TimeManager() {
    // turn this class into a nice string that shows time
    this.textFormat = (time) => {
        let reText = "";
        if (time.hours != 0) {
            reText += `${time.hours} h `;
        }
        if (time.minutes !== 0) {
            reText += `${time.minutes} min `;
        }
        reText += `${time.seconds} s `;

        return reText;
    }

    // converts miliseconds to time class
    this.milisecondsToTime = (milis) => {
        let t = new Time();
        t.hours = Math.floor(milis / 1000 / 60 / 60);
        t.minutes = Math.floor(milis / 1000 / 60) % 60;
        t.seconds = Math.floor(milis / 1000) % 60;

        return t;
    }

    // adds another time class to this one
    this.addTime = (time, time2) => {
        if (time.minutes + time2.minutes >= 60) {
            time.minutes = (time.minutes + time2.minutes) - 60;
            time.hours += 1;
        } else {
            time.minutes += time2.minutes;
        }

        if (time.seconds + time2.seconds >= 60) {
            time.seconds = (time.seconds + time2.seconds) - 60;
            time.minutes += 1;
        } else {
            time.seconds += time2.seconds;
        }
    }
}

// class that contains time in hours, minutes and seconds seperately
function Time(hours = 0, minutes = 0, seconds = 0) {
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
}

// a sessions class
function Session(name, index, curTime = new Time(), totTime = new Time()) {
    const tm = new TimeManager();

    let startTime = 0;
    let endTime = 0;
    let pause = true;

    this.name = name;
    this.index = index;
    this.currentTime = curTime;
    this.totalTime = totTime;

    this.getElement = () => {
        let el = document.createElement("li");
        el.classList.add("session-item");
        el.classList.add("session");
        el.setAttribute("id", "session-" + this.index);
        el.textContent = name;

        return el;
    }

    this.startRecording = (updateFunc) => {
        startTime = new Date().getTime();
        pause = false;
        countSeconds(updateFunc);
    }

    const countSeconds = (updateFunc) => {
        if (pause) return;
        setTimeout(() => {
            countSeconds(updateFunc);
        }, 1000);

        endTime = new Date().getTime();
        tm.addTime(this.currentTime, tm.milisecondsToTime(endTime - startTime));
        tm.addTime(this.totalTime, tm.milisecondsToTime(endTime - startTime));
        // console.log(tm.textFormat(this.currentTime));
        // console.log(tm.textFormat(this.totalTime));
        startTime = new Date().getTime();

        if (typeof updateFunc == "function") {
            updateFunc();
        }
    }

    this.pauseRecording = (save) => {
        pause = true;
        save();
    }

    this.finishRecording = (save, update) => {
        pause = true;
        this.currentTime = new Time();
        save();
        update();
    }

    this.getCurrentTime = () => {
        return tm.textFormat(this.currentTime)
    }

    this.getTotalTime = () => {
        return tm.textFormat(this.totalTime)
    }
}

// class that manages sessions
function SessionList(el) {
    this.element = el;
    this.addButtonElement = el.querySelector(".session-add");
    this.sessions = [];

    // creates new session by name
    this.addSessionByName = (name) => {
        let s = new Session(name, this.sessions.length);
        this.element.insertBefore(s.getElement(), this.addButtonElement);
        this.sessions.push(s);

        this.saveSessions();
    }

    // creates new session by element
    this.addSessionByElement = (se) => {
        this.element.insertBefore(se, this.addButtonElement);
    }

    // deletes a session
    this.removeSession = (index) => {
        if (this.sessions.length > 1) {
            document.querySelector("#" + this.sessions[index].getElement().getAttribute("id")).remove();
            this.sessions.splice(index, 1);
            this.updateSessionIndexes();

            this.saveSessions();
        }
    }

    this.removeAllSessions = () => {
        this.sessions = [];
        this.element.querySelectorAll(".session").forEach(e => {
            e.remove();
        });

        this.saveSessions();
    }

    this.updateSessionIndexes = () => {
        this.element.querySelectorAll(".session").forEach((e, i) => {
            e.setAttribute("id", "session-" + i);
            this.sessions[i].index = i;
        });
    }

    // saves current sessions to the local storage
    this.saveSessions = () => {
        localStorage.setItem("sessions", JSON.stringify(this.sessions));
    }

    // loads the sessions save in the local storage
    this.loadSessions = () => {

        // remove all sessions
        this.element.querySelectorAll(".session").forEach(e => {
            e.remove();
        });

        // get array from the local storage
        let arr = JSON.parse(localStorage.getItem("sessions"));

        // transform saved session to normal ones
        for (let i = 0; i < arr.length; i++) {
            arr[i] = new Session(arr[i].name, arr[i].index, arr[i].currentTime, arr[i].totalTime);
        }

        // create all the sessions
        this.sessions = arr;
        arr.forEach(e => {
            this.addSessionByElement(e.getElement());
        });
    }
}

// elements that show session's time
const totalTimeElement = document.querySelector(".total-time-spent");
const currentTimeElement = document.querySelector(".current-time-spent");

// buttons that control session
const startButton = document.querySelector(".start-button");
const pauseButton = document.querySelector(".pause-button");
const finishButton = document.querySelector(".finish-button");

// elements that take part in creating a new session
const addSessionButton = document.querySelector(".session-add");
const askForNameMenu = document.querySelector(".ask-for-name");
const askForNameField = document.querySelector(".ask-for-name__input");
const askForNameSubmit = document.querySelector(".ask-for-name__enter-name");
const askForNameCacel = document.querySelector(".ask-for-name__cancel");
let askForNameMenuOn = false;

// button that deletes session
const removeSessionButton = document.querySelector(".remove-session");

let currentSession = 0;

// load saved sessions
let sl = new SessionList(document.querySelector(".sessions"));
if (localStorage.getItem("sessions") !== null && JSON.parse(localStorage.getItem("sessions")).length > 0) {
    sl.loadSessions();
} else {
    sl.addSessionByName("First Session");
}

// add event listeners to sessions
updateEventListenersOfSessions();
// make time field show time of the first session
updateTimeFields(currentSession);
// select first session
makeSessionActive(currentSession);

// remove session button
removeSessionButton.addEventListener("click", () => {
    sl.removeSession(currentSession);
    currentSession = 0;
    makeSessionActive(currentSession);
    updateTimeFields(currentSession);
});

// opens menu of creating new session
addSessionButton.addEventListener("click", () => {
    askForNameMenu.classList.add("ask-for-name--active");
    askForNameMenuOn = true;
    askForNameField.select();
});

// closes menu of creating new session
askForNameCacel.addEventListener("click", () => {
    askForNameMenuOn = false;
    askForNameField.value = "";
    askForNameMenu.classList.remove("ask-for-name--active");
})

// creates new session
askForNameSubmit.addEventListener("click", () => {
    let sesName = askForNameField.value;
    if (sesName.length > 0) {
        sl.addSessionByName(sesName);
        updateEventListenersOfSessions();
        askForNameMenuOn = false;

        askForNameField.value = "";
        askForNameMenu.classList.remove("ask-for-name--active");
    }
});

// creates new session with the Enter key
document.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && askForNameMenuOn == true) {
        let sesName = askForNameField.value;
        if (sesName.length > 0) {
            sl.addSessionByName(sesName);
            updateEventListenersOfSessions();
            askForNameMenuOn = false;

            askForNameField.value = "";
            askForNameMenu.classList.remove("ask-for-name--active");
        }
    }
});

// starts recording time of the current session
startButton.addEventListener("click", () => {
    sl.sessions[currentSession].startRecording(function () {
        updateTimeFields(currentSession);
    });
    changeSessionState(currentSession, "recording");
});

// pauses recording of the current session
pauseButton.addEventListener("click", () => {
    sl.sessions[currentSession].pauseRecording(sl.saveSessions);
    changeSessionState(currentSession, "paused");
})

// finishes current session of the current session
finishButton.addEventListener("click", () => {
    sl.sessions[currentSession].finishRecording(sl.saveSessions, function () {
        updateTimeFields(currentSession);
    });
    changeSessionState(currentSession, "finished");
})

// adds event listeners to all sessions
function updateEventListenersOfSessions() {
    sl.element.querySelectorAll(".session").forEach(e => {
        e.addEventListener("click", (event) => {
            currentSession = event.target.getAttribute("id").slice(event.target.getAttribute("id").length - 1, event.target.getAttribute("id").length);
            updateTimeFields(currentSession);
            makeSessionActive(currentSession);
        });
    });
}

// updates time field to the time of a session
function updateTimeFields(index) {
    totalTimeElement.textContent = sl.sessions[index].getTotalTime();
    currentTimeElement.textContent = sl.sessions[index].getCurrentTime();
}

// selects a session
function makeSessionActive(index) {
    sl.element.querySelectorAll(".session").forEach(s => {
        s.classList.remove("session--active");
    });

    sl.element.querySelectorAll(".session")[index].classList.add("session--active");
}

// changes session's indicator of state
function changeSessionState(index, state) {
    if (state === "recording") {
        sl.element.querySelectorAll(".session")[currentSession].classList.add("session--recording");
        sl.element.querySelectorAll(".session")[currentSession].classList.remove("session--paused");
    } else if (state === "paused") {
        sl.element.querySelectorAll(".session")[currentSession].classList.add("session--paused");
        sl.element.querySelectorAll(".session")[currentSession].classList.remove("session--recording");
    } else if (state === "finished") {
        sl.element.querySelectorAll(".session")[currentSession].classList.remove("session--paused");
        sl.element.querySelectorAll(".session")[currentSession].classList.remove("session--recording");
    } else {
        console.error("unknown state!!!");
    }
}
