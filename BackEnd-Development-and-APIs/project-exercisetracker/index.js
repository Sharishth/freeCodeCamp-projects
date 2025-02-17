const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Define Schemas
const userSchema = new mongoose.Schema({
	username: String,
});

const exerciseSchema = new mongoose.Schema({
	userId: String,
	username: String,
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: String,
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create user then, res.json({ username: "", _id: "" })
app.post("/api/users", async (req, res) => { // <-- Changed from "/api/user" to "/api/users"
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });

    const newUser = new User({ username });
    await newUser.save();

    res.json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "username _id"); // Select only username & _id
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add an exercise for a user
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    // Validate required fields
    if (!description || !duration) {
      return res.status(400).json({ error: "Description and duration are required" });
    }

    // Check if user exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Use provided date or default to current date
    const exerciseDate = date ? new Date(date) : new Date();
    if (isNaN(exerciseDate)) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Create and save exercise entry
    const newExercise = new Exercise({
      userId: _id,
      username: user.username,
      description,
      duration: parseInt(duration),
      date: exerciseDate.toDateString(), // Convert date to readable format
    });

    await newExercise.save();

    // Add the exercise to the user object
    user.exercises = user.exercises || [];
    user.exercises.push({
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date,
    });

    // Save updated user with exercises
    await user.save();

    // Respond with the user object (including the new exercise)
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get a user's exercise log
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Check if user exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build the query for exercises
    let query = {};
    
    // If 'from' is provided, convert it to a date and filter exercises after that date
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate)) return res.status(400).json({ error: "Invalid 'from' date format" });
      query.date = { $gte: fromDate.toDateString() };  // Use $gte to filter exercises after 'from' date
    }

    // If 'to' is provided, convert it to a date and filter exercises before that date
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate)) return res.status(400).json({ error: "Invalid 'to' date format" });
      query.date = { ...query.date, $lte: toDate.toDateString() };  // Use $lte to filter exercises before 'to' date
    }

    // Get the exercises matching the query, with a limit if provided
    let exercises = await Exercise.find({ userId: _id, ...query }).limit(limit ? parseInt(limit) : 0);

    // Count the total number of exercises
    const count = exercises.length;

    // Format the exercise logs
    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    }));

    // Return the user object with the exercise log and count
    res.json({
      username: user.username,
      count: count,
      _id: user._id,
      log: log,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


// Start Server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
