import React, { useState } from "react";

function App() {
  const [heading, setHeadingText] = useState("Hello");

  const [bgColor, setBgColor] = useState("white");

  const [name, setName] = useState("");

  function handleClick() {
    setHeadingText(`Hello ${name}`);
  }

  function handleMouseOver() {
    setBgColor("black");
  }

  function handleMouseOut() {
    setBgColor("white");
  }

  function handleChange(event) {
    setName(event.target.value);
  }

  return (
    <div className="container">
      <h1>{heading}</h1>
      <input
        onChange={handleChange}
        value={name}
        type="text"
        placeholder="What's your name?"
      />
      <button
        style={{ backgroundColor: bgColor }}
        onMouseOut={handleMouseOut}
        onMouseOver={handleMouseOver}
        onClick={handleClick}
      >
        Submit
      </button>
    </div>
  );
}

export default App;
