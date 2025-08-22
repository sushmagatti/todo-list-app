'use strict';

// Slider functionality
let currentSlide = 0;
let slideInterval;
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('slider-dots');
const leftBtn = document.getElementById('slider-left');
const rightBtn = document.getElementById('slider-right');

function createDots() {
  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }
}

function updateDots() {
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function goToSlide(index) {
  slides[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  updateDots();
}

function nextSlide() {
  const next = (currentSlide + 1) % slides.length;
  goToSlide(next);
}

function prevSlide() {
  const prev = (currentSlide - 1 + slides.length) % slides.length;
  goToSlide(prev);
}

function startAutoSlide() {
  slideInterval = setInterval(nextSlide, 10000); // 30 seconds
}

function stopAutoSlide() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

// Event listeners for slider
if (leftBtn) leftBtn.addEventListener('click', () => {
  prevSlide();
  stopAutoSlide();
  startAutoSlide();
});

if (rightBtn) rightBtn.addEventListener('click', () => {
  nextSlide();
  stopAutoSlide();
  startAutoSlide();
});

// Initialize slider
createDots();
startAutoSlide();

// Todo app functionality
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const dueTimeInput = document.getElementById('due-time-input');
const taskList = document.getElementById('task-list');
const reminderOptions = document.getElementById('reminder-options');
const onceOptions = document.getElementById('once-options');
const weeklyOptions = document.getElementById('weekly-options');
const startDateInput = document.getElementById('start-date-input');
const endDateInput = document.getElementById('end-date-input');
const modeOnce = document.getElementById('mode-once');
const modeWeekly = document.getElementById('mode-weekly');

let tasks = loadTasks();
const reminderTimeouts = new Map();

function loadTasks() {
  try {
    const raw = localStorage.getItem('tasks');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Failed to load tasks from storage:', error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  } catch (error) {
    console.warn('Failed to save tasks to storage:', error);
  }
}

function formatDue(dueDate, dueTime) {
  if (!dueDate && !dueTime) return '';
  if (dueDate && dueTime) return `Due: ${dueDate} ${dueTime}`;
  if (dueDate) return `Due: ${dueDate}`;
  return `Due: ${dueTime}`;
}

function formatWeeklySummary(task) {
  if (!task || task.reminderMode !== 'weekly') return '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selected = Array.isArray(task.daysOfWeek) ? task.daysOfWeek.slice().sort() : [];
  const daysLabel = selected.length === 5 && selected.join(',') === '1,2,3,4,5'
    ? 'Mon–Fri'
    : selected.map(d => dayNames[d]).join(', ');
  const range = task.startDate && task.endDate ? `${task.startDate} → ${task.endDate}` : '';
  const time = task.dueTime || '';
  return `Weekly ${daysLabel}${range ? `, ${range}` : ''}${time ? ` at ${time}` : ''}`;
}

function parseDueTimestamp(dueDate, dueTime) {
  if (!dueDate || !dueTime) return null;
  const dateTimeString = `${dueDate}T${dueTime}`;
  const timestamp = new Date(dateTimeString).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

// Popup functionality
const reminderPopup = document.getElementById('reminder-popup');
const popupTask = document.getElementById('popup-task');
const popupDetails = document.getElementById('popup-details');
const popupTiming = document.getElementById('popup-timing');
const popupOk = document.getElementById('popup-ok');
const popupCancel = document.getElementById('popup-cancel');

function showPopup(task, timing = '') {
  if (!reminderPopup || !popupTask || !popupDetails || !popupTiming) return;
  
  // Set popup content
  popupTask.textContent = task.text;
  
  const whenLabel = task.reminderMode === 'weekly'
    ? (task.dueTime ? `Due at ${task.dueTime}` : '')
    : formatDue(task.dueDate || '', task.dueTime || '');
  
  popupDetails.textContent = whenLabel || 'No time specified';
  popupTiming.textContent = timing || 'Reminder';
  
  // Set colored variant based on timing
  const content = reminderPopup.querySelector('.popup-content');
  if (content) {
    content.classList.remove('popup-before', 'popup-now', 'pulse');
    if ((timing || '').toLowerCase().includes('before')) {
      content.classList.add('popup-before', 'pulse');
    } else if ((timing || '').toLowerCase() === 'now') {
      content.classList.add('popup-now', 'pulse');
    }
  }

  // Show popup
  reminderPopup.classList.add('show');
  
  // Focus on OK button for accessibility
  if (popupOk) popupOk.focus();
}

function hidePopup() {
  if (reminderPopup) {
    reminderPopup.classList.remove('show');
  }
}

// Popup event listeners
if (popupOk) {
  popupOk.addEventListener('click', hidePopup);
}

if (popupCancel) {
  popupCancel.addEventListener('click', hidePopup);
}

// Close popup when clicking overlay
if (reminderPopup) {
  reminderPopup.addEventListener('click', (e) => {
    if (e.target === reminderPopup) {
      hidePopup();
    }
  });
}

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && reminderPopup && reminderPopup.classList.contains('show')) {
    hidePopup();
  }
});

