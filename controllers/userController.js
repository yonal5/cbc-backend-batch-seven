
import axios from "axios";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import OTP from "../models/otpModel.js";
import getDesignedEmail from "../lib/emailDesigner.js";

dotenv.config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.APP_PASSWORD,
	},
});

export const createUser = async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hashedPassword,
    });

    await user.save();
    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};
export function createUserOld(req, res) {
	const { firstName, lastName, email, password } = req.body;

	const hashedPassword = bcrypt.hashSync(password, 10);

	const user = new User({
		firstName,
		lastName,
		email,
		password: hashedPassword,
	});	

	user
		.save()
		.then(() => {
			res.json({
				message: "User created successfully",
			});
		})
		.catch(() => {
			res.json({
				message: "Failed to create user",
			});
		});
}

export const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isBlock)
      return res
        .status(403)
        .json({ message: "Your account has been blocked. Contact admin." });

    const isMatch = bcrypt.compareSync(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET USER ----------------
export const getUser = (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  res.json({
    id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    role: req.user.role,
    image: req.user.image,
  });
};

export function isAdmin(req) {
	if (req.user == null) {
		return false;
	}
	if (req.user.role != "admin") {
		return false;
	}

	return true;
}
export const updateUser = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { firstName, lastName, image } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, image },
      { new: true }
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        image: updatedUser.image,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export function isCustomer(req) {
	if (req.user == null) {
		return false;
	}
	if (req.user.role != "user") {
		return false;
	}

	return true;
}

export async function googleLogin(req, res) {
	const token = req.body.token;

	if (token == null) {
		res.status(400).json({
			message: "Token is required",
		});
		return;
	}
	try {
		const googleResponse = await axios.get(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		const googleUser = googleResponse.data;

		const user = await User.findOne({
			email: googleUser.email,
		});

		if (user == null) {
			const newUser = new User({
				email: googleUser.email,
				firstName: googleUser.given_name,
				lastName: googleUser.family_name,
				password: "abc",
				isEmailVerified: googleUser.email_verified,
				image: googleUser.picture,
			});

			let savedUser = await newUser.save();

			const jwtToken = jwt.sign(
				{
					email: savedUser.email,
					firstName: savedUser.firstName,
					lastName: savedUser.lastName,
					role: savedUser.role,
					isEmailVerified: savedUser.isEmailVerified,
					image: savedUser.image,
				},
				process.env.JWT_SECRET
			);
			res.json({
				message: "Login successful",
				token: jwtToken,
				user: {
					email: savedUser.email,
					firstName: savedUser.firstName,
					lastName: savedUser.lastName,
					role: savedUser.role,
					isEmailVerified: savedUser.isEmailVerified,
					image: savedUser.image,
				},
			});
			return;
		} else {
			//login the user
			if (user.isBlock) {
				res.status(403).json({
					message: "Your account has been blocked. Please contact admin.",
				});
				return;
			}
			const jwtToken = jwt.sign(
				{
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					isEmailVerified: user.isEmailVerified,
					image: user.image,
				},
				process.env.JWT_SECRET
			);
			res.json({
				message: "Login successful",
				token: jwtToken,
				user: {
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					isEmailVerified: user.isEmailVerified,
					image: user.image,
				},
			});
			return;
		}
	} catch (err) {
		res.status(500).json({
			message: "Failed to login with google",
		});
		return;
	}
}

export async function getAllUsers(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}
	try {
		const users = await User.find();
		res.json(users);
	} catch (err) {
		res.status(500).json({
			message: "Failed to get users",
		});
	}
}

export async function blockOrUnblockUser(req, res) {
	console.log(req.user);
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}

	if (req.user.email === req.params.email) {
		res.status(400).json({
			message: "You cannot block yourself",
		});
		return;
	}

	try {
		await User.updateOne(
			{
				email: req.params.email,
			},
			{
				isBlock: req.body.isBlock,
			}
		);

		res.json({
			message: "User block status updated successfully",
		});
	} catch (err) {
		res.status(500).json({
			message: "Failed to block/unblock user",
		});
	}
}

export async function sendOTP(req, res) {
	const email = req.params.email;
	if (email == null) {
		res.status(400).json({
			message: "Email is required",
		});
		return;
	}

	// 100000 - 999999
	const otp = Math.floor(100000 + Math.random() * 900000);

	try {
		const user = await User.findOne({ email: email });

		const firstName = user ? user.firstName : "there";

		if (user == null) {
			res.status(404).json({
				message: "User not found",
			});
			return;
		}

		await OTP.deleteMany({
			email: email,
		});

		const newOTP = new OTP({
			email: email,
			otp: otp,
		});
		await newOTP.save();

		

		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Your OTP for Password Reset",
			text: `Hi! Your one-time passcode is ${otp}. It’s valid for 10 minutes. If you didn’t request this, ignore this email. — ${
				"Crystal Beauty Clear"
			}`,
			html: getDesignedEmail({
				otp,
				firstName,
				brandName: "Crystal Beauty Clear",
				supportEmail: "support@cbc.com",
				colors: { accent: "#fa812f", primary: "#fef3e2", secondary: "#393e46" },
			}),
		});

		res.json({
			message: "OTP sent to your email",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Failed to send OTP",
		});
	}
}

export const updateMyPassword = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ message: "Current and new password required" });

  try {
    const isMatch = bcrypt.compareSync(currentPassword, req.user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    req.user.password = hashedPassword;
    await req.user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update password" });
  }
};
