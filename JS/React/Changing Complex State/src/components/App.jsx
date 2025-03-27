import React, { useState } from "react";

function App() {
  const [contact, setContact] = useState({
    fName: "",
    lName: "",
    email: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setContact((prevObject) => {
      if (name === "fName") {
        return {
          fName: value,
          lName: prevObject.lName,
          email: prevObject.email,
        };
      } else if (name === "lName") {
        return {
          fName: prevObject.fName,
          lName: value,
          email: prevObject.email,
        };
      } else if (name === "email") {
        return {
          fName: prevObject.fName,
          lName: prevObject.lName,
          email: value,
        };
      }
    });
  }

  return (
    <div className="container">
      <h1>
        Hello {contact.fName} {contact.lName}
      </h1>
      <p>{contact.email}</p>
      <form>
        <input
          onChange={handleChange}
          value={contact.fName}
          name="fName"
          placeholder="First Name"
        />
        <input
          onChange={handleChange}
          value={contact.lName}
          name="lName"
          placeholder="Last Name"
        />
        <input
          onChange={handleChange}
          value={contact.email}
          name="email"
          placeholder="Email"
        />
        <button>Submit</button>
      </form>
    </div>
  );
}

export default App;

// switch (name) {
//   case "fName":
//     return {
//       fName: value,
//       lName: prevValue.lName,
//       email: prevValue.email,
//     };
//   case "lName":
//     return {
//       fName: prevValue.fName,
//       lName: value,
//       email: prevValue.email,
//     };
//   case "email":
//     return {
//       fName: prevValue.fName,
//       lName: prevValue.lName,
//       email: value,
//     };
//   default:
//     break;
// }
