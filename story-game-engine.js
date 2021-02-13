// GameEngineAtor!

/*
Wouldn't it be nice to be able to easily make stupid narrative games?

Yes, yes it would.

We need scenes. We need characters. We need conversation.

But how?
*/

const gameLogic = {
  title: "Mr. Murraud's Happiest Day",
  beats: {
    TOOK_EGG: false,
  },
  initialScene: 'house',
  scenes: {
    // Kids enter stage right. Mr Murraud is sitting in his chair smoking a pipe.
    // "Hello?" says Imogen tentatively.
    // "Ah, children!" says Mr Murraud, "I've been expecting you!"
    // "Us?" says Ira. "Why? Do we know you?"
    // "Nope. But I have something for you."
    // Mr Murraud reaches out a small box.
    // [1.TAKE BOX] [2.ASK WHAT IT IS]
    // 1 => Imogen takes the box. Inside is a shiny golden egg.
    // 2 => "Mmmm.. What is it first?" asks Imogen.
    // "A treat! A delight! An enthralling yet amazing present from me to you! It'll change your life. You MUST take it."
    // [1.TAKE BOX]
    house: {
      bg: ["house.png", "door.png", "desk.png"], // ordered by z-index (farthest to nearest)
      enter: async (game) => {
        const RIGHT = 400;
        const mrMurraud = new Character({ game, name: 'Mr. Murraud 👴🏽' })
        const imogen = new Character({ game, name: 'Imogen 👧🏻' })
        const ira = new Character({ game, name: 'Ira 👦🏻' })

        mrMurraud.animate("rocking-chair", 10).forever();
        imogen
          .animate("walk-left", 10 /*speed*/)
          .from(RIGHT)
          .to(RIGHT - 100);

        game.wait(1);

        ira
          .animate("walk-left", 10 /*speed*/)
          .from(RIGHT)
          .to(RIGHT - 80);

        if (!gameLogic.beats.TOOK_EGG) {
          imogen.say("...Hello?");
          mrMurraud.say("Ah, children! I've been expecting you!");
          ira.say("Us? Why do we know you?");
          mrMurraud.say("Ahahaha, no. But I have something for you.");

          const choices = {
            "TAKE BOX": async () => {
              game.say("Imogen takes the box. Inside is a shiny golden egg!");
              game.inventory.add('egg');
              gameLogic.beats.TOOK_EGG = true;
              mrMurraud.say("Ahhhh excellent.");
              game.say("The egg suddenly splits open --");
              game.say("-- and inside is the universe.");

              //goTo(scenes.universe);
            },
            "ASK WHAT IT IS": () => {
              imogen.say("Mmmm.. What is it first?");
              mrMurraud.say(
                "A treat! A delight! An enthralling yet amazing present from me to you! It'll change your life. You MUST take it."
              );
              game.buttons({ "TAKE BOX": choices["TAKE BOX"] });
            },
          };

          game.buttons(choices);
        }
      },
      universe: {},
    },
  },
};

class Game {
  constructor(game) {
    this.queue = []
    this.game = game
    this.inventory = new Inventory()
  }

  async start() {
    const scene = this.game.initialScene
    this.game.scenes[scene].enter(this)
    
    while(true) {
      const step = this.queue[0]
      if(step) {
        try {
          await step()
          this.queue.shift()
        } catch(e) {
          if(e) console.log("ERROR", e)
          // repeat step if we rejected
        }
      } else {
        this.done()
      }
    }
  }

  async wait(time) {
    this.queue.push(()=> new Promise((resolve) => {
      setTimeout(() => {
        return resolve()
      }, time * 1000)
    }))
  }
}

class TerminalGame extends Game {
  constructor(game) {
    super(game)

    const readline = require("readline");
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  done() {
    this.rl.close()
    process.exit(0)
  }

  async say(words) {
    this.queue.push(async () => {
      console.log(`///    ${words}    ///`)
    })
    this.wait(1)
  }

  buttons(choices) {
    this.queue.push(async () => {
      const p = new Promise((resolve, reject) => {
        const btns = Object.keys(choices).join('  -  ')
        this.rl.question(btns + ' ', function(choice) {
          if(choices[choice]) {
            return resolve(choices[choice]())
          } else
            return reject()
        })
      })

      return p
    })
  }
}

class Inventory {
  constructor() {
    this.inventory = []
  }

  add(item) {
  }
}

class Character {
  constructor({ game, name, animations = [] }) {
    this.game = game;
    this.name = name;
    this.animations = animations;
  }

  animate(animation, speed = 5) {
    return new Animation()
  }

  async say(words) {
    this.game.queue.push(async () => {
      console.log(`${this.name}: ${words}`)
    })
    this.game.wait(.5)
  }
}

class Animation {
  tick() {
    // figure out next pixel from `from` to `to`
    if (this.from == this.to) return false;
    else if (this.from > this.to) move(-1)
    else move(+1)
  }

  from() { return this }

  to() { return this }

  forever() { return this }
}

(new TerminalGame(gameLogic)).start()