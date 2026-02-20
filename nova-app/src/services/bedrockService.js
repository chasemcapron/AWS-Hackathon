import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  }
});

export const generateTargetOutput = async (companyName, context) => {
  const prompt = `
    You are an expert business analyst preparing a Texas A&M interviewer.
    Analyze the following context for the company ${companyName}:
    
    <context>
    ${context}
    </context>
    
    Output a strictly formatted JSON object matching the "Target Output Schema". Do not include any markdown formatting, preamble, or conversational text. Return ONLY the JSON.
    
    Schema format required:
    {
      "revenueMechanics": { "whoPays": "", "when": "", "recurring": "", "fulfillmentDependencies": "", "marginBand": "" },
      "constraintMap": ["Constraint 1", "Constraint 2", "Constraint 3"],
      "marketStructure": { "regulatory": "", "fragmentation": "", "barriers": "", "disintermediation": "" },
      "strategicTensions": ["Signal 1", "Signal 2", "Signal 3"],
      "aiOpportunities": ["Area 1", "Area 2", "Area 3"]
    }
  `;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1500,
    temperature: 0.2, // Low temperature for consistent JSON
    messages: [{ role: "user", content: prompt }],
  };

  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0", 
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const jsonString = responseBody.content[0].text;
    return JSON.parse(jsonString); // Returns the clean JS object
  } catch (error) {
    console.error("Bedrock Generation Error:", error);
    throw error;
  }
};
