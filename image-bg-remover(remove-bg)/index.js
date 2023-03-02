const request = require("request");
const fs = require("fs");

request.post(
  {
    url: "https://api.remove.bg/v1.0/removebg",
    formData: {
      image_url:
        "https://cdn.pixabay.com/photo/2023/01/31/05/59/zebra-7757193_960_720.jpg",
      size: "auto",
    },
    headers: {
      "X-Api-Key": "pmE68L3LpQsiZxMhTZS1Ly22",
    },
    encoding: null,
  },
  (error, response, body) => {
    if (error) {
      return console.error(
        `Request failed because invalid URL or file : ${error}`
      );
    }

    if (response.statusCode != 200) {
      return console.error(
        `Request failed status code not 200 but : ${
          response.statusCode
        } and error is ${error} and body is ${body.toString("utf8")}`
      );
    }

    fs.writeFileSync("./transparent-image/removed.png", body);
  }
);
