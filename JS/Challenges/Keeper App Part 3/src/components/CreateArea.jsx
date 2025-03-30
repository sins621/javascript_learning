import React, { useState } from "react";

function CreateArea(props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div>
      <form>
        <input
          name="title"
          placeholder="Title"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          value={title}
        />
        <textarea
          name="content"
          placeholder="Take a note..."
          rows="3"
          onChange={(event) => {
            setContent(event.target.value);
          }}
          value={content}
        />
        <button
          onClick={(event) => {
            event.preventDefault();
            props.addNote(title, content);
          }}
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default CreateArea;
