class UniqueUsername < ActiveRecord::Migration[7.1]
  def change
    if index_exists?(:users, :first_name)
      remove_index :users, :first_name
    end
    add_index :users, [ :first_name, :last_name ], unique: true
  end
end
