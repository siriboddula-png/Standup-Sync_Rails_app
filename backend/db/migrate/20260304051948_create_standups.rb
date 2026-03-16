class CreateStandups < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.string :first_name, null: false, default: ""
      t.string :last_name, null: false, default: ""
      t.timestamps null: false
    end
    add_index :users, :email, unique: true

    create_table :standups do |t|
      t.references :user, null: false, foreign_key: true
      t.date :standup_date, null: false
      t.text :done, null: false
      t.text :doing, null: false
      t.text :blockers
      t.timestamps
    end
  end
end
