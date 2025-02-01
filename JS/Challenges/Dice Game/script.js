function randomNumber() {
  return Math.floor(Math.random() * 6 + 1);
}

let img1Number = randomNumber();
let img2Number = randomNumber();
let img1 = document.querySelector(".img1");
let img2 = document.querySelector(".img2");
img1.setAttribute("src", "images/dice" + img1Number + ".png");
img2.setAttribute("src", "images/dice" + img2Number + ".png");

let title = document.querySelector("h1");

if (img1Number == img2Number) {
  title.textContent = "Draw!";
} else if (img1Number > img2Number) {
  title.textContent = "Player 1 Wins!";
} else {
  title.textContent = "Player 2 Wins!";
}
