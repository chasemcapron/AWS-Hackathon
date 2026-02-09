// This simulates the behavior of AWS Bedrock for local testing
export const getMockNudge = () => {
  const nudges = [
    "Mention a specific technical challenge you overcame.",
    "The interviewer is asking about conflict; use the STAR method.",
    "Focus more on the 'Result' quadrant of your answer.",
    "Good pacing. Try to connect this to the company's 'Ownership' principle."
  ];
  return nudges[Math.floor(Math.random() * nudges.length)];
};

export const mockSTARAnalysis = {
  situation: 80,
  task: 60,
  action: 30,
  result: 0
};