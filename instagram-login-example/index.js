const express = require("express");
const app = express();
const Instagram = require("instagram-web-api");
const Jimp = require("jimp");
require("dotenv").config();
const fs = require("fs");
const imaps = require("imap-simple");
const { connect } = require("http2");
const _ = require("lodash");
const simpleParser = require("mailparser").simpleParser;

const instaUsername = process.env.INSTAGRAM_USERNAME;
const instaPassword = process.env.INSTAGRAM_PASSWORD;

console.log(instaUsername, instaPassword);

const instagramLoginFunction = async () => {
  //   const client = new Instagram({
  //     username: instaUsername,
  //     password: instaPassword,
  //   });
  const client = await new Instagram(
    { username: instaUsername, password: instaPassword },
    { language: "en-US" }
  );
  const instagramPostPictureFunction = async () => {
    console.log("1 ENTERED FUNCTION");
    client
      .getFollowers({ client: client.id })
      .then((res) => {
        console.log("2 GET FOLLOWERS RESPONSE >>> , ", res);
      })
      .catch((err) => {
        console.log("2 GET FOLLOWERS ERROR >>> , ", err);
      });
    // await client
    //   .getProfile()
    //   .then((res) => {
    //     console.log("2 GOT PROFILE RESPONSE >>> , ", res);
    //   })
    //   .catch((err) => {
    //     console.log("2 GOT PROFILE ERROR >>> , ", err);
    //   });
    // await client
    //   .getPhotosByUsername({ username: instaUsername })
    //   .then((res) => {
    //     console.log("2 GOT SOME RES", res.toString().slice(0, 10));
    //     // return res.user.edge_owner_to_timeline_media.edges.map(
    //     //   (edge) => edge.node.edge_media_to_caption.edges[0].node.text
    //     // )[0];
    //   })
    //   .catch((err) => {
    //     console.log("2 GOT SOME ERR", err.toString().slice(0, 10));
    //   });
    // .then((mostRecent) => {
    //   return 0;
    // })
    // .then((latestNumber) => {
    //   const updatedNumber = latestNumber + 1;
    //   console.log("4 GOT SOME RES", updatedNumber);

    //   Jimp.read(
    //     "https://www.google.com/url?sa=i&url=https%3A%2F%2Fmyanimelist.net%2Fcharacter%2F40%2FLuffy_Monkey_D&psig=AOvVaw21Yav4xeUe5PvXE6IS2zfk&ust=1675974023081000&source=images&cd=vfe&ved=0CA8QjRxqFwoTCJDlvfPfhv0CFQAAAAAdAAAAABAK"
    //   )
    //     .then((luffy) => {
    //       console.log("5 GOT SOME RES");
    //       return luffy
    //         .resize(405, 405, Jimp.RESIZE_NEAREST_NEIGHBOR)
    //         .quality(100)
    //         .write(`./luffy.jpg`, async () => {
    //           await client
    //             .uploadPhoto({
    //               photo: `luffy.jpg`,
    //               caption: `${updatedNumber}`,
    //               post: "feed",
    //             })
    //             .then((media) => {
    //               console.log("6 GOT SOME RES");
    //               console.log(`https://www.instagram.com/p/${media.code}`);

    //               fs.unlinkSync(`luffy.jpg`);
    //             });
    //         });
    //     })
    //     .catch((err) => {
    //       console.log(" errr ", err);
    //     });
    // });
  };

  try {
    console.log("LOGGING IN....");

    await client.login();

    console.log("LOGIN SUCCESSFUL");

    const delayedEmailFunction = async (timeout) => {
      setTimeout(async () => {
        await instagramPostPictureFunction();
      }, timeout);
    };

    await delayedEmailFunction(5000);
  } catch (err) {
    console.log("LOGIN FAILED");
    // console.log(err);

    if (err.status === 403) {
      console.log("throttled");
      return;
    }

    console.log(err.error);
    if (err.error && err.error.message === "checkpoint_required") {
      const challengeUrl = err.error.checkpoint_url;

      await client.updateChallenge({ challengeUrl, choice: 1 });

      const eamilConfig = {
        imap: {
          user: `{process.env.USER_EMAIL}`,
          password: `{process.env.USER_PASSWORD}`,
          host: "imap.gmail.com",
          port: 993,
          tls: true,
          tlsOptions: {
            servername: "imap.gmail.com",
            rejectUnauthorized: false,
          },
          authTimeout: 30000,
        },
      };

      const delayedEmailFunction = async (timeout) => {
        setTimeout(() => {
          imaps.connect(eamilConfig).then((connection) => {
            return connection.openBox("INBOX").then(() => {
              const delay = 1 * 3600 * 1000;
              let lastHour = new Date();
              lastHour.setTime(Date.now() - delay);
              lastHour = lastHour.toISOString();

              const searchCriteria = ["ALL", "SINCE", lastHour];
              const fetchOptions = {
                bodies: [""],
              };
              return connection
                .search(searchCriteria, fetchOptions)
                .then((messages) => {
                  messages.forEach((item) => {
                    const all = _.find(item.parts, { which: "" });
                    const id = item.attributes.uid;
                    const idHeader = "Imap-Id: " + id + "\r\n";

                    simpleParser(idHeader + all.body, async (err, mail) => {
                      if (err) {
                        console.log(err);
                      }

                      console.log(mail.subject);

                      const answerCodeArr = mail.text
                        .split("\n")
                        .filter(
                          (item) => item && /^\S+$/.test(item) && !isNaN(item)
                        );

                      if (mail.text.includes("Instagram")) {
                        if (answerCodeArr.length > 0) {
                          const answerCode = answerCodeArr[0];
                          console.log(answerCode);

                          await client.updateChallenge({
                            challengeUrl,
                            securityCode: answerCode,
                          });

                          console.log(
                            `Answered instagram security challenge with answer code ${answerCode}`
                          );

                          await client.login();

                          await instagramPostPictureFunction();
                        }
                      }
                    });
                  });
                });
            });
          });
        }, timeout);
      };
      await delayedEmailFunction(45000);
    }
  }
};

instagramLoginFunction();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`LISTENING ON PORT ${port}`);
});
