#ifndef HALITE_SNAPSHOT_HPP
#define HALITE_SNAPSHOT_HPP

#include <string>
#include <unordered_map>
#include <utility>
#include "Player.hpp"
#include "SnapshotError.hpp"
#include "Generator.hpp"

namespace hlt {

struct PlayerSnapshot {
    std::vector<Location> factories;
    energy_type energy;
    std::vector<std::pair<Location, energy_type>> entities;
};

struct Snapshot {
    mapgen::MapParameters map_param{};
    std::unordered_map<Player::id_type, PlayerSnapshot> players;

    static Snapshot from_str(const std::string &snapshot);

    /**
     * Create snapshot from parameters
     */
    Snapshot(mapgen::MapParameters map_param,
             std::unordered_map<Player::id_type, PlayerSnapshot> players) :
            map_param{map_param}, players{std::move(players)} {}

    Snapshot() = default;

    /**
     * Default destructor for class
     */
    ~Snapshot() = default;
};

}

#endif //HALITE_REPLAY_HPP