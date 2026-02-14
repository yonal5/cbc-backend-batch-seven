import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin, isCustomer } from "./userController.js";


export async function getOrders(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    /* ADMIN → GET ALL */
    if (isAdmin(req)) {
      const orders = await Order.find().sort({
        createdAt: -1,
      });

      return res.json(orders);
    }

    /* CUSTOMER → GET OWN */
    if (isCustomer(req)) {
      const orders = await Order.find({
        email: req.user.email,
      }).sort({
        createdAt: -1,
      });

      return res.json(orders);
    }

    res.status(403).json({
      message: "Unauthorized",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error",
    });
  }
}

/* =========================
   UPDATE STATUS
========================= */
export async function updateOrderStatus(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Admin only",
      });
    }

    await Order.updateOne(
      { orderID: req.params.orderID },
      { status: req.body.status }
    );

    res.json({
      message: "Status updated",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
    });
  }
}

export async function createOrder(req, res) {

    try {

        if (!req.user) {
            return res.status(401).json({
                message: "Login required"
            });
        }

        const {
            customerName,
            phone,
            address,
            items
        } = req.body;


        if (!address)
            return res.status(400).json({
                message: "Address required"
            });


        if (!items || !Array.isArray(items) || items.length === 0)
            return res.status(400).json({
                message: "Cart empty"
            });


        /*
        GENERATE ORDER ID
        */
        const lastOrder = await Order
            .findOne()
            .sort({ date: -1 });


        let orderID = "CBC0000001";

        if (lastOrder) {

            const lastNumber =
                parseInt(lastOrder.orderID.replace("CBC", ""));

            orderID =
                "CBC" +
                (lastNumber + 1)
                .toString()
                .padStart(7, "0");

        }


        let total = 0;

        const orderItems = [];


        /*
        PROCESS ITEMS
        */
        for (const item of items) {

            const product =
                await Product.findOne({
                    productID: item.productID
                });

            if (!product)
                return res.status(400).json({
                    message:
                        "Product not found: " +
                        item.productID
                });


            if (product.stock < item.quantity)
                return res.status(400).json({
                    message:
                        product.name +
                        " out of stock"
                });


            /*
            REDUCE STOCK
            */
            product.stock -= item.quantity;

            await product.save();


            orderItems.push({

                productID: product.productID,
                quantity: item.quantity,
                name: product.name,
                price: product.price,
                image: product.images[0]

            });


            total += product.price * item.quantity;

        }


        /*
        CREATE ORDER
        */
        const order = await Order.create({

            orderID,

            items: orderItems,

            customerName:
                customerName ||
                req.user.firstName +
                " " +
                req.user.lastName,

            email: req.user.email,

            phone: phone || "Not provided",

            address,

            total

        });


        res.status(201).json({

            message: "Order created successfully",

            order

        });


    }
    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Server error"

        });

    }

}



export async function updateOrderStatus(req, res) {

    try {

        if (!isAdmin(req))
            return res.status(403).json({
                message: "Admin only"
            });


        await Order.updateOne(
            { orderID: req.params.orderID },
            { status: req.body.status }
        );


        res.json({
            message: "Status updated"
        });

    }
    catch (err) {

        res.status(500).json({
            message: "Server error"
        });

    }

}
