class RemoveTurnFromRolls < ActiveRecord::Migration[6.0]
  def change
    remove_column :rolls, :turn, :integer
  end
end
