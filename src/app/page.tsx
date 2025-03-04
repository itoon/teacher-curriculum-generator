"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactMarkdown, { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from "@/components/ui/custom-select";
import { EmptyState, LoadingState, ErrorState } from "@/components/empty-state";

// Form schema
const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  weeks: z.string().min(1, "Number of weeks is required"),
});

type FormValues = z.infer<typeof formSchema>;

// Define types for curriculum data
interface Activity {
  activity: string;
  description: string;
}

interface WeekData {
  week: number;
  title: string;
  learning_objectives: string[];
  classroom_activities: Activity[];
  required_materials: string[];
  assessment_strategies: string[];
}

export default function Home() {
  const [curriculum, setCurriculum] = useState<string>("");
  const [curriculumData, setCurriculumData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [examLoading, setExamLoading] = useState<{ [key: number]: boolean }>({});
  const [exams, setExams] = useState<{ [key: number]: string }>({});

  const { handleSubmit, formState, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      grade: "",
      weeks: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setCurriculumData([]);
    setExams({});
    
    try {
      const response = await fetch("/api/generate-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          subject: data.subject,
          grade: data.grade,
          weeks: data.weeks,
          format: "json"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate curriculum");
      }

      const result = await response.json();
      
      if (result.curriculum && Array.isArray(result.curriculum)) {
        setCurriculumData(result.curriculum);
        const formattedCurriculum = formatCurriculumToMarkdown(result.curriculum);
        setCurriculum(formattedCurriculum);
      } 
      else if (result.curriculum?.curriculum && Array.isArray(result.curriculum.curriculum)) {
        setCurriculumData(result.curriculum.curriculum);
        const formattedCurriculum = formatCurriculumToMarkdown(result.curriculum.curriculum);
        setCurriculum(formattedCurriculum);
      }
      else if (typeof result.curriculum === 'string') {
        setCurriculum(result.curriculum);
        try {
          const parsedData = parseMarkdownToCurriculumData(result.curriculum);
          setCurriculumData(parsedData);
        } catch (err) {
          console.error("Could not parse curriculum string to structured data", err);
        }
      }
      else {
        console.error("Unexpected response format:", result);
        setError("Received an unexpected response format. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while generating the curriculum. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse markdown string into structured data (if needed)
  const parseMarkdownToCurriculumData = (markdown: string): WeekData[] => {
    // This is a simplified parser - in a real app, you'd want a more robust solution
    const weeks: WeekData[] = [];
    const weekSections = markdown.split(/##\s+Week\s+\d+/i);
    
    if (weekSections.length <= 1) return weeks;
    
    for (let i = 1; i < weekSections.length; i++) {
      const content = weekSections[i];
      const weekMatch = markdown.match(new RegExp(`##\\s+Week\\s+${i}[^#]*`, 'i'));
      const title = weekMatch ? weekMatch[0].replace(/^##\s+Week\s+\d+:\s*/i, '').trim() : `Week ${i}`;
      
      const learningObjectives = content.match(/Learning Objectives[^#]*?(?=###|$)/i)?.[0]?.replace(/Learning Objectives[^:]*:\s*/i, '').trim() || '';
      const activities = content.match(/Classroom Activities[^#]*?(?=###|$)/i)?.[0]?.replace(/Classroom Activities[^:]*:\s*/i, '').trim() || '';
      const materials = content.match(/Required Materials[^#]*?(?=###|$)/i)?.[0]?.replace(/Required Materials[^:]*:\s*/i, '').trim() || '';
      const assessment = content.match(/Assessment Strategies[^#]*?(?=###|$)/i)?.[0]?.replace(/Assessment Strategies[^:]*:\s*/i, '').trim() || '';
      
      weeks.push({
        week: i,
        title,
        learning_objectives: learningObjectives.split(/\n-\s*/).filter(Boolean).map(item => item.trim()),
        classroom_activities: activities.split(/\n####\s*/).filter(Boolean).map(item => {
          const [activity, ...descParts] = item.split(/\n/);
          return {
            activity: activity.trim(),
            description: descParts.join('\n').trim()
          };
        }),
        required_materials: materials.split(/\n-\s*/).filter(Boolean).map(item => item.trim()),
        assessment_strategies: assessment.split(/\n-\s*/).filter(Boolean).map(item => item.trim())
      });
    }
    
    return weeks;
  };

  // Function to generate an exam for a specific week
  const generateExam = async (weekData: WeekData) => {
    const weekNumber = weekData.week;
    setExamLoading(prev => ({ ...prev, [weekNumber]: true }));
    
    try {
      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          subject: watch("subject"),
          grade: watch("grade"),
          weekNumber,
          learningObjectives: weekData.learning_objectives,
          title: weekData.title,
          format: "json"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate exam");
      }

      const result = await response.json();
      
      if (result.exam) {
        setExams(prev => ({ ...prev, [weekNumber]: result.exam }));
      } else {
        throw new Error("Invalid exam data received");
      }
    } catch (err) {
      console.error("Error generating exam:", err);
      // Show error in the exam section
      setExams(prev => ({ ...prev, [weekNumber]: "Error generating exam. Please try again." }));
    } finally {
      setExamLoading(prev => ({ ...prev, [weekNumber]: false }));
    }
  };

  // Function to convert curriculum object to markdown
  const formatCurriculumToMarkdown = (curriculumData: WeekData[] | any): string => {
    if (!curriculumData) return '';
    
    try {
      // If it's already a string, return it
      if (typeof curriculumData === 'string') return curriculumData;
      
      // If it's an array of week objects
      if (Array.isArray(curriculumData)) {
        return curriculumData.map((week: WeekData) => {
          let markdown = `## Week ${week.week}: ${week.title}\n\n`;
          
          // Learning Objectives
          if (week.learning_objectives) {
            markdown += `### Learning Objectives:\n`;
            if (Array.isArray(week.learning_objectives)) {
              week.learning_objectives.forEach((objective: string) => {
                markdown += `- ${objective}\n`;
              });
            } else {
              markdown += week.learning_objectives;
            }
            markdown += '\n\n';
          }
          
          // Classroom Activities
          if (week.classroom_activities) {
            markdown += `### Classroom Activities:\n`;
            if (Array.isArray(week.classroom_activities)) {
              week.classroom_activities.forEach((activity: Activity) => {
                markdown += `#### ${activity.activity}\n${activity.description}\n\n`;
              });
            } else {
              markdown += week.classroom_activities;
            }
            markdown += '\n';
          }
          
          // Required Materials
          if (week.required_materials) {
            markdown += `### Required Materials & Resources:\n`;
            if (Array.isArray(week.required_materials)) {
              week.required_materials.forEach((material: string) => {
                markdown += `- ${material}\n`;
              });
            } else {
              markdown += week.required_materials;
            }
            markdown += '\n\n';
          }
          
          // Assessment Strategies
          if (week.assessment_strategies) {
            markdown += `### Assessment Strategies:\n`;
            if (Array.isArray(week.assessment_strategies)) {
              week.assessment_strategies.forEach((strategy: string) => {
                markdown += `- ${strategy}\n`;
              });
            } else {
              markdown += week.assessment_strategies;
            }
            markdown += '\n\n';
          }
          
          return markdown;
        }).join('---\n\n');
      }
      
      // If it's an object with a curriculum property that's an array
      if (curriculumData.curriculum && Array.isArray(curriculumData.curriculum)) {
        return formatCurriculumToMarkdown(curriculumData.curriculum);
      }
      
      // Fallback: return empty string if format is not recognized
      console.error("Unrecognized curriculum data format:", curriculumData);
      return '';
    } catch (error) {
      console.error("Error formatting curriculum to markdown:", error);
      return '';
    }
  };

  // Add a function to format exam data to markdown
  const formatExamToMarkdown = (examData: any): string => {
    if (!examData) return '';
    
    try {
      // If it's already a string, return it
      if (typeof examData === 'string') return examData;
      
      // If it's an array of questions
      if (Array.isArray(examData)) {
        let markdown = `# Exam Questions\n\n`;
        
        examData.forEach((question, index) => {
          markdown += `## Question ${question.question_number || index + 1}\n\n`;
          markdown += `${question.question_text || question.question}\n\n`;
          
          if (question.options && Array.isArray(question.options)) {
            question.options.forEach((option: string) => {
              markdown += `- ${option}\n`;
            });
            markdown += '\n';
          }
          
          if (question.correct_answer) {
            markdown += `**Correct Answer:** ${question.correct_answer}\n\n`;
          }
        });
        
        return markdown;
      }
      
      // Fallback: stringify the object
      return JSON.stringify(examData, null, 2);
    } catch (error) {
      console.error("Error formatting exam to markdown:", error);
      return 'Error formatting exam data';
    }
  };

  // Subjects for the dropdown
  const subjects = [
    "Mathematics",
    "Science",
    "English Language Arts",
    "Social Studies",
    "History",
    "Geography",
    "Art",
    "Music",
    "Physical Education",
    "Computer Science",
    "Foreign Language",
  ];

  // Grades for the dropdown
  const grades = [
    "Kindergarten",
    "1st Grade",
    "2nd Grade",
    "3rd Grade",
    "4th Grade",
    "5th Grade",
    "6th Grade",
    "7th Grade",
    "8th Grade",
    "9th Grade",
    "10th Grade",
    "11th Grade",
    "12th Grade",
  ];

  // Weeks for the dropdown
  const weekOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Teacher Curriculum Generator</h1>
          <p className="text-muted-foreground">Generate detailed curriculum plans and exams for your classes</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-4">
            <div className="bg-card rounded-lg shadow-sm border border-muted p-5 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate Curriculum
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Subject
                  </Label>
                  <CustomSelect
                    value={watch("subject")}
                    onValueChange={(value: string) => setValue("subject", value)}
                  >
                    <CustomSelectTrigger className="w-full">
                      <CustomSelectValue placeholder="Select a subject" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="Math">Mathematics</CustomSelectItem>
                      <CustomSelectItem value="Science">Science</CustomSelectItem>
                      <CustomSelectItem value="English">English Language Arts</CustomSelectItem>
                      <CustomSelectItem value="Social Studies">Social Studies</CustomSelectItem>
                      <CustomSelectItem value="History">History</CustomSelectItem>
                      <CustomSelectItem value="Geography">Geography</CustomSelectItem>
                      <CustomSelectItem value="Art">Art</CustomSelectItem>
                      <CustomSelectItem value="Music">Music</CustomSelectItem>
                      <CustomSelectItem value="Physical Education">Physical Education</CustomSelectItem>
                      <CustomSelectItem value="Computer Science">Computer Science</CustomSelectItem>
                      <CustomSelectItem value="Foreign Language">Foreign Language</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                  {formState.errors.subject && (
                    <p className="text-destructive text-sm">{formState.errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Grade Level
                  </Label>
                  <CustomSelect
                    value={watch("grade")}
                    onValueChange={(value: string) => setValue("grade", value)}
                  >
                    <CustomSelectTrigger className="w-full">
                      <CustomSelectValue placeholder="Select a grade level" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="K">Kindergarten</CustomSelectItem>
                      <CustomSelectItem value="1">1st Grade</CustomSelectItem>
                      <CustomSelectItem value="2">2nd Grade</CustomSelectItem>
                      <CustomSelectItem value="3">3rd Grade</CustomSelectItem>
                      <CustomSelectItem value="4">4th Grade</CustomSelectItem>
                      <CustomSelectItem value="5">5th Grade</CustomSelectItem>
                      <CustomSelectItem value="6">6th Grade</CustomSelectItem>
                      <CustomSelectItem value="7">7th Grade</CustomSelectItem>
                      <CustomSelectItem value="8">8th Grade</CustomSelectItem>
                      <CustomSelectItem value="9">9th Grade</CustomSelectItem>
                      <CustomSelectItem value="10">10th Grade</CustomSelectItem>
                      <CustomSelectItem value="11">11th Grade</CustomSelectItem>
                      <CustomSelectItem value="12">12th Grade</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                  {formState.errors.grade && (
                    <p className="text-destructive text-sm">{formState.errors.grade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weeks" className="text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Number of Weeks
                  </Label>
                  <CustomSelect
                    value={watch("weeks")}
                    onValueChange={(value: string) => setValue("weeks", value)}
                  >
                    <CustomSelectTrigger className="w-full">
                      <CustomSelectValue placeholder="Select number of weeks" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="1">1 Week</CustomSelectItem>
                      <CustomSelectItem value="2">2 Weeks</CustomSelectItem>
                      <CustomSelectItem value="3">3 Weeks</CustomSelectItem>
                      <CustomSelectItem value="4">4 Weeks</CustomSelectItem>
                      <CustomSelectItem value="5">5 Weeks</CustomSelectItem>
                      <CustomSelectItem value="6">6 Weeks</CustomSelectItem>
                      <CustomSelectItem value="7">7 Weeks</CustomSelectItem>
                      <CustomSelectItem value="8">8 Weeks</CustomSelectItem>
                      <CustomSelectItem value="9">9 Weeks</CustomSelectItem>
                      <CustomSelectItem value="10">10 Weeks</CustomSelectItem>
                      <CustomSelectItem value="11">11 Weeks</CustomSelectItem>
                      <CustomSelectItem value="12">12 Weeks</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                  {formState.errors.weeks && (
                    <p className="text-destructive text-sm">{formState.errors.weeks.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Generate Curriculum
                    </>
                  )}
                </Button>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8 space-y-6">
            {curriculumData.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 pb-3 border-b border-muted flex items-center">
                  <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Generated Curriculum
                </h2>
                
                <div className="grid grid-cols-1 gap-6">
                  {curriculumData.map((week, index) => (
                    <div key={week.week || index} className="bg-card rounded-lg shadow-md overflow-hidden border border-muted">
                      {/* Week Header */}
                      <div className="bg-primary/10 p-4 border-b border-primary/20">
                        <h3 className="text-lg font-semibold text-primary flex items-center">
                          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Week {week.week}: {week.title}
                        </h3>
                      </div>
                      
                      {/* Week Content */}
                      <div className="p-5">
                        {/* Learning Objectives */}
                        <div className="mb-5">
                          <h4 className="font-medium text-base mb-3 flex items-center text-foreground">
                            <svg className="w-4 h-4 mr-2 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Learning Objectives
                          </h4>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            {Array.isArray(week.learning_objectives) ? 
                              week.learning_objectives.map((objective: string, i: number) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">{objective}</li>
                              )) : 
                              <li className="text-gray-700 dark:text-gray-300">{String(week.learning_objectives || 'No learning objectives provided')}</li>
                            }
                          </ul>
                        </div>
                        
                        {/* Classroom Activities */}
                        {(Array.isArray(week.classroom_activities) && week.classroom_activities.length > 0) && (
                          <div className="mb-5">
                            <h4 className="font-medium text-base mb-3 flex items-center text-foreground">
                              <svg className="w-4 h-4 mr-2 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                              </svg>
                              Classroom Activities
                            </h4>
                            <div className="space-y-3">
                              {week.classroom_activities.map((activity: Activity, i: number) => (
                                <div key={i} className="bg-muted/30 p-4 rounded-md border border-muted/50">
                                  <h5 className="font-medium text-sm text-primary/90 mb-1.5">{activity.activity}</h5>
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Materials */}
                        {(Array.isArray(week.required_materials) && week.required_materials.length > 0) && (
                          <div className="mb-5">
                            <h4 className="font-medium text-base mb-3 flex items-center text-foreground">
                              <svg className="w-4 h-4 mr-2 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              Required Materials
                            </h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              {week.required_materials.map((material: string, i: number) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">{material}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Assessment */}
                        {(Array.isArray(week.assessment_strategies) && week.assessment_strategies.length > 0) && (
                          <div className="mb-5">
                            <h4 className="font-medium text-base mb-3 flex items-center text-foreground">
                              <svg className="w-4 h-4 mr-2 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              Assessment Strategies
                            </h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              {week.assessment_strategies.map((strategy: string, i: number) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">{strategy}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Generate Exam Button */}
                        <div className="mt-6 flex justify-end">
                          <Button
                            onClick={() => generateExam(week)}
                            disabled={examLoading[week.week]}
                            size="sm"
                            className="bg-primary/90 hover:bg-primary text-white flex items-center"
                          >
                            {examLoading[week.week] ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Exam...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Generate Exam
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Add the exam display section after the Generate Exam button */}
                        {exams[week.week] && (
                          <div className="mt-6 pt-5 border-t border-muted">
                            <div className="border border-primary/20 rounded-md overflow-hidden bg-card">
                              <div className="bg-primary/5 p-3 border-b border-primary/20 flex justify-between items-center">
                                <h4 className="font-medium text-primary flex items-center">
                                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                  </svg>
                                  Exam for Week {week.week}: {week.title}
                                </h4>
                                <Button
                                  onClick={() => generateExam(week)}
                                  disabled={examLoading[week.week]}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8"
                                >
                                  {examLoading[week.week] ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Regenerating...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Regenerate
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="p-4 prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5">
                                <ReactMarkdown
                                  components={{
                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-base font-medium mt-3 mb-1.5" {...props} />,
                                    p: ({ node, ...props }) => <p className="my-1.5" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="my-1.5 pl-5 list-disc" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="my-1.5 pl-5 list-decimal" {...props} />,
                                    li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                      <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2" {...props} />
                                    ),
                                    code: ({ node, inline, className, ...props }: any) => 
                                      inline ? (
                                        <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props} />
                                      ) : (
                                        <code className="block bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto my-2" {...props} />
                                      ),
                                  }}
                                >
                                  {typeof exams[week.week] === 'string' 
                                    ? exams[week.week] 
                                    : formatExamToMarkdown(exams[week.week])}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
            
            {isLoading && <LoadingState />}
            
            {error && <ErrorState message={error} />}
          </div>
        </div>
      </div>
    </main>
  );
}
