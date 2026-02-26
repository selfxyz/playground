import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        try {
            const payload = req.body;

            const response = await fetch("https://api.staging.self.xyz/post-deferred-linking-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            console.error("Proxy error:", error);
            res.status(500).json({ error: "Failed to fetch token" });
        }
    }
}
