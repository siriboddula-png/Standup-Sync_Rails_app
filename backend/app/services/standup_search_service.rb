class StandupSearchService
  def initialize(params = {})
    @params = params
  end

  def call
    standups = Standup.includes(:user).all
    standups = apply_user_filter(standups)
    standups = apply_name_search(standups)
    standups = apply_date_filter(standups)
    standups = apply_sort(standups)
    standups
  end

  private

  def apply_user_filter(standups)
    return standups unless @params[:user_id].present?
    standups.where(user_id: @params[:user_id])
  end

  def apply_name_search(standups)
    return standups unless @params[:search_name].present?
    standups.joins(:user).where(
      "users.first_name ILIKE :q OR users.last_name ILIKE :q OR standups.name ILIKE :q",
      q: "%#{@params[:search_name]}%"
    )
  end

  def apply_date_filter(standups)
    return standups unless @params[:search_date].present?
    standups.where(standup_date: @params[:search_date])
  end

  def apply_sort(standups)
    sort_order = @params[:sort].presence || "desc"
    standups.order(standup_date: sort_order)
  end
end
