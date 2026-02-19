class CreateDailyStatistics < ActiveRecord::Migration[7.2]
  def change
    create_table :daily_statistics do |t|
      t.date :date, null: false
      t.integer :total_flights, default: 0
      t.integer :unique_aircraft, default: 0
      t.json :flights_by_country
      t.decimal :avg_altitude, precision: 10, scale: 2

      t.timestamps
    end

    add_index :daily_statistics, :date, unique: true
  end
end
