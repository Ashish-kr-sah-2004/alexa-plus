import 'dotenv/config';
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

async function run() {
  try {
    const data = await client.send(new CreateTableCommand({
      TableName: "AlexaPlusProfiles",
      AttributeDefinitions: [
        { AttributeName: "UserId", AttributeType: "S" }
      ],
      KeySchema: [
        { AttributeName: "UserId", KeyType: "HASH" }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }));
    console.log("🎉 Success! DynamoDB Table 'AlexaPlusProfiles' created.");
  } catch (err) {
    if (err.name === "ResourceInUseException") {
        console.log("✅ Table already exists! You're good to go.");
    } else {
        console.error("❌ Error creating table. Are your AWS Keys correct in .env?", err);
    }
  }
}
run();
