import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { subject, grade, weeks, format = "json" } = await req.json();
    console.log(subject, grade, weeks, format);

    if (!subject || !grade || !weeks) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if we should use the mock data for development
    if (
      process.env.NODE_ENV === "development" &&
      process.env.USE_MOCK_DATA === "true"
    ) {
      return NextResponse.json({
        curriculum: getMockCurriculumData(subject, grade, parseInt(weeks)),
      });
    }

    // Construct the prompt for curriculum generation
    // Explicitly request JSON format in the prompt
    const message =
      format === "json"
        ? `Generate a detailed curriculum for teaching ${subject} to ${grade} grade students over ${weeks} weeks.

For each week, include:
1. A lesson plan with clear learning objectives
2. Detailed classroom activities
3. Required materials and resources
4. Assessment strategies

IMPORTANT: Format your response as a valid JSON array where each element is a week object with the following structure:
{
  "week": number,
  "title": string,
  "learning_objectives": string[],
  "classroom_activities": [{ "activity": string, "description": string }],
  "required_materials": string[],
  "assessment_strategies": string[]
}

Do not include any explanatory text outside the JSON structure. The response should be parseable by JSON.parse().`
        : `Generate a detailed curriculum for teaching ${subject} to ${grade} grade students over ${weeks} weeks.

For each week, include:
1. A lesson plan with clear learning objectives
2. Detailed classroom activities
3. Required materials and resources
4. Assessment strategies

Format the response as a structured curriculum with clear sections for each week.`;

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
                    ? "You are an expert curriculum designer for K-12 education. You create detailed, age-appropriate curriculum plans that align with educational standards. You ALWAYS respond with valid, well-structured JSON that can be parsed directly by JSON.parse()."
                    : "You are an expert curriculum designer for K-12 education. You create detailed, age-appropriate curriculum plans that align with educational standards.",
              },
              {
                role: "user",
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        }
      );

      if (!resp.ok) {
        throw new Error(
          `OpenRouter API error: ${resp.status} ${resp.statusText}`
        );
      }

      const data = await resp.json();
      const generatedCurriculum = data.choices[0]?.message?.content || "";

      // If JSON format was requested, try to parse the response as JSON
      if (format === "json") {
        try {
          // The LLM might wrap the JSON in markdown code blocks, so we need to extract it
          const jsonMatch = generatedCurriculum.match(
            /```(?:json)?([\s\S]*?)```/
          ) || [null, generatedCurriculum];
          const jsonContent = jsonMatch[1].trim();

          // Parse the JSON content
          const parsedCurriculum = JSON.parse(jsonContent);

          // Return the parsed curriculum
          return NextResponse.json({
            curriculum: parsedCurriculum,
          });
        } catch (error) {
          console.error("Failed to parse JSON response:", error);
          // Fallback to returning the raw text
          return NextResponse.json({
            curriculum: generatedCurriculum,
            error: "Failed to parse JSON response",
          });
        }
      }

      // If not JSON format, return the raw text
      return NextResponse.json({
        curriculum: generatedCurriculum,
      });
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);

      // Fallback to mock data if API call fails
      return NextResponse.json({
        curriculum: getMockCurriculumData(subject, grade, parseInt(weeks)),
      });
    }
  } catch (error) {
    console.error("Error generating curriculum:", error);
    return NextResponse.json(
      { error: "Failed to generate curriculum" },
      { status: 500 }
    );
  }
}

// Mock data function for development
function getMockCurriculumData(subject: string, grade: string, weeks: number) {
  // Generate mock data based on the subject, grade, and weeks
  const mockData = [];

  for (let i = 1; i <= weeks; i++) {
    mockData.push({
      week: i,
      title: `${subject} Fundamentals - Week ${i}`,
      learning_objectives: [
        `Understand basic ${subject} concepts appropriate for ${grade} grade`,
        `Develop skills in ${subject} problem-solving`,
        `Apply ${subject} knowledge to real-world scenarios`,
      ],
      classroom_activities: [
        {
          activity: "Interactive Lesson",
          description: `Teacher-led instruction on ${subject} concepts for ${grade} grade students`,
        },
        {
          activity: "Group Work",
          description:
            "Students collaborate on problem-solving activities in small groups",
        },
        {
          activity: "Hands-on Project",
          description: `Students create a ${subject}-related project to demonstrate understanding`,
        },
      ],
      required_materials: [
        `${subject} textbook appropriate for ${grade} grade`,
        "Worksheets and handouts",
        "Art supplies for projects",
        "Digital resources and educational technology tools",
      ],
      assessment_strategies: [
        "Formative assessment through classroom observation",
        "Quizzes to check understanding",
        "Project-based assessment",
        "Peer and self-evaluation",
      ],
    });
  }

  return mockData;
}
