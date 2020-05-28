class CreateTurns < ActiveRecord::Migration[6.0]
  def change
    create_table :turns do |t|
      t.references :game, null: false, foreign_key: true
      t.integer :turn
    end
  end
end
