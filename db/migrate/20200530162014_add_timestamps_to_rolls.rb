class AddTimestampsToRolls < ActiveRecord::Migration[6.0]
  def change
    add_column :rolls, :created_at, :datetime, null: false, precision: 6
    add_column :rolls, :updated_at, :datetime, null: false, precision: 6
  end
end
