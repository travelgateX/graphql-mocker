module.exports = {
  extendibles: [
    "Query",
    "Mutation",
    "HotelXQuery",
    "HotelXMutation",
    "StatsQuery",
    "AdminMutation",
    "AdminQuery",
    "MappeaQuery",
    "MappeaMutation",
    "InsigthsQuery",
    "InsigthsMutation",
    "TransportQuery",
    "TransportMutation",
    "PaymentXQuery",
    "PaymentXMutation"
  ],
  astTypes: {
    EXTEND: "ObjectTypeExtension",
    EXTEND_DEFINITION: "TypeExtensionDefinition",
    ENUM: "EnumTypeDefinition",
    INPUT:"InputObjectTypeDefinition",
    SCALAR: "ScalarTypeDefinition",
    OBJECT: "ObjectTypeDefinition",
    INTERFACE:"InterfaceTypeDefinition",
    UNION: "UnionTypeDefinition"
  }

};
