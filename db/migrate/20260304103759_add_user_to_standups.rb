class AddUserToStandups < ActiveRecord::Migration[7.1]
  def change
    add_reference :standups, :user, foreign_key: true
    reversible do |dir|
      dir.up do
        if User.any?
          first_user_id = User.first.id
          execute "UPDATE standups SET user_id = #{first_user_id}"
        end
      end
    end
    change_column_null :standups, :user_id, false
  end
end
