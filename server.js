const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

var cur_id = 4;
var users = [
  {
    name: "omer",
    inbox: [
      {
        sender: "eyal",
        recipient: "omer",
        title: "Hello",
        content: "Hey there!",
        date: "01-01-2020",
        id: 1,
        read: true,
      },
      {
        sender: "eyal",
        recipient: "omer",
        title: "",
        content: "",
        date: "02-01-2020",
        id: 2,
        read: false,
      },
    ],
    sent: [
      {
        sender: "omer",
        recipient: "eyal",
        title: "Hello",
        content: "Welome!",
        date: "02-01-2020",
        id: 3,
        read: true,
      },
    ],
  },
  {
    name: "eyal",
    inbox: [
      {
        sender: "omer",
        recipient: "eyal",
        title: "Hello",
        content: "Welome!",
        date: "02-01-2020",
        id: 3,
        read: true,
      },
    ],
    sent: [
      {
        sender: "eyal",
        recipient: "omer",
        title: "Hello",
        content: "Hey there!",
        date: "01-01-2020",
        id: 1,
        read: true,
      },
      {
        sender: "eyal",
        recipient: "omer",
        title: "",
        content: "",
        date: "02-01-2020",
        id: 2,
        read: false,
      },
    ],
  },
];

// Read message (get by msgID).
app.get("/api/:user/msg-id/:id", (req, res) => {
  userObj = getUserObject(req.params.user);
  if (userObj === undefined) {
    res.status(404).send("User cannot be found.");
    return;
  }

  msgObj = getMsgObject(userObj.inbox, Number(req.params.id));

  if (msgObj === undefined) {
    res.status(404).send("Message cannot be found.");
    return;
  }

  // Set read to true.
  msgObj.read = true;

  // Return message.
  res.send(msgObj);
});

// Get messages (get by user).
app.get("/api/:user/inbox/all", (req, res) => {
  userObj = getUserObject(req.params.user);
  if (userObj === undefined || !userObj.inbox.length) {
    res.send("The user's inbox is empty.");
    return;
  }

  res.send(userObj.inbox);
});

// Get unread messages (get by user).
app.get("/api/:user/inbox/unread", (req, res) => {
  userObj = getUserObject(req.params.user);
  if (userObj === undefined || !userObj.inbox.length) {
    res.send("No Unread Messages.");
    return;
  }

  unreadMsgs = userObj.inbox.filter((x) => !x.read);
  !unreadMsgs.length ? res.send("No Unread Messages.") : res.send(unreadMsgs);
});

// Send message.
app.post("/api", (req, res) => {
  // check if request body contains all required keys.
  if (!validateMsg(req.body)) {
    // if not, return 'bad request'.
    res.status(400).send("Missing paramters within message object.");
    return;
  }

  // get message object from request body.
  const { title, content, sender, recipient, ...msg } = req.body;
  if (title === undefined) title = "";
  if (content === undefined) content = "";
  msg.sender = sender;
  msg.recipient = recipient;
  msg.title = title;
  msg.content = content;
  msg.id = cur_id;
  msg.read = false;
  cur_id++;

  // find index of users within users object.
  senIndex = getUserIndex(sender);
  recIndex = getUserIndex(recipient);

  if (senIndex == -1) {
    // recipient username not found, create new user.
    users.push({
      name: sender,
      inbox: [],
      sent: [],
    });
    senIndex = getUserIndex(sender);
  }
  if (recIndex == -1) {
    // recipient username not found, create new user.
    users.push({
      name: recipient,
      inbox: [],
      sent: [],
    });
    recIndex = getUserIndex(recipient);
  }

  // add message to receipient inbox and sender sent box.
  users[recIndex].inbox.push(msg);
  users[senIndex].sent.push(msg);

  // TEST
  res.send("Message sent successfully!");
});

// Delete message (by user and msgID).
app.delete("/api/:user/:id", (req, res) => {
  // Checks if user is the sender or recipient.
  userIndex = getUserIndex(req.params.user);
  if (userIndex === -1) {
    res.status(404).send("User cannot be found.");
    return;
  }
  userObj = users[userIndex];
  var userIsSender = true;

  id = Number(req.params.id);
  msgIndex = getMsgIndex(userObj.sent, id);
  if (msgIndex === -1) {
    userIsSender = false;
    msgIndex = getMsgIndex(userObj.inbox, id);
    if (msgIndex === -1) {
      res.status(404).send("Message cannot be found.");
      return;
    }
  }

  if (userIsSender) {
    // In case the given user is the sender:
    msg = getMsgObject(userObj.sent, id);
    recName = msg.recipient;

    // Delete from sender sent box.
    userObj.sent = userObj.sent.filter((x) => {
      return x.id !== id;
    });

    recIndex = getUserIndex(recName);
    recObj = users[recIndex];

    // Delete from recipient inbox.
    recObj.inbox = recObj.inbox.filter((x) => {
      return x.id !== id;
    });
  } else {
    // In case the given user is the recipient:
    msg = getMsgObject(userObj.inbox, id);
    senName = msg.sender;

    // Delete from sender inbox.
    userObj.inbox = userObj.inbox.filter((x) => {
      return x.id !== id;
    });

    senIndex = getUserIndex(senName);
    senObj = users[senIndex];

    // Delete from recipient inbox.
    senObj.sent = senObj.sent.filter((x) => {
      return x.id !== id;
    });
  }

  res.send('Message sent succefully!');
});

function validateMsg(obj) {
  const messageKeys = ["sender", "recipient", "title", "content", "date"];
  return messageKeys.every((item) => obj.hasOwnProperty(item));
}

function getUserIndex(name) {
  return users.findIndex((x) => x.name === name);
}

function getUserObject(name) {
  return users.find((x) => x.name === name);
}

function getMsgIndex(box, id) {
  return box.findIndex((x) => x.id === id);
}

function getMsgObject(box, id) {
  return box.find((x) => x.id === id);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
