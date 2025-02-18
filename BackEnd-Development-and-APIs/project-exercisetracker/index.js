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

// Serve HTML
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

// Schemas

const exerciseSchema = new mongoose.Schema({
	userId: String,
	username: String,
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: String,
});

const userSchema = new mongoose.Schema({
	username: String,
});

// Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Get all users
app.get('/api/users', async (_req, res) => {
	try {
		console.log('Action called to Get All Users');
		const users = await User.find({});
		if (users.length === 0) {
			return res.json({ message: 'There are no users entries in the database!' });
		}
		console.log(`TOTAL USERS IN DATABASE: ${users.length}`);
		res.json(users);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Failed to fetch all users failed!' });
	}
});

// Create a new user
app.post('/api/users', async (req, res) => {
	try {
		const inputUsername = req.body.username;
		console.log('Action called to create new user');
		console.log(`CREATING USER : ${inputUsername}`);

		const newUser = new User({ username: inputUsername });
		const savedUser = await newUser.save();

		res.json({ username: savedUser.username, _id: savedUser._id });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'User creation failed!' });
	}
});

// Add an exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
	try {
		const userId = req.params._id;
		const { description, duration, date } = req.body;

		console.log('Action called to add new Excercise');
		console.log(`Finding for USER _id [${userId}] ...`);

		const userInDb = await User.findById(userId);
		if (!userInDb) {
			return res.status(404).json({ message: 'User not found!' });
		}

		const newExercise = new Exercise({
			userId: userInDb._id,
			username: userInDb.username,
			description,
			duration: parseInt(duration),
			date: date || new Date().toISOString().substring(0, 10),
		});

		const savedExercise = await newExercise.save();

		res.json({
			username: userInDb.username,
			description: savedExercise.description,
			duration: savedExercise.duration,
			date: new Date(savedExercise.date).toDateString(),
			_id: userInDb._id,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Exercise creation failed!' });
	}
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
	try {
		const userId = req.params._id;
		const from = req.query.from || new Date(0).toISOString().substring(0, 10);
		const to = req.query.to || new Date().toISOString().substring(0, 10);
		const limit = Number(req.query.limit) || 0;

		console.log('Action to fetch User excercise log');
		console.log(`Fetching FOR USER _id [${userId}] ...`);

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found!' });
		}

		const exercises = await Exercise.find({
			userId,
			date: { $gte: from, $lte: to },
		})
			.select('description duration date')
			.limit(limit);

		const parsedDatesLog = exercises.map((exercise) => ({
			description: exercise.description,
			duration: exercise.duration,
			date: new Date(exercise.date).toDateString(),
		}));

		res.json({
			_id: user._id,
			username: user.username,
			count: parsedDatesLog.length,
			log: parsedDatesLog,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Fetching exercise logs failed!' });
	}
});

// Start Server
const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
