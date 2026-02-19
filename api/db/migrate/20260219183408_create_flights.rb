class CreateFlights < ActiveRecord::Migration[7.2]
  def change
    create_table :flights do |t|
      t.string :icao24, null: false
      t.string :callsign
      t.string :origin_country
      t.datetime :first_seen_at
      t.datetime :last_seen_at

      t.timestamps
    end

    add_index :flights, :icao24, unique: true
    add_index :flights, :callsign
    add_index :flights, :origin_country
    add_index :flights, :last_seen_at
  end
end
