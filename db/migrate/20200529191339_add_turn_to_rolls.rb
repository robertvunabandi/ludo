class AddTurnToRolls < ActiveRecord::Migration[6.0]
  def change
    add_reference :rolls, :turn, null: false, foreign_key: true
  end
end
