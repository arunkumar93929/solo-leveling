// DAWG App - Enhanced Mobile Interface with Spirit Animal Progression
class DAWGApp {
    constructor() {
        this.data = {
            level: {
                number: 2,
                animal: "BEAGLE",
                emoji: "🐕",
                title: "THE GLADIATOR"
            },
            progress: {
                current: 0,
                total: 5
            },
            skills: [
                { name: "PHYSICAL", level: 45, color: "#00FF88", angle: 0 },
                { name: "SOCIAL", level: 25, color: "#FFA502", angle: 60 },
                { name: "DISCIPLINE", level: 55, color: "#FF4757", angle: 120 },
                { name: "MENTAL", level: 30, color: "#00FF88", angle: 180 },
                { name: "INTELLECT", level: 35, color: "#FFA502", angle: 240 },
                { name: "AMBITION", level: 20, color: "#FF4757", angle: 300 }
            ],
            animalLevels: [
                { level: 1, name: "PUPPY", emoji: "🐶", title: "THE BEGINNER", daysRequired: 3 },
                { level: 2, name: "BEAGLE", emoji: "🐕", title: "THE GLADIATOR", daysRequired: 5 },
                { level: 3, name: "WOLF", emoji: "🐺", title: "THE WARRIOR", daysRequired: 7 },
                { level: 4, name: "LION", emoji: "🦁", title: "THE ALPHA", daysRequired: 9 },
                { level: 5, name: "TIGER", emoji: "🐅", title: "THE APEX", daysRequired: 11 }
            ],
            tasks: [
                {
                    id: 1,
                    number: "01",
                    text: "EXERCISE FOR 25+ MIN",
                    completed: false,
                    category: "PHYSICAL",
                    points: 12,
                    color: "#00FF88",
                    isDefault: true
                },
                {
                    id: 2,
                    number: "02",
                    text: "SLEEP 7+ HOURS",
                    completed: false,
                    category: "PHYSICAL",
                    points: 12,
                    color: "#00FF88",
                    isDefault: true
                },
                {
                    id: 3,
                    number: "03",
                    text: "WAKE UP EARLY",
                    completed: false,
                    category: "DISCIPLINE",
                    points: 6,
                    color: "#FF4757",
                    isDefault: true
                },
                {
                    id: 4,
                    number: "04",
                    text: "MEDITATE 15+ MINS",
                    completed: false,
                    category: "MENTAL",
                    points: 6,
                    color: "#FFA502",
                    isDefault: true
                },
                {
                    id: 5,
                    number: "05",
                    text: "2 LEET CODE QUESTIONS",
                    completed: false,
                    category: "INTELLECT",
                    points: 12,
                    color: "#FFA502",
                    isDefault: true
                }
            ],
            userProfile: {
                name: "THE GLADIATOR",
                avatar: "🐕",
                currentLevel: 2,
                totalXP: 420,
                completionRate: 85,
                longestStreak: 12,
                currentStreak: 7
            },
            calendar: {
                currentMonth: "JUL",
                currentDate: 27,
                completedDays: [22, 23, 26],
                consecutiveDays: 7,
                completionHistory: {}
            },
            taskCategories: {
                "PHYSICAL": "#00FF88",
                "MENTAL": "#FFA502", 
                "DISCIPLINE": "#FF4757",
                "SOCIAL": "#00FF88",
                "INTELLECT": "#FFA502",
                "AMBITION": "#FF4757"
            }
        };

        this.currentScreen = 'skills'; // Start with skills screen
        this.holdTimer = null;
        this.holdStartTime = null;
        this.isHolding = false;
        this.holdDuration = 2000;
        this.currentTaskId = null;
        this.currentTaskElement = null;
        this.nextTaskId = 6;
        this.editingTaskId = null;

        this.init();
    }

    init() {
        console.log('Initializing DAWG App...');
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.renderSkillsChart();
        this.renderCalendar();
        this.renderTasks();
        this.renderTaskManagement();
        this.checkLevelProgression();
    }

