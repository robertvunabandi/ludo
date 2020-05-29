class RemoveGameFromRolls < ActiveRecord::Migration[6.0]
  def change
    remove_reference :rolls, :game, null: false, foreign_key: true
  end
end
