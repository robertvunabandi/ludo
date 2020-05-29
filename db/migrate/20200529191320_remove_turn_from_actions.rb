class RemoveTurnFromActions < ActiveRecord::Migration[6.0]
  def change
    remove_column :actions, :turn, :integer
  end
end
