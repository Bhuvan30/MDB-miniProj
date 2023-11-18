const express = require("express");
const bodyParser = require("body-parser");
const path = require("path"); // Import the 'path' module
const mongoose = require("mongoose");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());

app.set("views", "../frontEnd/views");
app.set("view engine", "ejs");

app.use(express.static("../frontEnd/public"));

mongoose.connect("mongodb://127.0.0.1:27017/MDB-MiniDB", {
  useNewUrlParser: true,
});

const appointmentSchema = new mongoose.Schema({
  doctor: String,
  date: Date,
  time: String,
  // Add other fields as needed for each appointment
});

const patientSchema = new mongoose.Schema({
  name: String,
  medicalNo: String,
  age: Number,
  gender: String,
  email: String,
  password: String,
  myAppointments: [appointmentSchema],
});

const Patient = mongoose.model("patient", patientSchema);

// const patient = new Patient({
//   name: "John Doe",
//   medicalNo: "12345",
//   age: 30,
//   gender: "M",
//   email: "John_Doe@gmail.com",
//   password: "123",
//   myAppointments: [
//     {
//       doctor: "Dr. Smith",
//       date: new Date("2023-01-15"),
//       time: "10:30 AM",
//     },
//     {
//       doctor: "Dr. Johnson",
//       date: new Date("2023-02-05"),
//       time: "02:00 PM",
//     },
//   ],
// });

// patient.save();

const docAppSchema = new mongoose.Schema({
  doctor: String,
  date: Date,
  time: String,
  pName: String,
  pEmail: String,
});

// const DoctorApp = mongoose.model("doctorApp", docAppSchema);

const doctorSchema = new mongoose.Schema({
  name: String,
  UID: String,
  age: Number,
  gender: String,
  password: String,
  myAppointments: [docAppSchema],
});

const Doctor = mongoose.model("doctor", doctorSchema);

// const doctor = new Doctor({
//   name: "Dr. Smith",
//   UID: "D12345",
//   age: 40,
//   gender: "Male",
//   password: "123",
//   myAppointments: [
//     {
//       doctor: "Dr. Smith",
//       date: new Date("2023-01-15"),
//       time: "10:30 AM",
//       pName: "John Doe",
//       pEmail: "john.doe@example.com",
//     },
//     {
//       doctor: "Dr. Smith",
//       date: new Date("2023-02-05"),
//       time: "02:00 PM",
//       pName: "Jane Doe",
//       pEmail: "jane.doe@example.com",
//     },
//   ],
// });

// doctor.save();

let gUserType = undefined;
let gPatientInfo = undefined;
let isAuthenticated = false;

app.get("/", function (req, res) {
  res.render("index", {});
});

app.get("/login", function (req, res) {
  gUserType = req.query.userType;
  res.render("login", {});
});

app.get("/neworview", function (req, res) {
  if (isAuthenticated === true) {
    res.render("neworview", {});
  } else {
    res.redirect(`/`);
  }
});

app.get("/doctapp", function (req, res) {
  if (isAuthenticated === true) {
    res.render("doctapp", { doctapp: gDoctorInfo.myAppointments });
  } else {
    res.redirect(`/`);
  }
});

app.get("/pastapp", function (req, res) {
  console.log(isAuthenticated);
  if (isAuthenticated === false) {
    res.redirect(`/`);
  } else {
    res.render("pastapp", { pastApp: gPatientInfo.myAppointments });
  }
});

app.get("/appointment", function (req, res) {
  res.render("appointment", {});
});

app.post("/", async function (req, res) {
  let userType = req.body.userType;
  //   res.redirect("/test");
  // res.render("index", {});
  res.redirect(`/login?userType=${userType}`);
});

function someAsyncOperation(username, password) {
  return new Promise((resolve, reject) => {
    if (gUserType === "patient") {
      Patient.find({})
        .then((results) => {
          let info = null;
          for (let i = 0; i < results.length; i++) {
            if (
              results[i].name === username &&
              results[i].password === password
            ) {
              info = results[i];
              break;
            }
          }
          resolve(info);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    }
    if (gUserType === "doctor") {
      Doctor.find({})
        .then((results) => {
          let info = null;
          for (let i = 0; i < results.length; i++) {
            if (
              results[i].name === username &&
              results[i].password === password
            ) {
              info = results[i];
              break;
            }
          }
          resolve(info);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    }
  });
}

app.post("/login", async function (req, res) {
  try {
    let username = req.body.username;
    let password = req.body.password;
    let info = null;

    info = await someAsyncOperation(username, password);

    if (info !== null) {
      if (gUserType === "patient") {
        gPatientInfo = info;
        isAuthenticated = true;
        res.redirect("/neworview");
      }
      if (gUserType === "doctor") {
        gDoctorInfo = info;
        isAuthenticated = true;
        res.redirect("/doctapp");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }

  // res.redirect(`/neworview`);
});

app.post("/neworview", async function (req, res) {
  let appointmentType = req.body.appointmentType;

  if (appointmentType === "View Appointments") {
    res.redirect(`/pastapp`);
  }
  if (appointmentType === "Take Appointments") {
    res.redirect(`/appointment`);
  }
});

app.post("/appointment", async function (req, res) {
  let doctor = req.body.doctor;
  let date = req.body.date;
  let time = req.body.time;
  let name = gPatientInfo.name;
  let email = gPatientInfo.email;

  let ampm = req.body.ampm;

  let formattedTime = `${time} ${ampm}`;

  const newAppointment = {
    doctor: doctor,
    date: date,
    time: formattedTime,
    pName: name,
    pEmail: email,
  };

  const pNewAppointment = {
    doctor: doctor,
    date: date,
    time: formattedTime,
  };

  Doctor.updateOne(
    { name: doctor },
    { $push: { myAppointments: newAppointment } }
  )
    .then((result) => {
      console.log("Doctor updated successfully:");
    })
    .catch((err) => {
      console.error("Error updating doctor:", err);
    });

  Patient.updateOne(
    { name: name },
    { $push: { myAppointments: pNewAppointment } }
  )
    .then((result) => {
      console.log("Patient updated successfully:");
    })
    .catch((err) => {
      console.error("Error updating doctor:", err);
    });

  res.redirect(`/neworview`);
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
