class RemoveGameFromActions < ActiveRecord::Migration[6.0]
  def change
    remove_reference :actions, :game, null: false, foreign_key: true
  end
end
