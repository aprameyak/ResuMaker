import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // We'll make calls from the server side
});

export async function generateResumeContent(formData: any) {
  try {
    const completion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      max_tokens: 500,
      temperature: 0.7,
      prompt: `As a professional resume writer, create 3-4 achievement-focused bullet points for this work experience:
        Company: ${formData.company}
        Position: ${formData.position}
        Description: ${formData.description}
        
        Format the response as bullet points starting with • and focus on:
        - Quantifiable achievements and metrics
        - Leadership and initiative
        - Technical skills and tools used
        - Impact on the business`,
    });

    return completion.choices[0].text;
  } catch (error) {
    console.error('Error generating resume content:', error);
    throw error;
  }
} 