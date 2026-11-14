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

const handleAdminDashboard = (req, res) => {

  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id;

  const admindetails = `
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

  const countQuery = `SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'`;

  const unpaidPaymentQuery = `
    SELECT COUNT(*) AS totalUnpaid
    FROM payments
    WHERE status = 'pending'
  `;

  const recivedPaymentCount = `
  SELECT COUNT(*) AS total_payments_received
FROM payment_transactions;
  `;

  const Totalpayment = `
    SELECT
      MONTHNAME(due_date) AS month,
      SUM(amount) AS total_received
    FROM payments
    WHERE status = 'paid'
    GROUP BY MONTH(due_date), MONTHNAME(due_date)
    ORDER BY MONTH(due_date)
  `;

  const complaintQuery = `
    SELECT status, COUNT(*) AS count
    FROM complaints
    GROUP BY status
  `;


  const recentComplaintsQuery = `
  SELECT 
    c.category,
    c.description,
    c.status,
    c.created_at,
    u.username
  FROM complaints c
  JOIN users u ON c.user_id = u.id
  ORDER BY c.created_at DESC
  LIMIT 5

  `;

  // STEP 1 - user
  connection.query(admindetails, [userId], (err, adminResults) => {
    if (err) return res.status(500).send("Database Error");

    // STEP 2 - total users
    connection.query(countQuery, (err, countResults) => {
      if (err) return res.status(500).send("Database Error");

      // STEP 3 - unpaid
      connection.query(unpaidPaymentQuery, (err, unpaidResults) => {
        if (err) return res.status(500).send("Database Error");

        const totalUnpaid = unpaidResults?.[0]?.totalUnpaid || 0;
        // STEP 4 - paymentCount
        connection.query(recivedPaymentCount, (err, NoOfPaymentRecived) => {
          if (err) return res.status(500).send("Database Error");

          const totalNoOfrecived = NoOfPaymentRecived?.[0]?.total_payments_received || 0;

          // STEP 5 - paymentschart
          connection.query(Totalpayment, (err, paymentResults) => {
            if (err) return res.status(500).send("Database Error");

            const months = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];

            const revenueMap = {};

            paymentResults.forEach(row => {
              revenueMap[row.month] = Number(row.total_received);
            });

            const revenueChart = {
              labels: [],
              values: []
            };

            months.forEach(m => {
              revenueChart.labels.push(m);
              revenueChart.values.push(revenueMap[m] || 0);
            });

            // STEP 5 - complaints
            connection.query(complaintQuery, (err, complaintResults) => {
              if (err) return res.status(500).send("Database Error");

              const complaintMap = {
                pending: 0,
                in_progress: 0,
                resolved: 0
              };

              complaintResults.forEach(row => {
                complaintMap[row.status] = row.count;
              });

              const total =
                complaintMap.pending +
                complaintMap.in_progress +
                complaintMap.resolved;

              const complaintStats = {
                pending: complaintMap.pending,
                in_progress: complaintMap.in_progress,
                resolved: complaintMap.resolved,
                total,
                pendingPercent: total ? (complaintMap.pending / total) * 100 : 0,
                inProgressPercent: total ? (complaintMap.in_progress / total) * 100 : 0,
                resolvedPercent: total ? (complaintMap.resolved / total) * 100 : 0
              };


              //
              // STEP 1 - recent complaints
              connection.query(recentComplaintsQuery, (err, recentcomplaintsResults) => {
                if (err) return res.status(500).send("Database Error");

                // FINAL RENDER
                res.render("AdminDashboard", {
                  admin: adminResults[0],
                  totalUsers: countResults[0].totalUsers,
                  totalUnpaid,
                  totalNoOfrecived,
                  revenueChart,
                  complaintStats,
                  recentComplaints: recentcomplaintsResults,
                });
              });
            });
          });
        });

      });

    });

  });

};

