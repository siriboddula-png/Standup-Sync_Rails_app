class RemoveNameFromStandups < ActiveRecord::Migration[8.1]
  def change
    remove_column :standups, :name, :string
  end
end
