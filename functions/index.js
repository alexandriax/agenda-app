const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

// Initialize Firebase Admin
admin.initializeApp();

// Twilio Credentials (store these as Firebase Config vars in production)
const accountSid = "your_twilio_account_sid";
const authToken = "your_twilio_auth_token";
const twilioPhone = "your_twilio_phone_number";
const client = new twilio(accountSid, authToken);

// Firestore reference
const db = admin.firestore();

// Cloud Function to send SMS
exports.sendDailyNudge = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const eventSnapshot = await db.collection("events").orderBy("date").limit(1).get();

    if (usersSnapshot.empty || eventSnapshot.empty) {
      console.log("No users or events found.");
      return null;
    }

    const event = eventSnapshot.docs[0].data();
    const messageText = `🏳️‍🌈 Your Gay Agenda: ${event.name} - ${event.location}. More info: ${event.link}`;

    const sendPromises = [];

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      if (user.phoneNumber) {
        sendPromises.push(
          client.messages.create({
            body: messageText,
            from: twilioPhone,
            to: user.phoneNumber,
          })
        );
      }
    });

    await Promise.all(sendPromises);
    console.log("SMS nudges sent successfully.");
    return null;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return null;
  }
});

