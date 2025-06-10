import React, { useState } from "react";

const mockTasks = [
  { id: 1, text: "Send rate confirmation", completed: false },
  { id: 2, text: "Upload POD for trip #234", completed: true },
];

function App() {
  const [tasks, setTasks] = useState(mockTasks);
  const [newTask, setNewTask] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
    setNewTask("");
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages([...messages, { text: newMsg, time: new Date().toLocaleTimeString() }]);
    setNewMsg("");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🧾 Trucking Assistant</h1>

      <section style={{ marginBottom: 40 }}>
        <h2>📋 Tasks</h2>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task..."
        />
        <button onClick={addTask}>Add</button>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <label style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                {task.text}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>💬 Chat</h2>
        <div
          style={{
            border: "1px solid #ccc",
            height: 200,
            overflowY: "scroll",
            padding: 10,
            marginBottom: 10,
            background: "#f9f9f9",
          }}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              <strong>[{msg.time}]</strong> {msg.text}
            </div>
          ))}
        </div>
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </section>
    </div>
  );
}

export default App;