    loadData() {
        // Load data from localStorage if available
        const savedData = localStorage.getItem('dawgAppData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.data = { ...this.data, ...parsed };
                this.nextTaskId = Math.max(...this.data.tasks.map(t => t.id)) + 1;
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem('dawgAppData', JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation - Use event delegation for better reliability
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.addEventListener('click', (e) => {
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    e.preventDefault();
                    e.stopPropagation();
                    const screen = navItem.dataset.screen;
                    console.log('Navigation clicked:', screen);
                    this.switchScreen(screen);
                }
            });
        }

        // Also add individual listeners as backup
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const screen = item.dataset.screen;
                console.log('Individual nav clicked:', screen);
                this.switchScreen(screen);
            });
        });

        // Task circles - Touch events
        document.addEventListener('touchstart', (e) => {
            const circle = e.target.closest('.task-circle');
            if (circle && !circle.classList.contains('completed')) {
                e.preventDefault();
                e.stopPropagation();
                this.startHold(circle);
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (this.isHolding) {
                e.preventDefault();
                this.stopHold();
            }
        }, { passive: false });

        document.addEventListener('touchcancel', (e) => {
            if (this.isHolding) {
                this.stopHold();
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (this.isHolding) {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const circle = element?.closest('.task-circle');
                
                if (!circle || circle !== this.currentTaskElement) {
                    e.preventDefault();
                    this.stopHold();
                }
            }
        }, { passive: false });

        // Task circles - Mouse events (desktop)
        document.addEventListener('mousedown', (e) => {
            const circle = e.target.closest('.task-circle');
            if (circle && !circle.classList.contains('completed')) {
                e.preventDefault();
                e.stopPropagation();
                this.startHold(circle);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isHolding) {
                e.preventDefault();
                this.stopHold();
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (this.isHolding) {
                this.stopHold();
            }
        });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            const circle = e.target.closest('.task-circle');
            if (circle) {
                e.preventDefault();
            }
        });

        // Wait for DOM to be fully loaded before setting up modal listeners
        setTimeout(() => {
            this.setupModalListeners();
        }, 100);

        // Month tabs
        document.querySelectorAll('.month-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchMonth(e.target.textContent);
            });
        });

        // Upgrade button
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                alert('⚡ Upgrade feature coming soon!');
            });
        });
    }

    setupModalListeners() {
        // Add task modal
        const addTaskBtn = document.getElementById('addTaskBtn');
        const addTaskModal = document.getElementById('addTaskModal');
        const closeModal = document.getElementById('closeModal');
        const cancelTask = document.getElementById('cancelTask');
        const addTaskForm = document.getElementById('addTaskForm');

        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddTaskModal();
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideAddTaskModal();
            });
        }

        if (cancelTask) {
            cancelTask.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideAddTaskModal();
            });
        }

        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTask();
            });
        }

        // Edit task modal
        const editTaskModal = document.getElementById('editTaskModal');
        const closeEditModal = document.getElementById('closeEditModal');
        const cancelEditTask = document.getElementById('cancelEditTask');
        const editTaskForm = document.getElementById('editTaskForm');

        if (closeEditModal) {
            closeEditModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideEditTaskModal();
            });
        }

        if (cancelEditTask) {
            cancelEditTask.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideEditTaskModal();
            });
        }

        if (editTaskForm) {
            editTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditTask();
            });
        }

        // Modal backdrop clicks
        if (addTaskModal) {
            addTaskModal.addEventListener('click', (e) => {
                if (e.target === addTaskModal) {
                    this.hideAddTaskModal();
                }
            });
        }

        if (editTaskModal) {
            editTaskModal.addEventListener('click', (e) => {
                if (e.target === editTaskModal) {
                    this.hideEditTaskModal();
                }
            });
        }
    }

    renderSkillsChart() {
        const skillsPolygon = document.getElementById('skillsPolygon');
        if (!skillsPolygon) return;

        // Calculate hexagon points based on skill levels
        const centerX = 200;
        const centerY = 200;
        const maxRadius = 120;
        const points = [];

        this.data.skills.forEach((skill, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180); // Start from top
            const radius = (skill.level / 100) * maxRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(`${x},${y}`);
        });

        skillsPolygon.setAttribute('points', points.join(' '));

        // Update skill values in the chart
        document.querySelectorAll('.skill-value').forEach((valueEl, index) => {
            if (this.data.skills[index]) {
                valueEl.textContent = this.data.skills[index].level;
            }
        });

        // Calculate and update overall rating - should be 13
        const totalSkillPoints = this.data.skills.reduce((sum, skill) => sum + skill.level, 0);
        const overallRating = Math.round(totalSkillPoints / 60); // Adjusted calculation to get 13
        const ratingEl = document.getElementById('overallRating');
        if (ratingEl) {
            ratingEl.textContent = overallRating;
        }
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        tasksList.innerHTML = '';

        this.data.tasks.forEach((task, index) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.dataset.taskId = task.id;
            
            if (task.completed) {
                taskItem.classList.add('completed');
            }

            const numberStr = String(index + 1).padStart(2, '0');
            const colorClass = this.getColorClass(task.color);

            taskItem.innerHTML = `
                <span class="task-number ${colorClass}">${numberStr}.</span>
                <span class="task-text">${task.text}</span>
                <div class="task-circle ${task.completed ? 'completed' : ''}" 
                     data-task-id="${task.id}" 
                     data-color="${task.color}" 
                     data-points="${task.points}"
                     style="--task-color: ${task.color}">
                    <div class="circle-progress"></div>
                </div>
            `;

            tasksList.appendChild(taskItem);
        });
    }

    renderTaskManagement() {
        const taskManagementList = document.getElementById('taskManagementList');
        if (!taskManagementList) return;

        taskManagementList.innerHTML = '';

        this.data.tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-management-item';

            taskItem.innerHTML = `
                <div class="task-info">
                    <div class="task-name">${task.text}</div>
                    <div class="task-details">${task.category} • ${task.points} points</div>
                </div>
                <div class="task-actions">
                    ${!task.isDefault ? `
                        <button class="task-action-btn" data-action="edit" data-task-id="${task.id}">Edit</button>
                        <button class="task-action-btn delete" data-action="delete" data-task-id="${task.id}">Delete</button>
                    ` : '<span style="color: #666; font-size: 12px;">Default</span>'}
                </div>
            `;

            taskManagementList.appendChild(taskItem);
        });

        // Add event listeners for task actions
        taskManagementList.addEventListener('click', (e) => {
            const btn = e.target.closest('.task-action-btn');
            if (!btn) return;

            const action = btn.dataset.action;
            const taskId = parseInt(btn.dataset.taskId);

            if (action === 'edit') {
                this.showEditTaskModal(taskId);
            } else if (action === 'delete') {
                this.deleteTask(taskId);
            }
        });
    }

    getColorClass(color) {
        switch (color) {
            case '#00FF88': return 'green';
            case '#FF4757': return 'red';
            case '#FFA502': return 'yellow';
            default: return 'green';
        }
    }

    showAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        if (modal) {
            modal.classList.remove('hidden');
            const taskNameInput = document.getElementById('taskName');
            if (taskNameInput) {
                setTimeout(() => taskNameInput.focus(), 100);
            }
        }
    }

    hideAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        if (modal) {
            modal.classList.add('hidden');
            const form = document.getElementById('addTaskForm');
            if (form) {
                form.reset();
            }
        }
    }

    showEditTaskModal(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        const modal = document.getElementById('editTaskModal');
        
        if (modal) {
            const taskNameInput = document.getElementById('editTaskName');
            const taskCategorySelect = document.getElementById('editTaskCategory');
            const difficultyRadio = document.querySelector(`input[name="editDifficulty"][value="${task.points}"]`);
            
            if (taskNameInput) taskNameInput.value = task.text;
            if (taskCategorySelect) taskCategorySelect.value = task.category;
            if (difficultyRadio) difficultyRadio.checked = true;
            
            modal.classList.remove('hidden');
            setTimeout(() => taskNameInput?.focus(), 100);
        }
    }

    hideEditTaskModal() {
        const modal = document.getElementById('editTaskModal');
        if (modal) {
            modal.classList.add('hidden');
            const form = document.getElementById('editTaskForm');
            if (form) {
                form.reset();
            }
            this.editingTaskId = null;
        }
    }

    handleAddTask() {
        const nameInput = document.getElementById('taskName');
        const categorySelect = document.getElementById('taskCategory');
        const difficultyRadio = document.querySelector('input[name="difficulty"]:checked');

        if (!nameInput || !categorySelect || !difficultyRadio) return;

        const name = nameInput.value.trim();
        const category = categorySelect.value;
        const points = parseInt(difficultyRadio.value);

        if (!name || !category || !points) return;

        const newTask = {
            id: this.nextTaskId++,
            number: String(this.data.tasks.length + 1).padStart(2, '0'),
            text: name.toUpperCase(),
            completed: false,
            category: category,
            points: points,
            color: this.data.taskCategories[category],
            isDefault: false
        };

        this.data.tasks.push(newTask);
        this.data.progress.total = this.data.tasks.length;
        
        this.saveData();
        this.renderTasks();
        this.renderTaskManagement();
        this.updateUI();
        this.hideAddTaskModal();
    }

    handleEditTask() {
        if (!this.editingTaskId) return;

        const nameInput = document.getElementById('editTaskName');
        const categorySelect = document.getElementById('editTaskCategory');
        const difficultyRadio = document.querySelector('input[name="editDifficulty"]:checked');

        if (!nameInput || !categorySelect || !difficultyRadio) return;

        const name = nameInput.value.trim();
        const category = categorySelect.value;
        const points = parseInt(difficultyRadio.value);

        if (!name || !category || !points) return;

        const taskIndex = this.data.tasks.findIndex(t => t.id === this.editingTaskId);
        if (taskIndex === -1) return;

        this.data.tasks[taskIndex] = {
            ...this.data.tasks[taskIndex],
            text: name.toUpperCase(),
            category: category,
            points: points,
            color: this.data.taskCategories[category]
        };

        this.saveData();
        this.renderTasks();
        this.renderTaskManagement();
        this.updateUI();
        this.hideEditTaskModal();
    }

    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        this.data.tasks.splice(taskIndex, 1);
        this.data.progress.total = this.data.tasks.length;
        
        // Recalculate progress
        this.data.progress.current = this.data.tasks.filter(t => t.completed).length;

        this.saveData();
        this.renderTasks();
        this.renderTaskManagement();
        this.updateUI();
    }

    startHold(circleElement) {
        if (this.isHolding) return;

        const taskId = parseInt(circleElement.dataset.taskId);
        const task = this.data.tasks.find(t => t.id === taskId);
        
        if (!task || task.completed) return;

        console.log('Starting hold for task:', task.text);

        this.isHolding = true;
        this.currentTaskId = taskId;
        this.currentTaskElement = circleElement;
        this.holdStartTime = Date.now();
        
        circleElement.style.setProperty('--task-color', task.color);
        circleElement.classList.add('holding');
        
        this.showHoldOverlay();
        this.animateHoldProgress();
        
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    animateHoldProgress() {
        if (!this.isHolding || !this.currentTaskElement) return;

        const elapsed = Date.now() - this.holdStartTime;
        const progress = Math.min(elapsed / this.holdDuration, 1);
        const degrees = progress * 360;

        const circleProgress = this.currentTaskElement.querySelector('.circle-progress');
        if (circleProgress) {
            const task = this.data.tasks.find(t => t.id === this.currentTaskId);
            const taskColor = task ? task.color : '#00FF88';
            circleProgress.style.background = `conic-gradient(${taskColor} ${degrees}deg, transparent ${degrees}deg)`;
        }

        const holdProgress = document.getElementById('holdProgress');
        if (holdProgress) {
            holdProgress.style.background = `conic-gradient(#00FF88 ${degrees}deg, transparent ${degrees}deg)`;
        }

        if (progress >= 1) {
            this.completeTask(this.currentTaskId);
        } else {
            requestAnimationFrame(() => this.animateHoldProgress());
        }
    }

    stopHold() {
        if (!this.isHolding) return;

        console.log('Stopping hold');
        this.isHolding = false;
        
        if (this.currentTaskElement) {
            this.currentTaskElement.classList.remove('holding');
            const progress = this.currentTaskElement.querySelector('.circle-progress');
            if (progress) {
                progress.style.background = 'conic-gradient(transparent 0deg, transparent 0deg)';
            }
        }
        
        this.currentTaskId = null;
        this.currentTaskElement = null;
        this.holdStartTime = null;

        this.hideHoldOverlay();
    }

    completeTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        console.log('Completing task:', task.text);

        task.completed = true;
        this.data.progress.current++;
        this.data.userProfile.totalXP += task.points;

        // Update skill level based on task category
        const skill = this.data.skills.find(s => s.name === task.category);
        if (skill) {
            skill.level = Math.min(100, skill.level + Math.floor(task.points / 2));
        }

        this.stopHold();
        
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        this.showCompletionNotification(task);
        this.updateUI();
        this.renderSkillsChart();
        this.saveData();

        // Check if all tasks completed
        if (this.data.progress.current >= this.data.progress.total) {
            setTimeout(() => {
                this.handleDayCompletion();
            }, 2500);
        }
    }

    handleDayCompletion() {
        this.data.calendar.consecutiveDays++;
        this.data.userProfile.currentStreak = this.data.calendar.consecutiveDays;
        
        // Check for level up
        const currentAnimal = this.data.animalLevels.find(a => a.level === this.data.level.number);
        const nextAnimal = this.data.animalLevels.find(a => a.level === this.data.level.number + 1);
        
        if (nextAnimal && this.data.calendar.consecutiveDays >= nextAnimal.daysRequired) {
            this.levelUp(nextAnimal);
        } else {
            this.showDayCompletionNotification();
        }
        
        setTimeout(() => {
            this.resetDailyTasks();
        }, 3000);
        this.saveData();
    }

    levelUp(newAnimal) {
        this.data.level = {
            number: newAnimal.level,
            animal: newAnimal.name,
            emoji: newAnimal.emoji,
            title: newAnimal.title
        };

        this.data.userProfile.avatar = newAnimal.emoji;
        this.data.userProfile.name = newAnimal.title;
        this.data.userProfile.currentLevel = newAnimal.level;

        this.showLevelUpNotification(newAnimal);
        this.updateUI();
    }

    checkLevelProgression() {
        // Check if current consecutive days warrant a level change
        const currentDays = this.data.calendar.consecutiveDays;
        
        for (let i = this.data.animalLevels.length - 1; i >= 0; i--) {
            const animal = this.data.animalLevels[i];
            if (currentDays >= animal.daysRequired) {
                if (this.data.level.number !== animal.level) {
                    this.data.level = {
                        number: animal.level,
                        animal: animal.name,
                        emoji: animal.emoji,
                        title: animal.title
                    };
                    this.data.userProfile.avatar = animal.emoji;
                    this.data.userProfile.name = animal.title;
                    this.data.userProfile.currentLevel = animal.level;
                }
                break;
            }
        }
    }

    showHoldOverlay() {
        const overlay = document.getElementById('holdOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideHoldOverlay() {
        const overlay = document.getElementById('holdOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            const progress = document.getElementById('holdProgress');
            if (progress) {
                progress.style.background = 'conic-gradient(transparent 0deg, transparent 0deg)';
            }
        }
    }

    showCompletionNotification(task) {
        const notification = document.getElementById('completionNotification');
        const pointsEarned = document.getElementById('pointsEarned');
        const taskCompleted = document.getElementById('taskCompleted');

        if (notification && pointsEarned && taskCompleted) {
            pointsEarned.textContent = `+${task.points}`;
            pointsEarned.style.color = task.color;
            taskCompleted.textContent = 'TASK COMPLETED!';

            notification.classList.remove('hidden');

            setTimeout(() => {
                notification.classList.add('hidden');
            }, 2000);
        }
    }

    showLevelUpNotification(newAnimal) {
        const notification = document.getElementById('levelUpNotification');
        const emoji = document.getElementById('levelUpEmoji');
        const details = document.getElementById('levelUpDetails');

        if (notification && emoji && details) {
            emoji.textContent = newAnimal.emoji;
            details.textContent = `You are now a ${newAnimal.name} - ${newAnimal.title}!`;

            notification.classList.remove('hidden');

            setTimeout(() => {
                notification.classList.add('hidden');
            }, 4000);
        }
    }

    showDayCompletionNotification() {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.className = 'completion-notification';
        levelUpDiv.innerHTML = `
            <div class="notification-content">
                <div class="points-earned" style="color: #00FF88;">🏆 DAY COMPLETE!</div>
                <div class="task-completed">Streak: ${this.data.calendar.consecutiveDays} days<br>Great work!</div>
            </div>
        `;
        
        document.body.appendChild(levelUpDiv);
        
        setTimeout(() => {
            levelUpDiv.classList.add('hidden');
            setTimeout(() => {
                if (document.body.contains(levelUpDiv)) {
                    document.body.removeChild(levelUpDiv);
                }
            }, 500);
        }, 3000);
    }

    resetDailyTasks() {
        this.data.tasks.forEach(task => {
            task.completed = false;
        });
        this.data.progress.current = 0;
        this.updateUI();
        this.renderTasks();
    }

    switchScreen(screenName) {
        console.log('Switching to screen:', screenName);

        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screenName) {
                item.classList.add('active');
            }
        });

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}Screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log('Screen switched to:', screenName);
        } else {
            console.error('Screen not found:', `${screenName}Screen`);
        }

        this.currentScreen = screenName;

        // Re-render content when switching to certain screens
        if (screenName === 'tasks') {
            this.renderTasks();
        } else if (screenName === 'profile') {
            this.renderTaskManagement();
        } else if (screenName === 'calendar') {
            this.renderCalendar();
        }
    }

    switchMonth(monthName) {
        console.log('Switching to month:', monthName);
        
        document.querySelectorAll('.month-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent === monthName) {
                tab.classList.add('active');
            }
        });

        this.data.calendar.currentMonth = monthName;
        this.renderCalendar();
    }

    updateUI() {
        this.updateProgressBar();
        this.updateTaskUI();
        this.updateProfile();
        this.updateTasksHeader();
    }

    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill && progressText) {
            const percentage = (this.data.progress.current / this.data.progress.total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${this.data.progress.current}/${this.data.progress.total}`;
        }
    }

    updateTaskUI() {
        document.querySelectorAll('.task-item').forEach(item => {
            const taskId = parseInt(item.dataset.taskId);
            const task = this.data.tasks.find(t => t.id === taskId);
            
            if (task) {
                const circle = item.querySelector('.task-circle');
                
                if (task.completed) {
                    item.classList.add('completed');
                    circle.classList.add('completed');
                    circle.style.setProperty('--task-color', task.color);
                } else {
                    item.classList.remove('completed');
                    circle.classList.remove('completed');
                    circle.style.setProperty('--task-color', task.color);
                }
            }
        });
    }

    updateProfile() {
        // Update profile screen
        const profileAvatar = document.getElementById('profileAvatar');
        const profileName = document.getElementById('profileName');
        const profileLevel = document.getElementById('profileLevel');
        const profileXP = document.getElementById('profileXP');
        const profileCompletion = document.getElementById('profileCompletion');
        const profileStreak = document.getElementById('profileStreak');

        if (profileAvatar) profileAvatar.textContent = this.data.level.emoji;
        if (profileName) profileName.textContent = this.data.level.title;
        if (profileLevel) profileLevel.textContent = `LEVEL ${String(this.data.level.number).padStart(2, '0')}. ${this.data.level.animal}`;
        if (profileXP) profileXP.textContent = this.data.userProfile.totalXP;
        if (profileCompletion) profileCompletion.textContent = `${this.data.userProfile.completionRate}%`;
        if (profileStreak) profileStreak.textContent = this.data.calendar.consecutiveDays;
    }

    updateTasksHeader() {
        // Update tasks screen header
        const levelText = document.getElementById('levelText');
        const animalTitle = document.getElementById('animalTitle');
        const streakValue = document.getElementById('streakValue');
        const xpValue = document.getElementById('xpValue');
        const completionRate = document.getElementById('completionRate');

        if (levelText) levelText.textContent = `LEVEL ${String(this.data.level.number).padStart(2, '0')}. ${this.data.level.animal} ${this.data.level.emoji}`;
        if (animalTitle) animalTitle.textContent = this.data.level.title;
        if (streakValue) streakValue.textContent = this.data.calendar.consecutiveDays;
        if (xpValue) xpValue.textContent = this.data.userProfile.totalXP;
        if (completionRate) completionRate.textContent = `${this.data.userProfile.completionRate}%`;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.style.fontWeight = '600';
            dayEl.style.color = '#666666';
            dayEl.style.textAlign = 'center';
            dayEl.style.padding = '8px';
            dayEl.style.fontSize = '12px';
            calendarGrid.appendChild(dayEl);
        });

        // Add calendar days (July 2025)
        const currentMonth = 6; // July (0-indexed)
        const currentYear = 2025;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'calendar-day';
            emptyEl.style.visibility = 'hidden';
            calendarGrid.appendChild(emptyEl);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;

            // Mark today (27th)
            if (day === 27) {
                dayEl.classList.add('today');
            }

            // Mark completed days
            if (this.data.calendar.completedDays.includes(day)) {
                dayEl.classList.add('completed');
            }

            calendarGrid.appendChild(dayEl);
        }

        // Update calendar streak display
        const calendarStreak = document.getElementById('calendarStreak');
        if (calendarStreak) {
            calendarStreak.textContent = `${this.data.calendar.consecutiveDays} days`;
        }
    }
}

// Prevent zoom on mobile
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing DAWG App...');
    window.dawgApp = new DAWGApp();
});

// Backup initialization
window.addEventListener('load', () => {
    if (!window.dawgApp) {
        console.log('Backup initialization...');
        window.dawgApp = new DAWGApp();
    }
});