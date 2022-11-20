const {  gql } = require('apollo-server');

// Schema
const typeDefs = gql`

    #Types

    type User {
        id: ID
        name: String
        lastname: String
        email: String
        createdAt: String
    }

    type Product {
        id: ID
        name: String
        existence: Int
        price: Float
        createdAt: String
    }

    type Client{
        name: String
        lastname: String
        email:String
        createdAt: String
        company: String
        phone: String
        seller : ID
        id: ID
    }

    type Order {
        id: ID
        order:[OrderGroup]
        seller: ID
        status : OrderStatus
        client : Client
        total : Float
        createdAt : String
    }

    type OrderGroup{
        id: ID
        qty: Int
        name: String
        price: Float
    }

    type Token {
        token: String
    }

    type TopClient {
        total: Float
        client: [Client]
    }

    type TopSeller {
        seller: [User]
        total: Float
    }

    enum OrderStatus {
        PENDING
        COMPLETED
        CANCELED
    }
    
    #Inputs

    input UserInput {
        name: String!
        lastname: String!
        email: String!
        password: String!
    }

    input AuthInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        existence: Int!
        price: Float!
    }

    input ClientInput {
        name: String!
        email: String!
        lastname: String!
        company: String!
        phone: String
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        client: ID!
        status: OrderStatus
    }

    input OrderProductInput {
        id: ID
        qty: Int
        name: String
        price: Float
    }


    #Queries

    type Query{
        # Users
        getUser : User
        
        # Products
        getProducts: [Product]
        getOneProduct(id: ID!): Product

        # Clients
        getClients: [Client]
        getClientsBySeller: [Client]
        getClientById(id: ID!): Client

        # Orders
        getOrders : [Order]
        getOrdersBySeller : [Order]
        getOneOrder(id: ID!) : Order
        getOrderByStatus(status:String!) : [Order]

        #Advanced querys
        getBestClients : [TopClient]
        getBestSellers : [TopSeller]
        searchProduct( text: String!) : [Product]

    }

    #Mutations

    type Mutation {
        # Users
        newUser(input: UserInput!) : User
        authUser(input: AuthInput) : Token

        # Products
        newProduct(input: ProductInput) : Product
        updateProduct(id:ID!, input: ProductInput): Product
        deleteProduct(id:ID!): String

        # Clients
        newClient(input: ClientInput): Client
        updateClient(id: ID!, input : ClientInput) : Client
        deleteClient(id:ID!) : String

        # Orders
        newOrder(input: OrderInput) : Order
        updateOrder(id: ID!, input : OrderInput) : Order
        deleteOrder(id: ID!) : String
    }
`;

module.exports = typeDefs;


 



