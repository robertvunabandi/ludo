module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :participant

    def connect
      self.participant = get_participant
    end

    private

    def get_participant
      saved_participant = cookies.encrypted[:participant]
      if (saved_participant.nil?) || (!Participant.exists?(saved_participant))
        participant = Participant.new
        participant.save
        cookies.encrypted[:participant] = participant.id
      else
        participant = Participant.find(saved_participant)
      end
      return participant
    end
  end
end
