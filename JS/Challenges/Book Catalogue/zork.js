// game.js (Main game logic)
import readline from 'readline/promises'; // Use promises for async input

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const player = {
  location: 'start',
  inventory: [],
};

const rooms = {
  start: {
    description: 'You are at the start of your adventure.  There is a path to the north and east.',
    exits: {
      north: 'forest',
      east: 'cave',
    },
    items: ['rusty key'],
  },
  forest: {
    description: 'You are in a dark forest.  The path continues south and west.',
    exits: {
      south: 'start',
      west: 'clearing',
    },
  },
  cave: {
    description: 'You are in a damp cave.  There is only one way out, west.',
    exits: {
      west: 'start',
    },
  },
  clearing: {
    description: 'You are in a small clearing.  You see a locked chest.',
    exits: {
      east: 'forest',
    },
    items: ['old chest'], // Add the chest here
  },
};

async function showRoom(roomName) {
  const room = rooms[roomName];
  console.log(room.description);

    if (room.items && room.items.length > 0) {
      console.log("You see the following items here:", room.items.join(", "));
    }

}


async function askForAction() {
  const action = await rl.question('What do you do? (e.g., go north, go east, take key, open chest)\n');
  return action.toLowerCase();
}

async function handleAction(action) {
  const parts = action.split(' ');
  const verb = parts[0];
  const noun = parts.length > 1 ? parts.slice(1).join(' ') : null;

  switch (verb) {
    case 'go':
      handleGo(noun);
      break;
    case 'take':
      handleTake(noun);
      break;
    case 'open':
      handleOpen(noun);
      break;
    case 'inventory':
      console.log("Your inventory:", player.inventory.join(", "));
      break;
    default:
      console.log('I don\'t understand that action.');
  }
}

async function handleGo(direction) {
  const currentRoom = rooms[player.location];
  if (currentRoom.exits[direction]) {
    player.location = currentRoom.exits[direction];
    await showRoom(player.location);
  } else {
    console.log('You can\'t go that way.');
  }
}

async function handleTake(item) {
  const currentRoom = rooms[player.location];
  const itemIndex = currentRoom.items.indexOf(item);

  if (itemIndex > -1) {
    player.inventory.push(item);
    currentRoom.items.splice(itemIndex, 1);
    console.log('You picked up the', item + '.');
  } else {
    console.log('You can\'t find that here.');
  }
}

async function handleOpen(item) {
    if (item === 'chest') {
        if (player.inventory.includes('rusty key')) {
            console.log("You unlock the chest with the rusty key! Congratulations, you win!");
            rl.close(); // End the game
        } else {
            console.log("The chest is locked. You need a key.");
        }
    } else {
        console.log("You can't open that.");
    }
}


async function gameLoop() {
  await showRoom(player.location);

  while (true) {
    const action = await askForAction();
    await handleAction(action);
  }
}

console.log('Welcome to the Adventure Game!');
gameLoop();