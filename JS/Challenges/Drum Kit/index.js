let buttons = document.querySelectorAll(".drum");
let soundDir = "sounds/";
//let kickBass = new Audio(soundDir + "kick-bass.mp3");
//kickBass.play();

for (let button of buttons) {
  button.addEventListener("click", function () {
    let buttonInnerHTML = this.innerHTML;
    switch (buttonInnerHTML) {
      case "w":
        let tom1 = new Audio(soundDir + "tom-1.mp3");
        tom1.play();
        break;

      case "a":
        let tom2 = new Audio(soundDir + "tom-2.mp3");
        tom2.play();
        break;

      case "s":
        let tom3 = new Audio(soundDir + "tom-3.mp3");
        tom3.play();
        break;

      case "d":
        let tom4 = new Audio(soundDir + "tom-4.mp3");
        tom4.play();
        break;

      case "j":
        let kickBass = new Audio(soundDir + "kick-bass.mp3");
        kickBass.play();
        break;

      case "k":
        let snare = new Audio(soundDir + "snare.mp3");
        snare.play();
        break;

      case "l":
        let crash = new Audio(soundDir + "crash.mp3");
        crash.play();
        break;

      default:
        console.log(buttonInnerHTML);
    }
  });
}

document.addEventListener("keypress", function (event) {
  switch (event.key) {
    case "w":
      let tom1 = new Audio(soundDir + "tom-1.mp3");
      tom1.play();
      break;

    case "a":
      let tom2 = new Audio(soundDir + "tom-2.mp3");
      tom2.play();
      break;

    case "s":
      let tom3 = new Audio(soundDir + "tom-3.mp3");
      tom3.play();
      break;

    case "d":
      let tom4 = new Audio(soundDir + "tom-4.mp3");
      tom4.play();
      break;

    case "j":
      let kickBass = new Audio(soundDir + "kick-bass.mp3");
      kickBass.play();
      break;

    case "k":
      let snare = new Audio(soundDir + "snare.mp3");
      snare.play();
      break;

    case "l":
      let crash = new Audio(soundDir + "crash.mp3");
      crash.play();
      break;

    default:
      console.log(event.key);
  }

  let actionButton = document.querySelector("." + event.key);
  actionButton.classList.add("pressed");
  setTimeout(function () {
    actionButton.classList.remove("pressed");
  }, 50);
});
