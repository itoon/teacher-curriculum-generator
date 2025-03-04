import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      subject,
      grade,
      weekNumber,
      learningObjectives,
      title,
      format = "json",
    } = await req.json();

    if (!subject || !grade || !learningObjectives) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Construct the prompt for exam generation
    const message =
      format === "json"
        ? `Generate a 10-question exam for ${grade} students studying ${subject}, specifically for Week ${weekNumber}: ${title}.

The exam should test the following learning objectives:
${
  Array.isArray(learningObjectives)
    ? learningObjectives.map((obj: string) => `- ${obj}`).join("\n")
    : learningObjectives
}

For each question:
1. Create a mix of multiple-choice, true/false, and short answer questions
2. Include the correct answer for each question
3. Ensure questions are age-appropriate for ${grade} students
4. Focus specifically on the learning objectives listed above

IMPORTANT: Format your response as a valid JSON array where each element is a question object with the following structure:
{
  "question_number": number,
  "type": string,
  "question_text": string,
  "options": string[],
  "correct_answer": string,  
}

Do not include any explanatory text outside the JSON structure. The response should be parseable by JSON.parse().`
        : `Generate a 10-question exam for ${grade} students studying ${subject}, specifically for Week ${weekNumber}: ${title}.

The exam should test the following learning objectives:
${
  Array.isArray(learningObjectives)
    ? learningObjectives.map((obj: string) => `- ${obj}`).join("\n")
    : learningObjectives
}

For each question:
1. Create a mix of multiple-choice, true/false, and short answer questions
2. Include the correct answer for each question
3. Ensure questions are age-appropriate for ${grade} students
4. Focus specifically on the learning objectives listed above

Format the response as a structured exam with clear sections for each question.`;

    // Check if we should use the mock data for development
    if (
      process.env.NODE_ENV === "development" &&
      process.env.USE_MOCK_DATA === "true"
    ) {
      return NextResponse.json({
        exam: getMockExamData(subject, grade, weekNumber),
      });
    }

    // Call OpenRouter API directly using fetch
    try {
      const resp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
            "X-Title": "Teacher Curriculum Generator",
          },
          body: JSON.stringify({
            model:
              process.env.OPEN_ROUTER_MODEL_NAME ??
              "anthropic/claude-3-opus:beta",
            messages: [
              {
                role: "system",
                content:
                  format === "json"
                    ? "You are an expert educational assessment designer. You create clear, age-appropriate exams that effectively test student understanding of specific learning objectives. You ALWAYS respond with valid, well-structured JSON that can be parsed directly by JSON.parse()."
                    : "You are an expert educational assessment designer. You create clear, age-appropriate exams that effectively test student understanding of specific learning objectives.",
              },
              {
                role: "user",
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 3000,
          }),
        }
      );

      if (!resp.ok) {
        throw new Error(
          `OpenRouter API error: ${resp.status} ${resp.statusText}`
        );
      }

      const data = await resp.json();
      const generatedExam = data.choices[0]?.message?.content || "";

      // If JSON format was requested, try to parse the response as JSON
      if (format === "json") {
        try {
          // The LLM might wrap the JSON in markdown code blocks, so we need to extract it
          const jsonMatch = generatedExam.match(
            /```(?:json)?([\s\S]*?)```/
          ) || [null, generatedExam];
          const jsonContent = jsonMatch[1].trim();

          // Parse the JSON content
          const parsedExam = JSON.parse(jsonContent);

          // Return the parsed exam
          return NextResponse.json({
            exam: parsedExam,
          });
        } catch (error) {
          console.error("Failed to parse JSON response:", error);
          // Fallback to returning the raw text
          return NextResponse.json({
            exam: generatedExam,
            error: "Failed to parse JSON response",
          });
        }
      }

      // If not JSON format, return the raw text
      return NextResponse.json({
        exam: generatedExam,
      });
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);

      // Fallback to mock data if API call fails
      return NextResponse.json({
        exam:
          format === "json"
            ? getMockExamData(subject, grade, weekNumber)
            : formatMockExamToText(
                getMockExamData(subject, grade, weekNumber),
                subject,
                grade,
                weekNumber
              ),
      });
    }
  } catch (error) {
    console.error("Error generating exam:", error);
    return NextResponse.json(
      { error: "Failed to generate exam" },
      { status: 500 }
    );
  }
}

// Mock data function for development
function getMockExamData(subject: string, grade: string, _weekNumber: number) {
  return [
    {
      question_number: 1,
      type: "multiple-choice",
      question_text: `Which of these is related to ${subject}?`,
      options: [
        `a) A ${subject}-related term`,
        "b) An unrelated term",
        "c) Another unrelated term",
      ],
      correct_answer: `a) A ${subject}-related term`,
    },
    {
      question_number: 2,
      type: "multiple-choice",
      question_text: `What is a key concept in ${subject} for ${grade} students?`,
      options: [
        "a) Basic concept",
        "b) Advanced concept",
        "c) Unrelated concept",
      ],
      correct_answer: "a) Basic concept",
    },
    {
      question_number: 3,
      type: "true/false",
      question_text: `${subject} is an important subject for ${grade} students.`,
      correct_answer: "True",
    },
    {
      question_number: 4,
      type: "true/false",
      question_text: `Learning ${subject} is not useful for ${grade} students.`,
      correct_answer: "False",
    },
    {
      question_number: 5,
      type: "short answer",
      question_text: `Name one important skill related to ${subject}.`,
      correct_answer: "Any relevant skill",
    },
    {
      question_number: 6,
      type: "short answer",
      question_text: `How can ${subject} be applied in real life?`,
      correct_answer: "Any reasonable application",
    },
    {
      question_number: 7,
      type: "multiple-choice",
      question_text: `Which of these tools is most commonly used in ${subject}?`,
      options: [
        "a) Subject-specific tool",
        "b) Unrelated tool",
        "c) Another unrelated tool",
      ],
      correct_answer: "a) Subject-specific tool",
    },
    {
      question_number: 8,
      type: "multiple-choice",
      question_text: `What is a common challenge when learning ${subject}?`,
      options: ["a) Common challenge", "b) Unrelated issue", "c) Non-issue"],
      correct_answer: "a) Common challenge",
    },
    {
      question_number: 9,
      type: "true/false",
      question_text: `Practice is important for mastering ${subject}.`,
      correct_answer: "True",
    },
    {
      question_number: 10,
      type: "short answer",
      question_text: `Describe one way to demonstrate understanding of ${subject}.`,
      correct_answer: "Any reasonable demonstration method",
    },
  ];
}

// Function to format mock exam data to text
function formatMockExamToText(
  examData: Array<{
    question_number: number;
    type: string;
    question_text: string;
    options?: string[];
    correct_answer: string;
  }>,
  subject: string,
  grade: string,
  weekNumber: number
): string {
  let textExam = `# Exam for ${grade} - ${subject}: Week ${weekNumber}\n\n`;

  examData.forEach((q) => {
    textExam += `## Question ${q.question_number}\n\n${q.question_text}\n\n`;
    if (q.options && Array.isArray(q.options)) {
      q.options.forEach((opt: string) => {
        textExam += `- ${opt}\n`;
      });
    }
    textExam += `\n**Answer:** ${q.correct_answer}\n\n`;
  });

  return textExam;
}
