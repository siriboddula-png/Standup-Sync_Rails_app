class StandupsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_standup, only: [ :edit, :update, :destroy ]
  before_action :authorize_owner!, only: [ :edit, :update, :destroy ]

  def index
    @current_sort = params[:sort] == "asc" ? "asc" : "desc"
    @standups = Standup.joins(:user).includes(:user)
    search_term = params[:query] || params[:search_name]
    if search_term.present?
      @standups = @standups.where(
        "users.username ILIKE :q OR users.first_name ILIKE :q OR users.last_name ILIKE :q", q: "%#{search_term}%")
    end
    if params[:search_date].present?
      @standups = @standups.where(standup_date: params[:search_date])
    end
    @standups = @standups.order(standup_date: @current_sort)
    @grouped_standups = @standups.group_by(&:standup_date)
    @recent_blockers = Standup.where(standup_date: 7.days.ago..Date.today).where.not(blockers: [ nil, "", "nil", "-", "none", "None" ]).count
  end

  def profile
    @my_standups = current_user.standups.sorted_by_date("desc")
  end

  def new
    @standup = current_user.standups.build(standup_date: Date.today)
  end

  def create
    @standup = current_user.standups.build(standup_params)
    @standup.name ||= "#{current_user.first_name} #{current_user.last_name}"
    if @standup.save
      redirect_to standups_path, notice: "Update logged!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @standup.update(standup_params)
      redirect_to standups_path, notice: "Update was successfully edited."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @standup.destroy
    redirect_to standups_path, notice: "Update was deleted.", status: :see_other
  end

  private

  def set_standup
    @standup = Standup.find(params[:id])
  end

  def standup_params
    params.require(:standup).permit(:standup_date, :done, :doing, :blockers, :date)
  end

  def authorize_owner!
    unless @standup.user == current_user
      redirect_to standups_path, alert: "You are not authorized to modify this entry."
    end
  end
end
