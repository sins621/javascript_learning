import React, { useState } from "react";

function App() {

  let [counter, increaseCounter] = useState(0);

  function increase (){
    increaseCounter(counter + 1);
  }

  return (
    <div>
      <h1>{counter}</h1>
      <button onClick={increase}>Get Time</button>;
    </div>
  )
}

export default App;
