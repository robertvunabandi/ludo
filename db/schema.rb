# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2020_05_29_191352) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "actions", force: :cascade do |t|
    t.integer "roll"
    t.integer "action"
    t.integer "piece"
    t.bigint "turn_id", null: false
    t.index ["turn_id"], name: "index_actions_on_turn_id"
  end

  create_table "games", force: :cascade do |t|
    t.integer "status"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "participants", force: :cascade do |t|
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "username"
  end

  create_table "players", force: :cascade do |t|
    t.bigint "game_id", null: false
    t.bigint "participant_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["game_id"], name: "index_players_on_game_id"
    t.index ["participant_id"], name: "index_players_on_participant_id"
  end

  create_table "rolls", force: :cascade do |t|
    t.integer "roll_hint"
    t.bigint "turn_id", null: false
    t.index ["turn_id"], name: "index_rolls_on_turn_id"
  end

  create_table "rules", force: :cascade do |t|
    t.bigint "game_id", null: false
    t.string "name"
    t.integer "value"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["game_id"], name: "index_rules_on_game_id"
  end

  create_table "turns", force: :cascade do |t|
    t.bigint "game_id", null: false
    t.integer "turn"
    t.index ["game_id"], name: "index_turns_on_game_id"
  end

  add_foreign_key "actions", "turns"
  add_foreign_key "players", "games"
  add_foreign_key "players", "participants"
  add_foreign_key "rolls", "turns"
  add_foreign_key "rules", "games"
  add_foreign_key "turns", "games"
end
