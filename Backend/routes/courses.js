const express = require("express");

const CourseController = require("../controllers/courses");

const checkAuth = require('../middleware/check-auth');
const extractFile = require('../middleware/file');

const router = express.Router();

router.post("", checkAuth, extractFile, CourseController.createCourse);

router.put("/:_id", extractFile, CourseController.updateCourse);

router.get("", CourseController.getCourses);

router.get("/:_id", CourseController.getCourse);

router.delete("/:_id", checkAuth, CourseController.deleteCourse);

module.exports = router;