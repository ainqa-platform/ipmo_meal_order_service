/**
 * NPM Module dependencies.
 */
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const open = require("open");
const bodyParser = require("body-parser");
require("dotenv").config();

app.use(bodyParser.json());
app.use(cors());

///POST METHOD

app.post("/updateMealOrderStatus", async (req, res) => {
  if (req.body.ticketId) {
    try {
      var config = {
        method: "post",
        url: process.env.REACT_APP_ARANGO_URL_READ,
        headers: { "Content-Type": "application/json" },
        data: {
          db_name: process.env.REACT_APP_DB,
          entity: process.env.REACT_APP_MEAL_ORDER_ENTITY,
          filter: `${process.env.REACT_APP_MEAL_ORDER_ENTITY}.ticketId=='${req.body.ticketId}'`,
          return_fields: process.env.REACT_APP_MEAL_ORDER_ENTITY,
        },
      };

      axios(config)
        .then(function (response) {
          axios({
            method: "POST",
            url: process.env.REACT_APP_ARANGO_URL_UPSERT,
            headers: { "Content-Type": "application/json" },
            data: [
              {
                db_name: process.env.REACT_APP_DB,
                entity: process.env.REACT_APP_MEAL_ORDER_ENTITY,
                filter: { _id: response.data.result?.[0]._id },
                doc: {
                  activestatus: false,
                },
              },
            ],
          })
            .then((resp1) => res.status(200).json({ response: resp1.data }))
            .catch((err) =>
              res
                .status(400)
                .json({ error: true, message: "Please Check the payload" })
            );
        })
        .catch(function (error) {
          console.error(error);
        });

      //   res.status(300).json({ response: data.data.result });
    } catch (err) {
      console.error(err);
    }
  } else {
    res.status(400);
  }
});
app.post("/mealOrderStatusUpdate", async (req, res) => {
  if (req.body.ticketId) {
    try {
      var qdmConfig = {
        method: "POST",
        url: process.env.REACT_APP_ARANGO_URL_READ,
        headers: { "Content-Type": "application/json" },
        data: {
          db_name: process.env.REACT_APP_DB,
          entity: process.env.REACT_APP_QDM_TRANSACTION_LOG_ENTITY,
          filter: `${process.env.REACT_APP_QDM_TRANSACTION_LOG_ENTITY}.ticketId=='${req.body.ticketId}'`,
          return_fields: process.env.REACT_APP_QDM_TRANSACTION_LOG_ENTITY,
        },
      };
      axios(qdmConfig)
        .then((orderS) => {
          console.log(
            "first response",
            orderS.data.result[0].payload.inputDoc.OrderStatus
          );
          var config = {
            method: "POST",
            url: process.env.REACT_APP_ARANGO_URL_READ,
            headers: { "Content-Type": "application/json" },
            data: {
              db_name: process.env.REACT_APP_DB,
              entity: process.env.REACT_APP_MEAL_ORDER_ENTITY,
              filter: `${process.env.REACT_APP_MEAL_ORDER_ENTITY}.ticketId=='${req.body.ticketId}'`,
              return_fields: process.env.REACT_APP_MEAL_ORDER_ENTITY,
            },
          };
          axios(config)
            .then(function (response) {
              axios({
                method: "POST",
                url: process.env.REACT_APP_ARANGO_URL_UPSERT,
                headers: { "Content-Type": "application/json" },
                data: [
                  {
                    db_name: process.env.REACT_APP_DB,
                    entity: process.env.REACT_APP_MEAL_ORDER_ENTITY,
                    filter: { _id: response.data.result[0]._id },
                    doc: {
                      OrderStatus:
                        orderS.data.result[0].payload.inputDoc.OrderStatus,
                    },
                  },
                ],
              })
                .then((resp1) => {
                  console.log("second response", resp1.data);
                  res.status(200).json({ response: resp1.data });
                })
                .catch((err) =>
                  res
                    .status(400)
                    .json({ error: true, message: "Please Check the payload" })
                );
            })
            .catch(function (error) {
              console.error(error);
            });
        })
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }
  } else {
    res.status(400).json({ response: "Please check the payload" });
  }
});
app.post("/labelPrint", async (req, res) => {
  if (req.body.ticketId) {
    try {
      axios
        .post(process.env.REACT_APP_GENERATE_PDF, {
          reportid: process.env.REACT_APP_GENERATE_PDF_REPORTID,
          inputparams: {
            "@ticketId": req.body.ticketId,
          },
          result: [],
        })
        .then((resp1) => {
          open(resp1.data.downloadUrl, function (err) {
            if (err) throw err;
          });
          res.status(200).json({ response: resp1.data.downloadUrl });
        })

        .catch((err) =>
          res

            .status(400)

            .json({ error: true, message: "Please Check the payload" })
        );
    } catch (err) {
      console.error(err);
    }
  } else {
    res.status(400).json({ response: "Please check the payload" });
  }
});
app.listen(process.env.PORT || 3009, function () {
  console.log(
    "Express server listening on port %d in %s mode",
    this.address().port,
    app.settings.env
  );
});
