module StandupsHelper
  def highlight_blocker(text)
    return "-" if text.blank?

    highlighted = text.gsub(/blocker/i) do |match|
      "<span class='text-danger fw-bold'>#{match.upcase}</span>"
    end
    highlighted.html_safe
  end
end
