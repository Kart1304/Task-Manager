document.addEventListener("DOMContentLoaded", function() {
    // Theme toggle functionality
    const themeSwitch = document.getElementById("theme-switch");
    const body = document.body;

    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem("task-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Set initial theme based on saved preference or system preference
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        body.classList.add("dark");
        themeSwitch.checked = true;
    }

    // Toggle theme when switch is clicked
    themeSwitch.addEventListener("change", function() {
        if (this.checked) {
            body.classList.add("dark");
            localStorage.setItem("task-theme", "dark");
        } else {
            body.classList.remove("dark");
            localStorage.setItem("task-theme", "light");
        }
    });

    // Task Manager functionality
    const taskInput = document.getElementById("task-input");
    const taskPriority = document.getElementById("task-priority");
    const taskDueDate = document.getElementById("task-due-date");
    const taskCategory = document.getElementById("task-category");
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskList = document.getElementById("task-list");
    const noTasksMessage = document.getElementById("no-tasks-message");
    const clearCompletedBtn = document.getElementById("clear-completed-btn");
    const clearAllBtn = document.getElementById("clear-all-btn");
    
    // Filter elements
    const filterStatus = document.getElementById("filter-status");
    const filterPriority = document.getElementById("filter-priority");
    const filterCategory = document.getElementById("filter-category");
    const sortBy = document.getElementById("sort-by");
    
    // Stats elements
    const totalTasksElement = document.getElementById("total-tasks");
    const activeTasksElement = document.getElementById("active-tasks");
    const completedTasksElement = document.getElementById("completed-tasks");
    
    // Modal elements
    const editModal = document.getElementById("edit-modal");
    const closeModal = document.querySelector(".close-modal");
    const editTaskInput = document.getElementById("edit-task-input");
    const editTaskPriority = document.getElementById("edit-task-priority");
    const editTaskDueDate = document.getElementById("edit-task-due-date");
    const editTaskCategory = document.getElementById("edit-task-category");
    const saveEditBtn = document.getElementById("save-edit-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    
    // Task array to store all tasks
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    
    // Currently editing task ID
    let editingTaskId = null;
    
    // Initialize the app
    function init() {
        renderTasks();
        updateStats();
        updateCategoryFilter();
        
        // Set today as the default due date
        const today = new Date().toISOString().split("T")[0];
        taskDueDate.value = today;
    }
    
    // Save tasks to local storage
    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }
    
    // Add a new task
    function addTask() {
        const text = taskInput.value.trim();
        if (text === "") return;
        
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: taskPriority.value,
            dueDate: taskDueDate.value || null,
            category: taskCategory.value.trim() || "Uncategorized",
            dateAdded: new Date().toISOString()
        };
        
        tasks.push(task);
        saveTasks();
        
        // Clear input fields
        taskInput.value = "";
        taskPriority.value = "medium";
        taskCategory.value = "";
        
        // Set today as the default due date again
        const today = new Date().toISOString().split("T")[0];
        taskDueDate.value = today;
        
        renderTasks();
        updateStats();
        updateCategoryFilter();
        
        // Focus on input for next task
        taskInput.focus();
    }
    
    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        updateCategoryFilter();
    }
    
    // Toggle task completion
    function toggleTaskCompletion(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    // Edit a task
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        editingTaskId = id;
        
        // Populate modal fields
        editTaskInput.value = task.text;
        editTaskPriority.value = task.priority;
        editTaskDueDate.value = task.dueDate || "";
        editTaskCategory.value = task.category === "Uncategorized" ? "" : task.category;
        
        // Show modal
        editModal.classList.add("show");
    }
    
    // Save edited task
    function saveEditedTask() {
        if (!editingTaskId) return;
        
        const text = editTaskInput.value.trim();
        if (text === "") return;
        
        tasks = tasks.map(task => {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    text: text,
                    priority: editTaskPriority.value,
                    dueDate: editTaskDueDate.value || null,
                    category: editTaskCategory.value.trim() || "Uncategorized"
                };
            }
            return task;
        });
        
        saveTasks();
        closeEditModal();
        renderTasks();
        updateCategoryFilter();
    }
    
    // Close edit modal
    function closeEditModal() {
        editModal.classList.remove("show");
        editingTaskId = null;
    }
    
    // Clear completed tasks
    function clearCompletedTasks() {
        if (tasks.some(task => task.completed)) {
            if (confirm("Are you sure you want to delete all completed tasks?")) {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                updateStats();
                updateCategoryFilter();
            }
        }
    }
    
    // Clear all tasks
    function clearAllTasks() {
        if (tasks.length > 0) {
            if (confirm("Are you sure you want to delete ALL tasks?")) {
                tasks = [];
                saveTasks();
                renderTasks();
                updateStats();
                updateCategoryFilter();
            }
        }
    }
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return "No due date";
        
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Check if a task is overdue
    function isOverdue(dateString) {
        if (!dateString) return false;
        
        const dueDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dueDate < today;
    }
    
    // Filter and sort tasks
    function filterAndSortTasks() {
        let filteredTasks = [...tasks];
        
        // Filter by status
        if (filterStatus.value !== "all") {
            const completed = filterStatus.value === "completed";
            filteredTasks = filteredTasks.filter(task => task.completed === completed);
        }
        
        // Filter by priority
        if (filterPriority.value !== "all") {
            filteredTasks = filteredTasks.filter(task => task.priority === filterPriority.value);
        }
        
        // Filter by category
        if (filterCategory.value !== "all") {
            filteredTasks = filteredTasks.filter(task => task.category === filterCategory.value);
        }
        
        // Sort tasks
        switch (sortBy.value) {
            case "date-added-desc":
                filteredTasks.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case "date-added-asc":
                filteredTasks.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
                break;
            case "due-date-asc":
                filteredTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case "priority-desc":
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                filteredTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
            case "priority-asc":
                const priorityOrderAsc = { high: 3, medium: 2, low: 1 };
                filteredTasks.sort((a, b) => priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority]);
                break;
        }
        
        return filteredTasks;
    }
    
    // Render tasks to the DOM
    function renderTasks() {
        const filteredTasks = filterAndSortTasks();
        
        // Clear task list
        taskList.innerHTML = "";
        
        // Show/hide no tasks message
        if (filteredTasks.length === 0) {
            taskList.appendChild(noTasksMessage);
        } else {
            // Create task elements
            filteredTasks.forEach(task => {
                const taskItem = document.createElement("div");
                taskItem.classList.add("task-item");
                if (task.completed) {
                    taskItem.classList.add("task-completed");
                }
                
                // Create checkbox
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.classList.add("task-checkbox");
                checkbox.checked = task.completed;
                checkbox.addEventListener("change", () => toggleTaskCompletion(task.id));
                
                // Create task content
                const taskContent = document.createElement("div");
                taskContent.classList.add("task-content");
                
                const taskText = document.createElement("div");
                taskText.classList.add("task-text");
                taskText.textContent = task.text;
                
                const taskMeta = document.createElement("div");
                taskMeta.classList.add("task-meta");
                
                // Add priority badge
                const priorityBadge = document.createElement("span");
                priorityBadge.classList.add("task-priority", `priority-${task.priority}`);
                priorityBadge.textContent = task.priority;
                
                // Add due date
                const dueDate = document.createElement("span");
                dueDate.innerHTML = `<i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}`;
                if (isOverdue(task.dueDate) && !task.completed) {
                    dueDate.style.color = "var(--danger-color)";
                }
                
                // Add category
                const category = document.createElement("span");
                category.innerHTML = `<i class="fas fa-tag"></i> ${task.category}`;
                
                taskMeta.appendChild(priorityBadge);
                taskMeta.appendChild(dueDate);
                taskMeta.appendChild(category);
                
                taskContent.appendChild(taskText);
                taskContent.appendChild(taskMeta);
                
                // Create task actions
                const taskActions = document.createElement("div");
                taskActions.classList.add("task-actions");
                
                const editBtn = document.createElement("button");
                editBtn.classList.add("task-action-btn");
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.addEventListener("click", () => editTask(task.id));
                
                const deleteBtn = document.createElement("button");
                deleteBtn.classList.add("task-action-btn", "delete");
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.addEventListener("click", () => deleteTask(task.id));
                
                taskActions.appendChild(editBtn);
                taskActions.appendChild(deleteBtn);
                
                // Assemble task item
                taskItem.appendChild(checkbox);
                taskItem.appendChild(taskContent);
                taskItem.appendChild(taskActions);
                
                taskList.appendChild(taskItem);
            });
        }
    }
    
    // Update task statistics
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        totalTasksElement.textContent = totalTasks;
        activeTasksElement.textContent = activeTasks;
        completedTasksElement.textContent = completedTasks;
    }
    
    // Update category filter options
    function updateCategoryFilter() {
        // Get unique categories
        const categories = [...new Set(tasks.map(task => task.category))];
        
        // Save current selection
        const currentSelection = filterCategory.value;
        
        // Clear options except "All"
        while (filterCategory.options.length > 1) {
            filterCategory.remove(1);
        }
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            filterCategory.appendChild(option);
        });
        
        // Restore selection if possible
        if (categories.includes(currentSelection)) {
            filterCategory.value = currentSelection;
        }
    }
    
    // Event listeners
    addTaskBtn.addEventListener("click", addTask);
    
    taskInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            addTask();
        }
    });
    
    clearCompletedBtn.addEventListener("click", clearCompletedTasks);
    clearAllBtn.addEventListener("click", clearAllTasks);
    
    // Filter change events
    filterStatus.addEventListener("change", renderTasks);
    filterPriority.addEventListener("change", renderTasks);
    filterCategory.addEventListener("change", renderTasks);
    sortBy.addEventListener("change", renderTasks);
    
    // Modal events
    closeModal.addEventListener("click", closeEditModal);
    cancelEditBtn.addEventListener("click", closeEditModal);
    saveEditBtn.addEventListener("click", saveEditedTask);
    
    // Close modal when clicking outside
    window.addEventListener("click", function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    // Initialize the app
    init();
});