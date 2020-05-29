class AddTurnToActions < ActiveRecord::Migration[6.0]
  def change
    add_reference :actions, :turn, null: false, foreign_key: true
  end
end