const handleUsers = (req, res) => {

  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id;

  const adminDetails = `
     
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

  const userDetails = `
  SELECT
  u.id, 
    u.username,
    u.email,
    f.floor_number AS floor,
    r.room_number,
    u.bed_no
FROM users u
JOIN rooms r 
    ON u.room_id = r.id
JOIN floors f 
    ON u.floor_id = f.id
WHERE u.role = 'user'
ORDER BY f.floor_number, r.room_number, u.bed_no
  `;

  const userCountQuery = `
SELECT COUNT(*) AS totalUser
FROM users
WHERE role = 'user'
`;
  //step1--admin
  connection.query(adminDetails, [userId], (err, adminResults) => {
    if (err) return res.status(500).send("Database Error");


    // STEP 2 - userDetails
    connection.query(userDetails, (err, userResults) => {
      if (err) return res.status(500).send("Database Error");

      // STEP 2 - user  count
      connection.query(userCountQuery, (err, usercountResults) => {
        if (err) return res.status(500).send("Database Error");



        return res.render("AdminStudent", {
          admin: adminResults[0],
          users: userResults,
          totalUser: usercountResults[0].totalUser,
        });
      });
    });
  });
};

//signup
const handleUserSignup = async (req, res) => {
  const { username, email, password, floor_id, room_id, bed_no } = req.body;
  const user_id = uuidv4();

  console.log(saltRounds);
  const hash_password = await bcrypt.hash(password, saltRounds);

  let query = `INSERT INTO users(id , username, email, password,  floor_id, room_id, bed_no) VALUES
      (?, ?, ?, ?, ?, ?, ?) `

  try {
    connection.query(
      query,
      [user_id, username, email, hash_password, floor_id, room_id, bed_no],
      (err, result) => {
        if (err) {
          console.error("Error inserting users:", err.message);
          return res.status(500).send("Signup failed");
        }
        console.log("User inserted successfully");
        res.status(201).send("Signup successful");
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err.message);
    res.status(500).send("Signup failed");
  };
  return res.redirect("/admin/users");
};


const handleRooms = (req, res) => {

  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id;

  const adminDetails = `
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

  const floordetails = `
        SELECT 
            f.floor_number,
            r.room_number,
            r.total_beds,
            r.available_beds
        FROM floors f
        JOIN rooms r ON f.id = r.floor_id
        ORDER BY f.floor_number, r.room_number
    `;

  // Step 1: Admin Details
  connection.query(adminDetails, [userId], (err, adminResults) => {

    if (err) {
      return res.status(500).send("Database Error");
    }

    // Step 2: Floor Details
    connection.query(floordetails, (err, floorResults) => {

      if (err) {
        return res.status(500).send("Database Error");
      }

      const floorsMap = {};

      floorResults.forEach(row => {

        // Create floor object if not exists
        if (!floorsMap[row.floor_number]) {

          floorsMap[row.floor_number] = {
            floor_number: row.floor_number,
            rooms: []
          };
        }

        // Push room into floor
        floorsMap[row.floor_number].rooms.push({
          room_number: row.room_number,
          total_beds: row.total_beds,
          available_beds: row.available_beds
        });

      });

      // Convert object → array
      const floors = Object.values(floorsMap);

      

      // Render ONCE
      return res.render("AdminRooms", {
        admin: adminResults[0],
        floors
      });

    });

  });

}

