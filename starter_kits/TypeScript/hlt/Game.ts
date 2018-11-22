import { Logging } from "./Logging";
import { GameMap } from "./GameMap";
import { Player } from "./Player";
import { Ship } from "./Ship";
import { Position } from "./Position";
import { Shipyard } from "./Shipyard";
import { Dropoff } from "./Dropoff";
import { ServerCommunication } from "./ServerCommunicaion";

export class Game {
    turnNumber: number = 0;
    server: ServerCommunication = new ServerCommunication();

    public myId: number = 0;
    public players = new Map<number, Player>();
    public me?: Player;
    public gameMap?: GameMap;

    /**
     * Initialize a game object collecting all the start-state
     * instances for pre-game. Also sets up a log file in
     * "bot-<bot_id>.log".
     * @returns The initialized gameMap and me so we don't have to check if undefined.
     */
    async initialize(): Promise<[GameMap, Player]> {
        const serverData = await this.server.getInitialData();
        this.myId = serverData.myId;

        Logging.setup(`bot-${this.myId}.log`);

        serverData.players.forEach(playerData => {
            const player = new Player(playerData.id, new Shipyard(playerData.id, -1, new Position(playerData.x, playerData.y)))
            this.players.set(player.id, player);
        });
        this.me = this.players.get(this.myId);

        this.gameMap = new GameMap(serverData.cells);

        return [<GameMap>this.gameMap, <Player>this.me]; // We cast here because we have just initialized
    }

    /**
     * Updates the game object's state.
     */
    async updateFrame() {
        const data = await this.server.getUpdateData(this.players.size);
        this.turnNumber = data.turn;
        Logging.info(`================ TURN ${this.turnNumber.toString().padStart(3, '0')} ================`);
        data.players.forEach(playerData => {
            const player = <Player>this.players.get(playerData.id);
            player.haliteAmount = playerData.halite;

            // Process ships
            const newShipsData = playerData.ships
                .filter(shipData => !player.hasShip(shipData.id));
            newShipsData.forEach(newShipData =>
                player.addShip(new Ship(player.id, newShipData.id, new Position(newShipData.x, newShipData.y), newShipData.halite)));

            const lostShips = player.getShips()
                .filter(ship => !playerData.ships.some(shipData => shipData.id === ship.id));
            lostShips.forEach(ship => player.loseShip(ship.id));

            player.getShips().forEach(ship => {
                const updatedShipData = playerData.ships
                    .find(shipData => ship.id === shipData.id);
                if (updatedShipData) {
                    [ship.haliteAmount, ship.position.x, ship.position.y] = [updatedShipData.halite, updatedShipData.x, updatedShipData.y];
                }
            });

            // Process dropoffs
            const newDropoffsData = playerData.dropoffs
                .filter(dropoffData => !player.dropoffs.has(dropoffData.id));
            newDropoffsData.forEach((newDropoffData: { id: number, x: number, y: number }) =>
                player.dropoffs.set(newDropoffData.id,
                    new Dropoff(player.id, newDropoffData.id, new Position(newDropoffData.x, newDropoffData.y))));

            const lostDropoffs = Array.from(player.dropoffs.values())
                .filter(dropoff => !playerData.dropoffs.some(dropoffData => dropoffData.id === dropoff.id));
            lostDropoffs.forEach(lostDropoff => {
                player.dropoffs.delete(lostDropoff.id);
                player.lostDropoffs.set(lostDropoff.id, lostDropoff);
            });
        });

        const gameMap = <GameMap>this.gameMap;
        // Mark all cells as safe
        gameMap.cells.forEach(row => row.forEach(cell => cell.markSafe()));
        // Update cells
        data.cells.forEach(cell => gameMap.get(new Position(cell.x, cell.y)).haliteAmount = cell.halite);
        // Mark cells with ships as unsafe for navigation, mark sturctures
        for (const player of this.players.values()) {
            player.getShips()
                .forEach(ship => gameMap.get(ship.position).markUnsafe(ship));
            player.getDropoffs()
                .forEach(dropoff => gameMap.get(dropoff.position).structure = dropoff);
        }
    }

    /** 
     * Indicate that your bot is ready to play by sending the bot name. 
     */
    async ready(botName: string) {
        await this.server.sendCommands([botName]);
    }

    /**
     * Send all commands to the game engine, effectively ending your
     * turn.
     */
    async endTurn(commands: string[]) {
        await this.server.sendCommands(commands);
    }
}

