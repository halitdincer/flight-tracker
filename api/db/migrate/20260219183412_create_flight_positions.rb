class CreateFlightPositions < ActiveRecord::Migration[7.2]
  def change
    create_table :flight_positions do |t|
      t.references :flight, null: false, foreign_key: true
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false
      t.decimal :altitude, precision: 10, scale: 2
      t.decimal :velocity, precision: 8, scale: 2
      t.decimal :heading, precision: 6, scale: 2
      t.decimal :vertical_rate, precision: 8, scale: 2
      t.boolean :on_ground, default: false
      t.datetime :recorded_at, null: false

      t.timestamps
    end

    add_index :flight_positions, [:flight_id, :recorded_at]
    add_index :flight_positions, :recorded_at
  end
end
