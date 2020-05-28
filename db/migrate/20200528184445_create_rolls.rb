class CreateRolls < ActiveRecord::Migration[6.0]
  def change
    create_table :rolls do |t|
      t.references :game, null: false, foreign_key: true
      t.integer :turn
      t.integer :roll_hint
    end
  end
end
