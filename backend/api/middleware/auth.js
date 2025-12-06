const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

function getTokenFromRequest(req) {
    // Try Authorization header first (case-insensitive)
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
        const token = authHeader.slice(7).trim();
        if (token && token !== "null" && token !== "undefined") return token;
    }

    // Fallback to cookie named accessToken if present
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        const cookies = cookieHeader.split(";").map(c => c.trim());
        for (const cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "accessToken" && value) {
                return decodeURIComponent(value);
            }
        }
    }

    return null;
}

function authMiddleware(req, res, next) {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "missing_token"
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    error: "token_expired"
                });
            }
            return res.status(401).json({
                success: false,
                error: "invalid_token"
            });
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            error: "server_error"
        });
    }
}

module.exports = authMiddleware;
