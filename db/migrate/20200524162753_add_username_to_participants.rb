class AddUsernameToParticipants < ActiveRecord::Migration[6.0]
  def change
    add_column :participants, :username, :string
  end
end
