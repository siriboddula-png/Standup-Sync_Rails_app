puts "Creating 10 dummy users..."

users = []
existing_user_count = User.count

10.times do |i|
  user_number = existing_user_count + i + 1
  user = User.create!(
    first_name: Faker::Name.first_name,
    last_name: Faker::Name.last_name,
    username: "user#{user_number}_#{Faker::Internet.username(specifier: 5..8)}",
    email: "user#{user_number}@example.com",
    password: "password123",
    password_confirmation: "password123"
  )
  users << user
  puts " Created: #{user.first_name} #{user.last_name} (#{user.email})"
end

puts "\n Creating 30 dummy standup logs..."

done_tasks = [
  "Completed user authentication feature",
  "Fixed bug in payment processing",
  "Reviewed pull requests from team members",
  "Updated documentation for API endpoints",
  "Implemented search functionality",
  "Optimized database queries for better performance",
  "Conducted code review session",
  "Deployed hotfix to production",
  "Refactored legacy code in user module",
  "Set up CI/CD pipeline",
  "Created unit tests for new features",
  "Attended sprint planning meeting",
  "Resolved merge conflicts",
  "Updated dependencies to latest versions",
  "Implemented caching strategy"
]

doing_tasks = [
  "Working on dashboard redesign",
  "Implementing real-time notifications",
  "Writing integration tests",
  "Debugging performance issues",
  "Designing new database schema",
  "Creating API documentation",
  "Refactoring authentication logic",
  "Building admin panel features",
  "Optimizing frontend bundle size",
  "Setting up monitoring and logging",
  "Implementing email notification system",
  "Working on mobile responsive design",
  "Integrating third-party payment gateway",
  "Developing user profile management",
  "Creating data migration scripts"
]

blockers_list = [
  "Waiting for API access from third-party service",
  "Need design approval from stakeholders",
  "Blocked by infrastructure team for server access",
  "Waiting for code review from senior developer",
  "Database migration pending approval",
  "Need clarification on requirements",
  "Dependency on another team's feature completion",
  "Waiting for QA environment setup",
  "-",
  "none",
  "-",
  "nil",
  "-",
  "-",
  "-"
]

30.times do |i|
  user = users.sample
  date = rand(14).days.ago.to_date

  standup = Standup.create!(
    user: user,
    name: "#{user.first_name} #{user.last_name}",
    done: done_tasks.sample,
    doing: doing_tasks.sample,
    blockers: blockers_list.sample,
    standup_date: date
  )

  puts "  Log #{i + 1}: #{standup.name} - #{standup.standup_date}"
end

puts "\n Seeding completed successfully!"
puts " Summary:"
puts "  • Total users in database: #{User.count}"
puts "  • Total standup logs in database: #{Standup.count}"
puts "  • New users added: 10"
puts "  • New standup logs added: 30"
puts "\n Login credentials for newly created users:"
puts "  Email: user#{existing_user_count + 1}@example.com to user#{existing_user_count + 10}@example.com"
puts "  Password: password123"
