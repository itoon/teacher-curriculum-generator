import React from 'react';

export function EmptyState() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-muted p-6 flex flex-col items-center justify-center text-center h-[400px]">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-medium mb-2">No Curriculum Generated Yet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Select a subject, grade level, and number of weeks, then click "Generate Curriculum" to create a detailed curriculum plan.
      </p>
      <div className="flex items-center text-sm text-muted-foreground">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        You can also generate exams for each week of your curriculum
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-muted p-6 flex flex-col items-center justify-center text-center h-[400px]">
      <div className="w-16 h-16 flex items-center justify-center mb-4">
        <svg className="animate-spin w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h3 className="text-xl font-medium mb-2">Generating Curriculum...</h3>
      <p className="text-muted-foreground max-w-md">
        This may take a moment as we create a detailed curriculum plan tailored to your specifications.
      </p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 rounded-lg p-6 border border-destructive/30">
      <h3 className="text-lg font-medium text-destructive mb-2 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Error Generating Curriculum
      </h3>
      <p className="text-destructive/90">{message}</p>
    </div>
  );
} 