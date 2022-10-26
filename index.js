/**
 * NPM Module dependencies.
 */
const express = require("express");
// const cors = require("cors");
const axios = require("axios");
const app = express();
const open = require("open");
const bodyParser = require("body-parser");
const uuid = require("uuid");
//import { v4 as uuidv4 } from "uuid";
require("dotenv").config();

app.use(bodyParser.json());
// app.use(cors());

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
  if (req.body.ticketId.length !== 0) {
    try {
      axios
        .post(process.env.REACT_APP_GENERATE_PDF, {
          reportid: process.env.REACT_APP_GENERATE_PDF_REPORTID,
          inputparams: {
            "@ticketId":
              req.body.ticketId.length === 1
                ? `[${req.body.ticketId}]`
                : `${req.body.ticketId}`,
          },
          result: [],
        })

        .then((resp1) => {
          res.status(200).json({ response: resp1.data.downloadUrl });
        })
        .catch((err) => {
          res.status(400).json({
            error: true,
            message: err.response.data.error
              ? err.response.data.error
              : err.response.data,
          });
        });
    } catch (err) {
      console.error(err);
    }
  } else {
    res.status(400).json({ response: "Please check the payload" });
  }
});
app.post("/notificationUpsert", async (req, res) => {
  var notificationMsg = "";
  var chkMealOrder = "";
  if (req.body.notify_type) {
    if (req.body.patient_id) {
      const notifyUpsert = (mealordervalue, notificationmsgvalue) => {
        var config = {
          method: "POST",
          url: process.env.REACT_APP_ARANGO_URL_UPSERT,
          headers: { "Content-Type": "application/json" },
          data: [
            {
              db_name: process.env.REACT_APP_DB,
              entity: process.env.REACT_APP_NOTIFICATION_ENTITY,
              filter: {},
              // is_metadata: true,
              // metadataId: process.env.REACT_APP_METADATAID,
              // metadata_dbname: process.env.REACT_APP_MetadataDB_Name,
              doc: {
                Notification_id: uuid.v4(),
                Notification: notificationmsgvalue,
                Notification_type: req.body.notify_type,
                Notification_count: 0,
                Patient_id: req.body.patient_id,
                Mealorderid: mealordervalue,
              },
            },
          ],
        };

        axios(config)
          .then(function (response) {
            return res.status(200).json({ response: response.data });
          })
          .catch(function (error) {
            console.error(error);
          });
      };
      try {
        if (req.body.notify_type == "Patient") {
          var patientConfig = {
            method: "POST",
            url: process.env.REACT_APP_ARANGO_URL_READ,
            headers: { "Content-Type": "application/json" },
            data: {
              db_name: process.env.REACT_APP_DB,
              entity: "Patient,PatientCheckIn",
              filter: {
                Patient: `Patient._id =='${req.body.patient_id}' AND Patient.activestatus==true`,
                PatientCheckIn:
                  "PatientCheckIn.PatientCode==Patient._id AND PatientCheckIn.activestatus==true",
              },
              return_fields:
                "MERGE(Patient,{ BedCode: document(PatientCheckIn.BedCode).BedNumber, RoomCode:document(PatientCheckIn.roomCode).RoomNumber, PatientCategory:DOCUMENT(Patient.PatientCategory)  })",
            },
          };

          axios(patientConfig)
            .then(function (patientresponse) {
              var patientFullName =
                patientresponse.data.result[0].PatientFName +
                " " +
                patientresponse.data.result[0].PatientMName +
                " " +
                patientresponse.data.result[0].PatientLName;
              var roomNo = patientresponse.data.result[0].RoomCode;
              var bedNo = patientresponse.data.result[0].BedCode;
              var dietType =
                patientresponse.data.result[0].PatientCategory.display;

              notificationMsg +=
                "Patient " +
                patientFullName +
                " checked in the " +
                roomNo +
                ", " +
                bedNo +
                " for the " +
                dietType +
                " diet type";
              chkMealOrder = "NA";
              notifyUpsert(chkMealOrder, notificationMsg);
            })
            .catch(function (error) {
              console.error(error);
            });
        } else if (req.body.notify_type == "Meal Order") {
          if (req.body.mealorderid) {
            var mealorderConfig = {
              method: "POST",
              url: process.env.REACT_APP_ARANGO_URL_READ,
              headers: { "Content-Type": "application/json" },
              data: {
                db_name: process.env.REACT_APP_DB,
                entity: "MealOrder,Patient,PatientCheckIn",

                filter: {
                  MealOrder: `MealOrder._id == '${req.body.mealorderid}'  AND MealOrder.activestatus==true AND MealOrder.PatientCode == '${req.body.patient_id}'`,
                  Patient:
                    "Patient._id==MealOrder.PatientCode  AND Patient.activestatus==true",
                  PatientCheckIn:
                    "PatientCheckIn.PatientCode==Patient._id AND PatientCheckIn.activestatus==true",
                },
                return_fields:
                  "MERGE(MealOrder,{ PatientCategory:DOCUMENT(Patient.PatientCategory),  BedCode: document(PatientCheckIn.BedCode).BedNumber, RoomCode:document(PatientCheckIn.roomCode).RoomNumber})",
              },
            };

            axios(mealorderConfig)
              .then(function (mealresponse) {
                var roomNo = mealresponse.data.result[0].RoomCode;
                var bedNo = mealresponse.data.result[0].BedCode;
                var dietType =
                  mealresponse.data.result[0].PatientCategory.display;
                var mealType = mealresponse.data.result[0].OrderOtherDetails;
                notificationMsg =
                  "Order Received for " +
                  mealType +
                  " in the diet type of " +
                  dietType +
                  " for " +
                  roomNo +
                  ", " +
                  bedNo;
                chkMealOrder = req.body.mealorderid;
                notifyUpsert(chkMealOrder, notificationMsg);
              })
              .catch(function (error) {
                console.error(error);
              });
          } else {
            res.status(400).json({
              response: "Meal order id is missing, please check the payload",
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      res
        .status(400)
        .json({ response: "Patient id is missing, please check the payload" });
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
