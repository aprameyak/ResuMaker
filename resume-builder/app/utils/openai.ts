import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // We'll make calls from the server side
});

export async function generateResumeContent(formData: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional resume writer. Format the response in clear, concise bullet points."
        },
        {
          role: "user",
          content: `Generate professional bullet points for this work experience:
            Company: ${formData.company}
            Position: ${formData.position}
            Description: ${formData.description}`
        }
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating resume content:', error);
    throw error;
  }
} 