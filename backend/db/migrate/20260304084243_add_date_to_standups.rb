class AddDateToStandups < ActiveRecord::Migration[8.1]
  def change
    add_column :standups, :standup_date, :date
  end
end