// System notification helper when tab is hidden
function buildColoredIconDataUrl(hex) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${hex}' stop-opacity='1'/>
        <stop offset='100%' stop-color='${hex}' stop-opacity='0.85'/>
      </linearGradient>
    </defs>
    <rect rx='24' ry='24' x='8' y='8' width='112' height='112' fill='url(#g)'/>
    <g fill='white'>
      <circle cx='64' cy='56' r='28'/>
      <rect x='56' y='20' width='16' height='16' rx='4'/>
    </g>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function trySystemNotification(task, timing = '') {
  if (typeof document !== 'undefined' && document.hidden && 'Notification' in window) {
    const whenLabel = task.reminderMode === 'weekly'
      ? (task.dueTime ? `Due at ${task.dueTime}` : '')
      : formatDue(task.dueDate || '', task.dueTime || '');
    const timingText = timing ? ` (${timing})` : '';
    const body = `${task.text}${timingText}${whenLabel ? `\n${whenLabel}` : ''}`;

    const isBefore = (timing || '').toLowerCase().includes('before');
    const isNow = (timing || '').toLowerCase() === 'now';
    const colorHex = isBefore ? '#f59e0b' : (isNow ? '#10b981' : '#3b82f6');
    const icon = buildColoredIconDataUrl(colorHex);
    const badge = icon;
    const titlePrefix = isBefore ? '⏳' : (isNow ? '⏰' : '🔔');
    const title = `${titlePrefix} Task Reminder`;
    const tag = `reminder-${task.id}-${isBefore ? 'before' : isNow ? 'now' : 'other'}`;
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon, badge, tag, requireInteraction: true });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification(title, { body, icon, badge, tag, requireInteraction: true });
        });
      }
    } catch (_e) {
      // ignore
    }
  }
}

function showReminder(task, timing = '') {
  // If tab is hidden, attempt system notification; always also show popup overlay
  trySystemNotification(task, timing);
  showPopup(task, timing);
}

function cancelReminder(taskId) {
  const timeoutId = reminderTimeouts.get(taskId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    reminderTimeouts.delete(taskId);
  }
}

function getNextWeeklyOccurrenceTimestamp(task) {
  if (!task.startDate || !task.endDate || !task.dueTime || !Array.isArray(task.daysOfWeek) || task.daysOfWeek.length === 0) return null;
  const startBoundary = new Date(`${task.startDate}T00:00:00`);
  const endBoundary = new Date(`${task.endDate}T23:59:59`);
  if (Number.isNaN(startBoundary.getTime()) || Number.isNaN(endBoundary.getTime())) return null;

  const now = new Date();
  let cursor = new Date(Math.max(now.getTime(), startBoundary.getTime()));
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 500; i++) {
    if (cursor.getTime() > endBoundary.getTime()) return null;
    const day = cursor.getDay();
    if (task.daysOfWeek.includes(day)) {
      const [hh, mm] = task.dueTime.split(':').map(Number);
      const occurrence = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), hh || 0, mm || 0, 0, 0);
      if (occurrence.getTime() > now.getTime() && occurrence.getTime() >= startBoundary.getTime() && occurrence.getTime() <= endBoundary.getTime()) {
        return occurrence.getTime();
      }
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }
  return null;
}

