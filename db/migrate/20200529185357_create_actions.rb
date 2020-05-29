class CreateActions < ActiveRecord::Migration[6.0]
  def change
    create_table :actions do |t|
      t.references :game, null: false, foreign_key: true
      t.integer :turn
      t.integer :roll
      t.integer :action
      t.integer :piece
    end
  end
end
