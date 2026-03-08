require "test_helper"

class StandupsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get standups_index_url
    assert_response :success
  end
end
