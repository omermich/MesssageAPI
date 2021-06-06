const express = require("express");
const Joi = require("joi").extend(require("@joi/date"));
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

var cur_id = 1; // MessageID that will increment with each new message.
var users = []; // "DB" to hold the users and their incoming / sent messages.

// Read message (get by msgID).
app.get("/api/:user/msg/:id", (req, res) => {
    userObj = getUserObject(req.params.user);
    if (userObj === undefined)
        return res.status(404).send("User cannot be found.");

    msgObj = getMsgObject(userObj.inbox, Number(req.params.id));

    if (msgObj === undefined)
        return res.status(404).send("Message cannot be found.");

    // Set read to true.
    msgObj.read = true;

    // Return message.
    res.send(msgObj);
});

// Get messages (get by user).
app.get("/api/:user/inbox/all", (req, res) => {
    userObj = getUserObject(req.params.user);
    if (userObj === undefined || !userObj.inbox.length)
        return res.send("The user's inbox is empty.");

    res.send(userObj.inbox);
});

// Get unread messages (get by user).
app.get("/api/:user/inbox/unread", (req, res) => {
    userObj = getUserObject(req.params.user);
    if (userObj === undefined || !userObj.inbox.length)
        return res.send("No Unread Messages.");

    unreadMsgs = userObj.inbox.filter((x) => !x.read);
    !unreadMsgs.length ? res.send("No Unread Messages.") : res.send(unreadMsgs);
});

// Send message.
app.post("/api", (req, res) => {
    // check if request body contains all required keys.
    // if not, return 'bad request'.
    error = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // get message object from request body.
    const { title, content, sender, recipient, ...msg } = req.body;
    if (title == undefined) title = "";
    if (content == undefined) content = "";
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

    res.send("Message sent successfully!");
});

// Delete message (by user and msgID).
app.delete("/api/:user/:id", (req, res) => {
    // Checks if user is the sender or recipient.
    userIndex = getUserIndex(req.params.user);
    if (userIndex == -1) return res.status(404).send("User cannot be found.");

    userObj = users[userIndex];
    var userIsSender = true;

    id = Number(req.params.id);
    msgIndex = getMsgIndex(userObj.sent, id);
    if (msgIndex == -1) {
        userIsSender = false;
        msgIndex = getMsgIndex(userObj.inbox, id);
        if (msgIndex == -1)
            return res.status(404).send("Message cannot be found.");
    }

    excludeID = (x) => {
        return x.id != id;
    };

    if (userIsSender) {
        // In case the given user is the sender:
        msg = getMsgObject(userObj.sent, id);
        recName = msg.recipient;

        // Delete from sender sent box.
        userObj.sent = userObj.sent.filter(excludeID);

        recIndex = getUserIndex(recName);
        recObj = users[recIndex];

        // Delete from recipient inbox.
        recObj.inbox = recObj.inbox.filter(excludeID);
    } else {
        // In case the given user is the recipient:
        msg = getMsgObject(userObj.inbox, id);
        senName = msg.sender;

        // Delete from sender inbox.
        userObj.inbox = userObj.inbox.filter(excludeID);

        senIndex = getUserIndex(senName);
        senObj = users[senIndex];

        // Delete from recipient inbox.
        senObj.sent = senObj.sent.filter(excludeID);
    }

    res.send("Message deleted successfully!");
});

// Validate Message object from post request according to schema.
function validate(obj) {
    const schema = Joi.object({
        sender: Joi.string().required().min(2),
        recipient: Joi.string().required().min(2),
        title: Joi.string().required(),
        content: Joi.string().required(),
        date: Joi.date().format("DD-MM-YYYY").required(),
    });
    const { error } = schema.validate(obj);
    return error;
}

// Get index of user from 'users' given their name.
function getUserIndex(name) {
    return users.findIndex((x) => x.name === name);
}

// Get user object from 'users' given their name.
function getUserObject(name) {
    return users.find((x) => x.name === name);
}

// Get index of message from given mail box, given its ID.
function getMsgIndex(box, id) {
    return box.findIndex((x) => x.id === id);
}

// Get message object from given mail box, given its ID.
function getMsgObject(box, id) {
    return box.find((x) => x.id === id);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