function scheduleReminder(task) {
  cancelReminder(task.id);

  if (task.type !== 'reminder') return;

  if (task.reminderMode === 'weekly') {
    const nextTs = getNextWeeklyOccurrenceTimestamp(task);
    if (!nextTs) return;
    
    const now = Date.now();
    const remindAt2Min = nextTs - 2 * 60 * 1000; // 2 minutes before
    const remindAtExact = nextTs; // exact time
    
    // Schedule 2 minutes before notification
    if (remindAt2Min > now) {
      const delay2Min = remindAt2Min - now;
      const timeoutId2Min = setTimeout(() => {
        showReminder(task, '2 minutes before');
        // Schedule the exact time notification
        const delayExact = 2 * 60 * 1000; // 2 minutes later
        const timeoutIdExact = setTimeout(() => {
          showReminder(task, 'now');
          reminderTimeouts.delete(task.id + '_exact');
        }, delayExact);
        reminderTimeouts.set(task.id + '_exact', timeoutIdExact);
      }, delay2Min);
      reminderTimeouts.set(task.id, timeoutId2Min);
    } else if (remindAtExact > now) {
      // If 2 minutes before has passed, schedule only exact time
      const delayExact = remindAtExact - now;
      const timeoutIdExact = setTimeout(() => {
        showReminder(task, 'now');
        reminderTimeouts.delete(task.id);
        // Schedule the following occurrence
        scheduleReminder(task);
      }, delayExact);
      reminderTimeouts.set(task.id, timeoutIdExact);
    } else {
      // Schedule the following occurrence
      scheduleReminder(task);
    }
    return;
  }

  const dueTs = parseDueTimestamp(task.dueDate, task.dueTime);
  if (!dueTs) return;
  
  const now = Date.now();
  const remindAt2Min = dueTs - 2 * 60 * 1000; // 2 minutes before
  const remindAtExact = dueTs; // exact time
  
  if (dueTs <= now) return; // already due or past
  
  // Schedule 2 minutes before notification
  if (remindAt2Min > now) {
    const delay2Min = remindAt2Min - now;
    const timeoutId2Min = setTimeout(() => {
      showReminder(task, '2 minutes before');
      // Schedule the exact time notification
      const delayExact = 2 * 60 * 1000; // 2 minutes later
      const timeoutIdExact = setTimeout(() => {
        showReminder(task, 'now');
        reminderTimeouts.delete(task.id + '_exact');
      }, delayExact);
      reminderTimeouts.set(task.id + '_exact', timeoutIdExact);
    }, delay2Min);
    reminderTimeouts.set(task.id, timeoutId2Min);
  } else {
    // If 2 minutes before has passed, schedule only exact time
    const delayExact = remindAtExact - now;
    const timeoutIdExact = setTimeout(() => {
      showReminder(task, 'now');
      reminderTimeouts.delete(task.id);
    }, delayExact);
    reminderTimeouts.set(task.id, timeoutIdExact);
  }
}

function scheduleAllReminders() {
  for (const task of tasks) {
    if (task.type === 'reminder') scheduleReminder(task);
  }
}

function getSelectedTaskType() {
  const el = document.querySelector('input[name="task-type"]:checked');
  return el ? el.value : 'task';
}

function getSelectedRemindMode() {
  const el = document.querySelector('input[name="remind-mode"]:checked');
  return el ? el.value : 'once';
}

function getSelectedDaysOfWeek() {
  const boxes = Array.from(document.querySelectorAll('.dow'));
  const days = boxes.filter(b => b.checked).map(b => Number(b.getAttribute('data-dow')));
  return days;
}

function updateTypeVisibility() {
  const type = getSelectedTaskType();
  if (reminderOptions) {
    reminderOptions.style.display = type !== 'reminder' ? 'none' : 'flex';
  }
}

function updateModeVisibility() {
  const mode = getSelectedRemindMode();
  if (onceOptions) {
    onceOptions.style.display = mode !== 'once' ? 'none' : 'block';
  }
  if (weeklyOptions) {
    weeklyOptions.style.display = mode !== 'weekly' ? 'none' : 'flex';
  }
}

// Add event listeners for radio buttons
document.addEventListener('DOMContentLoaded', function() {
  const modeOnce = document.getElementById('mode-once');
  const modeWeekly = document.getElementById('mode-weekly');
  const typeTaskEl = document.getElementById('type-task');
  const typeReminderEl = document.getElementById('type-reminder');
  
  if (modeOnce) modeOnce.addEventListener('change', updateModeVisibility);
  if (modeWeekly) modeWeekly.addEventListener('change', updateModeVisibility);
  if (typeTaskEl) typeTaskEl.addEventListener('change', updateTypeVisibility);
  if (typeReminderEl) typeReminderEl.addEventListener('change', updateTypeVisibility);
  
  // Initialize visibility
  updateTypeVisibility();
  updateModeVisibility();
});

