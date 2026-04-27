import { getDb } from "../database/database.js";
import { verify } from "../middleware/auth.js";

export async function profileRoutes(fastify) {
    fastify.get("/api/profile", { preHandler: verify }, async (req, reply) => {
        const db = getDb();
        const result = await db.query(
            `
            SELECT
                users.id,
                users.login,
                COALESCE(profiles.full_name, '') AS full_name,
                COALESCE(profiles.bio, '') AS bio,
                TO_CHAR(profiles.birth_date, 'YYYY-MM-DD') AS birth_date
            FROM users
            LEFT JOIN profiles ON profiles.user_id = users.id
            WHERE users.id = $1
            `,
            [req.user.userId]
        );
        const user = result.rows[0];

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: "User not found",
            });
        }

        return {
            success: true,
            profile: {
                id: user.id,
                login: user.login,
                fullName: user.full_name,
                bio: user.bio,
                birthDate: user.birth_date || "",
            },
        };
    });

    fastify.post("/api/profile", { preHandler: verify }, async (req, reply) => {
        const fullName = req.body.fullName?.trim() ?? "";
        const bio = req.body.bio?.trim() ?? "";
        const birthDate = req.body.birthDate || null;
        const db = getDb();

        const userResult = await db.query(
            "SELECT id, login FROM users WHERE id = $1",
            [req.user.userId]
        );
        const user = userResult.rows[0];

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: "User not found",
            });
        }

        const savedProfile = await db.query(
            `
            INSERT INTO profiles(user_id, full_name, bio, birth_date)
            VALUES($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                bio = EXCLUDED.bio,
                birth_date = EXCLUDED.birth_date
            RETURNING full_name, bio, TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date
            `,
            [user.id, fullName, bio, birthDate]
        );

        return {
            success: true,
            message: "Profile saved",
            profile: {
                login: user.login,
                fullName: savedProfile.rows[0].full_name,
                bio: savedProfile.rows[0].bio,
                birthDate: savedProfile.rows[0].birth_date || "",
            },
        };
    });
}
