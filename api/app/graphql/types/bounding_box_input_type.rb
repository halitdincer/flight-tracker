# frozen_string_literal: true

module Types
  class BoundingBoxInputType < Types::BaseInputObject
    argument :lamin, Float, required: true, description: "Lower latitude bound"
    argument :lomin, Float, required: true, description: "Lower longitude bound"
    argument :lamax, Float, required: true, description: "Upper latitude bound"
    argument :lomax, Float, required: true, description: "Upper longitude bound"
  end
end
