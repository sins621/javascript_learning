import axios from "axios";

const url = "http://localhost:5000";

async function getRandomJoke() {
  try {
    const response = await axios.get(url + "/random");
    console.log(response.data.jokeText);
  } catch (error) {
    console.error(error);
  }
}

async function getSpecificJoke(id) {
  try {
    const response = await axios.get(url + "/get", {
      params: {
        id: id,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function getJokeByType(jokeType) {
  try {
    const response = await axios.get(url + "/filter", {
      params: {
        jokeType: jokeType,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function addNewJoke(jokeText, jokeType) {
  try {
    const response = await axios.post(url + "/new", {
      jokeText: jokeText,
      jokeType: jokeType,
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function putJoke(id, jokeText, jokeType) {
  try {
    const response = await axios.put(url + "/put", {
      id: id,
      jokeText: jokeText,
      jokeType: jokeType,
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function patchJoke(id, jokeText, jokeType) {
  try {
    const response = await axios.patch(url + "/patch", {
      id: id,
      jokeType: jokeType,
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function deleteJoke(id) {
  try {
    const response = await axios.delete(url + "/delete", {
      params: {
        id: id,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function deleteAll() {
  try {
    const response = await axios.delete(url + "/deleteAll");
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

deleteAll();
getRandomJoke();


// patchJoke(1, "Dumb Joke", "Dumb Joke");