function renderTasks() {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks yet. Add one above.';
    taskList.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const listItem = document.createElement('li');
    listItem.className = 'task-item';
    listItem.dataset.id = String(task.id);

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const typeBadge = document.createElement('span');
    if (task.type === 'reminder') {
      typeBadge.className = 'badge badge-reminder';
      typeBadge.textContent = 'Reminder';
      meta.appendChild(typeBadge);
    }

    meta.appendChild(text);

    if (task.type === 'reminder') {
      if (task.reminderMode === 'weekly') {
        const weeklySpan = document.createElement('span');
        weeklySpan.className = 'task-due';
        weeklySpan.textContent = formatWeeklySummary(task);
        meta.appendChild(weeklySpan);
      } else if (task.dueDate || task.dueTime) {
        const due = document.createElement('span');
        due.className = 'task-due';
        due.textContent = formatDue(task.dueDate || '', task.dueTime || '');
        meta.appendChild(due);
      }
    } else if (task.dueDate || task.dueTime) {
      const due = document.createElement('span');
      due.className = 'task-due';
      due.textContent = formatDue(task.dueDate || '', task.dueTime || '');
      meta.appendChild(due);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn btn-edit';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      const updatedText = prompt('Edit task', task.text);
      if (updatedText === null) return; // cancelled
      const trimmedText = updatedText.trim();
      if (trimmedText.length === 0) return; // ignore empty edits

      if (task.type === 'reminder' && task.reminderMode === 'once') {
        const updatedDate = prompt('Edit due date (YYYY-MM-DD) — leave empty to clear', task.dueDate || '');
        if (updatedDate === null) return; // cancelled
        const updatedTime = prompt('Edit due time (HH:MM) — leave empty to clear', task.dueTime || '');
        if (updatedTime === null) return; // cancelled

        const dateOk = updatedDate === '' || /^\d{4}-\d{2}-\d{2}$/.test(updatedDate);
        const timeOk = updatedTime === '' || /^\d{2}:\d{2}$/.test(updatedTime);
        if (!dateOk || !timeOk) {
          alert('Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.');
          return;
        }

        task.text = trimmedText;
        task.dueDate = updatedDate || '';
        task.dueTime = updatedTime || '';
      } else {
        // For weekly or normal tasks, only update text here
        task.text = trimmedText;
      }

      saveTasks();
      renderTasks();
      if (task.type === 'reminder') scheduleReminder(task);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      cancelReminder(task.id);
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    listItem.appendChild(meta);
    listItem.appendChild(actions);

    taskList.appendChild(listItem);
  }
}

// Handle add

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = taskInput.value.trim();
  if (!value) return;

  const type = getSelectedTaskType();

  let newTask;
  if (type === 'reminder') {
    const mode = getSelectedRemindMode();

    if (mode === 'once') {
      const dueDate = (dueDateInput.value || '').trim();
      const dueTime = (dueTimeInput.value || '').trim();
      if (!dueDate || !dueTime) {
        alert('Reminder requires both due date and time.');
        return;
      }
      newTask = {
        id: Date.now(),
        text: value,
        type: 'reminder',
        reminderMode: 'once',
        dueDate,
        dueTime
      };
    } else {
      const startDate = (startDateInput.value || '').trim();
      const endDate = (endDateInput.value || '').trim();
      const dueTime = (dueTimeInput.value || '').trim();
      const daysOfWeek = getSelectedDaysOfWeek();

      if (!startDate || !endDate || !dueTime) {
        alert('Weekly reminder requires start date, end date, and time.');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be on or before end date.');
        return;
      }
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        alert('Select at least one weekday for weekly reminders.');
        return;
      }

      newTask = {
        id: Date.now(),
        text: value,
        type: 'reminder',
        reminderMode: 'weekly',
        startDate,
        endDate,
        dueTime,
        daysOfWeek
      };
    }
  } else {
    newTask = {
      id: Date.now(),
      text: value,
      type: 'task'
    };
  }

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  if (newTask.type === 'reminder') scheduleReminder(newTask);

  // Reset form
  taskInput.value = '';
  if (dueDateInput) dueDateInput.value = '';
  if (dueTimeInput) dueTimeInput.value = '';
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  // Reset defaults: Task + Once, Mon-Fri checked
  const typeTaskEl = document.getElementById('type-task');
  const modeOnce = document.getElementById('mode-once');
  if (typeTaskEl) typeTaskEl.checked = true;
  if (modeOnce) modeOnce.checked = true;
  document.querySelectorAll('.dow').forEach((el) => {
    const val = Number(el.getAttribute('data-dow'));
    el.checked = [1,2,3,4,5].includes(val);
  });
  updateTypeVisibility();
  updateModeVisibility();
  taskInput.focus();
});

// Initial render and reminder scheduling
document.addEventListener('DOMContentLoaded', function() {
  renderTasks();
  updateTypeVisibility();
  updateModeVisibility();
  scheduleAllReminders();
}); 