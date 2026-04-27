import jwt from "jsonwebtoken";

export async function verify(req, reply) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({
            success: false,
            error: "Authorization token is required",
        });
    }

    if (!process.env.JWT_SECRET) {
        return reply.status(500).send({
            success: false,
            error: "JWT_SECRET is not set",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch {
        return reply.status(401).send({
            success: false,
            error: "Invalid token",
        });
    }
}
