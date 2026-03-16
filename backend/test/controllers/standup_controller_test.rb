require "test_helper"

class StandupControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get standup_index_url
    assert_response :success
  end
end
