const User = require('../models/User');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Order = require('../models/Order');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({
    path: 'variables.env'
});


const createToken = (user, secret, expiresIn) => {

    const {
        id,
        email,
        name,
        lastname
    } = user;
    return jwt.sign({
        id,
        email,
        name,
        lastname
    }, secret, {
        expiresIn
    })
}

// Resolvers : 

const resolvers = {

    Query: {
        getUser: async (_, {}, ctx) => {
            return await ctx.user;
        },
        getProducts: async () => {
            try {
                const products = await Product.find({});
                return products;
            } catch (error) {
                console.log(error);
            }
        },
        getOneProduct: async (_, {id}) => {
            // check if exists
            const product = await Product.findById(id)

            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        },
        getClients: async () => {
            try {
                const clients = await Client.find({})
                return clients;
            } catch (error) {
                throw new Error('Something went wrong');
            }
        },
        //get the clients of the seller
        getClientsBySeller: async (_, {}, ctx) => {
            try {
                const clients = await Client.find({
                    seller: ctx.user.id.toString()
                });
                return clients;
            } catch (error) {
                console.log(error);
            }
        },
        getClientById: async (_, {id }, ctx) => {
            //check if exists the client
            const client = await Client.findById(id);

            if (!client) {
                throw new Error('Client not found');
            }

            // only who created it can see it
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error('You do not the credentials');
            }

            return client;
        },
        getOrders: async () => {
            try {
                const orders = await Order.find({});
                return orders;
            } catch (error) {
                console.log(error);
            }
        },
        getOrdersBySeller: async (_, {}, ctx) => {
            try {
                const orders = await Order.find({
                    seller: ctx.user.id
                }).populate('client');
                return orders;
            } catch (error) {
                console.log(error);
            }
        },
        getOneOrder: async (_, { id }, ctx) => {
            // Check if order exists    
            const order = await Order.findById(id)
            if (!order) {
                throw new Error('Order does not exist')
            }

            //Only owner can see it
            if (order.seller.toString() !== ctx.user.id) {
                throw new Error('You have not the credentials')
            }

            //return the order
            return order
        }, // get the orders by State(PENDING,COMPLETED,CANCELED) of the authenticated user
        getOrderByStatus: async (_, {status }, ctx) => {
            // search for find method using  two params : id auth user and state
            const orders = await Order.find({
                seller: ctx.user.id,
                status
            })
            return orders
        },
        getBestClients: async () => {
            //aggregate makes multiple operations & return one
            const clients = await Order.aggregate([
                //filter the orders that are completed
                {
                    $match: {
                        status: "COMPLETED"
                    }
                },
                //makes reference to client n sum total of the completed 
                {
                    $group: {
                        _id: "$client",
                        total: {
                            $sum: '$total'
                        }
                    }
                },
                {
                    //this is like a populate in mongo
                    $lookup: {
                        from: 'clients',
                        localField: '_id',
                        foreignField: "_id",
                        //client is the same on TopClient type
                        as: "client"
                    }
                },
                {
                    $limit: 10
                },
                {
                    $sort: {
                        total: -1
                    }
                }
            ]);
            return clients;
        },
        getBestSellers: async () => {
            const sellers = await Order.aggregate([{
                    $match: {
                        status: "COMPLETED"
                    }
                },
                {
                    $group: {
                        _id: "$seller",
                        total: {
                            $sum: '$total'
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'seller'
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: {
                        total: -1
                    }
                }
            ]);

            return sellers;
        },
        searchProduct: async (_, { text }) => {
            const products = await Product.find({
                $text: {
                    $search: text
                }
            }).limit(10)
            return products;
        }
    },

    Mutation: {
        newUser: async (_, {input }) => {
            const {
                email,
                password
            } = input;
            // Chek if user exists
            const userExists = await User.findOne({
                email
            });
            if (userExists) {
                throw new Error(`User ${email} is already taken`);
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            input.password = await bcrypt.hash(password, salt);

            try {
                // Saving on DB
                const user = new User(input);
                user.save(); // guardarlo
                return user
            } catch (error) {
                console.log(error);
            }
        },
        authUser: async (_, {input}) => {
            const {
                email,
                password
            } = input;

            // check if user exists
            const userExists = await User.findOne({
                email
            });
            if (!userExists) {
                throw new Error("User does not exist");
            }
            // match password
            const isMatch = await bcrypt.compare(password, userExists.password);
            if (!isMatch) {
                throw new Error('Incorrect password');
            }

            // Crear el token
            return {
                token: createToken(userExists, process.env.SECRET, '5d')
            }

        },
        newProduct: async (_, { input }) => {
            try {
                const product = new Product(input);
                // save on the db & reuturn the result
                const result = await product.save();
                return result;
            } catch (error) {
                console.log(error);
            }
        },
        updateProduct: async (_, { id, input }) => {
            let product = await Product.findById(id);
            // check if prod exists
            if (!product) {
                throw new Error('Product not found');
            }
            // update and save on DB n return the new result using {new: true}
            product = await Product.findOneAndUpdate({
                _id: id
            }, input, {
                new: true
            });

            return product;
        },
        deleteProduct: async (_, { id }) => {

            // check if prod exists 
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Product not found');
            }
            // Delete the product if exists
            await Product.findOneAndDelete({
                _id: id
            });

            return "Product deleted";
        },
        newClient: async (_, { input }, ctx) => {

            const {
                email
            } = input
            // check if client exists
            const client = await Client.findOne({
                email
            });
            if (client) {
                throw new Error('client already exists');
            }
            const newClient = new Client(input);
            // asign seller
            newClient.seller = ctx.user.id;
            // Save it on DB
            try {
                const result = await newClient.save();
                return result;
            } catch (error) {
                console.log(error);
            }
        },
        updateClient: async (_, { id,input }, ctx) => {
            //check if client exists
            let client = await Client.findById(id);
            if (!client) {
                throw new Error('client not found');
            }
            // check if the seller is the owner
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error('You have not the credentials to edit');
            }
            // save on DB and return the new result 
            try {
                client = await Client.findOneAndUpdate({_id: id }, input, { new: true });
                return client;
            } catch (error) {
                console.log(error);
            }
        },
        deleteClient: async (_, {id }, ctx) => {
            //check if exists
            let client = await Client.findById(id);
            if (!client) {
                throw new Error('Client not found');
            }
            // check if seller is who delete
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error('You have not the credentials to this client');
            }
            // Delete Client from DB
            await Client.findOneAndDelete({
                _id: id
            });
            return "Client deleted";
        },
        newOrder: async (_, { input }, ctx) => {

            const {
                client
            } = input

            //         check if client exists
            let clientExists = await Client.findById(client);

            if (!clientExists) {
                throw new Error('client not found');
            }

            //       check if seller is owner 
            if (clientExists.seller.toString() !== ctx.user.id) {
                throw new Error('You have not the credentials');
            }
            for await (const article of input.order) {
                const {
                    id
                } = article
                const product = await Product.findById(id);
                if (article.qty > product.existence) {
                    throw new Error(`Not allowed: it's overpassig the available stock ${product.existence}`);

                } else {
                    product.existence = product.existence - article.qty;
                    await product.save();
                }
            }
            // Create new order
            try {
                const newOrder = new Order(input);
                // asign seller
                newOrder.seller = ctx.user.id;
                // Save order on DB
                const result = await newOrder.save();
                return result;

            } catch (error) {
                console.log(error);
            }
        },
        updateOrder: async (_, {id, input}, ctx) => {
            const {
                client
            } = input;
            // check if the order exists
            const orderExists = await Order.findById(id);
            if (!orderExists) {
                throw new Error('Order does not exist');
            }
            // if client exists
            const clientExists = await Client.findById(client);
            if (!clientExists) {
                throw new Error('Client does not exists');
            }
            //check if client & order belongs to same seller
            if (clientExists.seller.toString() !== ctx.user.id) {
                throw new Error("You don't have the credentials");
            }
            // Check existences
            if (input.order) {
                for await (const article of input.order) {
                    const {
                        id
                    } = article;

                    const product = await Product.findById(id);

                    if (article.qty > product.existence) {
                        throw new Error(`The qty is overpassig the available existences`);
                    } else {
                        // Reset the available    
                        product.existence = product.existence - article.qty;
                        await product.save();
                    }
                }
            }
            // Save the order after & return result
            const result = await Order.findOneAndUpdate({
                _id: id
            }, input, {
                new: true
            });
            return result;
        },
        deleteOrder: async (_, { id }, ctx) => {
            //check if the order exists
            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Order does not exists')
            }
            // check if seller owner is who will delete
            if (order.seller.toString() !== ctx.user.id) {
                throw new Error('You have not the credentials')
            }
            // delete order from DB
            await Order.findOneAndDelete({
                _id: id
            });
            return "Order Deleted"
        }
    }
}
module.exports = resolvers;