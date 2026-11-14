const { v4: uuidv4 } = require("uuid");
const connection = require("../config/db")
// Load environment variables
const dotenv = require('dotenv');
const path = require('path');

// Always load .env from the server folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.saltRounds);

const { setUser } = require("../service/auth");







//login
const handleUserLogin = (req, res) => {
  const { username, password } = req.body;// it need change input take email and password bcz email is enique

  const query = `SELECT * FROM users WHERE username=?`;
  connection.query(query, [username], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.status(401).alert("Invalid username or password");

    }
    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).end("Invalid username or password");
    }
    const token = setUser(user);
    //set token in cookie
    res.cookie("token", token);
    //  login success
    res.status(200).redirect("/");

  });
};


//redirect user dashboard
const handleUserDashboard = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id; // ✅ use id from JWT

  const userDataQ = `
    SELECT 
      u.username,
      u.email,
      f.floor_number,
      r.room_number,
      u.bed_no
    FROM users u
    LEFT JOIN floors f ON u.floor_id = f.id
    LEFT JOIN rooms r ON u.room_id = r.id
    WHERE u.id = ?
  `;

  const noticeQ = `
      SELECT *
      FROM notifications
      WHERE user_id = ?
      AND DATE(created_at) = (
      SELECT DATE(MAX(created_at))
      FROM notifications
     WHERE user_id = ?
)`;

  const BroadcastQ = `
         SELECT title, created_at
        FROM broadcast_messages
        WHERE created_at = (
        SELECT MAX(created_at)
        FROM broadcast_messages
)`;

  connection.query(userDataQ, [userId], (err, results) => {
    if (err) {

      return res.status(500).send("Database Error");
    }
    connection.query(noticeQ, [userId, userId], (err, noticeResults) => {
      if (err) {

        return res.status(500).send("Database Error");
      }

      connection.query(BroadcastQ, (err, broadcastResults) => {
        if (err) {

          return res.status(500).send("Database Error");
        }

        res.render("userDashboard", {
          user: results[0] || {},
          notices: noticeResults || {},
          broadcasts: broadcastResults || {},
        });
      });
    });
  });
};

const handleUserPaymentGET = (req, res) => {
  const userId = req.user.id;
  

  const cardQuery = `
     
  SELECT id, amount, due_date, late_fee, status
  FROM payments
  WHERE user_id = ?
  AND MONTH(due_date) = MONTH(CURDATE())
  AND YEAR(due_date) = YEAR(CURDATE())

   `;

  const historyQuery = `
     SELECT 
       amount,
       late_fee,
       (amount + late_fee) AS total,
       COALESCE(MAX(t.paid_date), p.due_date) AS date,
       p.status
     FROM payments p
     LEFT JOIN payment_transactions t 
     ON p.id = t.payment_id
     WHERE p.user_id = ?
     GROUP BY p.id
     ORDER BY p.due_date DESC
  `;


  connection.query(cardQuery, [userId], (err, cardResult) => {
    if (err) throw err;

    connection.query(historyQuery, [userId], (err, historyResult) => {
      if (err) throw err;



      return res.render("userPaymentDashboard", {
        card: cardResult[0] || {},
        histories: historyResult || {},
      });
    });
  });
};

const handleUsercomplaintGET = (req, res) => {

  const userId = req.user.id;

  let complainHistory = `SELECT 
             category,description,created_at,updated_at,status 
             from complaints 
             where user_id=?
             `;

  connection.query(complainHistory, [userId], (err, hist_Result) => {
    if (err) throw err;


    
    return res.render("userComplaint", {
      complaints: hist_Result,
    }

    );
  });
};

const handleUserNoticeGET = (req, res) => {
  const userId = req.user.id;
  const noticesQ = `Select 
        title ,message, created_at 
        from notifications 
        where user_id=?`;

  const broadcastQ = `Select 
        title ,content, created_at 
        from broadcast_messages 
        `;
  connection.query(broadcastQ, (err, broadcastResult) => {
    if (err) throw err;

    connection.query(noticesQ, [userId], (err, noticeResult) => {
      if (err) throw err;

      res.render("userNoticeBoard", {
        notices: noticeResult,
        broadcasts: broadcastResult,
      });
    });
  });
};

const handleAddComplaints = (req, res) => {
  const userId = req.user.id;
  if (!req.body) {
    return res.status(400).json({ error: "Request body missing" });
  }
  console.log(req.body);
  const { category, description } = req.body;

  if (!category) {
    return res.status(400).json({ error: "title is reqiured" });
  }

  if (!description) {
    return res.status(400).json({ error: "description is reqiured" });
  }

  const InsertComplaints = `
          INSERT complaints (user_id,category , description) values (?, ?, ?)`;

  connection.query(InsertComplaints, [userId, category, description], (err, complainAddResult) => {
    if (err) throw err;

    return res.redirect("/user/complaints");
  });
};



module.exports = {
 
  handleUserLogin,
  handleUserDashboard,
  handleUserPaymentGET,
  handleUsercomplaintGET,
  handleAddComplaints,
  handleUserNoticeGET
};