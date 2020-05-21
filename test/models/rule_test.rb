require 'test_helper'

class RuleTest < ActiveSupport::TestCase
  test "rule#create: valid for valid values of rules" do
    g = Game.create
    for rule_name in Rule::VALID_RULE_NAMES
      for valid_value in Rule::RULE_SPECS[rule_name][:valid]
        r = Rule.create(game: g, name: rule_name, value: valid_value)
        assert r.valid?
      end
    end
  end

  test "rule#create: invalid for all rules" do
    g = Game.create
    invalid_values = [-1, -2, -2343523, -34, 3500, 43553, 999999]
    for rule_name in Rule::VALID_RULE_NAMES
      for invalid_value in invalid_values
        r = Rule.create(game: g, name: rule_name, value: invalid_value)
        assert_not r.valid?
      end
    end
  end
end
