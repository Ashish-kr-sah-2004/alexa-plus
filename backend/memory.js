import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'user-profiles.json');

// Initialize AWS DynamoDB if credentials are provided
let dynamo = null;
const awsKey = process.env.AWS_ACCESS_KEY_ID;
if (awsKey && !awsKey.startsWith("YOUR_") && awsKey !== "YOUR_AWS_ACCESS_KEY_HERE") {
    try {
        dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
        console.log("☁️ Connected to Amazon DynamoDB for cloud memory.");
    } catch (e) {
        console.warn("DynamoDB initialization failed, falling back to local persistent store.");
    }
}

// Default initial profile for new learners
const DEFAULT_PROFILE = {
    userId: "user123",
    name: "Candidate",
    streakDays: 3,
    problemsSolved: 4,
    weakTopics: ["Time Complexity O(n²)", "Recursion Stack Overflow"],
    strongTopics: ["Binary Search", "HashMaps"],
    currentMode: "tech_coach",
    lastPracticed: new Date().toISOString(),
    recentEvaluations: [
        {
            topic: "Array Rotation",
            approach: "Nested loops",
            verdict: "Needs Time Complexity Practice",
            timestamp: new Date(Date.now() - 86400000).toISOString()
        }
    ]
};

function readAllProfiles() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
            const initialData = { user123: DEFAULT_PROFILE };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(content || '{}');
    } catch (e) {
        console.error("Error reading local profiles, resetting:", e.message);
        return { user123: DEFAULT_PROFILE };
    }
}

function writeAllProfiles(data) {
    try {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error saving local profiles:", e.message);
    }
}

export async function getUserProfile(userId = "user123") {
    // 1. Try DynamoDB if active
    if (dynamo) {
        try {
            const command = new GetItemCommand({
                TableName: "AlexaPlusProfiles",
                Key: { UserId: { S: userId } }
            });
            const res = await dynamo.send(command);
            if (res.Item) {
                return JSON.parse(res.Item.ProfileData.S);
            }
        } catch (e) {
            console.warn("DynamoDB fetch error, falling back to local store:", e.message);
        }
    }

    // 2. Local Persistent File Store
    const all = readAllProfiles();
    if (!all[userId]) {
        all[userId] = { ...DEFAULT_PROFILE, userId };
        writeAllProfiles(all);
    }
    return all[userId];
}

export async function saveUserProfile(userId = "user123", updates = {}) {
    const all = readAllProfiles();
    const current = all[userId] || { ...DEFAULT_PROFILE, userId };
    const updated = {
        ...current,
        ...updates,
        lastPracticed: new Date().toISOString()
    };
    all[userId] = updated;
    writeAllProfiles(all);

    // Sync to DynamoDB in background if credentials exist
    if (dynamo) {
        try {
            const command = new PutItemCommand({
                TableName: "AlexaPlusProfiles",
                Item: {
                    UserId: { S: userId },
                    ProfileData: { S: JSON.stringify(updated) },
                    UpdatedAt: { S: new Date().toISOString() }
                }
            });
            await dynamo.send(command);
        } catch (e) {
            console.warn("DynamoDB save warning:", e.message);
        }
    }

    return updated;
}

export async function logEvaluation(userId = "user123", evaluation = {}) {
    const profile = await getUserProfile(userId);

    const weakTopics = new Set(profile.weakTopics || []);
    const strongTopics = new Set(profile.strongTopics || []);

    if (evaluation.weakness) {
        weakTopics.add(evaluation.weakness);
    }
    if (evaluation.strength) {
        strongTopics.add(evaluation.strength);
        // If they got better at a weak topic, promote it
        weakTopics.delete(evaluation.strength);
    }

    const recentEvaluations = [
        {
            topic: evaluation.topic || "Algorithm Practice",
            approach: evaluation.approach || "Spoken Reasoning",
            verdict: evaluation.verdict || "Completed",
            timestamp: new Date().toISOString()
        },
        ...(profile.recentEvaluations || []).slice(0, 9)
    ];

    const problemsSolved = (profile.problemsSolved || 0) + (evaluation.solved ? 1 : 0);

    return await saveUserProfile(userId, {
        weakTopics: Array.from(weakTopics),
        strongTopics: Array.from(strongTopics),
        recentEvaluations,
        problemsSolved
    });
}
