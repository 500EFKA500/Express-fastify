import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { getDb } from "../database/database.js";

const router = express.Router();
const profileServiceUrl =
    process.env.PROFILE_SERVICE_URL ||
    `http://localhost:${Number(process.env.PROFILE_PORT) || 3001}`;

function createAuthToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not set");
    }

    return jwt.sign(
        { userId: user.id, login: user.login },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

router.get("/config", (req, res) => {
    return res.json({
        success: true,
        profileServiceUrl,
    });
});

router.post("/register", async (req, res) => {
    try {
        const login = req.body.login?.trim();
        const password = req.body.password;

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                error: "Login and password are required",
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                success: false,
                error: "Password must contain at least 4 symbols",
            });
        }

        const db = getDb();
        const existingUser = await db.query(
            "SELECT id FROM users WHERE login = $1",
            [login]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: "Login is already taken",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const createdUser = await db.query(
            "INSERT INTO users(login, password) VALUES($1, $2) RETURNING id, login",
            [login, hashedPassword]
        );
        const user = createdUser.rows[0];
        const token = createAuthToken(user);

        return res.json({
            success: true,
            message: "Registration success",
            user,
            token,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Failed to register user",
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const login = req.body.login?.trim();
        const password = req.body.password;

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                error: "Login and password are required",
            });
        }

        const db = getDb();
        const result = await db.query(
            "SELECT * FROM users WHERE login = $1",
            [login]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid login or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "Invalid login or password",
            });
        }
        const authUser = {
            id: user.id,
            login: user.login,
        };
        const token = createAuthToken(authUser);

        return res.json({
            success: true,
            message: "Auth success",
            user: authUser,
            token,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Failed to login",
        });
    }
});

export default router;
