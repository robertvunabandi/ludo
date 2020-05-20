class WaitChannel < ApplicationCable::Channel
  def subscribed
    stream_from "wait_channel"
    puts "---===---"
    puts "new connection!"
    puts participant
    puts participant.id
    puts "---===---"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    puts ">>>---<<<"
    puts "leaving!"
    puts participant
    puts participant.id
    puts ">>>---<<<"
  end
end
