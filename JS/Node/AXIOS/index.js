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
//getRandomJoke();
//getSpecificJoke(10);
getJokeByType("Poes");
