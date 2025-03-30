import React, { useState } from "react";
import TodoItem from "./TodoItem";

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

  function deleteItem(id) {
    updateToDoItems((prev) => {
      return prev.filter((item, index) => {
        return index !== id;
      });
    });
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
          {toDoItems.map((todoItem, index) => {
            return (
              <TodoItem
                todoItem={todoItem}
                id={index}
                onChecked={deleteItem}
                key={index}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
