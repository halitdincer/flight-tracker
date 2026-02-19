# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_02_19_183415) do
  create_table "daily_statistics", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.date "date", null: false
    t.integer "total_flights", default: 0
    t.integer "unique_aircraft", default: 0
    t.json "flights_by_country"
    t.decimal "avg_altitude", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_daily_statistics_on_date", unique: true
  end

  create_table "flight_positions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "flight_id", null: false
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.decimal "altitude", precision: 10, scale: 2
    t.decimal "velocity", precision: 8, scale: 2
    t.decimal "heading", precision: 6, scale: 2
    t.decimal "vertical_rate", precision: 8, scale: 2
    t.boolean "on_ground", default: false
    t.datetime "recorded_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["flight_id", "recorded_at"], name: "index_flight_positions_on_flight_id_and_recorded_at"
    t.index ["flight_id"], name: "index_flight_positions_on_flight_id"
    t.index ["recorded_at"], name: "index_flight_positions_on_recorded_at"
  end

  create_table "flights", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "icao24", null: false
    t.string "callsign"
    t.string "origin_country"
    t.datetime "first_seen_at"
    t.datetime "last_seen_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["callsign"], name: "index_flights_on_callsign"
    t.index ["icao24"], name: "index_flights_on_icao24", unique: true
    t.index ["last_seen_at"], name: "index_flights_on_last_seen_at"
    t.index ["origin_country"], name: "index_flights_on_origin_country"
  end

  add_foreign_key "flight_positions", "flights"
end
