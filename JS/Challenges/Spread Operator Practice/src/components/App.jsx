import React, { useState } from "react";

function App() {
  const [toDoItems, updateToDoItems] = useState([]);
  const [toDoInput, updateToDoInput] = useState("");

  function handleInput(event) {
    const { value } = event.target;
    updateToDoInput(value);
  }

  function handleAdd() {
    updateToDoItems((prev) => [...prev, toDoInput]);
    updateToDoInput("");
  }
  return (
    <div className="container">
      <div className="heading">
        <h1>To-Do List</h1>
      </div>
      <div className="form">
        <input
          onChange={handleInput}
          value={toDoInput}
          type="text"
          placeholder="Your next to do item."
        />
        <button onClick={handleAdd}>
          <span>Add</span>
        </button>
      </div>
      <div>
        <ul>
          {toDoItems.map((toDoItem) => (
            <li key={toDoItem}>{toDoItem}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
