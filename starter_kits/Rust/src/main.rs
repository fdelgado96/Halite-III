extern crate rand;

use hlt::command::Command;
use hlt::direction::Direction;
use hlt::game::Game;
use rand::Rng;
use rand::SeedableRng;
use rand::XorShiftRng;
use std::env;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

mod hlt;

fn main() {
    let args: Vec<String> = env::args().collect();
    let rng_seed: u64 = if args.len() > 1 {
        args[1].parse().unwrap()
    } else {
        SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
    };
    let seed_bytes: Vec<u8> = (0..16).map(|x| ((rng_seed >> (x % 8)) & 0xFF) as u8).collect();
    let mut rng: XorShiftRng = SeedableRng::from_seed([
        seed_bytes[0], seed_bytes[1], seed_bytes[2], seed_bytes[3],
        seed_bytes[4], seed_bytes[5], seed_bytes[6], seed_bytes[7],
        seed_bytes[8], seed_bytes[9], seed_bytes[10], seed_bytes[11],
        seed_bytes[12], seed_bytes[13], seed_bytes[14], seed_bytes[15]
    ]);

    let mut game = Game::new();
    Game::ready("MyRustBot");

    game.log.borrow_mut().log(&format!("Successfully created bot! My Player ID is {}. Bot rng seed is {}.", game.my_id.0, rng_seed));

    loop {
        game.update_frame();
        let me = game.me.borrow();
        let game_map = game.game_map.borrow();

        let mut command_queue: Vec<Command> = Vec::new();

        for ship in &me.ships {
            let ship = ship.1;
            let cell = game_map.at_entity(&**ship);

            let command = if cell.borrow().halite < game.constants.max_halite / 10 || ship.is_full() {
                let random_direction = Direction::get_all_cardinals()[rng.gen_range(0, 4)];
                ship.move_ship(random_direction)
            } else {
                ship.stay_still()
            };
            command_queue.push(command);
        }

        let shipyard_cell = game_map.at_entity(&*me.shipyard);

        if
            game.turn_number <= 200 &&
            me.halite >= game.constants.ship_cost &&
            !shipyard_cell.borrow().is_occupied()
        {
            command_queue.push(me.shipyard.spawn());
        }


        Game::end_turn(&command_queue);
    }
}