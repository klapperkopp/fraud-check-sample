require("dotenv").config();
const Vonage = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

const axios = require("axios");

const axiosConfig = {
  method: "get",
  url: "https://onlinesim.ru/api/getFreePhoneList?country=7",
};

let blockedNumbers = [];
const TEST_NUMBER = "79032795345";
//const TEST_NUMBER = "4915140046124";

axios(axiosConfig)
  .then(function (response) {
    blockedNumbers = response.data.numbers.map(
      (n) => n.country.toString() + n.number.toString()
    );
    console.log("Blocked Numbers: ", blockedNumbers);

    if (blockedNumbers.includes(TEST_NUMBER)) {
      // if blocked number, do nothing
      console.warn("HACKER, YOU ARE NOT ALLOWED TO ENTER!");
    } else {
      // check if number is on Vimpel
      vonage.numberInsight.get(
        {
          level: "advancedSync",
          number: TEST_NUMBER.replace("+", ""),
        },
        (error, result) => {
          if (error) {
            console.error(error);
          } else {
            console.log("Insights result: ", result);

            // if on Vimpel, send Verify TTS Code (Voice Call)
            if (result.current_carrier.network_code == 25099) {
              console.warn(
                "MIGHT BE A VIRTUAL USER. Send them TTS Call instead of SMS."
              );
              vonage.verify.request(
                {
                  number: TEST_NUMBER,
                  brand: process.env.BRAND_NAME,
                  workflow_id: 3, // TTS-TTS workflow, will only get two calls
                },
                (err, result) => {
                  if (err) {
                    console.error(err);
                  } else {
                    const verifyRequestId = result.request_id;
                    console.log("request_id", verifyRequestId);
                  }
                }
              );
            }
            // if not on Vimpel, send SMS
            else {
              vonage.verify.request(
                {
                  number: TEST_NUMBER,
                  brand: process.env.BRAND_NAME,
                  workflow_id: 4, // SMS-SMS workflow, will only get SMS
                },
                (err, result) => {
                  if (err) {
                    console.error(err);
                  } else {
                    const verifyRequestId = result.request_id;
                    console.log("request_id", verifyRequestId);
                  }
                }
              );
            }
          }
        }
      );
    }
  })
  .catch(function (error) {
    console.log(error);
  });
