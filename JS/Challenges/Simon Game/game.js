function nextSequence(sequence) {
  const random = Math.floor(Math.random() * buttonColors.length);
  sequence.push(buttonColors[random]);
  var i = 0;
  level++;
  $("h1").text("Level " + level);

  function delayedOutput() {
    playSound(sequence[i]);
    flash($("." + sequence[i]));

    i++;

    if (i < sequence.length) {
      setTimeout(delayedOutput, 1000);
    }
  }

  delayedOutput();
}

function playSound(element_id) {
  audio[element_id].play();
}

function flash(element) {
  $(element).addClass("pressed");
  setTimeout(function () {
    $(element).removeClass("pressed");
  }, 30);
}

let level = 0;
let userClickedPattern = [];

const buttonColors = ["red", "blue", "green", "yellow"];
const audio = {};

buttonColors.forEach((color) => {
  audio[color] = new Audio(`sounds/${color}.mp3`);
});

let gamePattern = [];

const buttons = $(".btn");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

buttons.on("click", function (event) {
  flash(event.target);
  playSound(event.target.id);
  userClickedPattern.push(event.target.id);

  if (gamePattern.length === userClickedPattern.length) {
    let isCorrect = true;
    for (let i = 0; i < gamePattern.length; i++) {
      if (gamePattern[i] !== userClickedPattern[i]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      $("h1").text("Correct!");
      setTimeout(function () {
        nextSequence(gamePattern);
      }, 1000);
    } else {
      $("body").addClass("game-over");
      setTimeout(function () {
        $("body").removeClass("game-over");
      }, 30);
      gamePattern = [];
      level = 0;
      $("h1").text("Incorrect, press any button to try again");
    }
    userClickedPattern = [];
  }
});

$(document).keypress(function () {
  nextSequence(gamePattern);
});
