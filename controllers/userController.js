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

// =====================================================
// CREATE USER
// =====================================================

export async function createUser(req, res) {
    try {
        const { email, firstName, lastName, password } = req.body;

        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            role: "user",
            isBlock: false,
            isEmailVerified: false,
            image: "/user.png",
        });

        await user.save();

        return res.status(201).json({
            message: "User created successfully",
        });

    } catch (err) {
        console.error("CREATE USER ERROR:", err);

        return res.status(500).json({
            message: "Failed to create user",
            error: err.message,
        });
    }
}


// =====================================================
// LOGIN
// =====================================================

export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.isBlock) {
            return res.status(403).json({
                message:
                    "Your account has been blocked. Please contact admin.",
            });
        }

        const isPasswordMatching = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatching) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                image: user.image,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                image: user.image,
            },
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);

        return res.status(500).json({
            message: "Login failed",
            error: err.message,
        });
    }
}


// =====================================================
// ADMIN CHECK
// =====================================================

export function isAdmin(req) {
    return req.user && req.user.role === "admin";
}


// =====================================================
// CUSTOMER CHECK
// =====================================================

export function isCustomer(req) {
    return req.user && req.user.role === "user";
}


// =====================================================
// GET CURRENT USER
// =====================================================

export function getUser(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    return res.json(req.user);
}


// =====================================================
// GOOGLE LOGIN
// =====================================================

export async function googleLogin(req, res) {
    const token = req.body.token;

    if (!token) {
        return res.status(400).json({
            message: "Token is required",
        });
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

        let user = await User.findOne({
            email: googleUser.email,
        });

        if (!user) {
            user = new User({
                email: googleUser.email,
                firstName: googleUser.given_name || "",
                lastName: googleUser.family_name || "",
                password: await bcrypt.hash(
                    Math.random().toString(36) + Date.now(),
                    10
                ),
                role: "user",
                isBlock: false,
                isEmailVerified:
                    googleUser.email_verified || false,
                image: googleUser.picture || "/user.png",
            });

            await user.save();
        }

        if (user.isBlock) {
            return res.status(403).json({
                message:
                    "Your account has been blocked. Please contact admin.",
            });
        }

        const jwtToken = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                image: user.image,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.json({
            message: "Login successful",
            token: jwtToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                image: user.image,
            },
        });

    } catch (err) {
        console.error("GOOGLE LOGIN ERROR:", err);

        return res.status(500).json({
            message: "Failed to login with google",
            error: err.message,
        });
    }
}


// =====================================================
// GET ALL USERS
// =====================================================

export async function getAllUsers(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }

    try {
        const users = await User.find().select("-password");

        return res.json(users);

    } catch (err) {
        console.error("GET USERS ERROR:", err);

        return res.status(500).json({
            message: "Failed to get users",
            error: err.message,
        });
    }
}


// =====================================================
// BLOCK / UNBLOCK USER
// =====================================================

export async function blockOrUnblockUser(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }

    if (req.user.email === req.params.email) {
        return res.status(400).json({
            message: "You cannot block yourself",
        });
    }

    try {
        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            { isBlock: req.body.isBlock },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.json({
            message: "User block status updated successfully",
        });

    } catch (err) {
        console.error("BLOCK USER ERROR:", err);

        return res.status(500).json({
            message: "Failed to block/unblock user",
            error: err.message,
        });
    }
}


// =====================================================
// SEND OTP
// =====================================================

export async function sendOTP(req, res) {
    const email = req.params.email;

    if (!email) {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    const otp = Math.floor(
        100000 + Math.random() * 900000
    );

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        await OTP.deleteMany({ email });

        const newOTP = new OTP({
            email,
            otp,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await newOTP.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP for Password Reset",

            text:
                `Hi! Your one-time passcode is ${otp}. ` +
                `It’s valid for 10 minutes. ` +
                `If you didn’t request this, ignore this email. ` +
                `— Crystal Beauty Clear`,

            html: getDesignedEmail({
                otp,
                firstName: user.firstName || "there",
                brandName: "Crystal Beauty Clear",
                supportEmail: "support@cbc.com",
                colors: {
                    accent: "#fa812f",
                    primary: "#fef3e2",
                    secondary: "#393e46",
                },
            }),
        });

        return res.json({
            message: "OTP sent to your email",
        });

    } catch (err) {
        console.error("SEND OTP ERROR:", err);

        return res.status(500).json({
            message: "Failed to send OTP",
            error: err.message,
        });
    }
}


// =====================================================
// CHANGE PASSWORD VIA OTP
// =====================================================

export async function changePasswordViaOTP(req, res) {
    const {
        email,
        otp,
        newPassword,
    } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({
            message: "Email, OTP and new password are required",
        });
    }

    try {
        const otpRecord = await OTP.findOne({
            email,
            otp,
			expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            return res.status(400).json({
                message: "Invalid OTP",
            });
        }

        await OTP.deleteMany({ email });

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        await User.updateOne(
            { email },
            { password: hashedPassword }
        );

        return res.json({
            message: "Password changed successfully",
        });

    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);

        return res.status(500).json({
            message: "Failed to change password",
            error: err.message,
        });
    }
}


// =====================================================
// UPDATE USER DATA
// =====================================================

export async function updateUserData(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    try {
        await User.updateOne(
            { email: req.user.email },
            {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                image: req.body.image,
            }
        );

        return res.json({
            message: "User data updated successfully",
        });

    } catch (err) {
        console.error("UPDATE USER ERROR:", err);

        return res.status(500).json({
            message: "Failed to update user data",
            error: err.message,
        });
    }
}


// =====================================================
// UPDATE PASSWORD
// =====================================================

export async function updatePassword(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const {
        currentPassword,
        newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Missing fields",
        });
    }

    try {
        const user = await User.findOne({
            email: req.user.email,
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        await User.updateOne(
            { email: req.user.email },
            { password: hashedPassword }
        );

        return res.json({
            message: "Password updated successfully",
        });

    } catch (err) {
        console.error("UPDATE PASSWORD ERROR:", err);

        return res.status(500).json({
            message: "Failed to update password",
            error: err.message,
        });
    }
}