const handlePayments = (req, res) => {

  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id;



  const adminDetails = `
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

  //payments
  const paymentHistory = `
            
SELECT
    pt.id AS transaction_id,
    u.username AS username,

    p.amount,
    p.late_fee,

    (p.amount + p.late_fee) AS total,

    pt.paid_amount,
    pt.payment_method,
    pt.paid_date,

    CASE
        WHEN p.late_fee > 0
             AND p.status = 'paid'
            THEN 'Paid Late'

        WHEN p.status = 'paid'
            THEN 'Paid'

        WHEN p.status = 'pending'
            THEN 'Unpaid'

        WHEN p.status = 'late'
            THEN 'Late'

        ELSE p.status
    END AS payment_status

FROM payment_transactions pt

JOIN payments p
    ON pt.payment_id = p.id

JOIN users u
    ON p.user_id = u.id

ORDER BY pt.created_at DESC;

    `;

  // Step 1: Admin Details
  connection.query(adminDetails, [userId], (err, adminResults) => {

    if (err) {
      return res.status(500).send("Database Error");
    }

    // Step 2: Payment Details
    connection.query(paymentHistory, (err, paymentResults) => {

      if (err) {
        return res.status(500).send("Database Error");
      }


      // Render ONCE
      return res.render("AdminPayment", {
        admin: adminResults[0],
        payments: paymentResults,

      });
    });
  });



};

const handleComplaints = (req, res) => {


  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id;



  const adminDetails = `
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

  const complaintsDetails = `
    SELECT 
    c.id,
    u.username AS username,

    CASE
        WHEN c.category = 'wifi' THEN 'WiFi issue'
        WHEN c.category = 'electricity' THEN 'Electrical issue'
        WHEN c.category = 'water' THEN 'Water supply issue'
        WHEN c.category = 'cleaning' THEN 'Cleaning issue'
        WHEN c.category = 'furniture' THEN 'Furniture issue'
        WHEN c.category = 'noise' THEN 'Noise complaint'
        ELSE 'Other issue'
    END AS category,

    c.description,

    DATE(c.created_at) AS date,

    c.status

FROM complaints c
JOIN users u
    ON c.user_id = u.id;
    `;

  // Step 1: Admin Details
  connection.query(adminDetails, [userId], (err, adminResults) => {

    if (err) {
      return res.status(500).send("Database Error");
    }

    // Step 2: Complaints Details
    connection.query(complaintsDetails, (err, complaintsResults) => {

      if (err) {
        return res.status(500).send("Database Error");
      }


      // Render ONCE
      return res.render("AdminComplaint", {
        admin: adminResults[0],
        complaints: complaintsResults,
      });
    });
  });


};

const handleComplaintProgress = (req, res) => {

  const complaintId = req.params.id;

  const query = `
        UPDATE complaints
        SET status = 'in_progress'
        WHERE id = ?
    `;

  connection.query(query, [complaintId], (err) => {

    if (err) {
      return res.status(500).send("Database Error");
    }

    res.redirect("/admin/complaints");
  });
};


const handleComplaintResolved = (req, res) => {

  const complaintId = req.params.id;

  const query = `
        UPDATE complaints
        SET status = 'resolved'
        WHERE id = ?
    `;

  connection.query(query, [complaintId], (err) => {

    if (err) {
      return res.status(500).send("Database Error");
    }

    res.redirect("/admin/complaints");
  });
};



const handleGetbroadcast = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const userId = req.user.id;



  const adminDetails = `
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


  const broadcastQuery = `
        SELECT 
            bm.id,
            bm.title,
            bm.content,
            DATE(bm.created_at) AS date,
            u.username AS created_by
        FROM broadcast_messages bm
        JOIN users u
            ON bm.created_by = u.id
        ORDER BY bm.created_at DESC
    `;


  // Step 1: Admin Details
  connection.query(adminDetails, [userId], (err, adminResults) => {

    if (err) {
      return res.status(500).send("Database Error");
    }


    //step-2 Broadcast Messages
    connection.query(broadcastQuery, (err, messageResults) => {

      if (err) {
        return res.status(500).send("Database Error");
      }


      // Render ONCE
      return res.render("AdminBoardcast", {
        admin: adminResults[0],
        messages: messageResults,

      });
    });
  });
};

const handlePostBroadcast = (req, res) => {

  if (!req.user) {
    return res.redirect("/login");
  }

  const { title, content } = req.body;

  const created_by = req.user.id;

  const query = `
        INSERT INTO broadcast_messages (
            title,
            content,
            created_by
        )
        VALUES (?, ?, ?)
    `;

  connection.query(
    query,
    [title, content, created_by],
    (err) => {

      if (err) {
        return res.status(500).send("Database Error");
      }

      res.redirect("/admin/broadcasts");
    }
  );
};

module.exports = {
  handleAdminDashboard,
  handleUsers,
  handleUserSignup,
  handleRooms,
  handlePayments,
  handleComplaints,
  handleComplaintProgress,
  handleComplaintResolved,
  handleGetbroadcast,
  handlePostBroadcast,
}