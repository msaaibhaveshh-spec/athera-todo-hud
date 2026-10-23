import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('athera_user');
    return saved ? JSON.parse(saved) : { name: '', dob: '', gender: '' };
  });

  const [isRegistered, setIsRegistered] = useState(() => {
    return localStorage.getItem('athera_registered') === 'true';
  });

  const [activeTab, setActiveTab] = useState('tasks');

  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem('athera_xp');
    return saved ? parseInt(saved) : 45;
  });
  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  const [boss, setBoss] = useState(() => {
    const saved = localStorage.getItem('athera_boss');
    return saved ? JSON.parse(saved) : { name: '🐉 Hackathon & Exam Titan', maxHp: 100, hp: 100 };
  });

  const [timeLeft, setTimeLeft] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('athera_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Study Python Architecture & Flask Routing', category: 'Studies', difficulty: 'Hard', completed: false, deadline: '23:59', time: 'Today' },
      { id: 2, text: 'Vehicle maintenance and oil check', category: 'Vehicles', difficulty: 'Medium', completed: true, deadline: '18:00', time: 'Today' }
    ];
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('athera_notes');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Project Roadmap', content: 'Complete HUD integration with hand gesture backend by Friday.', time: 'Today' }
    ];
  });

  const [taskInput, setTaskInput] = useState('');
  const [taskCategory, setTaskCategory] = useState('Studies');
  const [taskDifficulty, setTaskDifficulty] = useState('Medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('athera_streak');
    return saved ? parseInt(saved) : 3;
  });

  const [dailyHistory, setDailyHistory] = useState(() => {
    const saved = localStorage.getItem('athera_history');
    return saved ? JSON.parse(saved) : { yesterday: 4, today: 0 };
  });

  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('athera_user', JSON.stringify(userData));
    localStorage.setItem('athera_registered', isRegistered);
    localStorage.setItem('athera_tasks', JSON.stringify(tasks));
    localStorage.setItem('athera_notes', JSON.stringify(notes));
    localStorage.setItem('athera_streak', streak.toString());
    localStorage.setItem('athera_history', JSON.stringify(dailyHistory));
    localStorage.setItem('athera_xp', xp.toString());
    localStorage.setItem('athera_boss', JSON.stringify(boss));
  }, [userData, isRegistered, tasks, notes, streak, dailyHistory, xp, boss]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      tasks.forEach(t => {
        if (!t.completed && t.deadline === currentTime) {
          setAlertMessage(`🚨 DEADLINE ALERT: "${t.text}" (${t.category}) is due right now!`);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setXp(prev => prev + 50);
      setAlertMessage('🎉 Focus Session Completed! You earned +50 XP!');
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const exportData = () => {
    const backupData = { userData, isRegistered, tasks, notes, streak, dailyHistory, xp, boss };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athera_hud_backup_${userData.name || 'operator'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setAlertMessage('✅ Data successfully exported as JSON backup!');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.userData) setUserData(imported.userData);
        if (imported.isRegistered !== undefined) setIsRegistered(imported.isRegistered);
        if (imported.tasks) setTasks(imported.tasks);
        if (imported.notes) setNotes(imported.notes);
        if (imported.streak) setStreak(imported.streak);
        if (imported.dailyHistory) setDailyHistory(imported.dailyHistory);
        if (imported.xp) setXp(imported.xp);
        if (imported.boss) setBoss(imported.boss);
        setAlertMessage('✅ Backup successfully restored!');
      } catch (err) {
        setAlertMessage('❌ Failed to import backup. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (userData.name && userData.dob && userData.gender) {
      setIsRegistered(true);
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    const newTask = {
      id: Date.now(),
      text: taskInput.trim(),
      category: taskCategory,
      difficulty: taskDifficulty,
      completed: false,
      deadline: taskDeadline || '23:59',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTasks([newTask, ...tasks]);
    setTaskInput('');
    setTaskDeadline('');
    setStreak(prev => prev + 1);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        let xpGained = t.difficulty === 'Easy' ? 15 : t.difficulty === 'Medium' ? 30 : 50;

        if (nextCompleted) {
          setDailyHistory(prev => ({ ...prev, today: prev.today + 1 }));
          setXp(prev => prev + xpGained);
          setBoss(b => ({ ...b, hp: Math.max(0, b.hp - 20) }));
        } else {
          setDailyHistory(prev => ({ ...prev, today: Math.max(0, prev.today - 1) }));
          setXp(prev => Math.max(0, prev - xpGained));
          setBoss(b => ({ ...b, hp: Math.min(b.maxHp, b.hp + 20) }));
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    }));
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const addNote = (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setNotes([{ id: Date.now(), title: noteTitle.trim(), content: noteContent.trim(), time: new Date().toLocaleDateString() }, ...notes]);
    setNoteTitle('');
    setNoteContent('');
  };

  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const categories = ['All', 'Food', 'Studies', 'Home', 'Personal Work', 'Family Work', 'Vehicles'];
  const filteredTasks = tasks.filter(t => selectedCategory === 'All' || t.category === selectedCategory);

  const yesterdayCount = dailyHistory.yesterday || 1;
  const efficiencyPercentage = Math.round((dailyHistory.today / yesterdayCount) * 100);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <div className="hud-card">
        <div className="branding-header">
          <div className="club-tag">⚡ ATHERARx // PHOENIXCODEZ ⚡</div>
          <h1 className="main-title">STRIKE-LIST HUD</h1>
          <div className="designer-tag">Designed by Saai Bhavesh</div>
        </div>

        {!isRegistered ? (
          <form onSubmit={handleRegister}>
            <div className="storage-badge"><span className="storage-dot"></span> Secure System Initialization</div>
            <div className="form-group">
              <label>Operator Name</label>
              <input type="text" className="form-input" placeholder="Enter your name..." value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" className="form-input" value={userData.dob} onChange={(e) => setUserData({ ...userData, dob: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Gender Profile</label>
              <select className="form-select" value={userData.gender} onChange={(e) => setUserData({ ...userData, gender: e.target.value })} required>
                <option value="">Select Profile</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button type="submit" className="cyber-btn" style={{ marginTop: '0.5rem' }}>Initialize Terminal</button>
          </form>
        ) : (
          <div>
            <div className="storage-badge">
              <span className="storage-dot"></span> Operator: {userData.name} | Local Storage Active
            </div>

            <div className="rpg-status-bar">
              <div className="rpg-info">
                <h4>🛡️ RANK {level} OPERATOR</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--silver)' }}>XP: {xp} total ({xpProgress}/100 to next rank)</div>
              </div>
              <div className="rpg-xp-bar-container">
                <div className="rpg-xp-fill" style={{ width: `${xpProgress}%` }}></div>
              </div>
            </div>

            {alertMessage && (
              <div className="alert-banner">
                <span>{alertMessage}</span>
                <button onClick={() => setAlertMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✖</button>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">Total</div>
                <div className="stat-value">{tasks.length}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Pending</div>
                <div className="stat-value">{tasks.filter(t => !t.completed).length}</div>
              </div>
              <div className="stat-box streak">
                <div className="stat-label">Streak 🔥</div>
                <div className="stat-value">{streak} Days</div>
              </div>
              <div className="stat-box efficiency">
                <div className="stat-label">Efficiency 🚀</div>
                <div className="stat-value">{efficiencyPercentage}%</div>
              </div>
            </div>

            <div className="nav-section-tabs">
              <button className={`nav-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>📋 Protocols</button>
              <button className={`nav-tab-btn ${activeTab === 'boss' ? 'active' : ''}`} onClick={() => setActiveTab('boss')}>🐉 Boss Battle</button>
              <button className={`nav-tab-btn ${activeTab === 'pomodoro' ? 'active' : ''}`} onClick={() => setActiveTab('pomodoro')}>⏳ Pomodoro</button>
              <button className={`nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>📝 Notes</button>
              <button className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analytics & Backup</button>
            </div>

            {activeTab === 'tasks' && (
              <div>
                <form onSubmit={addTask} className="task-input-section">
                  <input type="text" className="form-input" placeholder="Enter protocol..." value={taskInput} onChange={(e) => setTaskInput(e.target.value)} required />
                  <select className="form-select" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}>
                    <option value="Food">🍔 Food</option>
                    <option value="Studies">📚 Studies</option>
                    <option value="Home">🏠 Home</option>
                    <option value="Personal Work">💻 Personal</option>
                    <option value="Family Work">👨‍👩‍👧 Family</option>
                    <option value="Vehicles">🚗 Vehicles</option>
                  </select>
                  <select className="form-select" value={taskDifficulty} onChange={(e) => setTaskDifficulty(e.target.value)}>
                    <option value="Easy">Easy (15XP)</option>
                    <option value="Medium">Med (30XP)</option>
                    <option value="Hard">Hard (50XP)</option>
                  </select>
                  <input type="time" className="form-input" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} title="Deadline Alarm" />
                  <button type="submit" className="task-submit-btn">+ Add</button>
                </form>

                <div className="category-chips">
                  {categories.map(cat => (
                    <button key={cat} className={`chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                  ))}
                </div>

                <ul className="task-list">
                  {filteredTasks.map(task => (
                    <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                      <div className="task-content" onClick={() => toggleTask(task.id)}>
                        <input type="checkbox" className="task-checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                        <div>
                          <div className="task-text">{task.text}</div>
                          <div className="task-meta-info">
                            <span className="badge-cat">[{task.category}]</span>
                            <span className={`badge-diff-${task.difficulty}`}>{task.difficulty}</span>
                            <span>Alarm: {task.deadline}</span>
                          </div>
                        </div>
                      </div>
                      <button className="task-delete-btn" onClick={() => deleteTask(task.id)}>🗑️</button>
                    </li>
                  ))}
                  {filteredTasks.length === 0 && <div className="empty-state">No protocols recorded under [{selectedCategory}].</div>}
                </ul>
              </div>
            )}

            {activeTab === 'boss' && (
              <div className="boss-arena">
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--red)' }}>{boss.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--silver)', margin: '0 0 10px 0' }}>Complete tasks to damage the boss and claim victory!</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  <span>Boss HP</span>
                  <span>{boss.hp} / {boss.maxHp} HP</span>
                </div>
                <div className="boss-hp-bar">
                  <div className="boss-hp-fill" style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}></div>
                </div>
                {boss.hp <= 0 && (
                  <div style={{ marginTop: '1rem', color: 'var(--gold)', fontWeight: 'bold' }}>
                    🏆 BOSS DEFEATED! +100 Bonus XP Awarded!
                    <button className="cyber-btn" style={{ marginTop: '10px' }} onClick={() => setBoss({ name: '🐉 Code Vortex Overlord', maxHp: 150, hp: 150 })}>Spawn Next Boss</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pomodoro' && (
              <div className="pomodoro-container">
                <h3 style={{ margin: 0, color: 'var(--blue)' }}>⏳ FOCUS TIMER</h3>
                <div className="pomodoro-timer-display">{formatTime(timeLeft)}</div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="cyber-btn" style={{ width: '120px' }} onClick={() => setIsTimerRunning(!isTimerRunning)}>
                    {isTimerRunning ? 'Pause' : 'Start Focus'}
                  </button>
                  <button className="cyber-btn" style={{ width: '120px', background: 'rgba(255,51,75,0.2)', color: 'var(--red)', border: '1px solid var(--red)' }} onClick={() => { setIsTimerRunning(false); setTimeLeft(1500); }}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="notes-container">
                <form onSubmit={addNote} className="notes-editor">
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--gold)' }}>Quick Note Maker</h4>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <input type="text" className="form-input" placeholder="Title..." value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <textarea className="form-textarea" rows="3" placeholder="Notes..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} required></textarea>
                  </div>
                  <button type="submit" className="cyber-btn" style={{ fontSize: '0.85rem', padding: '0.7rem' }}>Save Note</button>
                </form>
                <div className="notes-grid">
                  {notes.map(note => (
                    <div key={note.id} className="note-card">
                      <button onClick={() => deleteNote(note.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>×</button>
                      <h4>{note.title}</h4>
                      <p>{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <div className="empty-state" style={{ padding: '1rem' }}>No notes saved.</div>}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="stat-box" style={{ textAlign: 'left', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--gold)' }}>📊 Pattern Intelligence & Data Security</h3>
                <p style={{ fontSize: '0.9rem', margin: '5px 0' }}>• <b>Yesterday Completed:</b> {dailyHistory.yesterday} protocols</p>
                <p style={{ fontSize: '0.9rem', margin: '5px 0' }}>• <b>Today Completed:</b> {dailyHistory.today} protocols</p>
                <p style={{ fontSize: '0.9rem', margin: '5px 0' }}>• <b>Efficiency Index:</b> {efficiencyPercentage}% compared to previous day.</p>
                
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="cyber-btn" style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', width: 'auto' }} onClick={exportData}>📥 Export Backup</button>
                  <label className="cyber-btn" style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', width: 'auto', textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, var(--blue) 0%, #0077ff 100%)', color: '#07080a' }}>
                    📤 Restore Backup
                    <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
                  </label>
                  <button 
                    className="cyber-btn" 
                    style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', width: 'auto', background: 'rgba(255,51,75,0.2)', color: 'var(--red)', border: '1px solid var(--red)' }}
                    onClick={() => {
                      localStorage.clear();
                      setIsRegistered(false);
                      setUserData({ name: '', dob: '', gender: '' });
                    }}
                  >
                    🔄 Reset Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}