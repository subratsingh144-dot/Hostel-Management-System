const express = require("express");
const router = express.Router();
const connection = require("../config/db");
const { checkForAuthentication } = require("../middleware/auth");

const {
    handleAdminDashboard,
    handleUsers,
    handleRooms,
    handlePayments,
    handleComplaints,
    handleComplaintProgress,
    handleComplaintResolved,
    handleGetbroadcast,
    handlePostBroadcast,
} = require("../controller/adminController");

 router.use(checkForAuthentication);

router.get("/adminDashboard", handleAdminDashboard);


router.get("/users", handleUsers);
router.get("/AllRooms", handleRooms);

router.get("/payments", handlePayments);

router.get("/complaints", handleComplaints);

// Start Complaint progress
router.post("/complaints/:id/start", handleComplaintProgress);


// Resolve Complaint
router.post("/complaints/:id/resolve", handleComplaintResolved);


// Broadcast 
router.get("/broadcasts", handleGetbroadcast);


router.post("/broadcasts",handlePostBroadcast);

router.post('/deleteUser/:id',  (req, res) => {
  try {

const deleteuserQuery= `DELETE FROM users WHERE id = ?`;
     connection.query(deleteuserQuery, [req.params.id], (err) => {

        if (err) {
            return res.status(500).send("Database Error");
        }
    

    res.redirect('/admin/users');
   });
  } catch (err) {
    
    res.send("Delete failed");
  }
});


module.exports = router;